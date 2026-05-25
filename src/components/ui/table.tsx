import { cn } from '@/lib/utils'

export function Table({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        className={cn('w-full caption-bottom border-collapse', className)}
        {...props}
      />
    </div>
  )
}

export function THead(props: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead {...props} />
}

export function TBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn(className)} {...props} />
}

export function TR({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'border-b border-rule transition-colors hover:bg-ink-elev/60',
        className,
      )}
      {...props}
    />
  )
}

export function TH({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'text-left font-mono uppercase tracking-[0.16em] text-[10.5px] text-paper-subtle py-2.5 pr-6 first:pl-0 align-bottom border-b border-rule-strong',
        className,
      )}
      {...props}
    />
  )
}

export function TD({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn('py-3 pr-6 first:pl-0 align-top text-[13px]', className)}
      {...props}
    />
  )
}
