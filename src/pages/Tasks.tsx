import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ChevronRight } from 'lucide-react'
import { api, TaskState, type Task } from '@/lib/api'
import {
  isActive,
  stateLabel,
  stateTone,
  useTasks,
  useTaskOutput,
} from '@/lib/tasks'
import { fmtDate, fmtRelative } from '@/lib/format'
import { useCanWrite } from '@/lib/queries'
import { useDbCleanup } from '@/lib/mutations'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/data/PageHeader'
import { EmptyState } from '@/components/data/EmptyState'
import { ErrorState } from '@/components/data/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ConfirmDelete } from '@/components/ui/confirm-delete'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table'

type StateFilter = 'all' | 'active' | 'failed' | 'done'

export function Tasks() {
  const { data, isLoading, error, refetch, isFetching } = useTasks()
  const canWrite = useCanWrite()

  const [q, setQ] = useState('')
  const [stateFilter, setStateFilter] = useState<StateFilter>('all')

  const tasks = useMemo(() => {
    const list = data ? [...data].sort((a, b) => b.ID - a.ID) : []
    return list.filter((t) => {
      if (stateFilter === 'active' && !isActive(t)) return false
      if (stateFilter === 'failed' && t.State !== TaskState.Failed) return false
      if (
        stateFilter === 'done' &&
        t.State !== TaskState.Succeeded &&
        t.State !== TaskState.Failed
      )
        return false
      if (q) {
        const needle = q.trim().toLowerCase()
        const hay = `${t.ID} ${t.Name ?? ''}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
  }, [data, stateFilter, q])

  const counts = useMemo(() => {
    const all = data ?? []
    return {
      total: all.length,
      active: all.filter(isActive).length,
      failed: all.filter((t) => t.State === TaskState.Failed).length,
      done: all.filter(
        (t) =>
          t.State === TaskState.Succeeded || t.State === TaskState.Failed,
      ).length,
    }
  }, [data])

  return (
    <>
      <PageHeader
        kicker={
          counts.active > 0
            ? `${counts.active} running · ${counts.total} total`
            : `${counts.total} total`
        }
        title="Tasks"
        lede={
          <>
            Aptly's async task queue. Long-running operations (publishes,
            snapshot create, repo updates, DB cleanup) appear here as they
            execute. Click a row to stream its output.
          </>
        }
        actions={
          <>
            <Button
              variant="ghost"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              {isFetching ? 'Refreshing…' : 'Refresh'}
            </Button>
          </>
        }
      />

      {canWrite && <AdminBar />}

      <div className="flex flex-wrap items-end gap-4 mb-6">
        <div className="flex-1 min-w-[220px]">
          <label className="kicker block mb-2">Filter</label>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="task #id or name…"
          />
        </div>
        <div>
          <label className="kicker block mb-2">State</label>
          <div className="flex gap-1 border border-rule">
            {(
              [
                ['all', `All (${counts.total})`],
                ['active', `Active (${counts.active})`],
                ['failed', `Failed (${counts.failed})`],
                ['done', `Done (${counts.done})`],
              ] as Array<[StateFilter, string]>
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setStateFilter(key)}
                className={cn(
                  'h-9 px-3 font-mono uppercase tracking-[0.16em] text-[10.5px] transition-colors',
                  stateFilter === key
                    ? 'bg-amber/10 text-amber'
                    : 'text-paper-muted hover:text-paper',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error ? (
        <ErrorState error={error} />
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : !data?.length ? (
        <EmptyState
          title="No tasks queued"
          hint="Tasks land here as you upload, snapshot, publish, or clean up."
        />
      ) : !tasks.length ? (
        <EmptyState title="No matches" hint="Try a different state or query." />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH className="w-10"></TH>
              <TH className="w-16">ID</TH>
              <TH className="w-28">State</TH>
              <TH>Name</TH>
              <TH className="w-44">Added</TH>
              <TH className="w-44">Finished</TH>
            </TR>
          </THead>
          <TBody>
            {tasks.map((t) => (
              <TaskRow key={t.ID} task={t} />
            ))}
          </TBody>
        </Table>
      )}
    </>
  )
}

function AdminBar() {
  const qc = useQueryClient()
  const cleanup = useDbCleanup()
  const clear = useMutation({
    mutationFn: api.tasksClear,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Cleared completed tasks')
    },
    onError: (err) => {
      toast.error('Clear failed', {
        description: err instanceof Error ? err.message : String(err),
      })
    },
  })

  const [cleanupOpen, setCleanupOpen] = useState(false)

  return (
    <section className="mb-8 border border-rule px-5 py-4 flex flex-wrap items-center justify-between gap-4">
      <div>
        <div className="kicker">Admin</div>
        <p className="mt-1 text-paper-muted text-[13px] max-w-xl">
          DB cleanup reclaims pool files no longer referenced by any repo or
          snapshot. Run after bulk removing packages. Clearing tasks drops the
          succeeded/failed history so this list stays readable.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          onClick={() => clear.mutate()}
          disabled={clear.isPending}
        >
          {clear.isPending ? 'Clearing…' : 'Clear done'}
        </Button>
        <Button
          onClick={() => setCleanupOpen(true)}
          disabled={cleanup.isPending}
        >
          {cleanup.isPending ? 'Cleanup queued…' : 'DB cleanup'}
        </Button>
      </div>

      <ConfirmDelete
        open={cleanupOpen}
        onOpenChange={setCleanupOpen}
        kicker="Run DB cleanup"
        title={<>Run aptly DB cleanup?</>}
        description={
          <span>
            Reclaims orphan pool files. This is safe — it only removes files
            not referenced by any repo or snapshot. The task may take a while
            on a large pool.
          </span>
        }
        confirmText="CLEANUP"
        confirmLabel="Run cleanup"
        mutationLoading={cleanup.isPending}
        onConfirm={() => {
          cleanup.mutate(undefined, {
            onSuccess: () => setCleanupOpen(false),
          })
        }}
      />
    </section>
  )
}

function TaskRow({ task }: { task: Task }) {
  const [expanded, setExpanded] = useState(false)
  const out = useTaskOutput(expanded ? task.ID : undefined, isActive(task))

  return (
    <>
      <TR
        onClick={() => setExpanded((v) => !v)}
        className="cursor-pointer"
      >
        <TD className="w-10 align-middle">
          <ChevronRight
            className={cn(
              'h-3.5 w-3.5 text-paper-subtle transition-transform',
              expanded && 'rotate-90',
            )}
          />
        </TD>
        <TD className="font-mono text-paper-subtle align-middle">
          #{task.ID}
        </TD>
        <TD className="align-middle">
          <Badge tone={stateTone(task.State)}>{stateLabel(task.State)}</Badge>
        </TD>
        <TD className="text-paper align-middle">
          {task.Name ?? <span className="text-paper-subtle italic">—</span>}
        </TD>
        <TD className="font-mono text-paper-muted text-[12px] align-middle">
          {task.AddedAt ? (
            <span title={fmtDate(task.AddedAt)}>
              {fmtRelative(task.AddedAt)}
            </span>
          ) : (
            '—'
          )}
        </TD>
        <TD className="font-mono text-paper-muted text-[12px] align-middle">
          {task.FinishedAt ? (
            <span title={fmtDate(task.FinishedAt)}>
              {fmtRelative(task.FinishedAt)}
            </span>
          ) : (
            '—'
          )}
        </TD>
      </TR>
      {expanded && (
        <TR>
          <TD colSpan={6} className="bg-ink/40 pt-0">
            <pre className="bg-ink p-3 font-mono text-[11px] text-paper-muted whitespace-pre-wrap break-words max-h-96 overflow-y-auto border border-rule">
              {out.isLoading
                ? 'fetching output…'
                : out.error
                  ? out.error instanceof Error
                    ? out.error.message
                    : String(out.error)
                  : (out.data || '(no output yet)')}
            </pre>
          </TD>
        </TR>
      )}
    </>
  )
}
