import { NavLink, Link } from 'react-router-dom'
import { useVersion, useWhoami } from '@/lib/queries'
import { cn } from '@/lib/utils'
import { StatusDot } from '@/components/data/StatusDot'

const sections = [
  { to: '/', label: 'Overview', end: true },
  { to: '/repos', label: 'Repositories' },
  { to: '/mirrors', label: 'Mirrors' },
  { to: '/snapshots', label: 'Snapshots' },
  { to: '/publish', label: 'Publications' },
  { to: '/packages', label: 'Packages' },
]

export function TopNav() {
  const version = useVersion()
  const whoami = useWhoami()

  return (
    <header className="border-b border-rule bg-ink/80 backdrop-blur-sm sticky top-0 z-30">
      <div className="mx-auto max-w-[1240px] px-8">
        {/* Brand row */}
        <div className="flex items-baseline justify-between py-5">
          <Link
            to="/"
            className="group flex items-baseline gap-3 hover:opacity-90 transition-opacity"
          >
            <span className="font-display text-[28px] tracking-[-0.02em] leading-none text-paper">
              aptly<span className="text-amber">.</span>
            </span>
            <span className="kicker">Library</span>
            {version.data?.Version && (
              <span className="font-mono text-[10.5px] text-paper-subtle tracking-[0.12em]">
                v{version.data.Version}
              </span>
            )}
          </Link>

          <div className="flex items-center gap-4">
            <ConnectionPill ok={!version.isError} />
            {whoami.data?.user && (
              <span className="font-mono text-[12px] text-paper-muted">
                {whoami.data.user}
              </span>
            )}
          </div>
        </div>

        {/* Section tabs */}
        <nav className="-mb-px flex items-center gap-7 overflow-x-auto">
          {sections.map((s) => (
            <NavLink
              key={s.to}
              to={s.to}
              end={s.end}
              className={({ isActive }) =>
                cn(
                  'relative py-3 font-mono uppercase tracking-[0.16em] text-[11px] transition-colors',
                  isActive
                    ? 'text-amber'
                    : 'text-paper-muted hover:text-paper',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {s.label}
                  <span
                    className={cn(
                      'absolute inset-x-0 -bottom-px h-px transition-colors',
                      isActive ? 'bg-amber' : 'bg-transparent',
                    )}
                  />
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}

function ConnectionPill({ ok }: { ok: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono uppercase text-[10px] tracking-[0.16em] text-paper-subtle">
      <StatusDot tone={ok ? 'ok' : 'err'} pulse={!ok} />
      {ok ? 'connected' : 'unreachable'}
    </span>
  )
}
