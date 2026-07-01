import { Timestamp } from 'firebase/firestore'

/**
 * Converte o valor de um <input type="date"> ("YYYY-MM-DD") em Timestamp,
 * interpretando como meia-noite LOCAL (evita o deslocamento de fuso que
 * fazia "marcar outro dia").
 */
export function inputToTimestamp(s: string): Timestamp | null {
  if (!s) return null
  const [y, m, d] = s.split('-').map(Number)
  if (!y || !m || !d) return null
  return Timestamp.fromDate(new Date(y, m - 1, d, 0, 0, 0, 0))
}

/** Combina "YYYY-MM-DD" + "HH:mm" (hora local) em Timestamp. */
export function inputToTimestampWithTime(dateStr: string, timeStr: string): Timestamp | null {
  if (!dateStr) return null
  const [y, m, d] = dateStr.split('-').map(Number)
  const [hh, mm] = (timeStr || '00:00').split(':').map(Number)
  if (!y || !m || !d) return null
  return Timestamp.fromDate(new Date(y, m - 1, d, hh || 0, mm || 0, 0, 0))
}

/** Formata um Timestamp como "YYYY-MM-DD" LOCAL para preencher <input type="date">. */
export function tsToInput(ts: Timestamp | null | undefined): string {
  if (!ts) return ''
  return dateToInput(ts.toDate())
}

/** Formata um Date como "YYYY-MM-DD" usando componentes LOCAIS. */
export function dateToInput(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** Data de hoje como "YYYY-MM-DD" local. */
export function todayInput(): string {
  return dateToInput(new Date())
}

/** Hora "HH:mm" local de um Timestamp. */
export function tsToTimeInput(ts: Timestamp | null | undefined): string {
  if (!ts) return ''
  const d = ts.toDate()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}`
}
