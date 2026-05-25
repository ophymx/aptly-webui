import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { usePublishList } from '@/lib/queries'
import { PageHeader } from '@/components/data/PageHeader'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/data/EmptyState'
import { ErrorState } from '@/components/data/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Mono } from '@/components/data/Mono'
import { UpdatePublishAction } from '@/components/actions/UpdatePublishAction'
import { DropPublishAction } from '@/components/actions/DropPublishAction'

export function PublishList() {
  const { data, isLoading, error } = usePublishList()
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    if (!data) return []
    const needle = q.trim().toLowerCase()
    if (!needle) return data
    return data.filter((p) =>
      [p.Prefix, p.Distribution, p.Storage, p.SourceKind, p.Label]
        .filter(Boolean)
        .some((s) => s!.toLowerCase().includes(needle)),
    )
  }, [data, q])

  return (
    <>
      <PageHeader
        kicker={`${data?.length ?? 0} entries`}
        title="Publications"
        lede="Distributions currently being served by aptly to APT clients. Each one represents one or more sources published under a prefix."
        actions={
          <Input
            placeholder="filter by prefix, distribution…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-72"
          />
        }
      />

      {error ? (
        <ErrorState error={error} />
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-rule border border-rule">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full bg-ink" />
          ))}
        </div>
      ) : !data?.length ? (
        <EmptyState
          title="Nothing published"
          hint="Publish a snapshot or repo with `aptly publish snapshot/repo …`."
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="No matches" hint={`Nothing matches “${q}”.`} />
      ) : (
        <ul className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-rule border border-rule">
          {filtered.map((p, i) => (
            <li
              key={`${p.Storage}:${p.Prefix}:${p.Distribution}:${i}`}
              className="bg-ink p-7 group hover:bg-ink-elev transition-colors"
            >
              <div className="flex items-baseline justify-between gap-4">
                <div>
                  <div className="kicker">
                    {p.SourceKind || 'publication'}
                  </div>
                  <h3 className="mt-1 font-display text-[28px] tracking-[-0.015em] text-paper group-hover:text-amber transition-colors">
                    {p.Distribution}
                  </h3>
                </div>
                {p.Storage && (
                  <Badge tone="neutral">{p.Storage || 'default'}</Badge>
                )}
              </div>

              <div className="mt-5 font-mono text-[12px] text-paper-muted break-all">
                <span className="text-paper-subtle">prefix </span>
                {p.Prefix || '.'}
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {p.Architectures?.map((a) => (
                  <Badge key={a} tone="amber">
                    {a}
                  </Badge>
                ))}
              </div>

              {p.Sources && p.Sources.length > 0 && (
                <div className="mt-5 pt-5 border-t border-rule">
                  <div className="kicker mb-2">sources</div>
                  <ul className="space-y-1.5">
                    {p.Sources.map((src) => (
                      <li
                        key={`${src.Component}-${src.Name}`}
                        className="flex items-baseline justify-between gap-3"
                      >
                        <Mono className="truncate">
                          {p.SourceKind === 'snapshot' ? (
                            <Link
                              to={`/snapshots/${encodeURIComponent(src.Name)}`}
                              className="hover:text-amber transition-colors"
                            >
                              {src.Name}
                            </Link>
                          ) : (
                            <Link
                              to={`/repos/${encodeURIComponent(src.Name)}`}
                              className="hover:text-amber transition-colors"
                            >
                              {src.Name}
                            </Link>
                          )}
                        </Mono>
                        <Mono dim className="shrink-0 text-[11px]">
                          [{src.Component || 'main'}]
                        </Mono>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-5 pt-4 border-t border-rule flex items-center gap-3">
                <UpdatePublishAction publish={p} />
                <DropPublishAction publish={p} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
