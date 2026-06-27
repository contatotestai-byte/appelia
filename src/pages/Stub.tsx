import { useNavigate } from 'react-router-dom'
import { theme } from '@/theme'
import { ScreenHeader } from '@/components/ui'

const areaColor: Record<string, string> = {
  admin: theme.color.admin,
  marketing: theme.color.marketing,
  assistente: theme.color.navy,
  financeiro: theme.color.financeiro,
}

const areaInfo: Record<string, { icon: string; desc: string; itens: string[] }> = {
  admin: {
    icon: '📋',
    desc: 'Cronograma de entregas, controle de horas, contratos e agenda com WhatsApp.',
    itens: ['Cronograma (Kanban)', 'Controle de horas', 'Contratos', 'Agenda & WhatsApp'],
  },
  marketing: {
    icon: '📣',
    desc: 'Notícias e posts, calendário editorial, gestão de ADS, criativos e e-mail.',
    itens: ['Notícias & Posts', 'Calendário editorial', 'ADS', 'Criativos', 'E-mail'],
  },
  assistente: {
    icon: '🤖',
    desc: 'Chat com IA que cruza todas as áreas, com ações sugeridas.',
    itens: ['Perguntas sobre finanças', 'Gerar posts', 'Confirmar agenda', 'Marcar imposto como pago'],
  },
}

export function Stub({ area, title }: { area: string; title: string }) {
  const nav = useNavigate()
  const color = areaColor[area] ?? theme.color.navy
  const info = areaInfo[area] ?? { icon: '🧩', desc: '', itens: [] }

  return (
    <div style={{ padding: '4px 20px 0' }} className="fade">
      <ScreenHeader title={title} onBack={() => nav('/')} accent={color} />
      <div
        style={{
          background: '#fff',
          borderRadius: 18,
          padding: 24,
          boxShadow: theme.shadow.card,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 44 }}>{info.icon}</div>
        <div style={{ fontSize: 17, fontWeight: 800, color: theme.color.navy, margin: '10px 0 6px' }}>
          Módulo em desenvolvimento
        </div>
        <div style={{ fontSize: 13.5, color: theme.color.slate, lineHeight: 1.5 }}>{info.desc}</div>
        <div
          style={{
            marginTop: 18,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            textAlign: 'left',
          }}
        >
          {info.itens.map((i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 13.5,
                color: theme.color.navy,
                background: theme.color.bg,
                borderRadius: 10,
                padding: '10px 12px',
              }}
            >
              <span style={{ color, fontWeight: 800 }}>•</span> {i}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
