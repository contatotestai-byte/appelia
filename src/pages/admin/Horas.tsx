import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Timestamp } from 'firebase/firestore'
import { useTimeEntries, useCreateTimeEntry, useDeleteTimeEntry } from '@/hooks/useTimeEntries'
import { useClients, useClientMap } from '@/hooks/useClients'
import { theme } from '@/theme'
import { Card, ScreenHeader, Sheet, Field, inputStyle, PrimaryButton, Spinner } from '@/components/ui'
import type { TimeEntry } from '@/types'

const TIMER_KEY = 'elia_timer'
type RunningTimer = { clientId: string; descricao: string; startISO: string }

function fmtClock(ms: number) {
  const s = Math.floor(ms / 1000)
  const hh = String(Math.floor(s / 3600)).padStart(2, '0')
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

export default function Horas() {
  const nav = useNavigate()
  const { data, isLoading } = useTimeEntries()
  const clients = useClients()
  const clientMap = useClientMap()
  const create = useCreateTimeEntry()
  const remove = useDeleteTimeEntry()

  const [timer, setTimer] = useState<RunningTimer | null>(null)
  const [now, setNow] = useState(Date.now())
  const [setupOpen, setSetupOpen] = useState(false)
  const [manualOpen, setManualOpen] = useState(false)
  const [pendingClient, setPendingClient] = useState('')
  const [pendingDesc, setPendingDesc] = useState('')

  // manual entry
  const [mClient, setMClient] = useState('')
  const [mHoras, setMHoras] = useState('')
  const [mDesc, setMDesc] = useState('')
  const [mData, setMData] = useState(new Date().toISOString().slice(0, 10))

  useEffect(() => {
    const raw = localStorage.getItem(TIMER_KEY)
    if (raw) setTimer(JSON.parse(raw))
  }, [])

  useEffect(() => {
    if (!timer) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [timer])

  const startTimer = () => {
    if (!pendingClient) return
    const t: RunningTimer = { clientId: pendingClient, descricao: pendingDesc, startISO: new Date().toISOString() }
    localStorage.setItem(TIMER_KEY, JSON.stringify(t))
    setTimer(t)
    setNow(Date.now())
    setSetupOpen(false)
    setPendingDesc('')
  }

  const stopTimer = async () => {
    if (!timer) return
    const start = new Date(timer.startISO).getTime()
    const horas = Math.round(((Date.now() - start) / 3600000) * 100) / 100
    await create.mutateAsync({
      clientId: timer.clientId || null,
      inicio: Timestamp.fromDate(new Date(timer.startISO)),
      fim: Timestamp.fromDate(new Date()),
      horas,
      descricao: timer.descricao,
    })
    localStorage.removeItem(TIMER_KEY)
    setTimer(null)
  }

  const saveManual = async () => {
    await create.mutateAsync({
      clientId: mClient || null,
      inicio: mData ? Timestamp.fromDate(new Date(mData)) : null,
      fim: null,
      horas: parseFloat(mHoras.replace(',', '.')) || 0,
      descricao: mDesc,
    })
    setManualOpen(false)
    setMHoras(''); setMDesc('')
  }

  // agregação por cliente
  const consumed: Record<string, number> = {}
  for (const t of data ?? []) {
    const key = t.clientId ?? '__sem'
    consumed[key] = (consumed[key] ?? 0) + (t.horas || 0)
  }
  const rows = Object.entries(consumed).map(([id, horas]) => {
    const cli = (clients.data ?? []).find((c) => c.id === id)
    return { id, nome: id === '__sem' ? 'Sem cliente' : cli?.nome ?? '—', horas: Math.round(horas * 10) / 10, meta: cli?.horasContratadas ?? 0 }
  })

  const elapsed = timer ? now - new Date(timer.startISO).getTime() : 0

  return (
    <div style={{ padding: '4px 20px 0' }} className="fade">
      <ScreenHeader title="Horas" onBack={() => nav('/admin')} accent={theme.color.admin} />

      {/* timer */}
      <div style={{ background: theme.color.navy2, borderRadius: 18, padding: 22, textAlign: 'center', color: '#fff', marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: theme.color.slateLight }}>
          {timer ? (clientMap[timer.clientId] ?? 'Sem cliente') + (timer.descricao ? ` · ${timer.descricao}` : '') : 'Nenhum timer ativo'}
        </div>
        <div style={{ fontSize: 42, fontWeight: 800, letterSpacing: -1, fontVariantNumeric: 'tabular-nums', margin: '6px 0' }}>
          {fmtClock(elapsed)}
        </div>
        {timer ? (
          <button onClick={stopTimer} disabled={create.isPending} style={{ height: 46, padding: '0 28px', border: 'none', borderRadius: 12, background: theme.color.dangerDark, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            ⏹ Parar e salvar
          </button>
        ) : (
          <button onClick={() => setSetupOpen(true)} style={{ height: 46, padding: '0 28px', border: 'none', borderRadius: 12, background: theme.color.financeiro, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            ▶ Iniciar timer
          </button>
        )}
      </div>

      <button onClick={() => setManualOpen(true)} style={{ width: '100%', height: 42, borderRadius: 12, border: `1px solid ${theme.color.border}`, background: '#fff', color: theme.color.navy, fontWeight: 600, fontSize: 13.5, cursor: 'pointer', marginBottom: 18 }}>
        + Registro manual de horas
      </button>

      <div style={{ fontSize: 13, fontWeight: 700, color: theme.color.navy, marginBottom: 10 }}>Horas contratadas × consumidas</div>
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}><Spinner color={theme.color.admin} /></div>
      ) : rows.length === 0 ? (
        <Card><div style={{ fontSize: 13, color: theme.color.slate }}>Nenhuma hora registrada ainda.</div></Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {rows.map((r) => {
            const pct = r.meta > 0 ? Math.min(100, (r.horas / r.meta) * 100) : 0
            const near = r.meta > 0 && pct >= 75
            const barColor = pct >= 100 ? theme.color.dangerDark : near ? theme.color.warningDark : theme.color.financeiro
            return (
              <Card key={r.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: theme.color.navy, marginBottom: 8 }}>
                  <span>{r.nome}</span>
                  <span>{r.horas}{r.meta > 0 ? ` / ${r.meta}h` : 'h'}</span>
                </div>
                {r.meta > 0 ? (
                  <>
                    <div style={{ height: 8, borderRadius: 6, background: '#e2e8f0', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 6 }} />
                    </div>
                    {near && <div style={{ fontSize: 11, color: barColor, fontWeight: 600, marginTop: 6 }}>⚠️ {pct >= 100 ? 'Limite atingido' : 'Próximo do limite'}</div>}
                  </>
                ) : (
                  <div style={{ fontSize: 11, color: theme.color.slateLight }}>Defina as horas contratadas no cadastro do cliente para ver o progresso.</div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* lançamentos recentes */}
      {(data ?? []).length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: theme.color.navy, marginBottom: 10 }}>Lançamentos</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(data ?? []).slice(0, 12).map((t: TimeEntry) => (
              <Card key={t.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: theme.color.navy }}>{t.clientId ? clientMap[t.clientId] ?? '—' : 'Sem cliente'}</div>
                    <div style={{ fontSize: 11.5, color: theme.color.slate, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.descricao || '—'}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: theme.color.navy }}>{Math.round((t.horas || 0) * 10) / 10}h</div>
                  <button onClick={() => remove.mutate(t.id)} style={{ border: 'none', background: 'transparent', color: '#cbd5e1', fontSize: 16, cursor: 'pointer' }}>✕</button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* sheet iniciar timer */}
      <Sheet open={setupOpen} onClose={() => setSetupOpen(false)} title="Iniciar timer">
        <Field label="Cliente">
          <select value={pendingClient} onChange={(e) => setPendingClient(e.target.value)} style={inputStyle}>
            <option value="">— Selecione —</option>
            {(clients.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </Field>
        <Field label="Atividade">
          <input value={pendingDesc} onChange={(e) => setPendingDesc(e.target.value)} placeholder="Ex.: Pesquisa de clima" style={inputStyle} />
        </Field>
        <PrimaryButton onClick={startTimer} color={theme.color.financeiro} disabled={!pendingClient}>▶ Iniciar</PrimaryButton>
      </Sheet>

      {/* sheet registro manual */}
      <Sheet open={manualOpen} onClose={() => setManualOpen(false)} title="Registro manual">
        <Field label="Cliente">
          <select value={mClient} onChange={(e) => setMClient(e.target.value)} style={inputStyle}>
            <option value="">— Nenhum —</option>
            {(clients.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </Field>
        <Field label="Horas"><input value={mHoras} onChange={(e) => setMHoras(e.target.value)} inputMode="decimal" placeholder="Ex.: 2,5" style={inputStyle} /></Field>
        <Field label="Data"><input type="date" value={mData} onChange={(e) => setMData(e.target.value)} style={inputStyle} /></Field>
        <Field label="Descrição"><input value={mDesc} onChange={(e) => setMDesc(e.target.value)} placeholder="O que foi feito" style={inputStyle} /></Field>
        <PrimaryButton onClick={saveManual} color={theme.color.admin} disabled={create.isPending}>Salvar</PrimaryButton>
      </Sheet>
    </div>
  )
}
