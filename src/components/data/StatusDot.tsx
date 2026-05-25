import { cn } from '@/lib/utils'

type Tone = 'ok' | 'warn' | 'err' | 'neutral' | 'amber'

const map: Record<Tone, string> = {
  ok: 'bg-ok',
  warn: 'bg-warn',
  err: 'bg-err',
  amber: 'bg-amber',
  neutral: 'bg-paper-subtle',
}

export function StatusDot({
  tone = 'neutral',
  pulse = false,
  className,
}: {
  tone?: Tone
  pulse?: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-block h-1.5 w-1.5 rounded-full',
        map[tone],
        pulse && 'animate-pulse-dot',
        className,
      )}
    />
  )
}
