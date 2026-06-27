import type { CSSProperties, ReactNode } from 'react'
import { theme } from '@/theme'

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
        borderRadius: theme.radius.md,
        padding: 14,
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

const badgeColors: Record<string, { bg: string; fg: string }> = {
  pendente: { bg: '#fffbeb', fg: '#d97706' },
  solicitada: { bg: '#eff6ff', fg: '#2563eb' },
  emitida: { bg: '#ecfdf5', fg: '#059669' },
  pago: { bg: '#ecfdf5', fg: '#059669' },
  atrasado: { bg: '#fef2f2', fg: '#dc2626' },
  andamento: { bg: '#eff6ff', fg: '#2563eb' },
  entregue: { bg: '#ecfdf5', fg: '#059669' },
  confirmado: { bg: '#ecfdf5', fg: '#059669' },
  aguardando: { bg: '#fffbeb', fg: '#d97706' },
  sem_resposta: { bg: '#f1f5f9', fg: '#64748b' },
  rascunho: { bg: '#f1f5f9', fg: '#64748b' },
  aprovado: { bg: '#eff6ff', fg: '#2563eb' },
  publicado: { bg: '#ecfdf5', fg: '#059669' },
}

export function Badge({ status, label }: { status: string; label?: string }) {
  const c = badgeColors[status] ?? { bg: '#f1f5f9', fg: '#64748b' }
  return (
    <span
      style={{
        background: c.bg,
        color: c.fg,
        fontSize: 11,
        fontWeight: 600,
        padding: '4px 9px',
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
  color = theme.color.financeiro,
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
        borderRadius: theme.radius.md,
        background: disabled ? '#cbd5e1' : color,
        color: '#fff',
        fontSize: 16,
        fontWeight: 700,
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
  accent = theme.color.financeiro,
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
            borderRadius: 12,
            background: '#fff',
            boxShadow: theme.shadow.card,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            cursor: 'pointer',
            color: theme.color.navy,
          }}
        >
          ‹
        </div>
      )}
      <div style={{ fontSize: 22, fontWeight: 800, color: theme.color.navy, letterSpacing: -0.5 }}>
        {title}
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        {right ?? <div style={{ width: 10, height: 10, borderRadius: '50%', background: accent }} />}
      </div>
    </div>
  )
}

export function Spinner({ color = theme.color.financeiro }: { color?: string }) {
  return (
    <div
      style={{
        width: 26,
        height: 26,
        border: `3px solid ${color}33`,
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
        color: theme.color.slate,
        fontSize: 14,
        textAlign: 'center',
      }}
    >
      {children}
    </div>
  )
}

export function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <CenteredState>
      <div style={{ fontSize: 38 }}>{icon}</div>
      <div>{text}</div>
    </CenteredState>
  )
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <CenteredState>
      <div style={{ fontSize: 38 }}>⚠️</div>
      <div>Não foi possível carregar os dados.</div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            marginTop: 4,
            padding: '8px 16px',
            borderRadius: 10,
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

/** Modal simples (bottom sheet) usado em formulários. */
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
        background: 'rgba(15,23,42,.45)',
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
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          padding: '20px 20px 28px',
          maxHeight: '88%',
          overflowY: 'auto',
          animation: 'elia-slideup .25s ease',
        }}
      >
        <div
          style={{
            width: 40,
            height: 4,
            borderRadius: 4,
            background: '#e2e8f0',
            margin: '0 auto 16px',
          }}
        />
        <div style={{ fontSize: 18, fontWeight: 800, color: theme.color.navy, marginBottom: 16 }}>
          {title}
        </div>
        {children}
      </div>
    </div>
  )
}

export function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label
        style={{
          fontSize: 12,
          color: theme.color.slate,
          fontWeight: 600,
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
  borderRadius: theme.radius.md,
  border: `1px solid ${theme.color.border}`,
  background: '#fff',
  color: theme.color.navy,
  padding: '0 14px',
  fontSize: 15,
  fontFamily: 'inherit',
  outline: 'none',
}
