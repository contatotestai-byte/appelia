import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { inputToTimestamp, tsToInput, todayInput } from '@/lib/date'
import {
  useDeliveries,
  useCreateDelivery,
  useUpdateDelivery,
  useDeleteDelivery,
} from '@/hooks/useDeliveries'
import { useClients, useClientMap } from '@/hooks/useClients'
import { theme } from '@/theme'
import { ScreenHeader, Sheet, Field, inputStyle, PrimaryButton, Spinner, ErrorState } from '@/components/ui'
import type { Delivery, DeliveryStatus } from '@/types'

const COLUMNS: { status: DeliveryStatus; label: string; color: string }[] = [
  { status: 'pendente', label: 'PENDENTE', color: theme.color.warning },
  { status: 'andamento', label: 'ANDAMENTO', color: theme.color.financeiro },
  { status: 'entregue', label: 'ENTREGUE', color: theme.color.successDark },
]
const nextStatus: Record<DeliveryStatus, DeliveryStatus | null> = {
  pendente: 'andamento',
  andamento: 'entregue',
  entregue: null,
}

type Draft = { id?: string; titulo: string; clientId: string; prazo: string; status: DeliveryStatus; responsavel: string }
const empty = (): Draft => ({ titulo: '', clientId: '', prazo: todayInput(), status: 'pendente', responsavel: '' })

export default function Cronograma() {
  const nav = useNavigate()
  const { data, isLoading, isError, refetch } = useDeliveries()
  const clients = useClients()
  const clientMap = useClientMap()
  const create = useCreateDelivery()
  const update = useUpdateDelivery()
  const remove = useDeleteDelivery()

  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Draft>(empty())

  const openNew = () => { setDraft(empty()); setOpen(true) }
  const openEdit = (d: Delivery) => {
    setDraft({ id: d.id, titulo: d.titulo, clientId: d.clientId ?? '', prazo: tsToInput(d.prazo), status: d.status, responsavel: d.responsavel ?? '' })
    setOpen(true)
  }

  const save = async () => {
    const payload: Partial<Delivery> = {
      titulo: draft.titulo,
      clientId: draft.clientId || null,
      prazo: inputToTimestamp(draft.prazo),
      status: draft.status,
      responsavel: draft.responsavel,
    }
    if (draft.id) await update.mutateAsync({ id: draft.id, data: payload })
    else await create.mutateAsync(payload)
    setOpen(false)
  }

  const advance = (d: Delivery, e: React.MouseEvent) => {
    e.stopPropagation()
    const ns = nextStatus[d.status]
    if (ns) update.mutate({ id: d.id, data: { status: ns } })
  }

  const list = data ?? []
  const overloaded = list.filter((d) => d.status !== 'entregue').length >= 3

  return (
    <div style={{ padding: '4px 20px 0' }} className="fade">
      <ScreenHeader title="Cronograma" onBack={() => nav('/admin')} accent={theme.color.admin} />

      {overloaded && (
        <div style={{ background: 'linear-gradient(135deg,#f5f3ff,#eff6ff)', border: '1px solid #ddd6fe', borderRadius: 14, padding: 13, display: 'flex', gap: 9, alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontSize: 17 }}>🤖</span>
          <span style={{ fontSize: 12, color: '#5b21b6', fontWeight: 600 }}>Você tem várias entregas em aberto. Avalie redistribuir os prazos.</span>
        </div>
      )}

      <PrimaryButton onClick={openNew} color={theme.color.admin} style={{ height: 44, fontSize: 14, marginBottom: 16 }}>
        + Nova entrega
      </PrimaryButton>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><Spinner color={theme.color.admin} /></div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          {COLUMNS.map((col) => {
            const items = list.filter((d) => d.status === col.status)
            return (
              <div key={col.status} style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: theme.color.slate, marginBottom: 8 }}>
                  {col.label} <span style={{ color: '#cbd5e1' }}>{items.length}</span>
                </div>
                {items.length === 0 && (
                  <div style={{ fontSize: 11, color: '#cbd5e1', padding: '8px 4px' }}>—</div>
                )}
                {items.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => openEdit(d)}
                    style={{ background: '#fff', borderRadius: 12, padding: 11, boxShadow: '0 2px 6px rgba(15,23,42,.05)', marginBottom: 8, borderLeft: `3px solid ${col.color}`, cursor: 'pointer' }}
                  >
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: theme.color.navy, wordBreak: 'break-word' }}>{d.titulo}</div>
                    <div style={{ fontSize: 10.5, color: theme.color.slate, marginTop: 2 }}>
                      {d.clientId ? clientMap[d.clientId] ?? '—' : '—'}
                      {d.prazo ? ` · ${d.prazo.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}` : ''}
                    </div>
                    {nextStatus[d.status] && (
                      <button
                        onClick={(e) => advance(d, e)}
                        style={{ marginTop: 8, height: 26, width: '100%', borderRadius: 8, border: 'none', background: `${col.color}1a`, color: col.color, fontSize: 10.5, fontWeight: 700, cursor: 'pointer' }}
                      >
                        {d.status === 'pendente' ? 'Iniciar →' : 'Concluir ✓'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title={draft.id ? 'Editar entrega' : 'Nova entrega'}>
        <Field label="Título">
          <input value={draft.titulo} onChange={(e) => setDraft({ ...draft, titulo: e.target.value })} placeholder="Ex.: Mapa de cargos" style={inputStyle} />
        </Field>
        <Field label="Cliente">
          <select value={draft.clientId} onChange={(e) => setDraft({ ...draft, clientId: e.target.value })} style={inputStyle}>
            <option value="">— Nenhum —</option>
            {(clients.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </Field>
        <Field label="Prazo">
          <input type="date" value={draft.prazo} onChange={(e) => setDraft({ ...draft, prazo: e.target.value })} style={inputStyle} />
        </Field>
        <Field label="Responsável">
          <input value={draft.responsavel} onChange={(e) => setDraft({ ...draft, responsavel: e.target.value })} placeholder="Quem executa" style={inputStyle} />
        </Field>
        <Field label="Status">
          <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as DeliveryStatus })} style={inputStyle}>
            <option value="pendente">Pendente</option>
            <option value="andamento">Em andamento</option>
            <option value="entregue">Entregue</option>
          </select>
        </Field>

        <PrimaryButton onClick={save} color={theme.color.admin} disabled={create.isPending || update.isPending}>
          {create.isPending || update.isPending ? 'Salvando…' : 'Salvar'}
        </PrimaryButton>
        {draft.id && (
          <button onClick={async () => { await remove.mutateAsync(draft.id!); setOpen(false) }} style={{ width: '100%', marginTop: 10, height: 46, border: 'none', background: 'transparent', color: theme.color.dangerDark, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            Excluir entrega
          </button>
        )}
      </Sheet>
    </div>
  )
}
