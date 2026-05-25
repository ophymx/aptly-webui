import { useState } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ChevronRight, X } from 'lucide-react'
import { api, TaskState, type Task } from '@/lib/api'
import { isActive, stateLabel, stateTone, useTasks, useTaskOutput } from '@/lib/tasks'
import { fmtRelative } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { StatusDot } from '@/components/data/StatusDot'

export function TaskDrawerTrigger() {
  const [open, setOpen] = useState(false)
  const { data } = useTasks()
  const activeCount = data?.filter(isActive).length ?? 0
  const failedCount = data?.filter((t) => t.State === TaskState.Failed).length ?? 0

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 font-mono uppercase text-[10.5px] tracking-[0.16em] text-paper-muted hover:text-amber transition-colors"
          aria-label={`Tasks (${activeCount} active)`}
        >
          {activeCount > 0 ? (
            <StatusDot tone="amber" pulse />
          ) : failedCount > 0 ? (
            <StatusDot tone="err" />
          ) : (
            <StatusDot tone="neutral" />
          )}
          tasks
          {activeCount > 0 && (
            <span className="text-amber">· {activeCount} running</span>
          )}
        </button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] animate-fade-in" />
        <DialogPrimitive.Content className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-ink-elev border-l border-rule-strong shadow-2xl shadow-black/60 flex flex-col focus:outline-none animate-fade-in">
          <DrawerInside onClose={() => setOpen(false)} />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

function DrawerInside({ onClose }: { onClose: () => void }) {
  const { data, isLoading, error, refetch } = useTasks()
  const qc = useQueryClient()
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

  const sorted = data ? [...data].sort((a, b) => b.ID - a.ID) : []
  const hasDone = sorted.some(
    (t) => t.State === TaskState.Succeeded || t.State === TaskState.Failed,
  )

  return (
    <>
      <header className="flex items-center justify-between px-6 py-5 border-b border-rule">
        <div>
          <DialogPrimitive.Title asChild>
            <h2 className="font-display text-[22px] tracking-tight leading-none">
              Tasks
            </h2>
          </DialogPrimitive.Title>
          <DialogPrimitive.Description asChild>
            <p className="kicker mt-1.5">
              {sorted.filter(isActive).length} active · {sorted.length} total
            </p>
          </DialogPrimitive.Description>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="font-mono uppercase text-[10.5px] tracking-[0.16em] text-paper-subtle hover:text-paper transition-colors"
          >
            refresh
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-paper-subtle hover:text-paper p-1"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {error ? (
          <div className="p-6 text-err font-mono text-[12px]">
            {error instanceof Error ? error.message : String(error)}
          </div>
        ) : isLoading ? (
          <div className="p-6 text-paper-subtle text-[12px]">loading…</div>
        ) : sorted.length === 0 ? (
          <div className="py-16 text-center text-paper-muted italic font-display">
            No tasks queued.
          </div>
        ) : (
          <ul className="divide-y divide-rule">
            {sorted.map((t) => (
              <TaskRow key={t.ID} task={t} />
            ))}
          </ul>
        )}
      </div>

      <footer className="border-t border-rule px-6 py-4 flex items-center justify-between">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-paper-subtle">
          {hasDone ? 'some tasks are complete' : 'no completed tasks'}
        </span>
        <button
          type="button"
          disabled={!hasDone || clear.isPending}
          onClick={() => clear.mutate()}
          className={cn(
            'h-8 px-3 font-mono uppercase tracking-[0.16em] text-[11px] border transition-colors',
            hasDone && !clear.isPending
              ? 'border-rule-strong text-paper hover:border-amber hover:text-amber'
              : 'border-rule text-paper-subtle cursor-not-allowed',
          )}
        >
          {clear.isPending ? '…' : 'clear done'}
        </button>
      </footer>
    </>
  )
}

function TaskRow({ task }: { task: Task }) {
  const [expanded, setExpanded] = useState(isActive(task))
  const out = useTaskOutput(expanded ? task.ID : undefined, isActive(task))

  return (
    <li>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left px-6 py-4 hover:bg-ink-elev-2 transition-colors flex items-baseline gap-3"
      >
        <ChevronRight
          className={cn(
            'h-3.5 w-3.5 mt-1 shrink-0 text-paper-subtle transition-transform',
            expanded && 'rotate-90',
          )}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-mono text-[12px] text-paper-subtle shrink-0">
              #{task.ID}
            </span>
            <Badge tone={stateTone(task.State)} className="shrink-0">
              {stateLabel(task.State)}
            </Badge>
          </div>
          <div className="mt-1 text-[13px] text-paper truncate">
            {task.Name ?? 'unnamed task'}
          </div>
          {task.AddedAt && (
            <div className="mt-0.5 font-mono text-[10.5px] text-paper-subtle uppercase tracking-[0.14em]">
              added {fmtRelative(task.AddedAt)}
            </div>
          )}
        </div>
      </button>
      {expanded && (
        <div className="px-6 pb-4 -mt-2">
          <pre className="bg-ink p-3 font-mono text-[11px] text-paper-muted whitespace-pre-wrap break-words max-h-64 overflow-y-auto border border-rule">
            {out.isLoading
              ? 'fetching output…'
              : out.error
                ? out.error instanceof Error
                  ? out.error.message
                  : String(out.error)
                : (out.data || '(no output yet)')}
          </pre>
        </div>
      )}
    </li>
  )
}
