import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useExpenses } from '@/hooks/useExpenses'
import { useInvoices } from '@/hooks/useInvoices'
import { useTaxes } from '@/hooks/useTaxes'
import { theme, fmtBRL } from '@/theme'
import { Card, Spinner, IconTile } from '@/components/ui'
import { Icon, type IconName } from '@/components/Icon'
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

const shortcuts: { icon: IconName; label: string; to: string }[] = [
  { icon: 'receipt', label: 'Registrar despesa', to: '/financeiro/despesas' },
  { icon: 'fileCheck', label: 'Solicitar NF', to: '/financeiro/notas-fiscais' },
  { icon: 'calendar', label: 'Confirmar agenda', to: '/admin/agenda' },
  { icon: 'megaphone', label: 'Gerar post', to: '/marketing' },
]

export default function Home() {
  const nav = useNavigate()
  const { user } = useAuth()
  const expenses = useExpenses()
  const invoices = useInvoices()
  const taxes = useTaxes()

  const loading = expenses.isLoading || invoices.isLoading || taxes.isLoading
  const [showSaldo, setShowSaldo] = useState(false)
  const mask = 'R$ ••••••'

  const despesaMes = (expenses.data ?? [])
    .filter((e) => isThisMonth(e.data))
    .reduce((s, e) => s + (e.valor || 0), 0)

  const receitaMes = (invoices.data ?? [])
    .filter((i) => i.status === 'emitida' && isThisMonth(i.data ?? i.createdAt))
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
          <div style={{ fontSize: 25, fontWeight: 700, color: theme.color.navy, letterSpacing: -0.6, textTransform: 'capitalize' }}>
            Olá, {nome}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 9 }}>
          <div
            onClick={() => nav('/configuracoes')}
            style={{
              width: 44,
              height: 44,
              borderRadius: 13,
              background: '#fff',
              border: `1px solid ${theme.color.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.color.slate,
              cursor: 'pointer',
            }}
          >
            <Icon name="settings" size={20} />
          </div>
          <div
            onClick={() => nav('/notificacoes')}
            style={{
              width: 44,
              height: 44,
              borderRadius: 13,
              background: '#fff',
              border: `1px solid ${theme.color.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.color.slate,
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            <Icon name="bell" size={20} />
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
      </div>

      {/* card saldo */}
      <div
        style={{
          background: `linear-gradient(145deg,${theme.color.navy2},${theme.color.navy})`,
          borderRadius: 20,
          padding: 22,
          color: '#fff',
          boxShadow: theme.shadow.raised,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: theme.color.slateLight }}>
            Saldo de {new Date().toLocaleDateString('pt-BR', { month: 'long' })}
          </span>
          <div
            onClick={() => setShowSaldo((v) => !v)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 9, background: 'rgba(255,255,255,.08)', color: theme.color.slateLight, cursor: 'pointer' }}
            aria-label={showSaldo ? 'Ocultar saldo' : 'Mostrar saldo'}
          >
            <Icon name={showSaldo ? 'eyeOff' : 'eye'} size={17} />
          </div>
        </div>
        <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: -1, margin: '6px 0 16px' }}>
          {loading ? '…' : showSaldo ? fmtBRL(saldo) : mask}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, background: 'rgba(255,255,255,.06)', borderRadius: 12, padding: '10px 12px' }}>
            <div style={{ fontSize: 11, color: theme.color.slateLight }}>Receita</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: theme.color.success }}>{showSaldo ? fmtBRL(receitaMes) : mask}</div>
          </div>
          <div style={{ flex: 1, background: 'rgba(255,255,255,.06)', borderRadius: 12, padding: '10px 12px' }}>
            <div style={{ fontSize: 11, color: theme.color.slateLight }}>Despesa</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#f87171' }}>{showSaldo ? fmtBRL(despesaMes) : mask}</div>
          </div>
        </div>
      </div>

      {/* atenção hoje */}
      <div style={{ marginTop: 22 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: theme.color.slate, marginBottom: 11 }}>Atenção hoje</div>
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
              <Card key={i} onClick={() => nav(a.to)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <IconTile size={38} bg={a.bg} color={a.accent}>
                    <Icon name="alert" size={19} />
                  </IconTile>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: theme.color.navy }}>{a.titulo}</div>
                    <div style={{ fontSize: 12, color: theme.color.slate2 }}>{a.sub}</div>
                  </div>
                  <Icon name="forward" size={18} color={theme.color.faint} strokeWidth={2} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* atalhos */}
      <div style={{ marginTop: 22 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: theme.color.slate, marginBottom: 11 }}>Atalhos</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {shortcuts.map((s) => (
            <Card key={s.label} onClick={() => nav(s.to)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <IconTile size={38}>
                  <Icon name={s.icon} size={19} />
                </IconTile>
                <span style={{ fontSize: 13, fontWeight: 600, color: theme.color.navy }}>{s.label}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
