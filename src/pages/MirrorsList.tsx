import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useMirrors } from '@/lib/queries'
import { PageHeader } from '@/components/data/PageHeader'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/data/EmptyState'
import { ErrorState } from '@/components/data/ErrorState'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table'
import { Mono } from '@/components/data/Mono'
import { Badge } from '@/components/ui/badge'
import { fmtRelative } from '@/lib/format'

export function MirrorsList() {
  const { data, isLoading, error } = useMirrors()
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    if (!data) return []
    const needle = q.trim().toLowerCase()
    if (!needle) return data
    return data.filter(
      (m) =>
        m.Name.toLowerCase().includes(needle) ||
        m.ArchiveURL?.toLowerCase().includes(needle) ||
        m.Distribution?.toLowerCase().includes(needle),
    )
  }, [data, q])

  return (
    <>
      <PageHeader
        kicker={`${data?.length ?? 0} entries`}
        title="Mirrors"
        lede="Remote APT sources that aptly tracks. Each mirror snapshots an upstream distribution at a point in time when you update it."
        actions={
          <Input
            placeholder="filter by name, url, distribution…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-72"
          />
        }
      />

      {error ? (
        <ErrorState error={error} />
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : !data?.length ? (
        <EmptyState
          title="No mirrors configured"
          hint="Add one with `aptly mirror create <name> <url> <dist>`."
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="No matches" hint={`Nothing matches “${q}”.`} />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Name</TH>
              <TH>Upstream</TH>
              <TH>Distribution</TH>
              <TH>Architectures</TH>
              <TH>Last updated</TH>
            </TR>
          </THead>
          <TBody>
            {filtered.map((m) => (
              <TR key={m.Name}>
                <TD>
                  <Link
                    to={`/mirrors/${encodeURIComponent(m.Name)}`}
                    className="font-display text-[17px] text-paper hover:text-amber transition-colors"
                  >
                    {m.Name}
                  </Link>
                </TD>
                <TD>
                  <Mono dim className="break-all">
                    {m.ArchiveURL || '—'}
                  </Mono>
                </TD>
                <TD>
                  {m.Distribution ? (
                    <Badge tone="amber">{m.Distribution}</Badge>
                  ) : (
                    <span className="text-paper-subtle">—</span>
                  )}
                </TD>
                <TD>
                  <div className="flex flex-wrap gap-1">
                    {m.Architectures?.length ? (
                      m.Architectures.map((a) => (
                        <Badge key={a} tone="neutral">
                          {a}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-paper-subtle">—</span>
                    )}
                  </div>
                </TD>
                <TD className="text-paper-muted">
                  <span title={m.LastDownloadDate ?? ''}>
                    {fmtRelative(m.LastDownloadDate)}
                  </span>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </>
  )
}
