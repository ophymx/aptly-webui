/**
 * Thin client for aptly's REST API. The SPA expects requests to /api to be
 * reverse-proxied to the aptly daemon (see README for nginx example).
 */

const BASE = '/api'

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
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: 'application/json' },
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
