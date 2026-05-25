import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useRepos } from '@/lib/queries'
import { PageHeader } from '@/components/data/PageHeader'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/data/EmptyState'
import { ErrorState } from '@/components/data/ErrorState'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table'
import { Mono } from '@/components/data/Mono'
import { Badge } from '@/components/ui/badge'

export function ReposList() {
  const { data, isLoading, error } = useRepos()
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    if (!data) return []
    const needle = q.trim().toLowerCase()
    if (!needle) return data
    return data.filter(
      (r) =>
        r.Name.toLowerCase().includes(needle) ||
        r.Comment?.toLowerCase().includes(needle) ||
        r.DefaultDistribution?.toLowerCase().includes(needle),
    )
  }, [data, q])

  return (
    <>
      <PageHeader
        kicker={`${data?.length ?? 0} entries`}
        title="Local repositories"
        lede="Repositories you maintain locally. Add packages with the aptly CLI; this UI reads only."
        actions={
          <Input
            placeholder="filter by name, distribution, comment…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-72"
          />
        }
      />
      {error ? (
        <ErrorState error={error} />
      ) : isLoading ? (
        <ListSkeleton />
      ) : !data?.length ? (
        <EmptyState
          title="No repositories yet"
          hint="Create one with `aptly repo create <name>` on the daemon host."
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="No matches" hint={`Nothing matches “${q}”.`} />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Name</TH>
              <TH>Default distribution</TH>
              <TH>Default component</TH>
              <TH>Comment</TH>
            </TR>
          </THead>
          <TBody>
            {filtered.map((r) => (
              <TR key={r.Name}>
                <TD>
                  <Link
                    to={`/repos/${encodeURIComponent(r.Name)}`}
                    className="font-display text-[17px] text-paper hover:text-amber transition-colors"
                  >
                    {r.Name}
                  </Link>
                </TD>
                <TD>
                  {r.DefaultDistribution ? (
                    <Badge tone="amber">{r.DefaultDistribution}</Badge>
                  ) : (
                    <span className="text-paper-subtle">—</span>
                  )}
                </TD>
                <TD>
                  <Mono dim>{r.DefaultComponent ?? '—'}</Mono>
                </TD>
                <TD className="text-paper-muted">
                  {r.Comment || (
                    <span className="text-paper-subtle italic">no comment</span>
                  )}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </>
  )
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}
