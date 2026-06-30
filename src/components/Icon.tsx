import type { CSSProperties } from 'react'

/** Ícones de linha (stroke) no estilo v2 do ELIÁ. */
const PATHS: Record<string, string> = {
  back: 'M15 6l-6 6 6 6',
  forward: 'M9 6l6 6-6 6',
  home: 'M3 10.5 12 4l9 6.5M5.5 9.8V20h13V9.8',
  wallet: 'M4 7.5A1.5 1.5 0 0 1 5.5 6H17v3M3 7.5h18v12H3z',
  clipboard: 'M5 4h14v17H5zM9 4.5h6V7H9zM9 12h6M9 16h4',
  megaphone: 'M4 10v4l11 5V5L4 10zM15 8.5a3.5 3.5 0 0 1 0 7M7 14v3.5',
  sparkle: 'M12 3l1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7L12 3z',
  bell: 'M6 9a6 6 0 0 1 12 0c0 4.5 1.8 5.7 1.8 5.7H4.2S6 13.5 6 9zM10 19a2 2 0 0 0 4 0',
  receipt: 'M6 3h12v18l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4L6 21V3zM9 8h6M9 12h6',
  file: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h4',
  fileCheck: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9.5 15.5l1.5 1.5 3-3',
  bank: 'M4 21h16M5.5 10.5h13M12 3.5 5 7h14l-7-3.5zM7 10.5v8M11 10.5v8M13 10.5v8M17 10.5v8',
  pie: 'M21 12A9 9 0 1 1 12 3v9zM14 3.2A9 9 0 0 1 20.8 10H14z',
  calendar: 'M4 5h16v16H4zM4 9.5h16M8 3v4M16 3v4',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7.5V12l3 2',
  columns: 'M4 4h16v16H4zM9.5 4v16M14.5 4v16',
  users: 'M16 19v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 9a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M22 19v-2a4 4 0 0 0-3-3.9M16 2.1a4 4 0 0 1 0 7.8',
  user: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  check: 'M5 12.5l4.5 4.5L19 7',
  checkCircle: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8.5 12.5l2.5 2.5 4.5-5',
  alert: 'M12 3.5 2.5 20h19L12 3.5zM12 10v4M12 17.5h.01',
  plus: 'M12 5v14M5 12h14',
  trash: 'M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13h10l1-13',
  camera: 'M3 8V6a2 2 0 0 1 2-2h1.5l1-1.5h5l1 1.5H21M3 7h18v13H3zM12 13.5m-3.4 0a3.4 3.4 0 1 0 6.8 0 3.4 3.4 0 1 0-6.8 0',
  whatsapp: 'M21 11.5a8 8 0 0 1-11.6 7.1L3 21l2.4-6.3A8 8 0 1 1 21 11.5z',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 0 1-4 0v-.1A1.7 1.7 0 0 0 7 19.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 4.6 14H4a2 2 0 0 1 0-4h.1A1.7 1.7 0 0 0 5.3 7L5.2 7a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 11 5.4V5a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V11a2 2 0 0 1 0 4h-.1z',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  upload: 'M12 16V4M8 8l4-4 4 4M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3',
  paperclip: 'M21 11.5 12.5 20a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7L10 17.4a1.7 1.7 0 0 1-2.3-2.3l7.8-7.8',
  download: 'M12 4v12M8 12l4 4 4-4M4 20h16',
  news: 'M4 5h13v15H4zM17 8h3v9a2 2 0 0 1-4 0V5M7 9h7M7 13h7M7 17h4',
  chart: 'M4 20V10M10 20V4M16 20v-7M21 20H3',
  play: 'M7 5l11 7-11 7V5z',
  stop: 'M6 6h12v12H6z',
  close: 'M6 6l12 12M18 6L6 18',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-4.3-4.3',
  arrowUp: 'M5 15l7-7 7 7',
}

export type IconName = keyof typeof PATHS

export function Icon({
  name,
  size = 20,
  color = 'currentColor',
  strokeWidth = 1.75,
  style,
}: {
  name: IconName
  size?: number
  color?: string
  strokeWidth?: number
  style?: CSSProperties
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
