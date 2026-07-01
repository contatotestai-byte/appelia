import { useNavigate } from 'react-router-dom'
import { useDeliveries } from '@/hooks/useDeliveries'
import { useTimeEntries } from '@/hooks/useTimeEntries'
import { useContracts } from '@/hooks/useContracts'
import { theme } from '@/theme'
import { Card, ScreenHeader, IconTile } from '@/components/ui'
import { Icon, type IconName } from '@/components/Icon'
import type { Timestamp } from 'firebase/firestore'

function isThisWeek(ts: Timestamp | null): boolean {
  if (!ts) return false
  const d = ts.toDate().getTime()
  const now = Date.now()
  return d >= now - 86400000 && d <= now + 6 * 86400000
}
function isThisMonth(ts: Timestamp | null): boolean {
  if (!ts) return false
  const d = ts.toDate()
  const n = new Date()
  return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear()
}

export default function AdminHub() {
  const nav = useNavigate()
  const deliveries = useDeliveries()
  const timeEntries = useTimeEntries()
  const contracts = useContracts()

  const entregasSemana = (deliveries.data ?? []).filter(
    (d) => d.status !== 'entregue' && isThisWeek(d.prazo),
  ).length
  const horasMes = Math.round(
    (timeEntries.data ?? [])
      .filter((t) => isThisMonth(t.inicio))
      .reduce((s, t) => s + (t.horas || 0), 0),
  )
  const contratosVencer = (contracts.data ?? []).filter((c) => {
    if (!c.dataFim) return false
    const dias = Math.ceil((c.dataFim.toDate().getTime() - Date.now()) / 86400000)
    return dias >= 0 && dias <= 30 && c.status !== 'renovado' && c.status !== 'encerrado'
  }).length

  const cards: { icon: IconName; title: string; sub: string; to: string; danger?: boolean }[] = [
    { icon: 'columns', title: 'Cronograma', sub: 'Entregas', to: '/admin/cronograma' },
    { icon: 'clock', title: 'Horas', sub: 'Timer + relatório', to: '/admin/horas' },
    { icon: 'file', title: 'Contratos', sub: contratosVencer ? `${contratosVencer} a vencer` : 'Gerenciar', to: '/admin/contratos', danger: contratosVencer > 0 },
    { icon: 'calendar', title: 'Agenda', sub: '+ WhatsApp', to: '/admin/agenda' },
    { icon: 'users', title: 'Clientes', sub: 'Cadastro manual', to: '/clientes' },
  ]

  return (
    <div style={{ padding: '4px 20px 0' }} className="fade">
      <ScreenHeader title="Administrativo" onBack={() => nav('/')} accent={theme.color.admin} />

      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <Stat label="Entregas/semana" value={String(entregasSemana)} color={theme.color.admin} />
        <Stat label="Horas no mês" value={`${horasMes}h`} color={theme.color.navy} />
        <Stat label="Contratos a vencer" value={String(contratosVencer)} color={contratosVencer ? theme.color.dangerDark : theme.color.navy} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {cards.map((c) => (
          <Card key={c.title} onClick={() => nav(c.to)} style={{ padding: 16 }}>
            <IconTile size={40}><Icon name={c.icon} size={20} /></IconTile>
            <div style={{ fontSize: 14, fontWeight: 600, color: theme.color.navy, marginTop: 11 }}>{c.title}</div>
            <div style={{ fontSize: 11.5, color: c.danger ? theme.color.dangerDark : theme.color.slate2, marginTop: 1 }}>{c.sub}</div>
          </Card>
        ))}
      </div>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <Card style={{ flex: 1, padding: 13 }}>
      <div style={{ fontSize: 11, color: theme.color.slate }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color, marginTop: 3 }}>{value}</div>
    </Card>
  )
}
