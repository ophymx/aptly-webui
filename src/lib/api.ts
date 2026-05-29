/**
 * Thin client for aptly's REST API. The base URL is derived at runtime
 * from the bundle's own asset URL (see `./base.ts`) so the SPA works at
 * any mount point. The proxy hop to the aptly daemon lives in nginx
 * (see README example).
 */

import { API_BASE as BASE } from './base'

export class ApiError extends Error {
  status: number
  body?: unknown
  constructor(message: string, status: number, body?: unknown) {
    super(message)
    this.status = status
    this.body = body
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  // Auto-attach JSON content-type when sending a string body (not multipart).
  if (init?.body && typeof init.body === 'string') {
    headers['Content-Type'] = 'application/json'
  }
  const res = await fetch(`${BASE}${path}`, {
    headers: { ...headers, ...(init?.headers as Record<string, string>) },
    ...init,
  })
  const text = await res.text()
  let body: unknown
  try {
    body = text ? JSON.parse(text) : undefined
  } catch {
    body = text
  }
  if (!res.ok) {
    const msg =
      (typeof body === 'object' && body && 'error' in body && String((body as { error: unknown }).error)) ||
      (typeof body === 'string' && body) ||
      res.statusText ||
      `HTTP ${res.status}`
    throw new ApiError(msg, res.status, body)
  }
  return body as T
}

function qs(params: Record<string, string | number | boolean | undefined>): string {
  const parts: string[] = []
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === false) continue
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
  }
  return parts.length ? `?${parts.join('&')}` : ''
}

// Aptly's publish URL convention: "{storage}:{prefix}" where slashes
// in nested prefixes are encoded as "_" and the root prefix is "." —
// rendered as ":." for the root so RFC 3986 path resolution doesn't
// normalize the bare "." segment away on the wire. The "{storage}:"
// piece is omitted when storage is empty (the aptly default), but
// then ":" still has to be present for the root prefix.
function encodePublishPrefix(prefix: string, storage = ''): string {
  const normPrefix = !prefix || prefix === '.' ? '.' : prefix.replace(/\//g, '_')
  const param =
    storage || normPrefix === '.' ? `${storage}:${normPrefix}` : normPrefix
  return encodeURIComponent(param)
}

// ---------- Resource types ----------
// Aptly's response shapes are documented but somewhat loose. Fields are kept
// optional where the docs don't guarantee them, so the UI degrades gracefully.

export interface VersionInfo {
  Version?: string
}

export interface Repo {
  Name: string
  Comment?: string
  DefaultDistribution?: string
  DefaultComponent?: string
}

export interface Mirror {
  Name: string
  UUID?: string
  ArchiveRoot?: string
  ArchiveURL?: string
  Distribution?: string
  Components?: string[]
  Architectures?: string[]
  Meta?: Record<string, string>
  LastDownloadDate?: string
  Filter?: string
  Status?: number
  WorkerPID?: number
  FilterWithDeps?: boolean
  DownloadSources?: boolean
  DownloadUdebs?: boolean
  DownloadInstaller?: boolean
}

export interface Snapshot {
  Name: string
  Description?: string
  CreatedAt?: string
  Origin?: string
  NumPackages?: number
}

export interface PublishSource {
  Name: string
  Component?: string
}

export interface Publish {
  Storage?: string
  Prefix?: string
  Distribution?: string
  SourceKind?: 'local' | 'snapshot' | string
  Sources?: PublishSource[]
  Architectures?: string[]
  Label?: string
  Origin?: string
  NotAutomatic?: string
  ButAutomaticUpgrades?: string
  AcquireByHash?: boolean
  MultiDist?: boolean
  Path?: string
}

export interface PackageRef {
  // Aptly returns package keys as strings in some endpoints and as objects in others.
  Key: string
}

export interface PackageDetail {
  Key?: string
  Package?: string
  Version?: string
  Architecture?: string
  Section?: string
  Priority?: string
  Maintainer?: string
  Homepage?: string
  Description?: string
  Filename?: string
  MD5sum?: string
  SHA1?: string
  SHA256?: string
  Size?: string
  InstalledSize?: string
  Depends?: string
  Recommends?: string
  Suggests?: string
  Conflicts?: string
  Provides?: string
  Replaces?: string
  Source?: string
  [k: string]: unknown
}

export interface Whoami {
  user?: string
  /**
   * Stable role the proxy maps from IdP groups. The UI treats anything other
   * than `"writer"` as read-only. When `role` is absent entirely (i.e. the
   * deploy hasn't wired role mapping yet) the UI defaults to writer.
   */
  role?: 'reader' | 'writer' | string
  /**
   * Optional URL the proxy wants the SPA to navigate to for sign-out (e.g.
   * `/oauth2/sign_out?rd=/` for oauth2-proxy, `/api/logout` for Authelia).
   * The SPA renders a sign-out link when present and hides it when absent,
   * so this is auth-provider-agnostic — the proxy owns the URL shape.
   */
  signout_url?: string
}

// Aptly task states: 0=INIT, 1=RUNNING, 2=SUCCEEDED, 3=FAILED.
export enum TaskState {
  Init = 0,
  Running = 1,
  Succeeded = 2,
  Failed = 3,
}

export interface Task {
  ID: number
  Name?: string
  State: TaskState
  ProcessID?: number
  // Aptly may include these on detail responses.
  AddedAt?: string
  StartedAt?: string
  FinishedAt?: string
}

// ---------- Write request bodies ----------

export interface SnapshotCreateBody {
  Name: string
  Description?: string
}

export interface PublishSourceInput {
  Name: string
  Component?: string
}

export interface PublishCreateBody {
  SourceKind: 'local' | 'snapshot'
  Sources: PublishSourceInput[]
  Distribution?: string
  Label?: string
  Origin?: string
  Architectures?: string[]
  ForceOverwrite?: boolean
  Signing?: SigningOptions
  AcquireByHash?: boolean
  NotAutomatic?: string
  ButAutomaticUpgrades?: string
  MultiDist?: boolean
}

export interface PublishUpdateBody {
  Snapshots?: PublishSourceInput[]
  ForceOverwrite?: boolean
  Signing?: SigningOptions
  AcquireByHash?: boolean
  MultiDist?: boolean
}

export interface SigningOptions {
  Skip?: boolean
  Batch?: boolean
  GpgKey?: string
  Keyring?: string
  SecretKeyring?: string
  Passphrase?: string
  PassphraseFile?: string
}

// ---------- Endpoints ----------

export const api = {
  version: () => request<VersionInfo>('/version'),
  whoami: () => request<Whoami>('/whoami'),

  repos: () => request<Repo[]>('/repos'),
  repo: (name: string) => request<Repo>(`/repos/${encodeURIComponent(name)}`),
  repoPackages: (name: string, q?: string) =>
    request<string[]>(
      `/repos/${encodeURIComponent(name)}/packages${q ? `?q=${encodeURIComponent(q)}` : ''}`,
    ),

  mirrors: () => request<Mirror[]>('/mirrors'),
  mirror: (name: string) => request<Mirror>(`/mirrors/${encodeURIComponent(name)}`),
  mirrorPackages: (name: string, q?: string) =>
    request<string[]>(
      `/mirrors/${encodeURIComponent(name)}/packages${q ? `?q=${encodeURIComponent(q)}` : ''}`,
    ),

  snapshots: () => request<Snapshot[]>('/snapshots'),
  snapshot: (name: string) => request<Snapshot>(`/snapshots/${encodeURIComponent(name)}`),
  snapshotPackages: (name: string, q?: string) =>
    request<string[]>(
      `/snapshots/${encodeURIComponent(name)}/packages${q ? `?q=${encodeURIComponent(q)}` : ''}`,
    ),

  publishList: () => request<Publish[]>('/publish'),

  packageSearch: (q: string) =>
    request<string[]>(`/packages?q=${encodeURIComponent(q)}`),
  packageByKey: (key: string) =>
    request<PackageDetail>(`/packages/${encodeURIComponent(key)}`),

  // ---------- Tasks ----------
  tasks: () => request<Task[]>('/tasks'),
  task: (id: number) => request<Task>(`/tasks/${id}`),
  taskOutput: (id: number) => request<string>(`/tasks/${id}/output`),
  tasksClear: () => request<unknown>('/tasks-clear', { method: 'POST' }),
  taskDelete: (id: number) =>
    request<unknown>(`/tasks/${id}`, { method: 'DELETE' }),

  // ---------- Mutations (release workflow) ----------
  // All mutations use _async=true and return a Task immediately.

  mirrorUpdate: (
    name: string,
    opts: { IgnoreSignatures?: boolean; SkipExistingPackages?: boolean } = {},
  ) =>
    request<Task>(
      `/mirrors/${encodeURIComponent(name)}${qs({ _async: true })}`,
      { method: 'PUT', body: JSON.stringify(opts) },
    ),

  snapshotCreateFromMirror: (mirrorName: string, body: SnapshotCreateBody) =>
    request<Task>(
      `/mirrors/${encodeURIComponent(mirrorName)}/snapshots${qs({ _async: true })}`,
      { method: 'POST', body: JSON.stringify(body) },
    ),

  snapshotCreateFromRepo: (repoName: string, body: SnapshotCreateBody) =>
    request<Task>(
      `/repos/${encodeURIComponent(repoName)}/snapshots${qs({ _async: true })}`,
      { method: 'POST', body: JSON.stringify(body) },
    ),

  snapshotDelete: (name: string, force = false) =>
    request<Task>(
      `/snapshots/${encodeURIComponent(name)}${qs({ _async: true, force })}`,
      { method: 'DELETE' },
    ),

  publishCreate: (
    prefix: string,
    body: PublishCreateBody,
    storage = '',
  ) =>
    request<Task>(
      `/publish/${encodePublishPrefix(prefix, storage)}${qs({ _async: true })}`,
      { method: 'POST', body: JSON.stringify(body) },
    ),

  publishUpdate: (
    prefix: string,
    distribution: string,
    body: PublishUpdateBody,
    storage = '',
  ) =>
    request<Task>(
      `/publish/${encodePublishPrefix(prefix, storage)}/${encodeURIComponent(
        distribution,
      )}${qs({ _async: true })}`,
      { method: 'PUT', body: JSON.stringify(body) },
    ),

  publishDrop: (
    prefix: string,
    distribution: string,
    force = false,
    storage = '',
  ) =>
    request<Task>(
      `/publish/${encodePublishPrefix(prefix, storage)}/${encodeURIComponent(
        distribution,
      )}${qs({ _async: true, force })}`,
      { method: 'DELETE' },
    ),

  // Upload .deb files to a staging directory. Multipart, no JSON.
  filesUpload: async (dir: string, files: File[]) => {
    const fd = new FormData()
    for (const f of files) fd.append('file', f, f.name)
    return request<string[]>(
      `/files/${encodeURIComponent(dir)}`,
      { method: 'POST', body: fd },
    )
  },

  // Move uploaded files from a staging dir into a local repo.
  repoAddFromFiles: (
    repo: string,
    dir: string,
    opts: { noRemove?: boolean; forceReplace?: boolean } = {},
  ) =>
    request<Task>(
      `/repos/${encodeURIComponent(repo)}/file/${encodeURIComponent(dir)}${qs({
        _async: true,
        noRemove: opts.noRemove,
        forceReplace: opts.forceReplace,
      })}`,
      { method: 'POST' },
    ),

  filesListDirs: () => request<string[]>('/files'),
  filesDeleteDir: (dir: string) =>
    request<unknown>(`/files/${encodeURIComponent(dir)}`, { method: 'DELETE' }),
}

/**
 * Aptly returns package keys as flat strings like:
 *   "Pi386 mypackage 1.2.3 abc123def456"
 * (architecture-prefix, name, version, hash). Parse defensively.
 */
export function parsePackageKey(key: string): {
  arch: string
  name: string
  version: string
  hash: string
  raw: string
} {
  const parts = key.trim().split(/\s+/)
  const [archRaw, name, version, hash] = parts
  const arch = archRaw?.startsWith('P') ? archRaw.slice(1) : (archRaw ?? '')
  return {
    arch,
    name: name ?? '',
    version: version ?? '',
    hash: hash ?? '',
    raw: key,
  }
}
