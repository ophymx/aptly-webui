import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useSnapshots } from '@/lib/queries'
import { PageHeader } from '@/components/data/PageHeader'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/data/EmptyState'
import { ErrorState } from '@/components/data/ErrorState'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table'
import { fmtDate, fmtRelative } from '@/lib/format'

export function SnapshotsList() {
  const { data, isLoading, error } = useSnapshots()
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<'newest' | 'name'>('newest')

  const filtered = useMemo(() => {
    if (!data) return []
    const needle = q.trim().toLowerCase()
    const base = needle
      ? data.filter(
          (s) =>
            s.Name.toLowerCase().includes(needle) ||
            s.Description?.toLowerCase().includes(needle),
        )
      : data
    if (sort === 'name') {
      return [...base].sort((a, b) => a.Name.localeCompare(b.Name))
    }
    return [...base].sort((a, b) => {
      const ad = a.CreatedAt ? Date.parse(a.CreatedAt) : 0
      const bd = b.CreatedAt ? Date.parse(b.CreatedAt) : 0
      return bd - ad
    })
  }, [data, q, sort])

  return (
    <>
      <PageHeader
        kicker={`${data?.length ?? 0} entries`}
        title="Snapshots"
        lede="Immutable, named copies of a repository or mirror at a point in time. Snapshots are the unit you publish."
        actions={
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setSort(sort === 'newest' ? 'name' : 'newest')}
              className="font-mono uppercase text-[10.5px] tracking-[0.16em] text-paper-muted hover:text-amber transition-colors"
            >
              sort · {sort === 'newest' ? 'newest first' : 'a→z'}
            </button>
            <Input
              placeholder="filter…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-64"
            />
          </div>
        }
      />

      {error ? (
        <ErrorState error={error} />
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : !data?.length ? (
        <EmptyState
          title="No snapshots yet"
          hint="Snapshots are created from repos or mirrors with the aptly CLI."
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="No matches" hint={`Nothing matches “${q}”.`} />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Name</TH>
              <TH>Description</TH>
              <TH className="text-right">Created</TH>
            </TR>
          </THead>
          <TBody>
            {filtered.map((s) => (
              <TR key={s.Name}>
                <TD className="w-1/3">
                  <Link
                    to={`/snapshots/${encodeURIComponent(s.Name)}`}
                    className="font-display text-[17px] text-paper hover:text-amber transition-colors"
                  >
                    {s.Name}
                  </Link>
                </TD>
                <TD className="text-paper-muted">
                  {s.Description || (
                    <span className="text-paper-subtle italic">none</span>
                  )}
                </TD>
                <TD className="text-right text-paper-muted whitespace-nowrap">
                  <div className="font-mono text-[12px]">
                    {fmtDate(s.CreatedAt)}
                  </div>
                  <div className="font-mono text-[10.5px] text-paper-subtle uppercase tracking-[0.14em]">
                    {fmtRelative(s.CreatedAt)}
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </>
  )
}
