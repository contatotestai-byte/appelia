import { useNavigate } from 'react-router-dom'
import { useInvoices } from '@/hooks/useInvoices'
import { useClients } from '@/hooks/useClients'
import { theme, fmtBRL } from '@/theme'
import { Card, ScreenHeader, Spinner, EmptyState, ErrorState } from '@/components/ui'

const PALETTE = ['#2563eb', '#7c3aed', '#059669', '#f59e0b', '#ef4444', '#0ea5e9', '#ec4899']

export default function ReceitasPorCliente() {
  const nav = useNavigate()
  const invoices = useInvoices()
  const clients = useClients()
  const loading = invoices.isLoading || clients.isLoading

  // soma de NFs emitidas por cliente
  const totals: Record<string, number> = {}
  for (const i of invoices.data ?? []) {
    if (i.status !== 'emitida') continue
    const key = i.clientId ?? '__sem'
    totals[key] = (totals[key] ?? 0) + (i.valor || 0)
  }
  const clientName: Record<string, string> = { __sem: 'Sem cliente' }
  const clientTipo: Record<string, string> = {}
  for (const c of clients.data ?? []) {
    clientName[c.id] = c.nome
    clientTipo[c.id] = c.tipo
  }

  const rows = Object.entries(totals)
    .map(([id, valor], idx) => ({ id, valor, nome: clientName[id] ?? '—', tipo: clientTipo[id] ?? 'esporadico', color: PALETTE[idx % PALETTE.length] }))
    .sort((a, b) => b.valor - a.valor)

  const total = rows.reduce((s, r) => s + r.valor, 0)

  // pizza via conic-gradient
  let acc = 0
  const stops = rows
    .map((r) => {
      const start = (acc / Math.max(1, total)) * 360
      acc += r.valor
      const end = (acc / Math.max(1, total)) * 360
      return `${r.color} ${start}deg ${end}deg`
    })
    .join(', ')

  return (
    <div style={{ padding: '4px 20px 0' }} className="fade">
      <ScreenHeader title="Receitas por cliente" onBack={() => nav('/financeiro')} />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div>
      ) : invoices.isError ? (
        <ErrorState onRetry={() => invoices.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState icon="📊" text="Sem receitas emitidas no período. Marque NFs como emitidas para ver o gráfico." />
      ) : (
        <>
          <Card style={{ display: 'flex', alignItems: 'center', gap: 18, padding: 18 }}>
            <div
              style={{
                width: 110,
                height: 110,
                borderRadius: '50%',
                background: `conic-gradient(${stops})`,
                flexShrink: 0,
                position: 'relative',
              }}
            >
              <div style={{ position: 'absolute', inset: 22, borderRadius: '50%', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 10, color: theme.color.slate }}>Total</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: theme.color.navy }}>{fmtBRL(total)}</span>
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {rows.map((r) => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: r.color }} />
                  <span style={{ fontSize: 12, color: theme.color.navy, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.nome}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: theme.color.slate }}>{Math.round((r.valor / total) * 100)}%</span>
                </div>
              ))}
            </div>
          </Card>

          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rows.map((r) => (
              <Card key={r.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 11, background: `${r.color}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: r.color, fontWeight: 800 }}>
                    {r.nome.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: theme.color.navy }}>{r.nome}</div>
                    <div style={{ fontSize: 11.5, color: theme.color.slate }}>
                      {r.tipo === 'fixo' ? '🔵 Cliente fixo' : '⚪ Esporádico'}
                    </div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: theme.color.navy }}>{fmtBRL(r.valor)}</div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
