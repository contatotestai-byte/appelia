import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications, useMarkNotificationRead } from '@/hooks/useNotifications'
import { theme } from '@/theme'
import { Card, ScreenHeader, Spinner, EmptyState, ErrorState } from '@/components/ui'
import type { NotificationTipo } from '@/types'

const icons: Record<NotificationTipo, string> = {
  imposto: '🏛️',
  contrato: '📄',
  agenda: '🗓️',
  entrega: '📋',
  geral: '🔔',
}

const filtros: { value: '' | NotificationTipo; label: string }[] = [
  { value: '', label: 'Todas' },
  { value: 'imposto', label: 'Impostos' },
  { value: 'contrato', label: 'Contratos' },
  { value: 'agenda', label: 'Agenda' },
  { value: 'entrega', label: 'Entregas' },
]

export default function Notificacoes() {
  const nav = useNavigate()
  const { data, isLoading, isError, refetch } = useNotifications()
  const markRead = useMarkNotificationRead()
  const [filtro, setFiltro] = useState<'' | NotificationTipo>('')

  const list = (data ?? []).filter((n) => !filtro || n.tipo === filtro)

  return (
    <div style={{ padding: '4px 20px 0' }} className="fade">
      <ScreenHeader title="Notificações" onBack={() => nav('/')} accent={theme.color.navy} />

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 16 }} className="scroll">
        {filtros.map((f) => (
          <button
            key={f.value || 'all'}
            onClick={() => setFiltro(f.value)}
            style={{
              height: 34,
              padding: '0 14px',
              borderRadius: 10,
              border: filtro === f.value ? `2px solid ${theme.color.navy}` : `1px solid ${theme.color.border}`,
              background: filtro === f.value ? '#f1f5f9' : '#fff',
              color: theme.color.navy,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><Spinner /></div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : list.length === 0 ? (
        <EmptyState icon="🔔" text="Sem notificações por enquanto." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.map((n) => (
            <Card key={n.id} onClick={() => !n.lida && markRead.mutate(n.id)} accent={n.lida ? undefined : theme.color.financeiro}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: theme.color.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                  {icons[n.tipo] ?? '🔔'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: n.lida ? 500 : 700, color: theme.color.navy }}>{n.titulo}</div>
                  <div style={{ fontSize: 12.5, color: theme.color.slate, marginTop: 2 }}>{n.mensagem}</div>
                  <div style={{ fontSize: 11, color: theme.color.slateLight, marginTop: 4 }}>
                    {n.createdAt ? n.createdAt.toDate().toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                </div>
                {!n.lida && <div style={{ width: 8, height: 8, borderRadius: '50%', background: theme.color.financeiro, marginTop: 4 }} />}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
