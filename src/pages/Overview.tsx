import { Link } from 'react-router-dom'
import {
  useMirrors,
  useRepos,
  useSnapshots,
  usePublishList,
} from '@/lib/queries'
import { Skeleton } from '@/components/ui/skeleton'
import { fmtRelative } from '@/lib/format'
import { ErrorState } from '@/components/data/ErrorState'
import type { Snapshot } from '@/lib/api'

export function Overview() {
  const repos = useRepos()
  const mirrors = useMirrors()
  const snapshots = useSnapshots()
  const publish = usePublishList()

  const anyError =
    repos.error || mirrors.error || snapshots.error || publish.error

  return (
    <div className="animate-fade-in">
      {anyError && (
        <div className="mb-10">
          <ErrorState
            error={
              repos.error ?? mirrors.error ?? snapshots.error ?? publish.error
            }
          />
        </div>
      )}

      {/* Counts grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-rule border border-rule">
        <CountTile
          to="/repos"
          label="Local repositories"
          n={repos.data?.length}
          loading={repos.isLoading}
        />
        <CountTile
          to="/mirrors"
          label="Mirrors"
          n={mirrors.data?.length}
          loading={mirrors.isLoading}
        />
        <CountTile
          to="/snapshots"
          label="Snapshots"
          n={snapshots.data?.length}
          loading={snapshots.isLoading}
        />
        <CountTile
          to="/publish"
          label="Publications"
          n={publish.data?.length}
          loading={publish.isLoading}
        />
      </section>

      {/* Recent snapshots */}
      <section className="mt-16 grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-16">
        <div>
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="font-display text-[28px] tracking-[-0.015em]">
              Most recent snapshots
            </h2>
            <Link
              to="/snapshots"
              className="kicker text-paper-muted hover:text-amber transition-colors"
            >
              all snapshots →
            </Link>
          </div>
          <div className="rule-short mb-6" />
          {snapshots.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : snapshots.data && snapshots.data.length > 0 ? (
            <ul className="space-y-0 divide-y divide-rule border-y border-rule">
              {sortByDate(snapshots.data).slice(0, 6).map((s) => (
                <li key={s.Name}>
                  <Link
                    to={`/snapshots/${encodeURIComponent(s.Name)}`}
                    className="block py-4 group"
                  >
                    <div className="flex items-baseline justify-between gap-6">
                      <div className="min-w-0">
                        <div className="font-display text-[18px] text-paper group-hover:text-amber transition-colors truncate">
                          {s.Name}
                        </div>
                        {s.Description && (
                          <div className="mt-1 text-[12.5px] text-paper-muted truncate">
                            {s.Description}
                          </div>
                        )}
                      </div>
                      <time className="font-mono text-[11px] text-paper-subtle uppercase tracking-[0.14em] shrink-0">
                        {fmtRelative(s.CreatedAt)}
                      </time>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-paper-muted italic">No snapshots yet.</p>
          )}
        </div>

        <aside className="border-l border-rule pl-8">
          <h2 className="font-display text-[28px] tracking-[-0.015em] mb-6">
            Published distributions
          </h2>
          <div className="rule-short mb-6" />
          {publish.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : publish.data && publish.data.length > 0 ? (
            <ul className="space-y-4">
              {publish.data.map((p, i) => (
                <li key={`${p.Storage}:${p.Prefix}:${p.Distribution}:${i}`}>
                  <Link
                    to="/publish"
                    className="block group"
                  >
                    <div className="font-mono text-[13px] text-paper group-hover:text-amber transition-colors">
                      {(p.Prefix || '.')}/<span className="text-amber">{p.Distribution}</span>
                    </div>
                    <div className="font-mono text-[10.5px] text-paper-subtle uppercase tracking-[0.16em] mt-0.5">
                      {p.SourceKind} · {p.Architectures?.join(' ') ?? '—'}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-paper-muted italic">Nothing published.</p>
          )}
        </aside>
      </section>
    </div>
  )
}

function CountTile({
  to,
  label,
  n,
  loading,
}: {
  to: string
  label: string
  n: number | undefined
  loading: boolean
}) {
  return (
    <Link
      to={to}
      className="block bg-ink hover:bg-ink-elev transition-colors group p-7"
    >
      <div className="kicker text-paper-subtle group-hover:text-amber transition-colors">
        {label}
      </div>
      <div className="mt-5 flex items-baseline gap-3">
        {loading ? (
          <Skeleton className="h-16 w-20" />
        ) : (
          <span className="drop">{n ?? 0}</span>
        )}
      </div>
      <div className="mt-5 font-mono text-[11px] text-paper-subtle uppercase tracking-[0.16em] flex items-center gap-2">
        <span className="group-hover:text-amber transition-colors">
          browse →
        </span>
      </div>
    </Link>
  )
}

function sortByDate(arr: Snapshot[]): Snapshot[] {
  return [...arr].sort((a, b) => {
    const ad = a.CreatedAt ? Date.parse(a.CreatedAt) : 0
    const bd = b.CreatedAt ? Date.parse(b.CreatedAt) : 0
    return bd - ad
  })
}
