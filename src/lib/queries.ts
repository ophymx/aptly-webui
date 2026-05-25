import { useQuery } from '@tanstack/react-query'
import { api } from './api'

const stale = { stale: 30_000, long: 5 * 60_000 }

export function useVersion() {
  return useQuery({
    queryKey: ['version'],
    queryFn: api.version,
    staleTime: stale.long,
  })
}

export function useWhoami() {
  return useQuery({
    queryKey: ['whoami'],
    queryFn: api.whoami,
    staleTime: stale.long,
    retry: false,
  })
}

/**
 * Returns true when the current user may perform mutations. Backed by the
 * proxy-provided `role` field on /api/whoami. Defaults to true when role is
 * absent so deployments without role mapping keep their write controls.
 *
 * Note: this gates UI visibility only. The actual write permission is
 * enforced by the reverse proxy (see README for the nginx config).
 */
export function useCanWrite(): boolean {
  const { data } = useWhoami()
  if (data?.role === undefined) return true
  return data.role === 'writer'
}

export function useRepos() {
  return useQuery({
    queryKey: ['repos'],
    queryFn: api.repos,
    staleTime: stale.stale,
  })
}

export function useRepo(name: string | undefined) {
  return useQuery({
    enabled: !!name,
    queryKey: ['repo', name],
    queryFn: () => api.repo(name!),
    staleTime: stale.stale,
  })
}

export function useRepoPackages(name: string | undefined, q: string) {
  return useQuery({
    enabled: !!name,
    queryKey: ['repo-packages', name, q],
    queryFn: () => api.repoPackages(name!, q || undefined),
    staleTime: stale.stale,
  })
}

export function useMirrors() {
  return useQuery({
    queryKey: ['mirrors'],
    queryFn: api.mirrors,
    staleTime: stale.stale,
  })
}

export function useMirror(name: string | undefined) {
  return useQuery({
    enabled: !!name,
    queryKey: ['mirror', name],
    queryFn: () => api.mirror(name!),
    staleTime: stale.stale,
  })
}

export function useMirrorPackages(name: string | undefined, q: string) {
  return useQuery({
    enabled: !!name,
    queryKey: ['mirror-packages', name, q],
    queryFn: () => api.mirrorPackages(name!, q || undefined),
    staleTime: stale.stale,
  })
}

export function useSnapshots() {
  return useQuery({
    queryKey: ['snapshots'],
    queryFn: api.snapshots,
    staleTime: stale.stale,
  })
}

export function useSnapshot(name: string | undefined) {
  return useQuery({
    enabled: !!name,
    queryKey: ['snapshot', name],
    queryFn: () => api.snapshot(name!),
    staleTime: stale.stale,
  })
}

export function useSnapshotPackages(name: string | undefined, q: string) {
  return useQuery({
    enabled: !!name,
    queryKey: ['snapshot-packages', name, q],
    queryFn: () => api.snapshotPackages(name!, q || undefined),
    staleTime: stale.stale,
  })
}

export function usePublishList() {
  return useQuery({
    queryKey: ['publish'],
    queryFn: api.publishList,
    staleTime: stale.stale,
  })
}

export function usePackageSearch(q: string) {
  return useQuery({
    enabled: q.trim().length > 0,
    queryKey: ['package-search', q],
    queryFn: () => api.packageSearch(q),
    staleTime: stale.stale,
  })
}

export function usePackage(key: string | undefined) {
  return useQuery({
    enabled: !!key,
    queryKey: ['package', key],
    queryFn: () => api.packageByKey(key!),
    staleTime: stale.long,
  })
}
