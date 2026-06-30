import type { CSSProperties, ReactNode } from 'react'
import { theme } from '@/theme'
import { Icon } from '@/components/Icon'

export function Card({
  children,
  onClick,
  style,
  accent,
}: {
  children: ReactNode
  onClick?: () => void
  style?: CSSProperties
  accent?: string
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: theme.color.white,
        borderRadius: theme.radius.lg,
        padding: 14,
        border: `1px solid ${theme.color.border}`,
        boxShadow: theme.shadow.card,
        cursor: onClick ? 'pointer' : 'default',
        borderLeft: accent ? `3px solid ${accent}` : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** Tile neutro 38–40px para um ícone (estilo v2). */
export function IconTile({
  children,
  size = 40,
  bg = theme.color.tile,
  color = theme.color.slate,
}: {
  children: ReactNode
  size?: number
  bg?: string
  color?: string
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 11,
        background: bg,
        color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: `0 0 ${size}px`,
      }}
    >
      {children}
    </div>
  )
}

const badgeColors: Record<string, { bg: string; fg: string }> = {
  pendente: { bg: theme.color.warningBg, fg: theme.color.warningDark },
  solicitada: { bg: theme.color.primarySoft, fg: theme.color.primary },
  emitida: { bg: theme.color.successBg, fg: theme.color.successDark },
  pago: { bg: theme.color.successBg, fg: theme.color.successDark },
  atrasado: { bg: theme.color.dangerBg, fg: theme.color.dangerDark },
  andamento: { bg: theme.color.primarySoft, fg: theme.color.primary },
  entregue: { bg: theme.color.successBg, fg: theme.color.successDark },
  confirmado: { bg: theme.color.successBg, fg: theme.color.successDark },
  aguardando: { bg: theme.color.warningBg, fg: theme.color.warningDark },
  sem_resposta: { bg: '#f2f4f7', fg: theme.color.slate2 },
  rascunho: { bg: '#f2f4f7', fg: theme.color.slate2 },
  aprovado: { bg: theme.color.primarySoft, fg: theme.color.primary },
  publicado: { bg: theme.color.successBg, fg: theme.color.successDark },
}

export function Badge({ status, label }: { status: string; label?: string }) {
  const c = badgeColors[status] ?? { bg: '#f2f4f7', fg: theme.color.slate2 }
  return (
    <span
      style={{
        background: c.bg,
        color: c.fg,
        fontSize: 11,
        fontWeight: 600,
        padding: '3px 10px',
        borderRadius: 20,
        textTransform: 'capitalize',
        whiteSpace: 'nowrap',
      }}
    >
      {label ?? status.replace('_', ' ')}
    </span>
  )
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  color = theme.color.primary,
  style,
  type = 'button',
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  color?: string
  style?: CSSProperties
  type?: 'button' | 'submit'
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 52,
        border: 'none',
        borderRadius: 13,
        background: disabled ? '#d0d5dd' : color,
        color: '#fff',
        fontSize: 15,
        fontWeight: 600,
        fontFamily: 'inherit',
        cursor: disabled ? 'not-allowed' : 'pointer',
        width: '100%',
        ...style,
      }}
    >
      {children}
    </button>
  )
}

export function ScreenHeader({
  title,
  onBack,
  right,
}: {
  title: string
  onBack?: () => void
  accent?: string
  right?: ReactNode
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
      {onBack && (
        <div
          onClick={onBack}
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            background: '#fff',
            border: `1px solid ${theme.color.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: theme.color.slate,
          }}
        >
          <Icon name="back" size={20} strokeWidth={1.9} />
        </div>
      )}
      <div style={{ fontSize: 21, fontWeight: 700, color: theme.color.navy, letterSpacing: -0.5 }}>
        {title}
      </div>
      {right && <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>{right}</div>}
    </div>
  )
}

export function Spinner({ color = theme.color.primary }: { color?: string }) {
  return (
    <div
      style={{
        width: 24,
        height: 24,
        border: `2.5px solid ${color}33`,
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'elia-spin .7s linear infinite',
      }}
    />
  )
}

export function CenteredState({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: '48px 20px',
        color: theme.color.slate2,
        fontSize: 14,
        textAlign: 'center',
      }}
    >
      {children}
    </div>
  )
}

export function EmptyState({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <CenteredState>
      <div style={{ color: theme.color.faint }}>{icon}</div>
      <div>{text}</div>
    </CenteredState>
  )
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <CenteredState>
      <Icon name="alert" size={34} color={theme.color.warningDark} />
      <div>Não foi possível carregar os dados.</div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            marginTop: 4,
            padding: '8px 16px',
            borderRadius: 11,
            border: `1px solid ${theme.color.border}`,
            background: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Tentar novamente
        </button>
      )}
    </CenteredState>
  )
}

/** Modal bottom sheet. */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  if (!open) return null
  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(16,24,40,.45)',
        zIndex: 60,
        display: 'flex',
        alignItems: 'flex-end',
        animation: 'elia-fade .2s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          background: '#fff',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: '18px 20px 28px',
          maxHeight: '90%',
          overflowY: 'auto',
          animation: 'elia-slideup .25s ease',
        }}
      >
        <div style={{ width: 40, height: 4, borderRadius: 4, background: '#e4e7ec', margin: '0 auto 16px' }} />
        <div style={{ fontSize: 18, fontWeight: 700, color: theme.color.navy, marginBottom: 16, letterSpacing: -0.3 }}>
          {title}
        </div>
        {children}
      </div>
    </div>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label
        style={{
          fontSize: 12,
          color: theme.color.slate2,
          fontWeight: 500,
          display: 'block',
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  )
}

export const inputStyle: CSSProperties = {
  width: '100%',
  height: 48,
  borderRadius: 12,
  border: `1px solid ${theme.color.borderInput}`,
  background: '#fcfcfd',
  color: theme.color.navy,
  padding: '0 14px',
  fontSize: 15,
  fontFamily: 'inherit',
  outline: 'none',
}
