import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { theme } from '@/theme'

const tabs = [
  { to: '/', icon: '🏠', label: 'Início', match: (p: string) => p === '/' },
  { to: '/financeiro', icon: '💰', label: 'Financeiro', match: (p: string) => p.startsWith('/financeiro') },
  { to: '/admin', icon: '📋', label: 'Admin', match: (p: string) => p.startsWith('/admin') },
  { to: '/marketing', icon: '📣', label: 'Marketing', match: (p: string) => p.startsWith('/marketing') },
  { to: '/assistente', icon: '🤖', label: 'Assistente', match: (p: string) => p.startsWith('/assistente') },
]

export default function Layout() {
  const nav = useNavigate()
  const { pathname } = useLocation()
  const hideChatFab = pathname.startsWith('/assistente')

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#cbd5e1',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 430,
          height: '100dvh',
          maxHeight: 920,
          background: theme.color.bg,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 30px 70px -20px rgba(15,23,42,.4)',
        }}
      >
        {/* área de scroll */}
        <div
          className="scroll"
          style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '14px 0 96px' }}
        >
          <Outlet />
        </div>

        {/* botão flutuante IA */}
        {!hideChatFab && (
          <div
            onClick={() => nav('/assistente')}
            style={{
              position: 'absolute',
              right: 18,
              bottom: 92,
              width: 54,
              height: 54,
              borderRadius: 18,
              background: `linear-gradient(150deg, ${theme.color.navy2}, ${theme.color.navy})`,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              boxShadow: '0 12px 24px -8px rgba(15,23,42,.6)',
              cursor: 'pointer',
              zIndex: 40,
            }}
          >
            🤖
          </div>
        )}

        {/* bottom nav */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 78,
            background: 'rgba(255,255,255,.92)',
            backdropFilter: 'blur(12px)',
            borderTop: `1px solid ${theme.color.border}`,
            display: 'flex',
            alignItems: 'flex-start',
            padding: '10px 8px 0',
            zIndex: 35,
          }}
        >
          {tabs.map((t) => {
            const active = t.match(pathname)
            return (
              <div
                key={t.to}
                onClick={() => nav(t.to)}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: 21, opacity: active ? 1 : 0.4, filter: active ? 'none' : 'grayscale(1)' }}>
                  {t.icon}
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, color: active ? theme.color.navy : theme.color.slateLight }}>
                  {t.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
