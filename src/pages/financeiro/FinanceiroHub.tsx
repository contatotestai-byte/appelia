import { useNavigate } from 'react-router-dom'
import { useExpenses } from '@/hooks/useExpenses'
import { useInvoices } from '@/hooks/useInvoices'
import { useTaxes } from '@/hooks/useTaxes'
import { theme, fmtBRLShort } from '@/theme'
import { Card, ScreenHeader, IconTile } from '@/components/ui'
import { Icon, type IconName } from '@/components/Icon'
import type { Timestamp } from 'firebase/firestore'

function monthKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}`
}

export default function FinanceiroHub() {
  const nav = useNavigate()
  const expenses = useExpenses()
  const invoices = useInvoices()
  const taxes = useTaxes()

  // agrega entradas/saídas dos últimos 6 meses
  const months: { label: string; entrada: number; saida: number; key: string }[] = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      label: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
      entrada: 0,
      saida: 0,
      key: monthKey(d),
    })
  }
  const byKey = Object.fromEntries(months.map((m) => [m.key, m]))
  const bucket = (ts: Timestamp | null) => (ts ? byKey[monthKey(ts.toDate())] : undefined)

  for (const inv of invoices.data ?? []) {
    if (inv.status === 'emitida') {
      const b = bucket(inv.createdAt)
      if (b) b.entrada += inv.valor || 0
    }
  }
  for (const exp of expenses.data ?? []) {
    const b = bucket(exp.data)
    if (b) b.saida += exp.valor || 0
  }

  const maxVal = Math.max(1, ...months.flatMap((m) => [m.entrada, m.saida]))

  const aReceber = (invoices.data ?? [])
    .filter((i) => i.status === 'solicitada' || i.status === 'pendente')
    .reduce((s, i) => s + (i.valor || 0), 0)
  const aPagar = (expenses.data ?? [])
    .filter((e) => {
      if (!e.data) return false
      const d = e.data.toDate()
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    .reduce((s, e) => s + (e.valor || 0), 0)
  const impostosPend = (taxes.data ?? [])
    .filter((t) => t.status !== 'pago')
    .reduce((s, t) => s + (t.valor || 0), 0)

  const cards: { icon: IconName; title: string; sub: string; to: string }[] = [
    { icon: 'receipt', title: 'Despesas', sub: 'OCR de recibos', to: '/financeiro/despesas' },
    { icon: 'fileCheck', title: 'Notas Fiscais', sub: `${(invoices.data ?? []).filter((i) => i.status !== 'emitida').length} pendente(s)`, to: '/financeiro/notas-fiscais' },
    { icon: 'bank', title: 'Impostos', sub: `${(taxes.data ?? []).filter((t) => t.status !== 'pago').length} em aberto`, to: '/financeiro/impostos' },
    { icon: 'pie', title: 'Receitas', sub: 'por cliente', to: '/financeiro/receitas' },
  ]

  return (
    <div style={{ padding: '4px 20px 0' }} className="fade">
      <ScreenHeader title="Financeiro" onBack={() => nav('/')} />

      {/* gráfico */}
      <Card style={{ borderRadius: 16, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: theme.color.navy }}>Entradas × Saídas</span>
          <span style={{ fontSize: 11, color: theme.color.slate }}>6 meses</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 120, gap: 8 }}>
          {months.map((m, idx) => (
            <div key={m.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 100 }}>
                <div
                  style={{
                    width: 10,
                    height: Math.max(4, (m.entrada / maxVal) * 100),
                    background: idx === months.length - 1 ? theme.color.financeiro : theme.color.success,
                    borderRadius: 4,
                  }}
                />
                <div
                  style={{ width: 10, height: Math.max(4, (m.saida / maxVal) * 100), background: '#f87171', borderRadius: 4 }}
                />
              </div>
              <span style={{ fontSize: 10, color: idx === months.length - 1 ? theme.color.navy : '#94a3b8', fontWeight: idx === months.length - 1 ? 700 : 400 }}>
                {m.label}
              </span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 14, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
          <Legend color={theme.color.success} label="Entradas" />
          <Legend color="#f87171" label="Saídas" />
        </div>
      </Card>

      {/* indicadores */}
      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
        <Indicator label="A receber" value={fmtBRLShort(aReceber)} color={theme.color.successDark} />
        <Indicator label="A pagar" value={fmtBRLShort(aPagar)} color={theme.color.dangerDark} />
        <Indicator label="Impostos" value={fmtBRLShort(impostosPend)} color={theme.color.warningDark} />
      </div>

      {/* cards navegação */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
        {cards.map((c) => (
          <Card key={c.title} onClick={() => nav(c.to)} style={{ padding: 16 }}>
            <IconTile size={40}><Icon name={c.icon} size={20} /></IconTile>
            <div style={{ fontSize: 14, fontWeight: 600, color: theme.color.navy, marginTop: 11 }}>{c.title}</div>
            <div style={{ fontSize: 11.5, color: theme.color.slate2, marginTop: 1 }}>{c.sub}</div>
          </Card>
        ))}
      </div>
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 9, height: 9, borderRadius: 3, background: color }} />
      <span style={{ fontSize: 11, color: theme.color.slate }}>{label}</span>
    </div>
  )
}

function Indicator({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <Card style={{ flex: 1, padding: 13 }}>
      <div style={{ fontSize: 11, color: theme.color.slate }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color, marginTop: 3 }}>{value}</div>
    </Card>
  )
}
