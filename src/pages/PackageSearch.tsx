import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { usePackageSearch } from '@/lib/queries'
import { parsePackageKey } from '@/lib/api'
import { PageHeader } from '@/components/data/PageHeader'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/data/EmptyState'
import { ErrorState } from '@/components/data/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Mono } from '@/components/data/Mono'

export function PackageSearch() {
  const [params, setParams] = useSearchParams()
  const initial = params.get('q') ?? ''
  const [q, setQ] = useState(initial)
  const submitted = params.get('q') ?? ''

  const { data, isLoading, error, isFetching } = usePackageSearch(submitted)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setParams(q ? { q } : {})
  }

  return (
    <>
      <PageHeader
        kicker="Packages"
        title="Search the index"
        lede={
          <>
            Use aptly's query syntax. Examples:{' '}
            <Mono className="text-paper">nginx</Mono>,{' '}
            <Mono className="text-paper">{`Name (~ ^lib)`}</Mono>,{' '}
            <Mono className="text-paper">{`$Architecture (amd64), Priority (optional)`}</Mono>.
          </>
        }
      />

      <form onSubmit={submit} className="flex items-end gap-4 mb-10">
        <div className="flex-1">
          <label className="kicker block mb-2">Query</label>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="package name or aptly query…"
            autoFocus
          />
        </div>
        <button
          type="submit"
          className="h-9 px-4 border border-rule-strong font-mono uppercase tracking-[0.16em] text-[11px] text-paper hover:border-amber hover:text-amber transition-colors"
        >
          Search
        </button>
      </form>

      {!submitted ? (
        <EmptyState
          title="Enter a query"
          hint="Results stream from /api/packages?q=…"
        />
      ) : error ? (
        <ErrorState error={error} />
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : !data?.length ? (
        <EmptyState title="No packages match" hint={`Query: ${submitted}`} />
      ) : (
        <>
          <div className="flex items-baseline gap-3 mb-4">
            <div className="font-display text-[24px] tracking-tight">
              {data.length.toLocaleString()}
            </div>
            <div className="kicker">
              {data.length === 1 ? 'package' : 'packages'}
              {isFetching ? ' · updating' : ''}
            </div>
          </div>
          <ul className="divide-y divide-rule border-y border-rule font-mono text-[12.5px]">
            {data.slice(0, 1000).map((k) => {
              const p = parsePackageKey(k)
              return (
                <li key={k}>
                  <Link
                    to={`/packages/${encodeURIComponent(k)}`}
                    className="group flex items-baseline gap-4 py-2.5 -mx-2 px-2 hover:bg-ink-elev/60 transition-colors"
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
                  </Link>
                </li>
              )
            })}
            {data.length > 1000 && (
              <li className="py-3 text-center text-paper-subtle font-mono text-[11px] uppercase tracking-[0.16em]">
                showing first 1,000 of {data.length.toLocaleString()}
              </li>
            )}
          </ul>
        </>
      )}
    </>
  )
}
