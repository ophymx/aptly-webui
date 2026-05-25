import { Link } from 'react-router-dom'
import { parsePackageKey } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/data/EmptyState'
import { ErrorState } from '@/components/data/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Mono } from '@/components/data/Mono'

export function PackageList({
  title,
  q,
  setQ,
  keys,
  loading,
  error,
}: {
  title: string
  q: string
  setQ: (v: string) => void
  keys: string[] | undefined
  loading: boolean
  error: unknown
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-6 mb-4">
        <div>
          <div className="kicker">{title}</div>
          <div className="mt-1 font-display text-[22px] tracking-tight">
            {loading ? '…' : keys?.length?.toLocaleString() ?? 0}
            <span className="text-paper-subtle text-[14px] ml-2">
              {q ? 'matching' : 'total'}
            </span>
          </div>
        </div>
        <Input
          placeholder="filter (e.g. `Name (nginx*)`)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
          aria-label="package filter query"
        />
      </div>

      {error ? (
        <ErrorState error={error} />
      ) : loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : !keys?.length ? (
        <EmptyState
          title={q ? 'No matches' : 'No packages'}
          hint={
            q
              ? `Nothing matches the filter “${q}”.`
              : 'This resource has no associated packages.'
          }
        />
      ) : (
        <ul className="divide-y divide-rule border-y border-rule font-mono text-[12.5px]">
          {keys.slice(0, 500).map((k) => {
            const p = parsePackageKey(k)
            return (
              <li key={k}>
                <Link
                  to={`/packages/${encodeURIComponent(k)}`}
                  className="group flex items-baseline gap-4 py-2.5 hover:bg-ink-elev/60 transition-colors -mx-2 px-2"
                >
                  <span className="w-20 shrink-0">
                    <Badge tone="neutral">{p.arch || '?'}</Badge>
                  </span>
                  <span className="flex-1 min-w-0 truncate text-paper group-hover:text-amber transition-colors">
                    {p.name}
                  </span>
                  <Mono dim className="shrink-0">
                    {p.version}
                  </Mono>
                  <span className="font-mono text-[10px] text-paper-subtle tracking-[0.1em] shrink-0 w-20 text-right">
                    {p.hash?.slice(0, 8) || ''}
                  </span>
                </Link>
              </li>
            )
          })}
          {keys.length > 500 && (
            <li className="py-3 text-center text-paper-subtle font-mono text-[11px] uppercase tracking-[0.16em]">
              showing first 500 of {keys.length.toLocaleString()}
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
