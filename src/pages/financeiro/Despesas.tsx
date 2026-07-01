import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { inputToTimestamp, tsToInput, todayInput } from '@/lib/date'
import {
  useExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  useUploadComprovante,
} from '@/hooks/useExpenses'
import { useClients, useClientMap } from '@/hooks/useClients'
import { callFunction } from '@/lib/firebase/functions'
import { theme, fmtBRL } from '@/theme'
import {
  Card,
  ScreenHeader,
  Sheet,
  Field,
  inputStyle,
  PrimaryButton,
  Spinner,
  EmptyState,
  ErrorState,
} from '@/components/ui'
import type { Despesa, DespesaCategoria } from '@/types'

const CATEGORIAS: { value: DespesaCategoria; label: string; icon: string; bg: string }[] = [
  { value: 'transporte', label: 'Transporte', icon: '🚗', bg: '#eff6ff' },
  { value: 'alimentacao', label: 'Alimentação', icon: '🍽️', bg: '#fff7ed' },
  { value: 'material', label: 'Material', icon: '📦', bg: '#f5f3ff' },
  { value: 'outros', label: 'Outros', icon: '🧩', bg: '#f1f5f9' },
]
const catInfo = (c: string) => CATEGORIAS.find((x) => x.value === c) ?? CATEGORIAS[3]

type Draft = {
  id?: string
  valor: string
  data: string
  categoria: DespesaCategoria
  clientId: string
  descricao: string
  comprovanteUrl: string | null
  origem: 'manual' | 'ocr'
}

const emptyDraft = (): Draft => ({
  valor: '',
  data: todayInput(),
  categoria: 'transporte',
  clientId: '',
  descricao: '',
  comprovanteUrl: null,
  origem: 'manual',
})

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve((r.result as string).split(',')[1])
    r.onerror = reject
    r.readAsDataURL(file)
  })

export default function Despesas() {
  const nav = useNavigate()
  const { data, isLoading, isError, refetch } = useExpenses()
  const clients = useClients()
  const clientMap = useClientMap()
  const create = useCreateExpense()
  const update = useUpdateExpense()
  const remove = useDeleteExpense()
  const upload = useUploadComprovante()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [draft, setDraft] = useState<Draft>(emptyDraft())
  const [ocrBusy, setOcrBusy] = useState(false)
  const [ocrNote, setOcrNote] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const camRef = useRef<HTMLInputElement>(null)

  const [fCat, setFCat] = useState<string>('')
  const [fClient, setFClient] = useState<string>('')

  const filtered = useMemo(() => {
    return (data ?? []).filter((e) => {
      if (fCat && e.categoria !== fCat) return false
      if (fClient && e.clientId !== fClient) return false
      return true
    })
  }, [data, fCat, fClient])

  const openNew = () => {
    setDraft(emptyDraft())
    setOcrNote(null)
    setSheetOpen(true)
  }

  const openEdit = (e: Despesa) => {
    setDraft({
      id: e.id,
      valor: String(e.valor ?? ''),
      data: e.data ? tsToInput(e.data) : todayInput(),
      categoria: e.categoria,
      clientId: e.clientId ?? '',
      descricao: e.descricao ?? '',
      comprovanteUrl: e.comprovanteUrl,
      origem: e.origem,
    })
    setOcrNote(null)
    setSheetOpen(true)
  }

  // Fluxo OCR: foto -> Cloud Function ocrExpense -> preenche o draft para revisão
  const handlePhoto = async (file: File) => {
    setOcrBusy(true)
    setOcrNote('Lendo o recibo com IA…')
    setDraft(emptyDraft())
    setSheetOpen(true)
    try {
      const base64 = await fileToBase64(file)
      const comprovanteUrl = await upload.mutateAsync(file)
      const res = await callFunction<{ imageBase64: string }, { valor?: number; data?: string; categoria?: DespesaCategoria; descricao?: string }>(
        'ocrExpense',
        { imageBase64: base64 },
      )
      setDraft((d) => ({
        ...d,
        valor: res.valor != null ? String(res.valor) : d.valor,
        data: res.data || d.data,
        categoria: res.categoria || d.categoria,
        descricao: res.descricao || d.descricao,
        comprovanteUrl,
        origem: 'ocr',
      }))
      setOcrNote('Revise os dados extraídos pela IA antes de salvar.')
    } catch {
      setOcrNote('Não consegui ler o recibo automaticamente. Preencha manualmente (o comprovante foi anexado).')
      try {
        const comprovanteUrl = await upload.mutateAsync(file)
        setDraft((d) => ({ ...d, comprovanteUrl, origem: 'ocr' }))
      } catch {
        /* ignore */
      }
    } finally {
      setOcrBusy(false)
    }
  }

  const save = async () => {
    const payload: Partial<Despesa> = {
      valor: parseFloat(draft.valor.replace(',', '.')) || 0,
      data: inputToTimestamp(draft.data),
      categoria: draft.categoria,
      clientId: draft.clientId || null,
      descricao: draft.descricao,
      comprovanteUrl: draft.comprovanteUrl,
      origem: draft.origem,
    }
    if (draft.id) await update.mutateAsync({ id: draft.id, data: payload })
    else await create.mutateAsync(payload)
    setSheetOpen(false)
  }

  const del = async () => {
    if (draft.id) {
      await remove.mutateAsync(draft.id)
      setSheetOpen(false)
    }
  }

  return (
    <div style={{ padding: '4px 20px 0' }} className="fade">
      <ScreenHeader title="Despesas" onBack={() => nav('/financeiro')} />

      {/* botão foto do recibo */}
      <div
        onClick={() => camRef.current?.click()}
        style={{
          background: `linear-gradient(135deg, ${theme.color.financeiro}, #1d4ed8)`,
          borderRadius: 16,
          padding: '18px 16px',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          cursor: 'pointer',
          boxShadow: '0 12px 24px -12px rgba(37,99,235,.6)',
        }}
      >
        <div style={{ fontSize: 30 }}>📷</div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Foto do recibo</div>
          <div style={{ fontSize: 12.5, opacity: 0.85 }}>IA extrai valor, data e categoria</div>
        </div>
      </div>
      <input
        ref={camRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => e.target.files?.[0] && handlePhoto(e.target.files[0])}
      />

      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <button
          onClick={openNew}
          style={{
            flex: 1,
            height: 42,
            borderRadius: 12,
            border: `1px solid ${theme.color.border}`,
            background: '#fff',
            color: theme.color.navy,
            fontWeight: 600,
            fontSize: 13.5,
            cursor: 'pointer',
          }}
        >
          + Registro manual
        </button>
      </div>

      {/* filtros */}
      <div style={{ display: 'flex', gap: 8, marginTop: 16, overflowX: 'auto' }} className="scroll">
        <select value={fCat} onChange={(e) => setFCat(e.target.value)} style={chipSelect}>
          <option value="">Todas categorias</option>
          {CATEGORIAS.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <select value={fClient} onChange={(e) => setFClient(e.target.value)} style={chipSelect}>
          <option value="">Todos clientes</option>
          {(clients.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
      </div>

      {/* lista */}
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><Spinner /></div>
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : filtered.length === 0 ? (
          <EmptyState icon="🧾" text="Nenhuma despesa registrada ainda." />
        ) : (
          filtered.map((e) => {
            const ci = catInfo(e.categoria)
            return (
              <Card key={e.id} onClick={() => openEdit(e)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 11, background: ci.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                    {ci.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: theme.color.navy }}>{ci.label}</div>
                    <div style={{ fontSize: 12, color: theme.color.slate, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {e.clientId ? clientMap[e.clientId] ?? '—' : '—'}
                      {e.descricao ? ` · ${e.descricao}` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: theme.color.navy }}>{fmtBRL(e.valor || 0)}</div>
                    <div style={{ fontSize: 11, color: theme.color.slateLight }}>
                      {e.data ? e.data.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : ''}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>

      {/* sheet de formulário */}
      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={draft.id ? 'Editar despesa' : 'Nova despesa'}>
        {ocrBusy && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, color: theme.color.financeiro, fontSize: 13.5, fontWeight: 600 }}>
            <Spinner /> {ocrNote}
          </div>
        )}
        {!ocrBusy && ocrNote && (
          <div style={{ background: '#eff6ff', color: '#1d4ed8', borderRadius: 10, padding: '10px 12px', fontSize: 12.5, marginBottom: 14 }}>
            {ocrNote}
          </div>
        )}

        <Field label="Valor (R$)">
          <input
            value={draft.valor}
            onChange={(e) => setDraft({ ...draft, valor: e.target.value })}
            inputMode="decimal"
            placeholder="0,00"
            style={inputStyle}
          />
        </Field>
        <Field label="Data">
          <input type="date" value={draft.data} onChange={(e) => setDraft({ ...draft, data: e.target.value })} style={inputStyle} />
        </Field>
        <Field label="Categoria">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {CATEGORIAS.map((c) => (
              <button
                key={c.value}
                onClick={() => setDraft({ ...draft, categoria: c.value })}
                style={{
                  border: draft.categoria === c.value ? `2px solid ${theme.color.financeiro}` : `1px solid ${theme.color.border}`,
                  background: draft.categoria === c.value ? '#eff6ff' : '#fff',
                  borderRadius: 12,
                  padding: '8px 12px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: theme.color.navy,
                  cursor: 'pointer',
                }}
              >
                {c.icon} {c.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Cliente (opcional)">
          <select value={draft.clientId} onChange={(e) => setDraft({ ...draft, clientId: e.target.value })} style={inputStyle}>
            <option value="">— Nenhum —</option>
            {(clients.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </Field>
        <Field label="Observação">
          <input value={draft.descricao} onChange={(e) => setDraft({ ...draft, descricao: e.target.value })} placeholder="Ex.: Uber até o cliente" style={inputStyle} />
        </Field>

        <Field label="Comprovante">
          {draft.comprovanteUrl ? (
            <a href={draft.comprovanteUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: theme.color.financeiro, fontWeight: 600 }}>
              📎 Ver comprovante anexado
            </a>
          ) : (
            <button onClick={() => fileRef.current?.click()} style={{ ...inputStyle, textAlign: 'left', color: theme.color.slate, cursor: 'pointer' }}>
              📎 Anexar comprovante…
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            style={{ display: 'none' }}
            onChange={async (e) => {
              const f = e.target.files?.[0]
              if (f) {
                const url = await upload.mutateAsync(f)
                setDraft((d) => ({ ...d, comprovanteUrl: url }))
              }
            }}
          />
        </Field>

        <div style={{ marginTop: 8 }}>
          <PrimaryButton onClick={save} disabled={create.isPending || update.isPending}>
            {create.isPending || update.isPending ? 'Salvando…' : 'Salvar despesa'}
          </PrimaryButton>
          {draft.id && (
            <button
              onClick={del}
              style={{ width: '100%', marginTop: 10, height: 46, border: 'none', background: 'transparent', color: theme.color.dangerDark, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
            >
              Excluir despesa
            </button>
          )}
        </div>
      </Sheet>
    </div>
  )
}

const chipSelect: React.CSSProperties = {
  height: 36,
  borderRadius: 10,
  border: `1px solid ${theme.color.border}`,
  background: '#fff',
  color: theme.color.navy,
  fontSize: 12.5,
  fontWeight: 600,
  padding: '0 10px',
  cursor: 'pointer',
}
