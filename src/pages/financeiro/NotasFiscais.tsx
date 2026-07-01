import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { inputToTimestamp, tsToInput, todayInput } from '@/lib/date'
import {
  useInvoices,
  useCreateInvoice,
  useUpdateInvoice,
  useDeleteInvoice,
} from '@/hooks/useInvoices'
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
  Badge,
  Spinner,
  EmptyState,
  ErrorState,
} from '@/components/ui'
import type { Invoice, InvoiceStatus } from '@/types'

type Draft = {
  id?: string
  clientId: string
  valor: string
  descricao: string
  status: InvoiceStatus
  data: string
  pdfUrl: string | null
}

const empty = (): Draft => ({ clientId: '', valor: '', descricao: '', status: 'solicitada', data: todayInput(), pdfUrl: null })

export default function NotasFiscais() {
  const nav = useNavigate()
  const { data, isLoading, isError, refetch } = useInvoices()
  const clients = useClients()
  const clientMap = useClientMap()
  const create = useCreateInvoice()
  const update = useUpdateInvoice()
  const remove = useDeleteInvoice()

  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Draft>(empty())
  const [aiBusy, setAiBusy] = useState(false)
  const [fStatus, setFStatus] = useState('')

  const refDate = (i: Invoice) => i.data?.toMillis() ?? i.createdAt?.toMillis() ?? 0
  const pendentes = (data ?? []).filter((i) => i.status !== 'emitida')
  const filtered = (data ?? [])
    .filter((i) => !fStatus || i.status === fStatus)
    .sort((a, b) => refDate(b) - refDate(a))

  const openNew = () => { setDraft(empty()); setOpen(true) }
  const openEdit = (i: Invoice) => {
    setDraft({
      id: i.id,
      clientId: i.clientId ?? '',
      valor: String(i.valor ?? ''),
      descricao: i.descricao ?? '',
      status: i.status,
      data: i.data ? tsToInput(i.data) : (i.createdAt ? tsToInput(i.createdAt) : todayInput()),
      pdfUrl: i.pdfUrl,
    })
    setOpen(true)
  }

  const gerarRascunho = async () => {
    if (!draft.clientId) return
    setAiBusy(true)
    try {
      const res = await callFunction<{ clientId: string }, { descricao: string }>('generateInvoiceDraft', { clientId: draft.clientId })
      setDraft((d) => ({ ...d, descricao: res.descricao }))
    } catch {
      setDraft((d) => ({ ...d, descricao: d.descricao || 'Serviço de consultoria prestado no período.' }))
    } finally {
      setAiBusy(false)
    }
  }

  const save = async () => {
    const payload: Partial<Invoice> = {
      clientId: draft.clientId || null,
      valor: parseFloat(draft.valor.replace(',', '.')) || 0,
      descricao: draft.descricao,
      status: draft.status,
      data: inputToTimestamp(draft.data),
      pdfUrl: draft.pdfUrl,
    }
    if (draft.id) await update.mutateAsync({ id: draft.id, data: payload })
    else await create.mutateAsync(payload)
    setOpen(false)
  }

  return (
    <div style={{ padding: '4px 20px 0' }} className="fade">
      <ScreenHeader title="Notas Fiscais" onBack={() => nav('/financeiro')} />

      <PrimaryButton onClick={openNew} style={{ height: 48 }}>+ Solicitar nova NF</PrimaryButton>

      {pendentes.length > 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '10px 12px', marginTop: 14, fontSize: 12.5, color: '#92400e' }}>
          ⚠️ {pendentes.length} nota(s) aguardando emissão.
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        {['', 'solicitada', 'emitida', 'pendente'].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setFStatus(s)}
            style={{
              height: 34,
              padding: '0 12px',
              borderRadius: 10,
              border: fStatus === s ? `2px solid ${theme.color.financeiro}` : `1px solid ${theme.color.border}`,
              background: fStatus === s ? '#eff6ff' : '#fff',
              color: theme.color.navy,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {s || 'Todas'}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><Spinner /></div>
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : filtered.length === 0 ? (
          <EmptyState icon="📑" text="Nenhuma nota fiscal por aqui." />
        ) : (
          filtered.map((i) => (
            <Card key={i.id} onClick={() => openEdit(i)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: theme.color.navy }}>{fmtBRL(i.valor || 0)}</span>
                    <Badge status={i.status} />
                  </div>
                  <div style={{ fontSize: 12, color: theme.color.slate, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {i.clientId ? clientMap[i.clientId] ?? '—' : '—'} · {i.descricao || 'Sem descrição'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11.5, color: theme.color.slate2, whiteSpace: 'nowrap' }}>
                    {(i.data ?? i.createdAt)?.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} title={draft.id ? 'Editar NF' : 'Solicitar NF'}>
        <Field label="Cliente">
          <select value={draft.clientId} onChange={(e) => setDraft({ ...draft, clientId: e.target.value })} style={inputStyle}>
            <option value="">— Selecione —</option>
            {(clients.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </Field>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <Field label="Valor (R$)">
              <input value={draft.valor} onChange={(e) => setDraft({ ...draft, valor: e.target.value })} inputMode="decimal" placeholder="0,00" style={inputStyle} />
            </Field>
          </div>
          <div style={{ flex: 1 }}>
            <Field label="Data (mês de referência)">
              <input type="date" value={draft.data} onChange={(e) => setDraft({ ...draft, data: e.target.value })} style={inputStyle} />
            </Field>
          </div>
        </div>
        <Field label="Descrição do serviço">
          <textarea
            value={draft.descricao}
            onChange={(e) => setDraft({ ...draft, descricao: e.target.value })}
            rows={3}
            placeholder="Descrição que irá na nota fiscal"
            style={{ ...inputStyle, height: 'auto', paddingTop: 10, resize: 'vertical' }}
          />
          <button
            onClick={gerarRascunho}
            disabled={aiBusy || !draft.clientId}
            style={{ marginTop: 8, height: 38, width: '100%', borderRadius: 10, border: `1px dashed ${theme.color.financeiro}`, background: '#eff6ff', color: theme.color.financeiro, fontWeight: 600, fontSize: 13, cursor: draft.clientId ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {aiBusy ? <><Spinner /> Gerando…</> : '✨ Gerar descrição com IA'}
          </button>
        </Field>
        <Field label="Status">
          <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as InvoiceStatus })} style={inputStyle}>
            <option value="solicitada">Solicitada</option>
            <option value="pendente">Pendente</option>
            <option value="emitida">Emitida</option>
          </select>
        </Field>

        <PrimaryButton onClick={save} disabled={create.isPending || update.isPending}>
          {create.isPending || update.isPending ? 'Salvando…' : draft.id ? 'Salvar' : 'Solicitar NF'}
        </PrimaryButton>
        {draft.id && (
          <>
            {draft.status !== 'emitida' && (
              <button onClick={() => setDraft({ ...draft, status: 'emitida' })} style={secondaryBtn}>
                Marcar como emitida
              </button>
            )}
            <button onClick={async () => { await remove.mutateAsync(draft.id!); setOpen(false) }} style={{ ...secondaryBtn, color: theme.color.dangerDark }}>
              Excluir
            </button>
          </>
        )}
      </Sheet>
    </div>
  )
}

const secondaryBtn: React.CSSProperties = {
  width: '100%',
  marginTop: 10,
  height: 46,
  border: 'none',
  background: 'transparent',
  color: theme.color.financeiro,
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
}
