import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useExpenses } from '@/hooks/useExpenses'
import { useInvoices } from '@/hooks/useInvoices'
import { useTaxes } from '@/hooks/useTaxes'
import { theme, fmtBRL } from '@/theme'
import { Card, Spinner } from '@/components/ui'
import type { Timestamp } from 'firebase/firestore'

function isThisMonth(ts: Timestamp | null): boolean {
  if (!ts) return false
  const d = ts.toDate()
  const now = new Date()
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

function daysUntil(ts: Timestamp | null): number | null {
  if (!ts) return null
  const diff = ts.toDate().getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

const shortcuts = [
  { icon: '🧾', label: 'Registrar despesa', to: '/financeiro/despesas' },
  { icon: '📑', label: 'Solicitar NF', to: '/financeiro/notas-fiscais' },
  { icon: '🗓️', label: 'Confirmar agenda', to: '/admin/agenda' },
  { icon: '📣', label: 'Gerar post', to: '/marketing' },
]

export default function Home() {
  const nav = useNavigate()
  const { user } = useAuth()
  const expenses = useExpenses()
  const invoices = useInvoices()
  const taxes = useTaxes()

  const loading = expenses.isLoading || invoices.isLoading || taxes.isLoading

  const despesaMes = (expenses.data ?? [])
    .filter((e) => isThisMonth(e.data))
    .reduce((s, e) => s + (e.valor || 0), 0)

  const receitaMes = (invoices.data ?? [])
    .filter((i) => i.status === 'emitida')
    .reduce((s, i) => s + (i.valor || 0), 0)

  const saldo = receitaMes - despesaMes

  const nome = user?.displayName?.split(' ')[0] || 'consultora'
  const hoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  // pendências
  const alertas: { icon: string; bg: string; accent: string; titulo: string; sub: string; to: string }[] = []
  for (const t of taxes.data ?? []) {
    const d = daysUntil(t.vencimento)
    if (t.status === 'atrasado' || (d !== null && d <= 5 && t.status !== 'pago')) {
      alertas.push({
        icon: '⚠️',
        bg: '#fef2f2',
        accent: theme.color.danger,
        titulo: t.status === 'atrasado' ? `${t.tipo} atrasado` : `${t.tipo} vence em ${d} dia(s)`,
        sub: fmtBRL(t.valor),
        to: '/financeiro/impostos',
      })
    }
  }

  return (
    <div style={{ padding: '4px 20px 0' }} className="fade">
      {/* cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 13, color: theme.color.slate, fontWeight: 500, textTransform: 'capitalize' }}>
            {hoje}
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: theme.color.navy, letterSpacing: -0.5, textTransform: 'capitalize' }}>
            Olá, {nome}
          </div>
        </div>
        <div
          onClick={() => nav('/notificacoes')}
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: '#fff',
            boxShadow: theme.shadow.card,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 19,
            cursor: 'pointer',
            position: 'relative',
          }}
        >
          🔔
          {alertas.length > 0 && (
            <span
              style={{
                position: 'absolute',
                top: 9,
                right: 9,
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: theme.color.danger,
                border: '2px solid #fff',
              }}
            />
          )}
        </div>
      </div>

      {/* card saldo */}
      <div
        style={{
          background: `linear-gradient(150deg,${theme.color.navy2},${theme.color.navy})`,
          borderRadius: 18,
          padding: 20,
          color: '#fff',
          boxShadow: theme.shadow.raised,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: theme.color.slateLight }}>
            Saldo de {new Date().toLocaleDateString('pt-BR', { month: 'long' })}
          </span>
        </div>
        <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: -1, margin: '6px 0 16px' }}>
          {loading ? '…' : fmtBRL(saldo)}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, background: 'rgba(255,255,255,.06)', borderRadius: 12, padding: '10px 12px' }}>
            <div style={{ fontSize: 11, color: theme.color.slateLight }}>Receita</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: theme.color.success }}>{fmtBRL(receitaMes)}</div>
          </div>
          <div style={{ flex: 1, background: 'rgba(255,255,255,.06)', borderRadius: 12, padding: '10px 12px' }}>
            <div style={{ fontSize: 11, color: theme.color.slateLight }}>Despesa</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#f87171' }}>{fmtBRL(despesaMes)}</div>
          </div>
        </div>
      </div>

      {/* atenção hoje */}
      <div style={{ marginTop: 22 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: theme.color.navy, marginBottom: 10 }}>Atenção hoje</div>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
            <Spinner />
          </div>
        ) : alertas.length === 0 ? (
          <Card>
            <div style={{ fontSize: 13.5, color: theme.color.slate }}>Nada urgente por aqui. 🎉</div>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {alertas.slice(0, 4).map((a, i) => (
              <Card key={i} accent={a.accent} onClick={() => nav(a.to)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: a.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                    }}
                  >
                    {a.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: theme.color.navy }}>{a.titulo}</div>
                    <div style={{ fontSize: 12, color: theme.color.slate }}>{a.sub}</div>
                  </div>
                  <span style={{ color: '#cbd5e1', fontSize: 18 }}>›</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* atalhos */}
      <div style={{ marginTop: 22 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: theme.color.navy, marginBottom: 10 }}>Atalhos</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {shortcuts.map((s) => (
            <Card key={s.label} onClick={() => nav(s.to)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 11,
                    background: '#eff6ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                  }}
                >
                  {s.icon}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: theme.color.navy }}>{s.label}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
