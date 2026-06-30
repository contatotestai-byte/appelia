import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Timestamp } from 'firebase/firestore'
import {
  useContracts,
  useCreateContract,
  useUpdateContract,
  useDeleteContract,
  useUploadContractPdf,
} from '@/hooks/useContracts'
import { useClients, useClientMap } from '@/hooks/useClients'
import { callFunction } from '@/lib/firebase/functions'
import { theme, fmtBRL } from '@/theme'
import { Card, ScreenHeader, Sheet, Field, inputStyle, PrimaryButton, Badge, Spinner, EmptyState, ErrorState } from '@/components/ui'
import type { Contract, ContractStatus } from '@/types'

type Draft = {
  id?: string
  clientId: string
  valor: string
  dataInicio: string
  dataFim: string
  status: ContractStatus
  pdfUrl: string | null
  obrigacoes: string
}
const empty = (): Draft => ({ clientId: '', valor: '', dataInicio: '', dataFim: '', status: 'ativo', pdfUrl: null, obrigacoes: '' })

function diasParaFim(c: Contract): number | null {
  if (!c.dataFim) return null
  return Math.ceil((c.dataFim.toDate().getTime() - Date.now()) / 86400000)
}

export default function Contratos() {
  const nav = useNavigate()
  const { data, isLoading, isError, refetch } = useContracts()
  const clients = useClients()
  const clientMap = useClientMap()
  const create = useCreateContract()
  const update = useUpdateContract()
  const remove = useDeleteContract()
  const upload = useUploadContractPdf()

  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Draft>(empty())
  const [aiText, setAiText] = useState('')
  const [aiBusy, setAiBusy] = useState(false)
  const [aiMsg, setAiMsg] = useState<string | null>(null)
  const pdfRef = useRef<HTMLInputElement>(null)

  const openNew = () => { setDraft(empty()); setAiText(''); setAiMsg(null); setOpen(true) }
  const openEdit = (c: Contract) => {
    setDraft({
      id: c.id, clientId: c.clientId ?? '', valor: String(c.valor ?? ''),
      dataInicio: c.dataInicio ? c.dataInicio.toDate().toISOString().slice(0, 10) : '',
      dataFim: c.dataFim ? c.dataFim.toDate().toISOString().slice(0, 10) : '',
      status: c.status, pdfUrl: c.pdfUrl, obrigacoes: (c.obrigacoes ?? []).join('\n'),
    })
    setAiText(''); setAiMsg(null); setOpen(true)
  }

  const extrair = async () => {
    if (!aiText.trim()) return
    setAiBusy(true); setAiMsg('Analisando o contrato com IA…')
    try {
      const res = await callFunction<{ text: string }, { dataInicio?: string; dataFim?: string; valor?: number; obrigacoes?: string[] }>('parseContract', { text: aiText })
      setDraft((d) => ({
        ...d,
        valor: res.valor != null ? String(res.valor) : d.valor,
        dataInicio: res.dataInicio || d.dataInicio,
        dataFim: res.dataFim || d.dataFim,
        obrigacoes: (res.obrigacoes ?? []).join('\n') || d.obrigacoes,
      }))
      setAiMsg('Campos preenchidos pela IA — revise antes de salvar.')
    } catch {
      setAiMsg('IA indisponível no momento (requer Functions ativas). Preencha manualmente.')
    } finally {
      setAiBusy(false)
    }
  }

  const save = async () => {
    const payload: Partial<Contract> = {
      clientId: draft.clientId || null,
      valor: parseFloat(draft.valor.replace(',', '.')) || 0,
      dataInicio: draft.dataInicio ? Timestamp.fromDate(new Date(draft.dataInicio)) : null,
      dataFim: draft.dataFim ? Timestamp.fromDate(new Date(draft.dataFim)) : null,
      status: draft.status,
      pdfUrl: draft.pdfUrl,
      obrigacoes: draft.obrigacoes.split('\n').map((s) => s.trim()).filter(Boolean),
    }
    if (draft.id) await update.mutateAsync({ id: draft.id, data: payload })
    else await create.mutateAsync(payload)
    setOpen(false)
  }

  const list = data ?? []

  return (
    <div style={{ padding: '4px 20px 0' }} className="fade">
      <ScreenHeader title="Contratos" onBack={() => nav('/admin')} accent={theme.color.admin} />

      <button onClick={openNew} style={{ width: '100%', height: 48, border: '1px dashed #c4b5fd', borderRadius: 14, background: '#f5f3ff', color: '#6d28d9', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 16 }}>
        ＋ Adicionar contrato (PDF → IA)
      </button>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><Spinner color={theme.color.admin} /></div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : list.length === 0 ? (
        <EmptyState icon="📄" text="Nenhum contrato cadastrado." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.map((c) => {
            const dias = diasParaFim(c)
            const alerta = dias != null && dias >= 0 && dias <= 30 && c.status !== 'renovado' && c.status !== 'encerrado'
            return (
              <Card key={c.id} onClick={() => openEdit(c)} accent={alerta ? theme.color.danger : undefined}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: theme.color.navy }}>{c.clientId ? clientMap[c.clientId] ?? '—' : 'Sem cliente'}</div>
                  {alerta ? (
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: '#b91c1c', background: '#fef2f2', padding: '3px 8px', borderRadius: 20 }}>Encerra em {dias}d</span>
                  ) : (
                    <Badge status={c.status === 'renovado' ? 'emitida' : c.status === 'ativo' ? 'confirmado' : 'sem_resposta'} label={c.status} />
                  )}
                </div>
                <div style={{ fontSize: 12, color: theme.color.slate, marginTop: 4 }}>
                  {fmtBRL(c.valor || 0)}/mês
                  {c.dataInicio && c.dataFim ? ` · ${c.dataInicio.toDate().toLocaleDateString('pt-BR')} → ${c.dataFim.toDate().toLocaleDateString('pt-BR')}` : ''}
                </div>
                {alerta && <div style={{ fontSize: 11.5, color: theme.color.dangerDark, fontWeight: 600, marginTop: 6 }}>⏰ Avaliar renovação</div>}
              </Card>
            )
          })}
        </div>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title={draft.id ? 'Editar contrato' : 'Novo contrato'}>
        {/* extração por IA */}
        <Field label="Colar texto do contrato (opcional → IA extrai)">
          <textarea value={aiText} onChange={(e) => setAiText(e.target.value)} rows={3} placeholder="Cole aqui o texto do contrato para a IA preencher os campos" style={{ ...inputStyle, height: 'auto', paddingTop: 10, resize: 'vertical' }} />
          <button onClick={extrair} disabled={aiBusy || !aiText.trim()} style={{ marginTop: 8, height: 38, width: '100%', borderRadius: 10, border: `1px dashed ${theme.color.admin}`, background: '#f5f3ff', color: theme.color.admin, fontWeight: 600, fontSize: 13, cursor: aiText.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {aiBusy ? <><Spinner color={theme.color.admin} /> Analisando…</> : '✨ Extrair dados com IA'}
          </button>
          {aiMsg && <div style={{ fontSize: 12, color: theme.color.slate, marginTop: 8 }}>{aiMsg}</div>}
        </Field>

        <Field label="Cliente">
          <select value={draft.clientId} onChange={(e) => setDraft({ ...draft, clientId: e.target.value })} style={inputStyle}>
            <option value="">— Selecione —</option>
            {(clients.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </Field>
        <Field label="Valor mensal (R$)"><input value={draft.valor} onChange={(e) => setDraft({ ...draft, valor: e.target.value })} inputMode="decimal" placeholder="0,00" style={inputStyle} /></Field>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}><Field label="Início"><input type="date" value={draft.dataInicio} onChange={(e) => setDraft({ ...draft, dataInicio: e.target.value })} style={inputStyle} /></Field></div>
          <div style={{ flex: 1 }}><Field label="Fim"><input type="date" value={draft.dataFim} onChange={(e) => setDraft({ ...draft, dataFim: e.target.value })} style={inputStyle} /></Field></div>
        </div>
        <Field label="Status">
          <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as ContractStatus })} style={inputStyle}>
            <option value="ativo">Ativo</option>
            <option value="a_renovar">A renovar</option>
            <option value="renovado">Renovado</option>
            <option value="encerrado">Encerrado</option>
          </select>
        </Field>
        <Field label="Obrigações (uma por linha)">
          <textarea value={draft.obrigacoes} onChange={(e) => setDraft({ ...draft, obrigacoes: e.target.value })} rows={3} style={{ ...inputStyle, height: 'auto', paddingTop: 10, resize: 'vertical' }} />
        </Field>
        <Field label="PDF do contrato">
          {draft.pdfUrl ? (
            <a href={draft.pdfUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: theme.color.admin, fontWeight: 600 }}>📎 Ver PDF anexado</a>
          ) : (
            <button onClick={() => pdfRef.current?.click()} disabled={upload.isPending} style={{ ...inputStyle, textAlign: 'left', color: theme.color.slate, cursor: 'pointer' }}>
              {upload.isPending ? 'Enviando…' : '📎 Anexar PDF…'}
            </button>
          )}
          <input ref={pdfRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={async (e) => {
            const f = e.target.files?.[0]
            if (!f) return
            try { const url = await upload.mutateAsync(f); setDraft((d) => ({ ...d, pdfUrl: url })) }
            catch { setAiMsg('Upload requer o Storage ativo (plano Blaze).') }
          }} />
        </Field>

        <PrimaryButton onClick={save} color={theme.color.admin} disabled={create.isPending || update.isPending}>
          {create.isPending || update.isPending ? 'Salvando…' : 'Salvar contrato'}
        </PrimaryButton>
        {draft.id && (
          <button onClick={async () => { await remove.mutateAsync(draft.id!); setOpen(false) }} style={{ width: '100%', marginTop: 10, height: 46, border: 'none', background: 'transparent', color: theme.color.dangerDark, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            Excluir contrato
          </button>
        )}
      </Sheet>
    </div>
  )
}
