import { Outlet } from 'react-router-dom'
import { TopNav } from './TopNav'

export function Shell() {
  return (
    <div className="min-h-full flex flex-col">
      <TopNav />
      <main className="flex-1">
        <div className="mx-auto max-w-[1240px] px-8 py-10">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  )
}

function Footer() {
  return (
    <footer className="border-t border-rule mt-16">
      <div className="mx-auto max-w-[1240px] px-8 py-6 flex flex-wrap items-center justify-between gap-3 text-paper-subtle">
        <div className="font-mono text-[11px] uppercase tracking-[0.16em]">
          read-only browser · aptly rest api
        </div>
        <div className="font-mono text-[11px] tracking-[0.08em]">
          <a
            href="https://www.aptly.info/doc/api/"
            target="_blank"
            rel="noreferrer"
            className="hover:text-paper-muted transition-colors"
          >
            aptly.info/doc/api ↗
          </a>
        </div>
      </div>
    </footer>
  )
}
