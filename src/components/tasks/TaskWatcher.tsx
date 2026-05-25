import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTasks } from '@/lib/tasks'
import { TaskState } from '@/lib/api'
import { toast } from 'sonner'

/**
 * Mount once near the app root. Watches the tasks list for transitions from
 * active → done, then invalidates the resource queries so the UI refreshes,
 * and emits a toast for the completion.
 */
export function TaskWatcher() {
  const { data } = useTasks()
  const qc = useQueryClient()
  const prev = useRef<Map<number, TaskState>>(new Map())

  useEffect(() => {
    if (!data) return
    const current = new Map(data.map((t) => [t.ID, t.State]))

    for (const t of data) {
      const before = prev.current.get(t.ID)
      const wasActive =
        before === TaskState.Init || before === TaskState.Running
      const isDone =
        t.State === TaskState.Succeeded || t.State === TaskState.Failed
      if (wasActive && isDone) {
        if (t.State === TaskState.Succeeded) {
          toast.success(`Task #${t.ID} succeeded`, {
            description: t.Name,
          })
        } else {
          toast.error(`Task #${t.ID} failed`, {
            description: t.Name,
          })
        }
        // Broad invalidation — cheap on a small aptly instance.
        qc.invalidateQueries({ queryKey: ['repos'] })
        qc.invalidateQueries({ queryKey: ['mirrors'] })
        qc.invalidateQueries({ queryKey: ['snapshots'] })
        qc.invalidateQueries({ queryKey: ['publish'] })
        qc.invalidateQueries({ queryKey: ['version'] })
        // Detail pages
        qc.invalidateQueries({ queryKey: ['mirror'] })
        qc.invalidateQueries({ queryKey: ['snapshot'] })
        qc.invalidateQueries({ queryKey: ['repo'] })
        qc.invalidateQueries({ queryKey: ['mirror-packages'] })
        qc.invalidateQueries({ queryKey: ['snapshot-packages'] })
        qc.invalidateQueries({ queryKey: ['repo-packages'] })
      }
    }
    prev.current = current
  }, [data, qc])

  return null
}
