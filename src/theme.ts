/** Tokens de design extraídos do protótipo ELIÁ. */
export const theme = {
  color: {
    navy: '#0f172a',
    navy2: '#1e293b',
    slate: '#64748b',
    slateLight: '#94a3b8',
    border: '#e2e8f0',
    bg: '#f8fafc',
    white: '#ffffff',
    // áreas
    financeiro: '#2563eb',
    admin: '#7c3aed',
    marketing: '#059669',
    // semânticos
    success: '#34d399',
    successDark: '#059669',
    danger: '#ef4444',
    dangerDark: '#dc2626',
    warning: '#f59e0b',
    warningDark: '#d97706',
  },
  radius: { sm: 10, md: 14, lg: 18 },
  shadow: {
    card: '0 2px 10px rgba(15,23,42,.05)',
    raised: '0 14px 30px -14px rgba(15,23,42,.5)',
  },
} as const

export const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })

export const fmtBRLShort = (v: number) => {
  if (Math.abs(v) >= 1000) return `R$ ${(v / 1000).toFixed(1).replace('.', ',')}k`
  return fmtBRL(v)
}
