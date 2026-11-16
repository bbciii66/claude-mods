import type { Limit } from '../types'

const NAMES: Record<string, string> = { five_hour: '5-hr', seven_day: 'Weekly', spend_limit: 'Spend' }

/** "3h 30m", "2d 21h", "12m" until the reset; "" when unknown. */
export function untilText(resetsAt: string | undefined, now: number): string {
  if (!resetsAt) return ''
  const ms = Date.parse(resetsAt) - now
  if (!Number.isFinite(ms)) return ''
  if (ms <= 0) return 'now'
  const mins = Math.round(ms / 60000)
  const d = Math.floor(mins / 1440), h = Math.floor((mins % 1440) / 60), m = mins % 60
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function label(kind: string): string {
  return NAMES[kind] ?? kind.replace(/_/g, ' ')
}

/** Theme color by how full the window is. */
export function tone(pct: number): 'success' | 'warning' | 'error' {
  return pct >= 80 ? 'error' : pct >= 50 ? 'warning' : 'success'
}

/** Ten-cell bar, e.g. "███░░░░░░░". */
export function bar(pct: number): string {
  const n = Math.max(0, Math.min(10, Math.round(pct / 10)))
  return '█'.repeat(n) + '░'.repeat(10 - n)
}

/** Order: 5-hour first, then weekly, then anything else. */
export function ordered(limits: Limit[]): Limit[] {
  const rank = (k: string) => (k === 'five_hour' ? 0 : k === 'seven_day' ? 1 : 2)
  return [...limits].sort((a, b) => rank(a.kind) - rank(b.kind))
}

/** One-line text: "5-hr 30% · resets 3h 30m   Weekly 7% · resets 4d 2h". */
export function line(limits: Limit[], now: number): string {
  return ordered(limits)
    .map(l => {
      const u = untilText(l.resetsAt, now)
      return `${label(l.kind)} ${Math.round(l.percentUsed)}%${u ? ` · resets ${u}` : ''}`
    })
    .join('   ')
}


export type Extras = {
  resets?: { count: number; expires?: string }
  fable?: { count: number; expires?: string }
  credit?: { left: number; total: number; expires: string }
  updated?: string
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "10.22", "10/22", "Oct 22", "2026-10-22" -> "YYYY-MM-DD" (this year, or next year when already past). */
export function parseDate(text: string, now: number): string | null {
  const t = text.trim()
  let y: number | null = null, m: number, d: number
  let r = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (r) { y = +r[1]; m = +r[2]; d = +r[3] }
  else if ((r = t.match(/^(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?$/))) { m = +r[1]; d = +r[2]; if (r[3]) y = r[3].length === 2 ? 2000 + +r[3] : +r[3] }
  else if ((r = t.match(/^([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2})$/))) { m = MONTHS.findIndex(x => x.toLowerCase() === r![1].toLowerCase()) + 1; d = +r[2] }
  else return null
  if (!(m >= 1 && m <= 12 && d >= 1 && d <= 31)) return null
  const today = new Date(now)
  if (y === null) {
    y = today.getUTCFullYear()
    if (Date.UTC(y, m - 1, d) < Date.UTC(y, today.getUTCMonth(), today.getUTCDate())) y += 1
  }
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

/** "Oct 22 (in 10 days)" */
export function expiryText(iso: string, now: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const t = new Date(now)
  const days = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate())) / 86400000)
  const when = days < 0 ? 'expired' : days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`
  return `${MONTHS[m - 1]} ${d} (${when})`
}

/** The /meter command: "resets 1 10.22", "credit 242 250 11.5", "clear". */
export function applyArgs(args: string, extras: Extras, now: number): { extras: Extras; reply: string } {
  const w = args.trim().split(/\s+/).filter(Boolean)
  const help = 'Use: /meter resets <how many> <expires, e.g. 10.22>   ·   /meter credit <left> <total> <expires, e.g. 11.5>   ·   /meter clear'
  const stamp = new Date(now).toISOString().slice(0, 10)
  if (w[0] === 'clear') return { extras: {}, reply: 'Cleared the resets and credit you entered.' }
  if ((w[0] === 'resets' || w[0] === 'fable') && w.length >= 2) {
    const count = Number(w[1])
    const exp = w.length >= 3 ? parseDate(w.slice(2).join(' '), now) : undefined
    if (!Number.isFinite(count) || count < 0 || (w.length >= 3 && !exp)) return { extras, reply: help }
    const entry = exp ? { count, expires: exp } : { count }
    const name = w[0] === 'fable' ? 'Fable reset' : 'full reset'
    return {
      extras: { ...extras, [w[0]]: entry, updated: stamp },
      reply: `Saved: ${count} ${name}${count === 1 ? '' : 's'}${exp ? `, expires ${expiryText(exp, now)}` : ''}.`,
    }
  }
  if (w[0] === 'credit' && w.length >= 4) {
    const left = Number(w[1].replace(/[$,]/g, '')); const total = Number(w[2].replace(/[$,]/g, '')); const exp = parseDate(w.slice(3).join(' '), now)
    if (!Number.isFinite(left) || !Number.isFinite(total) || total <= 0 || !exp) return { extras, reply: help }
    return { extras: { ...extras, credit: { left, total, expires: exp }, updated: stamp }, reply: `Saved: $${left} of $${total} cloud credit, expires ${expiryText(exp, now)}.` }
  }
  return { extras, reply: help }
}

/** "Full resets: 1 · expires Oct 22 (in 10 days)   Cloud credit: $242 of $250 · expires Nov 5 (in 24 days)" */
export function extrasLine(x: Extras, now: number): string {
  const parts: string[] = []
  // Expired items are left off the row; they stay stored until /meter clear or a new entry replaces them.
  const isLive = (iso: string | undefined): boolean => {
    if (!iso) return true
    const [y, m, d] = iso.split('-').map(Number)
    const t = new Date(now)
    return Date.UTC(y, m - 1, d) >= Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate())
  }
  const tail = (iso: string | undefined) => (iso ? ` · expires ${expiryText(iso, now)}` : '')
  if (x.resets && isLive(x.resets.expires)) parts.push(`Full resets: ${x.resets.count}${tail(x.resets.expires)}`)
  if (x.fable && isLive(x.fable.expires)) parts.push(`Fable resets: ${x.fable.count}${tail(x.fable.expires)}`)
  if (x.credit && isLive(x.credit.expires)) parts.push(`Cloud credit: $${x.credit.left} of $${x.credit.total}${tail(x.credit.expires)}`)
  return parts.join('   ')
}

/** Shows the 5-hour window even when the API sent none (no window running): idle at 0%. */
export function withFiveHour(limits: Limit[]): Limit[] {
  if (limits.length === 0 || limits.some(l => l.kind === 'five_hour')) return limits
  return [{ kind: 'five_hour', percentUsed: 0 }, ...limits]
}
