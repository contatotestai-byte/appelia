import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { theme } from '@/theme'
import { Icon, type IconName } from '@/components/Icon'

const tabs: { to: string; icon: IconName; label: string; match: (p: string) => boolean }[] = [
  { to: '/', icon: 'home', label: 'Início', match: (p) => p === '/' },
  { to: '/financeiro', icon: 'wallet', label: 'Financeiro', match: (p) => p.startsWith('/financeiro') },
  { to: '/admin', icon: 'clipboard', label: 'Admin', match: (p) => p.startsWith('/admin') },
  { to: '/marketing', icon: 'megaphone', label: 'Marketing', match: (p) => p.startsWith('/marketing') },
  { to: '/assistente', icon: 'sparkle', label: 'Assistente', match: (p) => p.startsWith('/assistente') },
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
        background: theme.color.outer,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          height: '100dvh',
          maxHeight: 900,
          background: theme.color.bg,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 30px 70px -20px rgba(16,24,40,.45)',
        }}
      >
        {/* área de scroll */}
        <div
          className="scroll"
          style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '14px 0 100px' }}
        >
          <Outlet />
        </div>

        {/* botão flutuante IA */}
        {!hideChatFab && (
          <button
            onClick={() => nav('/assistente')}
            style={{
              position: 'absolute',
              right: 18,
              bottom: 94,
              width: 54,
              height: 54,
              borderRadius: 17,
              border: 'none',
              background: `linear-gradient(145deg, ${theme.color.primary}, ${theme.color.primaryDark})`,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: theme.shadow.indigo,
              cursor: 'pointer',
              zIndex: 40,
            }}
          >
            <Icon name="sparkle" size={24} strokeWidth={1.8} />
          </button>
        )}

        {/* bottom nav */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 80,
            background: 'rgba(255,255,255,.94)',
            backdropFilter: 'blur(14px)',
            borderTop: `1px solid ${theme.color.border}`,
            display: 'flex',
            alignItems: 'flex-start',
            padding: '11px 6px 0',
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
                  gap: 4,
                  cursor: 'pointer',
                  color: active ? theme.color.primary : theme.color.slateLight,
                }}
              >
                <Icon name={t.icon} size={23} strokeWidth={1.8} />
                <span style={{ fontSize: 10, fontWeight: 600 }}>{t.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
