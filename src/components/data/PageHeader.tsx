import { cn } from '@/lib/utils'

export function PageHeader({
  kicker,
  title,
  lede,
  actions,
  className,
}: {
  kicker?: React.ReactNode
  title: React.ReactNode
  lede?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <header
      className={cn(
        'flex flex-col gap-3 pb-6 border-b border-rule mb-8 animate-fade-in',
        className,
      )}
    >
      <div className="flex items-end justify-between gap-6">
        <div className="min-w-0 flex-1">
          {kicker && <div className="kicker mb-2.5">{kicker}</div>}
          <h1 className="font-display text-[44px] leading-[1.02] text-paper tracking-[-0.015em] break-words">
            {title}
          </h1>
          {lede && (
            <p className="mt-3 max-w-xl text-paper-muted text-[14px] leading-relaxed">
              {lede}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </header>
  )
}
