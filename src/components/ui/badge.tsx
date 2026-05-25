import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 font-mono uppercase text-[10px] tracking-[0.16em] py-0.5 px-1.5 border',
  {
    variants: {
      tone: {
        neutral: 'border-rule text-paper-muted',
        amber: 'border-amber/40 text-amber',
        ok: 'border-ok/40 text-ok',
        warn: 'border-warn/40 text-warn',
        err: 'border-err/40 text-err',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />
}
