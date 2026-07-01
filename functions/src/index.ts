import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { logger } from 'firebase-functions/v2'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { db, messaging, requireAuth, REGION } from './admin.js'
import { ai, aiConfigured } from './ai/provider.js'

const opts = { region: REGION }

// ============================================================
// Helpers
// ============================================================
function ensureAI() {
  if (!aiConfigured()) {
    throw new HttpsError(
      'failed-precondition',
      'IA não configurada no servidor. Defina GEMINI_API_KEY (ou ANTHROPIC_API_KEY) nas variáveis das Functions.',
    )
  }
}

async function getClientName(ownerId: string, clientId?: string | null): Promise<string> {
  if (!clientId) return 'cliente'
  const snap = await db.collection('clients').doc(clientId).get()
  if (snap.exists && snap.data()?.ownerId === ownerId) return snap.data()?.nome ?? 'cliente'
  return 'cliente'
}

async function createNotification(
  ownerId: string,
  tipo: string,
  titulo: string,
  mensagem: string,
  refId: string | null = null,
) {
  await db.collection('notifications').add({
    ownerId,
    tipo,
    titulo,
    mensagem,
    lida: false,
    refId,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })
}

async function pushToUser(ownerId: string, title: string, body: string) {
  try {
    const userSnap = await db.collection('users').doc(ownerId).get()
    const token = userSnap.data()?.fcmToken
    if (token) {
      await messaging.send({ token, notification: { title, body } })
    }
  } catch (e) {
    logger.warn('Falha ao enviar push', e)
  }
}

// ============================================================
// 1. ocrExpense — OCR de recibo -> estrutura via IA
//    Usa visão do Gemini diretamente (gratuito) quando disponível.
// ============================================================
export const ocrExpense = onCall(opts, async (req) => {
  requireAuth(req)
  const imageBase64 = (req.data?.imageBase64 as string) || ''
  if (!imageBase64) throw new HttpsError('invalid-argument', 'Imagem ausente.')

  const geminiKey = process.env.GEMINI_API_KEY
  const visionKey = process.env.GOOGLE_VISION_API_KEY
  const prompt =
    'Extraia do recibo os campos e retorne JSON: { "valor": number (em reais), "data": "YYYY-MM-DD", ' +
    '"categoria": "transporte"|"alimentacao"|"material"|"outros", "descricao": string curta }.'

  try {
    // Caminho 1: Gemini com visão (não precisa do Vision pago).
    if ((process.env.AI_PROVIDER || 'gemini') === 'gemini' && geminiKey) {
      const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash'
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: prompt + ' Responda apenas com o JSON.' },
                { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } },
              ],
            },
          ],
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data: any = await res.json()
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'
      const json = text.match(/\{[\s\S]*\}/)?.[0] ?? '{}'
      return JSON.parse(json)
    }

    // Caminho 2: Google Vision (OCR) -> IA estrutura o texto.
    if (visionKey) {
      const vres = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${visionKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{ image: { content: imageBase64 }, features: [{ type: 'TEXT_DETECTION' }] }],
        }),
      })
      const vdata: any = await vres.json()
      const texto = vdata?.responses?.[0]?.fullTextAnnotation?.text ?? ''
      ensureAI()
      return ai.completeJSON(`${prompt}\n\nTexto do recibo:\n${texto}`)
    }

    throw new HttpsError('failed-precondition', 'OCR indisponível: configure GEMINI_API_KEY ou GOOGLE_VISION_API_KEY.')
  } catch (e: any) {
    logger.error('ocrExpense', e)
    throw new HttpsError('internal', 'Não foi possível ler o recibo.')
  }
})

// ============================================================
// 2. parseContract — extrai dados do contrato via IA
//    Recebe { text } (texto extraído do PDF no client) ou { pdfUrl }.
// ============================================================
export const parseContract = onCall(opts, async (req) => {
  requireAuth(req)
  ensureAI()
  let texto = (req.data?.text as string) || ''
  const pdfUrl = req.data?.pdfUrl as string | undefined
  if (!texto && pdfUrl) {
    const r = await fetch(pdfUrl)
    texto = await r.text() // melhor esforço; PDFs binários exigem extrator dedicado
  }
  if (!texto) throw new HttpsError('invalid-argument', 'Envie o texto do contrato.')

  return ai.completeJSON(
    'Extraia do contrato e retorne JSON: { "dataInicio": "YYYY-MM-DD", "dataFim": "YYYY-MM-DD", ' +
      '"valor": number, "obrigacoes": string[] }.\n\nContrato:\n' +
      texto.slice(0, 12000),
  )
})

// ============================================================
// 3. generateInvoiceDraft — descrição de serviço para a NF
// ============================================================
export const generateInvoiceDraft = onCall(opts, async (req) => {
  const ownerId = requireAuth(req)
  ensureAI()
  const clientId = req.data?.clientId as string | undefined
  const nome = await getClientName(ownerId, clientId)
  const descricao = await ai.complete(
    `Escreva uma descrição profissional e concisa (1-2 frases) de serviço de consultoria de pessoas/RH ` +
      `prestado ao cliente "${nome}", adequada para constar em nota fiscal. Sem saudações.`,
  )
  return { descricao: descricao.trim() }
})

// ============================================================
// 4. estimateTaxes — estima imposto do mês conforme regime
// ============================================================
const ALIQUOTAS: Record<string, number> = {
  simples_nacional: 0.06,
  mei: 0.0,
  lucro_presumido: 0.1133,
  lucro_real: 0.15,
}

export const estimateTaxes = onCall(opts, async (req) => {
  const ownerId = requireAuth(req)
  const now = new Date()
  const inicioMes = Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth(), 1))

  const invSnap = await db
    .collection('invoices')
    .where('ownerId', '==', ownerId)
    .where('status', '==', 'emitida')
    .get()

  let receita = 0
  invSnap.forEach((d) => {
    const v = d.data()
    const ref = v.data ?? v.createdAt
    if (ref && ref.toMillis() >= inicioMes.toMillis()) receita += v.valor || 0
  })

  const userSnap = await db.collection('users').doc(ownerId).get()
  const regime = userSnap.data()?.regimeTributario || 'simples_nacional'
  const aliquota = ALIQUOTAS[regime] ?? 0.06
  const valorEstimado = Math.round(receita * aliquota * 100) / 100

  // grava/atualiza um registro de estimativa em taxes
  await db.collection('taxes').add({
    ownerId,
    tipo: `Estimativa ${regime.replace('_', ' ')}`,
    valor: valorEstimado,
    vencimento: Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth() + 1, 20)),
    status: 'pendente',
    multaEstimada: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })

  return { receita, regime, aliquota, valorEstimado }
})

// ============================================================
// 5. calcLateTaxPenalty — multa e juros de imposto atrasado
// ============================================================
export const calcLateTaxPenalty = onCall(opts, async (req) => {
  const ownerId = requireAuth(req)
  const taxId = req.data?.taxId as string
  const snap = await db.collection('taxes').doc(taxId).get()
  if (!snap.exists || snap.data()?.ownerId !== ownerId) {
    throw new HttpsError('not-found', 'Imposto não encontrado.')
  }
  const t = snap.data()!
  const venc: Timestamp | undefined = t.vencimento
  const diasAtraso = venc ? Math.max(0, Math.floor((Date.now() - venc.toMillis()) / 86400000)) : 0
  const meses = Math.max(1, Math.ceil(diasAtraso / 30))

  // Regra padrão (Simples): multa 0,33%/dia limitada a 20% + juros Selic ~1%/mês.
  const multa = Math.min(0.2, 0.0033 * diasAtraso) * (t.valor || 0)
  const juros = 0.01 * meses * (t.valor || 0)
  const multaEstimada = Math.round((multa + juros) * 100) / 100

  await snap.ref.update({ multaEstimada, updatedAt: FieldValue.serverTimestamp() })
  return { diasAtraso, multaEstimada }
})

// ============================================================
// 6. generatePost — legenda + hashtags a partir de notícia/tema
// ============================================================
export const generatePost = onCall(opts, async (req) => {
  requireAuth(req)
  ensureAI()
  const rede = (req.data?.rede as string) || 'instagram'
  const tema = (req.data?.tema as string) || (req.data?.noticia as string) || ''
  if (!tema) throw new HttpsError('invalid-argument', 'Informe o tema ou a notícia.')

  const json = await ai.completeJSON<{ texto: string; hashtags: string[] }>(
    `Você é social media de uma consultoria de pessoas/RH. Crie um post para ${rede} sobre: "${tema}". ` +
      `Tom profissional e próximo. Retorne JSON { "texto": string, "hashtags": string[] } ` +
      `(${rede === 'linkedin' ? '3-5' : '8-12'} hashtags).`,
  )
  return json
})

// ============================================================
// 7. fetchRelevantNews — agendada: popula feed de notícias
// ============================================================
export const fetchRelevantNews = onSchedule({ schedule: 'every day 07:00', region: REGION, timeZone: 'America/Sao_Paulo' }, async () => {
  const newsKey = process.env.NEWS_API_KEY
  // Stub: sem NEWS_API_KEY apenas registra log. Quando configurado, busca e grava em /news.
  if (!newsKey) {
    logger.info('fetchRelevantNews: NEWS_API_KEY não configurada — pulando.')
    return
  }
  try {
    const res = await fetch(
      `https://newsapi.org/v2/everything?q=consultoria%20OR%20RH%20OR%20gest%C3%A3o%20de%20pessoas&language=pt&sortBy=publishedAt&pageSize=10&apiKey=${newsKey}`,
    )
    const data: any = await res.json()
    const batch = db.batch()
    for (const a of data?.articles ?? []) {
      const ref = db.collection('news').doc()
      batch.set(ref, {
        titulo: a.title,
        fonte: a.source?.name,
        url: a.url,
        publicadoEm: a.publishedAt,
        createdAt: FieldValue.serverTimestamp(),
      })
    }
    await batch.commit()
  } catch (e) {
    logger.error('fetchRelevantNews', e)
  }
})

// ============================================================
// 8. generateAdAnalysis — agendada: análise diária de ADS
// ============================================================
export const generateAdAnalysis = onSchedule({ schedule: 'every day 08:00', region: REGION, timeZone: 'America/Sao_Paulo' }, async () => {
  if (!aiConfigured()) {
    logger.info('generateAdAnalysis: IA não configurada — pulando.')
    return
  }
  const snap = await db.collectionGroup('adCampaigns').get()
  const byOwner: Record<string, any[]> = {}
  snap.forEach((d) => {
    const v = d.data()
    ;(byOwner[v.ownerId] ??= []).push(v)
  })
  for (const [ownerId, camps] of Object.entries(byOwner)) {
    try {
      const resumo = await ai.complete(
        `Analise estas campanhas de anúncios e dê um resumo curto com 2-3 recomendações de ajuste:\n` +
          JSON.stringify(camps.map((c) => ({ nome: c.nome, gasto: c.gasto, metricas: c.metricas }))),
      )
      await createNotification(ownerId, 'geral', 'Análise diária de ADS', resumo.slice(0, 500))
    } catch (e) {
      logger.warn('generateAdAnalysis owner', ownerId, e)
    }
  }
})

// ============================================================
// 9. generateEmailCopy — assunto + corpo otimizados
// ============================================================
export const generateEmailCopy = onCall(opts, async (req) => {
  requireAuth(req)
  ensureAI()
  const objetivo = (req.data?.objetivo as string) || ''
  if (!objetivo) throw new HttpsError('invalid-argument', 'Informe o objetivo do e-mail.')
  return ai.completeJSON<{ assunto: string; corpo: string }>(
    `Crie um e-mail marketing para consultoria de pessoas. Objetivo: "${objetivo}". ` +
      `Otimize o assunto para taxa de abertura. Retorne JSON { "assunto": string, "corpo": string }.`,
  )
})

// ============================================================
// 10. sendWhatsAppConfirmation — redige + envia (stub de envio)
// ============================================================
export const sendWhatsAppConfirmation = onCall(opts, async (req) => {
  const ownerId = requireAuth(req)
  const appointmentId = req.data?.appointmentId as string
  const snap = await db.collection('appointments').doc(appointmentId).get()
  if (!snap.exists || snap.data()?.ownerId !== ownerId) {
    throw new HttpsError('not-found', 'Compromisso não encontrado.')
  }
  const appt = snap.data()!
  const nome = await getClientName(ownerId, appt.clientId)

  let mensagem = `Olá! Confirmando nossa reunião "${appt.titulo}". Podemos manter o horário?`
  if (aiConfigured()) {
    try {
      mensagem = (
        await ai.complete(
          `Redija uma mensagem curta e cordial de WhatsApp para confirmar a reunião "${appt.titulo}" ` +
            `com o cliente "${nome}". Sem emojis em excesso.`,
        )
      ).trim()
    } catch { /* usa fallback */ }
  }

  // Envio real só se Z-API/Twilio estiverem configurados.
  const zapiInstance = process.env.ZAPI_INSTANCE_ID
  const zapiToken = process.env.ZAPI_TOKEN
  let enviado = false
  if (zapiInstance && zapiToken && appt.contato) {
    try {
      await fetch(`https://api.z-api.io/instances/${zapiInstance}/token/${zapiToken}/send-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(process.env.ZAPI_CLIENT_TOKEN ? { 'Client-Token': process.env.ZAPI_CLIENT_TOKEN } : {}) },
        body: JSON.stringify({ phone: appt.contato, message: mensagem }),
      })
      enviado = true
    } catch (e) {
      logger.warn('Z-API envio falhou', e)
    }
  }

  await snap.ref.update({ statusConfirmacao: enviado ? 'aguardando' : appt.statusConfirmacao, updatedAt: FieldValue.serverTimestamp() })
  return { mensagem, enviado }
})

// ============================================================
// 11. syncCalendar — sincroniza com Google Calendar (stub OAuth)
// ============================================================
export const syncCalendar = onCall(opts, async (req) => {
  requireAuth(req)
  if (!process.env.GOOGLE_CALENDAR_CLIENT_ID) {
    throw new HttpsError('failed-precondition', 'Google Calendar ainda não configurado. Adicione as credenciais OAuth no servidor.')
  }
  // TODO: trocar code/refresh-token e sincronizar eventos.
  return { synced: 0, pending: true }
})

// ============================================================
// 12. aiAssistant — chat com function calling sobre o Firestore
// ============================================================
const ASSISTANT_TOOLS = [
  {
    name: 'consultar_despesas',
    description: 'Soma e lista despesas do usuário, opcionalmente por categoria e mês corrente.',
    parameters: { type: 'object', properties: { categoria: { type: 'string' } } },
  },
  {
    name: 'consultar_impostos',
    description: 'Lista impostos pendentes ou atrasados do usuário.',
    parameters: { type: 'object', properties: { status: { type: 'string', enum: ['pendente', 'atrasado', 'pago'] } } },
  },
  {
    name: 'consultar_contratos',
    description: 'Lista contratos e datas de encerramento.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'marcar_imposto_pago',
    description: 'Marca um imposto como pago pelo id.',
    parameters: { type: 'object', properties: { taxId: { type: 'string' } }, required: ['taxId'] },
  },
]

async function runAssistantTool(ownerId: string, name: string, args: any): Promise<unknown> {
  switch (name) {
    case 'consultar_despesas': {
      let q = db.collection('expenses').where('ownerId', '==', ownerId)
      if (args?.categoria) q = q.where('categoria', '==', args.categoria)
      const snap = await q.get()
      const now = new Date()
      let total = 0
      const itens: any[] = []
      snap.forEach((d) => {
        const v = d.data()
        const dt = v.data?.toDate?.()
        if (dt && dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear()) {
          total += v.valor || 0
          itens.push({ valor: v.valor, categoria: v.categoria, descricao: v.descricao })
        }
      })
      return { totalMes: total, quantidade: itens.length, itens: itens.slice(0, 20) }
    }
    case 'consultar_impostos': {
      const snap = await db.collection('taxes').where('ownerId', '==', ownerId).get()
      const itens: any[] = []
      snap.forEach((d) => {
        const v = d.data()
        if (!args?.status || v.status === args.status) itens.push({ id: d.id, tipo: v.tipo, valor: v.valor, status: v.status })
      })
      return { itens }
    }
    case 'consultar_contratos': {
      const snap = await db.collection('contracts').where('ownerId', '==', ownerId).get()
      const itens: any[] = []
      snap.forEach((d) => {
        const v = d.data()
        itens.push({ valor: v.valor, dataFim: v.dataFim?.toDate?.()?.toISOString?.(), status: v.status })
      })
      return { itens }
    }
    case 'marcar_imposto_pago': {
      const ref = db.collection('taxes').doc(args.taxId)
      const snap = await ref.get()
      if (!snap.exists || snap.data()?.ownerId !== ownerId) return { ok: false, erro: 'não encontrado' }
      await ref.update({ status: 'pago', updatedAt: FieldValue.serverTimestamp() })
      return { ok: true }
    }
    default:
      return { erro: 'ferramenta desconhecida' }
  }
}

export const aiAssistant = onCall(opts, async (req) => {
  const ownerId = requireAuth(req)
  ensureAI()
  const pergunta = (req.data?.pergunta as string) || ''
  if (!pergunta) throw new HttpsError('invalid-argument', 'Envie sua pergunta.')

  const system =
    'Você é o assistente da consultoria ELIÁ. Responda em português, de forma curta e útil. ' +
    'Use as ferramentas para consultar/alterar dados reais quando necessário. ' +
    'Ao final, se houver uma ação possível, sugira-a.'

  const first = await ai.withTools([{ role: 'user', content: pergunta }], ASSISTANT_TOOLS, system)

  if (first.toolCalls.length === 0) {
    return { resposta: first.text, acoes: [] }
  }

  // Executa ferramentas e pede a resposta final com os resultados.
  const resultados: string[] = []
  const acoes: { tool: string; args: any }[] = []
  for (const call of first.toolCalls) {
    const out = await runAssistantTool(ownerId, call.name, call.args)
    resultados.push(`Ferramenta ${call.name} retornou: ${JSON.stringify(out)}`)
    acoes.push({ tool: call.name, args: call.args })
  }

  const resposta = await ai.complete(
    `Pergunta do usuário: "${pergunta}"\n\nResultados das consultas:\n${resultados.join('\n')}\n\n` +
      `Responda à pergunta de forma clara e objetiva em português.`,
    system,
  )

  return { resposta, acoes }
})

// ============================================================
// 13. scheduleReminders — agendada: vencimentos -> notificações + push
// ============================================================
export const scheduleReminders = onSchedule({ schedule: 'every day 09:00', region: REGION, timeZone: 'America/Sao_Paulo' }, async () => {
  const now = Date.now()
  const dia = 86400000

  // Impostos vencendo em <= 3 dias ou atrasados
  const taxSnap = await db.collection('taxes').where('status', 'in', ['pendente', 'atrasado']).get()
  for (const d of taxSnap.docs) {
    const t = d.data()
    const venc = t.vencimento?.toMillis?.()
    if (!venc) continue
    const dias = Math.ceil((venc - now) / dia)
    if (dias <= 3) {
      const titulo = dias < 0 ? `${t.tipo} atrasado` : `${t.tipo} vence em ${dias} dia(s)`
      await createNotification(t.ownerId, 'imposto', titulo, `Valor: R$ ${t.valor}`, d.id)
      await pushToUser(t.ownerId, 'ELIÁ — Imposto', titulo)
    }
  }

  // Contratos encerrando em 30/15/7 dias
  const contractSnap = await db.collection('contracts').get()
  for (const d of contractSnap.docs) {
    const c = d.data()
    const fim = c.dataFim?.toMillis?.()
    if (!fim) continue
    const dias = Math.ceil((fim - now) / dia)
    if ([30, 15, 7].includes(dias)) {
      const titulo = `Contrato encerra em ${dias} dias`
      await createNotification(c.ownerId, 'contrato', titulo, 'Avaliar renovação', d.id)
      await pushToUser(c.ownerId, 'ELIÁ — Contrato', titulo)
    }
  }

  // Compromissos de amanhã aguardando confirmação
  const apptSnap = await db.collection('appointments').where('statusConfirmacao', '==', 'aguardando').get()
  for (const d of apptSnap.docs) {
    const a = d.data()
    const data = a.data?.toMillis?.()
    if (!data) continue
    const dias = Math.ceil((data - now) / dia)
    if (dias === 1) {
      await createNotification(a.ownerId, 'agenda', `Reunião amanhã: ${a.titulo}`, 'Aguardando confirmação', d.id)
      await pushToUser(a.ownerId, 'ELIÁ — Agenda', `Reunião amanhã: ${a.titulo}`)
    }
  }
})
