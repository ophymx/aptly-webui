import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  api,
  type PublishCreateBody,
  type PublishUpdateBody,
  type SnapshotCreateBody,
  type Task,
} from './api'

function notify(action: string) {
  return {
    onSuccess: (task: Task) => {
      toast.success(`${action} submitted`, {
        description: `Task #${task.ID} · ${task.Name ?? ''}`,
      })
    },
    onError: (err: unknown) => {
      toast.error(`${action} failed`, {
        description: err instanceof Error ? err.message : String(err),
      })
    },
  }
}

export function useUpdateMirror() {
  const qc = useQueryClient()
  const handlers = notify('Mirror update')
  return useMutation({
    mutationFn: ({
      name,
      opts,
    }: {
      name: string
      opts?: Parameters<typeof api.mirrorUpdate>[1]
    }) => api.mirrorUpdate(name, opts ?? {}),
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      handlers.onSuccess(task)
    },
    onError: handlers.onError,
  })
}

export function useCreateSnapshotFromMirror() {
  const qc = useQueryClient()
  const handlers = notify('Snapshot create')
  return useMutation({
    mutationFn: ({
      mirror,
      body,
    }: {
      mirror: string
      body: SnapshotCreateBody
    }) => api.snapshotCreateFromMirror(mirror, body),
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      handlers.onSuccess(task)
    },
    onError: handlers.onError,
  })
}

export function useCreateSnapshotFromRepo() {
  const qc = useQueryClient()
  const handlers = notify('Snapshot create')
  return useMutation({
    mutationFn: ({
      repo,
      body,
    }: {
      repo: string
      body: SnapshotCreateBody
    }) => api.snapshotCreateFromRepo(repo, body),
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      handlers.onSuccess(task)
    },
    onError: handlers.onError,
  })
}

export function useDeleteSnapshot() {
  const qc = useQueryClient()
  const handlers = notify('Snapshot delete')
  return useMutation({
    mutationFn: ({ name, force }: { name: string; force?: boolean }) =>
      api.snapshotDelete(name, force),
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      handlers.onSuccess(task)
    },
    onError: handlers.onError,
  })
}

export function useCreatePublish() {
  const qc = useQueryClient()
  const handlers = notify('Publish create')
  return useMutation({
    mutationFn: ({
      prefix,
      body,
    }: {
      prefix: string
      body: PublishCreateBody
    }) => api.publishCreate(prefix, body),
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      handlers.onSuccess(task)
    },
    onError: handlers.onError,
  })
}

export function useUpdatePublish() {
  const qc = useQueryClient()
  const handlers = notify('Publish update')
  return useMutation({
    mutationFn: ({
      prefix,
      distribution,
      body,
      storage,
    }: {
      prefix: string
      distribution: string
      body: PublishUpdateBody
      storage?: string
    }) => api.publishUpdate(prefix, distribution, body, storage),
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      handlers.onSuccess(task)
    },
    onError: handlers.onError,
  })
}

export function useDropPublish() {
  const qc = useQueryClient()
  const handlers = notify('Publish drop')
  return useMutation({
    mutationFn: ({
      prefix,
      distribution,
      force,
      storage,
    }: {
      prefix: string
      distribution: string
      force?: boolean
      storage?: string
    }) => api.publishDrop(prefix, distribution, force, storage),
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      handlers.onSuccess(task)
    },
    onError: handlers.onError,
  })
}

/**
 * Two-step: upload files to a staging dir, then add them to a repo.
 * Returns the final task once the repo-add is submitted.
 */
export function useUploadAndAddToRepo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      repo,
      files,
      forceReplace,
    }: {
      repo: string
      files: File[]
      forceReplace?: boolean
    }) => {
      // Staging dir is unique to this submission. Aptly creates it lazily.
      const dir = `webui-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const uploaded = await api.filesUpload(dir, files)
      const task = await api.repoAddFromFiles(repo, dir, {
        forceReplace,
        noRemove: false, // let aptly remove staged files after import
      })
      return { task, dir, uploaded }
    },
    onSuccess: ({ task, uploaded }) => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Upload submitted', {
        description: `${uploaded.length} file(s) → Task #${task.ID}`,
      })
    },
    onError: (err) => {
      toast.error('Upload failed', {
        description: err instanceof Error ? err.message : String(err),
      })
    },
  })
}
