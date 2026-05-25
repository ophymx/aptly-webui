import { cn } from '@/lib/utils'

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('bg-ink-elev-2 animate-pulse-dot', className)}
      {...props}
    />
  )
}
