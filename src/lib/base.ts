/**
 * The SPA's mount point, derived at runtime from this module's own URL.
 *
 * In production, the build emits chunks at `<mount>/assets/<file>.js`,
 * and the browser sets `import.meta.url` to the absolute URL of the
 * executing module. Stripping the `/assets/...` suffix leaves the mount
 * point — no `<base href>`, no server-side HTML rewriting, no config
 * endpoint. Works at `/`, `/aptly/`, `/tools/aptly/`, etc.
 *
 * In dev, the Vite server doesn't serve from `/assets/`, so we just
 * assume root mount (the dev proxy at vite.config.ts handles `/api`).
 */
const mountPath = import.meta.env.DEV
  ? ''
  : new URL(import.meta.url).pathname.replace(/\/assets\/[^/]+$/, '')

/** React Router basename — `'/'` at root, `'/aptly'` etc. for subpath. */
export const BASENAME = mountPath || '/'

/** Absolute API base — `'/api'` at root, `'/aptly/api'` for subpath. */
export const API_BASE = `${mountPath}/api`
