import { useQuery } from '@tanstack/react-query'
import { api, TaskState, type Task } from './api'

export function isActive(t: Task): boolean {
  return t.State === TaskState.Init || t.State === TaskState.Running
}

export function stateLabel(state: TaskState): string {
  switch (state) {
    case TaskState.Init:
      return 'queued'
    case TaskState.Running:
      return 'running'
    case TaskState.Succeeded:
      return 'succeeded'
    case TaskState.Failed:
      return 'failed'
  }
}

export type Tone = 'ok' | 'warn' | 'err' | 'neutral' | 'amber'

export function stateTone(state: TaskState): Tone {
  switch (state) {
    case TaskState.Init:
      return 'neutral'
    case TaskState.Running:
      return 'amber'
    case TaskState.Succeeded:
      return 'ok'
    case TaskState.Failed:
      return 'err'
  }
}

export function useTasks() {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: api.tasks,
    refetchInterval: (query) => {
      const data = query.state.data as Task[] | undefined
      return data?.some(isActive) ? 1500 : false
    },
    refetchOnWindowFocus: true,
    staleTime: 0,
  })
}

export function useTaskOutput(id: number | undefined, active: boolean) {
  return useQuery({
    enabled: id !== undefined,
    queryKey: ['task-output', id],
    queryFn: () => api.taskOutput(id!),
    refetchInterval: active ? 1500 : false,
    staleTime: 0,
  })
}
