export function fmtDate(input?: string | null): string {
  if (!input) return '—'
  const d = new Date(input)
  if (Number.isNaN(d.getTime())) return input
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function fmtRelative(input?: string | null): string {
  if (!input) return '—'
  const d = new Date(input)
  if (Number.isNaN(d.getTime())) return input
  const diff = (Date.now() - d.getTime()) / 1000
  const abs = Math.abs(diff)
  const sign = diff < 0 ? 'in ' : ''
  const suffix = diff < 0 ? '' : ' ago'
  const units: Array<[number, string]> = [
    [60, 'second'],
    [60, 'minute'],
    [24, 'hour'],
    [30, 'day'],
    [12, 'month'],
    [Number.POSITIVE_INFINITY, 'year'],
  ]
  let value = abs
  let label = 'second'
  for (const [step, unit] of units) {
    if (value < step) {
      label = unit
      break
    }
    value = value / step
    label = unit
  }
  const rounded = Math.max(1, Math.round(value))
  return `${sign}${rounded} ${label}${rounded === 1 ? '' : 's'}${suffix}`
}

export function pluralize(n: number, singular: string, plural?: string): string {
  return `${n.toLocaleString()} ${n === 1 ? singular : (plural ?? singular + 's')}`
}

const SPELLED = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
]

export function spellNumber(n: number): string {
  if (n < SPELLED.length) return SPELLED[n]
  return n.toLocaleString()
}

export function truncMiddle(s: string, max = 32): string {
  if (s.length <= max) return s
  const half = Math.floor((max - 1) / 2)
  return `${s.slice(0, half)}…${s.slice(-half)}`
}
