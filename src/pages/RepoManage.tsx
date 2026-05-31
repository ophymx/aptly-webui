import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { parsePackageKey } from '@/lib/api'
import {
  useCanWrite,
  useRepo,
  useRepoPackages,
} from '@/lib/queries'
import { useRemoveRepoPackages } from '@/lib/mutations'
import { PageHeader } from '@/components/data/PageHeader'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/data/EmptyState'
import { ErrorState } from '@/components/data/ErrorState'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table'
import { Mono } from '@/components/data/Mono'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDelete } from '@/components/ui/confirm-delete'
import { cn } from '@/lib/utils'

type SortCol = 'arch' | 'name' | 'version' | 'hash'
type SortDir = 'asc' | 'desc'

interface Row {
  key: string
  arch: string
  name: string
  version: string
  hash: string
}

const ROW_LIMIT = 2000

export function RepoManage() {
  const { name } = useParams<{ name: string }>()
  const repo = useRepo(name)
  const canWrite = useCanWrite()
  // No query filter from aptly — sort/filter happens client-side so headers can sort
  // the *full* row set, not just whatever aptly returned for a partial query.
  const packages = useRepoPackages(name, '')

  const rows = useMemo<Row[]>(() => {
    return (packages.data ?? []).map((k) => {
      const p = parsePackageKey(k)
      return {
        key: k,
        arch: p.arch || '',
        name: p.name || '',
        version: p.version || '',
        hash: p.hash || '',
      }
    })
  }, [packages.data])

  const [q, setQ] = useState('')
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(needle) ||
        r.version.toLowerCase().includes(needle) ||
        r.arch.toLowerCase().includes(needle) ||
        r.key.toLowerCase().includes(needle),
    )
  }, [rows, q])

  const [sortCol, setSortCol] = useState<SortCol>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const sorted = useMemo(() => {
    const arr = filtered.slice()
    const cmp = (a: Row, b: Row) => {
      if (sortCol === 'version') {
        const c = compareVersions(a.version, b.version)
        return sortDir === 'asc' ? c : -c
      }
      const av = a[sortCol]
      const bv = b[sortCol]
      const c = av.localeCompare(bv, undefined, { numeric: true })
      return sortDir === 'asc' ? c : -c
    }
    arr.sort(cmp)
    return arr
  }, [filtered, sortCol, sortDir])

  function toggleSort(col: SortCol) {
    if (col === sortCol) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortCol(col)
      setSortDir('asc')
    }
  }

  // Selection -------------------------------------------------------------
  const [selected, setSelected] = useState<Set<string>>(new Set())

  function toggleOne(key: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const visibleKeys = useMemo(() => sorted.slice(0, ROW_LIMIT).map((r) => r.key), [sorted])
  const allVisibleSelected =
    visibleKeys.length > 0 && visibleKeys.every((k) => selected.has(k))

  function toggleAllVisible() {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allVisibleSelected) {
        for (const k of visibleKeys) next.delete(k)
      } else {
        for (const k of visibleKeys) next.add(k)
      }
      return next
    })
  }

  function clearSelection() {
    setSelected(new Set())
  }

  // Mutation --------------------------------------------------------------
  const mut = useRemoveRepoPackages()
  const [confirmOpen, setConfirmOpen] = useState(false)

  function confirmDelete() {
    if (!name || selected.size === 0) return
    const refs = Array.from(selected)
    mut.mutate(
      { repo: name, packageRefs: refs },
      {
        onSuccess: () => {
          clearSelection()
          setConfirmOpen(false)
        },
      },
    )
  }

  // Render ----------------------------------------------------------------
  if (repo.error) return <ErrorState error={repo.error} />

  return (
    <>
      <PageHeader
        kicker={
          <>
            <Link to="/repos" className="hover:text-amber">
              repositories
            </Link>
            {' / '}
            <Link
              to={`/repos/${encodeURIComponent(name ?? '')}`}
              className="hover:text-amber"
            >
              {repo.data?.Name ?? name ?? '—'}
            </Link>
            {' / '}
            <span>manage</span>
          </>
        }
        title="Manage packages"
        lede={
          <>
            Bulk-remove package versions from the local repo. After removing,
            run a{' '}
            <Link to="/publish" className="text-amber hover:underline">
              publish update
            </Link>{' '}
            so the on-disk apt repo reflects the change. Pool files are
            reclaimed by{' '}
            <Link to="/tasks" className="text-amber hover:underline">
              DB cleanup
            </Link>
            .
          </>
        }
        actions={
          canWrite && selected.size > 0 ? (
            <>
              <Button variant="ghost" onClick={clearSelection}>
                Clear ({selected.size})
              </Button>
              <Button
                onClick={() => setConfirmOpen(true)}
                className="border-err/40 text-err hover:border-err hover:text-err"
              >
                Remove selected
              </Button>
            </>
          ) : null
        }
      />

      <div className="flex flex-wrap items-end gap-4 mb-6">
        <div className="flex-1 min-w-[260px]">
          <label className="kicker block mb-2">Filter</label>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="package name, version, arch…"
          />
        </div>
        <div className="text-right">
          <div className="kicker">Showing</div>
          <div className="font-display text-[22px] tracking-tight">
            {packages.isLoading
              ? '…'
              : Math.min(sorted.length, ROW_LIMIT).toLocaleString()}
            <span className="text-paper-subtle text-[14px] ml-2">
              {sorted.length !== rows.length
                ? `of ${rows.length.toLocaleString()}`
                : 'total'}
            </span>
          </div>
        </div>
      </div>

      {packages.error ? (
        <ErrorState error={packages.error} />
      ) : packages.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : !rows.length ? (
        <EmptyState
          title="No packages"
          hint="This repo is empty. Upload .debs from the repo detail page."
        />
      ) : !sorted.length ? (
        <EmptyState title="No matches" hint={`Nothing matches “${q}”.`} />
      ) : (
        <>
          <Table className="font-mono text-[12.5px]">
            <THead>
              <TR>
                {canWrite && (
                  <TH className="w-8 pl-0 pr-3">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleAllVisible}
                      aria-label="select all visible"
                      className="accent-amber"
                    />
                  </TH>
                )}
                <SortableTH
                  label="arch"
                  col="arch"
                  sortCol={sortCol}
                  sortDir={sortDir}
                  onClick={() => toggleSort('arch')}
                />
                <SortableTH
                  label="name"
                  col="name"
                  sortCol={sortCol}
                  sortDir={sortDir}
                  onClick={() => toggleSort('name')}
                />
                <SortableTH
                  label="version"
                  col="version"
                  sortCol={sortCol}
                  sortDir={sortDir}
                  onClick={() => toggleSort('version')}
                />
                <SortableTH
                  label="hash"
                  col="hash"
                  sortCol={sortCol}
                  sortDir={sortDir}
                  onClick={() => toggleSort('hash')}
                  className="text-right"
                />
              </TR>
            </THead>
            <TBody>
              {sorted.slice(0, ROW_LIMIT).map((r) => {
                const isSel = selected.has(r.key)
                return (
                  <TR
                    key={r.key}
                    className={isSel ? 'bg-amber/5 hover:bg-amber/10' : ''}
                  >
                    {canWrite && (
                      <TD className="w-8 pl-0 pr-3 align-middle">
                        <input
                          type="checkbox"
                          checked={isSel}
                          onChange={() => toggleOne(r.key)}
                          aria-label={`select ${r.name} ${r.version}`}
                          className="accent-amber"
                        />
                      </TD>
                    )}
                    <TD className="align-middle">
                      <Badge tone="neutral">{r.arch || '?'}</Badge>
                    </TD>
                    <TD className="align-middle">
                      <Link
                        to={`/packages/${encodeURIComponent(r.key)}`}
                        className="text-paper hover:text-amber transition-colors"
                      >
                        {r.name}
                      </Link>
                    </TD>
                    <TD className="align-middle">
                      <Mono dim>{r.version}</Mono>
                    </TD>
                    <TD className="align-middle text-right">
                      <span className="font-mono text-[10px] text-paper-subtle tracking-[0.1em]">
                        {r.hash.slice(0, 12)}
                      </span>
                    </TD>
                  </TR>
                )
              })}
            </TBody>
          </Table>
          {sorted.length > ROW_LIMIT && (
            <p className="mt-3 text-center text-paper-subtle font-mono text-[11px] uppercase tracking-[0.16em]">
              showing first {ROW_LIMIT.toLocaleString()} of{' '}
              {sorted.length.toLocaleString()} — narrow the filter to refine
            </p>
          )}
        </>
      )}

      <ConfirmDelete
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        kicker="Remove packages"
        title={
          <>
            Remove <span className="text-err">{selected.size}</span> package
            {selected.size === 1 ? '' : 's'} from{' '}
            <Mono className="text-paper">{name}</Mono>?
          </>
        }
        description={
          <span>
            Removes the selected package keys from the local repo. Snapshots
            already referencing the keys are unaffected. Run a publish update
            afterward to refresh the served apt repo, and DB cleanup later to
            reclaim pool files.
          </span>
        }
        confirmText="REMOVE"
        confirmLabel="Remove all"
        mutationLoading={mut.isPending}
        onConfirm={confirmDelete}
      />
    </>
  )
}

// Header cell with sort indicator. Inline rather than a separate file because
// it leaks the SortCol type and there's only one consumer.
function SortableTH({
  label,
  col,
  sortCol,
  sortDir,
  onClick,
  className,
}: {
  label: string
  col: SortCol
  sortCol: SortCol
  sortDir: SortDir
  onClick: () => void
  className?: string
}) {
  const active = sortCol === col
  return (
    <TH className={cn('cursor-pointer select-none', className)} onClick={onClick}>
      <span
        className={cn(
          'inline-flex items-center gap-1 hover:text-paper transition-colors',
          active && 'text-amber',
        )}
      >
        {label}
        <span className="text-[9px] tracking-normal">
          {active ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
        </span>
      </span>
    </TH>
  )
}

// Debian-ish version compare. We don't pull in dpkg, just split on the same
// separators dpkg uses (~ . - + : _) and compare segments numerically when
// both segments parse as integers, lexically otherwise. Good enough for
// sorting; do not use for "is X newer than Y" decisions.
function compareVersions(a: string, b: string): number {
  const sa = a.split(/[~.\-+:_]/)
  const sb = b.split(/[~.\-+:_]/)
  const n = Math.max(sa.length, sb.length)
  for (let i = 0; i < n; i++) {
    const xa = sa[i] ?? ''
    const xb = sb[i] ?? ''
    if (xa === xb) continue
    const na = Number(xa)
    const nb = Number(xb)
    if (Number.isFinite(na) && Number.isFinite(nb)) {
      if (na !== nb) return na - nb
    }
    return xa.localeCompare(xb, undefined, { numeric: true })
  }
  return 0
}
