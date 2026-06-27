/**
 * Camada de IA abstraída. Troque o provedor com a env AI_PROVIDER (gemini|claude).
 * Nenhuma chave é exposta ao client — tudo roda no servidor (Cloud Functions).
 */

export interface AITool {
  name: string
  description: string
  parameters: Record<string, unknown> // JSON Schema
}

export interface AIToolCall {
  name: string
  args: Record<string, unknown>
}

export interface AIResult {
  text: string
  toolCalls: AIToolCall[]
}

export interface AIProvider {
  /** Chamada simples de texto. Aceita instrução de sistema opcional. */
  complete(prompt: string, system?: string): Promise<string>
  /** Chamada com saída JSON estruturada (retorna objeto parseado). */
  completeJSON<T>(prompt: string, system?: string): Promise<T>
  /** Chamada com ferramentas (function calling). */
  withTools(messages: { role: 'user' | 'assistant'; content: string }[], tools: AITool[], system?: string): Promise<AIResult>
}

const PROVIDER = (process.env.AI_PROVIDER || 'gemini').toLowerCase()

// ----------------------- Gemini (gratuito) -----------------------
const GEMINI_KEY = process.env.GEMINI_API_KEY || ''
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

function extractJSON(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) return fenced[1].trim()
  const first = text.indexOf('{')
  const firstArr = text.indexOf('[')
  const start = first === -1 ? firstArr : firstArr === -1 ? first : Math.min(first, firstArr)
  if (start >= 0) {
    const lastObj = text.lastIndexOf('}')
    const lastArr = text.lastIndexOf(']')
    const end = Math.max(lastObj, lastArr)
    if (end > start) return text.slice(start, end + 1)
  }
  return text.trim()
}

const geminiProvider: AIProvider = {
  async complete(prompt, system) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`
    const body: Record<string, unknown> = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    }
    if (system) body.systemInstruction = { parts: [{ text: system }] }
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) throw new Error(`Gemini erro ${res.status}: ${await res.text()}`)
    const data = (await res.json()) as any
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  },
  async completeJSON(prompt, system) {
    const sys = (system ? system + '\n' : '') + 'Responda APENAS com JSON válido, sem texto extra.'
    const text = await geminiProvider.complete(prompt, sys)
    return JSON.parse(extractJSON(text))
  },
  async withTools(messages, tools, system) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`
    const body: Record<string, unknown> = {
      contents: messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
      tools: [
        {
          functionDeclarations: tools.map((t) => ({ name: t.name, description: t.description, parameters: t.parameters })),
        },
      ],
    }
    if (system) body.systemInstruction = { parts: [{ text: system }] }
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) throw new Error(`Gemini erro ${res.status}: ${await res.text()}`)
    const data = (await res.json()) as any
    const parts = data?.candidates?.[0]?.content?.parts ?? []
    const toolCalls: AIToolCall[] = []
    let text = ''
    for (const p of parts) {
      if (p.functionCall) toolCalls.push({ name: p.functionCall.name, args: p.functionCall.args || {} })
      if (p.text) text += p.text
    }
    return { text, toolCalls }
  },
}

// ----------------------- Claude (pago) -----------------------
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || ''
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6'

const claudeProvider: AIProvider = {
  async complete(prompt, system) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 1500,
        system,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!res.ok) throw new Error(`Claude erro ${res.status}: ${await res.text()}`)
    const data = (await res.json()) as any
    return data?.content?.[0]?.text ?? ''
  },
  async completeJSON(prompt, system) {
    const sys = (system ? system + '\n' : '') + 'Responda APENAS com JSON válido, sem texto extra.'
    const text = await claudeProvider.complete(prompt, sys)
    return JSON.parse(extractJSON(text))
  },
  async withTools(messages, tools, system) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 1500,
        system,
        tools: tools.map((t) => ({ name: t.name, description: t.description, input_schema: t.parameters })),
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    })
    if (!res.ok) throw new Error(`Claude erro ${res.status}: ${await res.text()}`)
    const data = (await res.json()) as any
    const toolCalls: AIToolCall[] = []
    let text = ''
    for (const block of data?.content ?? []) {
      if (block.type === 'text') text += block.text
      if (block.type === 'tool_use') toolCalls.push({ name: block.name, args: block.input || {} })
    }
    return { text, toolCalls }
  },
}

export const ai: AIProvider = PROVIDER === 'claude' ? claudeProvider : geminiProvider

export const aiConfigured = (): boolean =>
  PROVIDER === 'claude' ? !!ANTHROPIC_KEY : !!GEMINI_KEY
