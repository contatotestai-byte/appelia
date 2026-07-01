import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Timestamp } from 'firebase/firestore'
import { inputToTimestampWithTime, tsToInput, tsToTimeInput, todayInput } from '@/lib/date'
import {
  useAppointments,
  useCreateAppointment,
  useUpdateAppointment,
  useDeleteAppointment,
} from '@/hooks/useAppointments'
import { useClients, useClientMap } from '@/hooks/useClients'
import { callFunction } from '@/lib/firebase/functions'
import { theme } from '@/theme'
import { Card, ScreenHeader, Sheet, Field, inputStyle, PrimaryButton, Spinner, EmptyState, ErrorState } from '@/components/ui'
import type { Appointment, ConfirmacaoStatus } from '@/types'

type Draft = { id?: string; clientId: string; titulo: string; data: string; hora: string; contato: string; statusConfirmacao: ConfirmacaoStatus }
const empty = (): Draft => ({ clientId: '', titulo: '', data: todayInput(), hora: '10:00', contato: '', statusConfirmacao: 'sem_resposta' })

const confLabel: Record<ConfirmacaoStatus, { label: string; bg: string; fg: string }> = {
  confirmado: { label: 'Confirmado', bg: '#ecfdf5', fg: '#059669' },
  aguardando: { label: 'Aguardando', bg: '#fffbeb', fg: '#d97706' },
  sem_resposta: { label: 'Sem confirmação', bg: '#f1f5f9', fg: '#64748b' },
}

function rotuloData(ts: Timestamp | null): string {
  if (!ts) return ''
  const d = ts.toDate()
  const hoje = new Date()
  const amanha = new Date(); amanha.setDate(hoje.getDate() + 1)
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (sameDay(d, hoje)) return `HOJE · ${hora}`
  if (sameDay(d, amanha)) return `AMANHÃ · ${hora}`
  return `${d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).toUpperCase()} · ${hora}`
}

export default function Agenda() {
  const nav = useNavigate()
  const { data, isLoading, isError, refetch } = useAppointments()
  const clients = useClients()
  const clientMap = useClientMap()
  const create = useCreateAppointment()
  const update = useUpdateAppointment()
  const remove = useDeleteAppointment()

  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Draft>(empty())
  const [waBusy, setWaBusy] = useState<string | null>(null)
  const [waMsg, setWaMsg] = useState<string | null>(null)

  const openNew = () => { setDraft(empty()); setOpen(true) }
  const openEdit = (a: Appointment) => {
    setDraft({
      id: a.id, clientId: a.clientId ?? '', titulo: a.titulo,
      data: tsToInput(a.data), hora: tsToTimeInput(a.data) || '10:00',
      contato: a.contato ?? '', statusConfirmacao: a.statusConfirmacao,
    })
    setOpen(true)
  }

  const save = async () => {
    const payload: Partial<Appointment> = {
      clientId: draft.clientId || null,
      titulo: draft.titulo,
      data: inputToTimestampWithTime(draft.data, draft.hora),
      contato: draft.contato,
      statusConfirmacao: draft.statusConfirmacao,
      googleEventId: null,
    }
    if (draft.id) await update.mutateAsync({ id: draft.id, data: payload })
    else await create.mutateAsync(payload)
    setOpen(false)
  }

  const confirmarWhatsApp = async (a: Appointment, e: React.MouseEvent) => {
    e.stopPropagation()
    setWaBusy(a.id); setWaMsg(null)
    try {
      const res = await callFunction<{ appointmentId: string }, { mensagem: string; enviado: boolean }>('sendWhatsAppConfirmation', { appointmentId: a.id })
      setWaMsg(res.enviado ? '✅ Mensagem enviada pelo WhatsApp.' : `Mensagem gerada pela IA: "${res.mensagem}" (envio automático requer Z-API/Twilio configurados).`)
    } catch {
      setWaMsg('Confirmação automática indisponível (requer Functions + WhatsApp configurados).')
    } finally {
      setWaBusy(null)
    }
  }

  const list = data ?? []

  return (
    <div style={{ padding: '4px 20px 0' }} className="fade">
      <ScreenHeader title="Agenda" onBack={() => nav('/admin')} accent={theme.color.admin} />

      <PrimaryButton onClick={openNew} color={theme.color.admin} style={{ height: 44, fontSize: 14, marginBottom: 14 }}>
        + Novo compromisso
      </PrimaryButton>

      {waMsg && (
        <div style={{ background: '#eff6ff', color: '#1d4ed8', borderRadius: 12, padding: '10px 12px', fontSize: 12.5, marginBottom: 14 }}>{waMsg}</div>
      )}

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><Spinner color={theme.color.admin} /></div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : list.length === 0 ? (
        <EmptyState icon="🗓️" text="Nenhum compromisso agendado." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.map((a) => {
            const c = confLabel[a.statusConfirmacao]
            return (
              <Card key={a.id} onClick={() => openEdit(a)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 11, color: theme.color.admin, fontWeight: 700 }}>{rotuloData(a.data)}</div>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: theme.color.navy, marginTop: 2 }}>
                      {a.clientId ? `${clientMap[a.clientId] ?? '—'} — ` : ''}{a.titulo}
                    </div>
                  </div>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: c.fg, background: c.bg, padding: '3px 8px', borderRadius: 20, whiteSpace: 'nowrap' }}>{c.label}</span>
                </div>
                {a.statusConfirmacao !== 'confirmado' && (
                  <button
                    onClick={(e) => confirmarWhatsApp(a, e)}
                    disabled={waBusy === a.id}
                    style={{ width: '100%', height: 42, border: 'none', borderRadius: 11, background: theme.color.successDark, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginTop: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
                  >
                    {waBusy === a.id ? <><Spinner color="#fff" /> Enviando…</> : '💬 Confirmar via WhatsApp'}
                  </button>
                )}
              </Card>
            )
          })}

          <div style={{ background: 'linear-gradient(135deg,#f5f3ff,#eff6ff)', border: '1px solid #ddd6fe', borderRadius: 14, padding: 13, display: 'flex', gap: 9, alignItems: 'center' }}>
            <span style={{ fontSize: 17 }}>🤖</span>
            <span style={{ fontSize: 12, color: '#5b21b6', fontWeight: 600 }}>A IA redige a mensagem de confirmação personalizada por cliente.</span>
          </div>
        </div>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title={draft.id ? 'Editar compromisso' : 'Novo compromisso'}>
        <Field label="Título"><input value={draft.titulo} onChange={(e) => setDraft({ ...draft, titulo: e.target.value })} placeholder="Ex.: Alinhamento" style={inputStyle} /></Field>
        <Field label="Cliente">
          <select value={draft.clientId} onChange={(e) => setDraft({ ...draft, clientId: e.target.value })} style={inputStyle}>
            <option value="">— Nenhum —</option>
            {(clients.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </Field>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}><Field label="Data"><input type="date" value={draft.data} onChange={(e) => setDraft({ ...draft, data: e.target.value })} style={inputStyle} /></Field></div>
          <div style={{ width: 110 }}><Field label="Hora"><input type="time" value={draft.hora} onChange={(e) => setDraft({ ...draft, hora: e.target.value })} style={inputStyle} /></Field></div>
        </div>
        <Field label="WhatsApp do cliente (com DDD)"><input value={draft.contato} onChange={(e) => setDraft({ ...draft, contato: e.target.value })} placeholder="5511999999999" inputMode="tel" style={inputStyle} /></Field>
        <Field label="Confirmação">
          <select value={draft.statusConfirmacao} onChange={(e) => setDraft({ ...draft, statusConfirmacao: e.target.value as ConfirmacaoStatus })} style={inputStyle}>
            <option value="sem_resposta">Sem confirmação</option>
            <option value="aguardando">Aguardando</option>
            <option value="confirmado">Confirmado</option>
          </select>
        </Field>

        <PrimaryButton onClick={save} color={theme.color.admin} disabled={create.isPending || update.isPending}>
          {create.isPending || update.isPending ? 'Salvando…' : 'Salvar'}
        </PrimaryButton>
        {draft.id && (
          <button onClick={async () => { await remove.mutateAsync(draft.id!); setOpen(false) }} style={{ width: '100%', marginTop: 10, height: 46, border: 'none', background: 'transparent', color: theme.color.dangerDark, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            Excluir
          </button>
        )}
      </Sheet>
    </div>
  )
}
