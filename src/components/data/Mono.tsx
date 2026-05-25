import { cn } from '@/lib/utils'

/** A monospace inline pill for IDs / hashes / paths. */
export function Mono({
  className,
  children,
  dim,
}: {
  className?: string
  children: React.ReactNode
  dim?: boolean
}) {
  return (
    <span
      className={cn(
        'font-mono text-[12.5px]',
        dim ? 'text-paper-muted' : 'text-paper',
        className,
      )}
    >
      {children}
    </span>
  )
}
