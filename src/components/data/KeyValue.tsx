import { cn } from '@/lib/utils'

export function KeyValueList({
  items,
  className,
}: {
  items: Array<{ key: string; value: React.ReactNode }>
  className?: string
}) {
  return (
    <dl className={cn('grid grid-cols-[max-content_1fr] gap-x-6 gap-y-3', className)}>
      {items.map(({ key, value }) => (
        <div key={key} className="contents">
          <dt className="field-key pt-0.5">{key}</dt>
          <dd className="field-val break-all">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
