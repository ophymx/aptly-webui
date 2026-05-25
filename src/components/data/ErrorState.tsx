import { ApiError } from '@/lib/api'

export function ErrorState({ error }: { error: unknown }) {
  const status = error instanceof ApiError ? error.status : undefined
  const msg = error instanceof Error ? error.message : String(error)
  return (
    <div className="border border-err/40 bg-err/5 p-5">
      <div className="kicker text-err">
        Error{status ? ` · ${status}` : ''}
      </div>
      <div className="mt-2 font-mono text-[13px] text-paper">{msg}</div>
      <div className="mt-3 font-mono text-[11px] text-paper-subtle">
        Check that the aptly daemon is reachable through /api on this origin.
      </div>
    </div>
  )
}
