/** Tokens de design — ELIÁ v2 (índigo, cards com borda, ícones de linha). */
const INDIGO = '#4f46e5'

export const theme = {
  color: {
    navy: '#101828',
    navy2: '#1d2939',
    slate: '#475467',
    slate2: '#667085',
    slateLight: '#98a2b3',
    faint: '#c0c5cf',
    border: '#eceef2',
    borderInput: '#eaecf0',
    bg: '#f5f6f8',
    outer: '#e4e7ec',
    tile: '#f2f4f7',
    white: '#ffffff',
    // accent único (v2)
    primary: INDIGO,
    primaryDark: '#4338ca',
    primarySoft: '#eef2ff',
    primarySoftBorder: '#c7d2fe',
    // áreas — todas em índigo no v2 (mantidas por compatibilidade)
    financeiro: INDIGO,
    admin: INDIGO,
    marketing: INDIGO,
    // semânticos
    success: '#079455',
    successBright: '#47cd89',
    successDark: '#067647',
    successBg: '#ecfdf3',
    successBorder: '#a6f4c5',
    danger: '#f04438',
    dangerDark: '#d92d20',
    dangerBg: '#fef3f2',
    warning: '#f79009',
    warningDark: '#dc6803',
    warningBg: '#fffaeb',
    whatsapp: '#079455',
  },
  radius: { sm: 11, md: 14, lg: 16, xl: 20 },
  shadow: {
    card: '0 1px 2px rgba(16,24,40,.04)',
    raised: '0 16px 32px -18px rgba(16,24,40,.6)',
    indigo: '0 12px 24px -12px rgba(79,70,229,.7)',
  },
} as const

export const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })

export const fmtBRLShort = (v: number) => {
  if (Math.abs(v) >= 1000) return `R$ ${(v / 1000).toFixed(1).replace('.', ',')}k`
  return fmtBRL(v)
}
