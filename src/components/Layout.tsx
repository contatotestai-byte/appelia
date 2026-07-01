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
    <div className="app-frame">
      {/* área de scroll com conteúdo centralizado */}
      <div className="app-scroll scroll">
        <div className="app-content">
          <Outlet />
        </div>
      </div>

      {/* botão flutuante IA */}
      {!hideChatFab && (
        <button
          className="app-fab"
          onClick={() => nav('/assistente')}
          style={{
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
          }}
        >
          <Icon name="sparkle" size={24} strokeWidth={1.8} />
        </button>
      )}

      {/* bottom nav */}
      <div className="app-nav">
        <div className="app-nav-inner">
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
