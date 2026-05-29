import { Outlet } from 'react-router-dom'
import { Toaster } from 'sonner'
import { TopNav } from './TopNav'
import { TaskWatcher } from '@/components/tasks/TaskWatcher'

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
      <TaskWatcher />
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'hsl(28 10% 9%)',
            border: '1px solid hsl(30 8% 24%)',
            color: 'hsl(36 30% 90%)',
            borderRadius: 0,
            fontFamily:
              '"IBM Plex Sans", ui-sans-serif, system-ui, sans-serif',
          },
        }}
      />
    </div>
  )
}

function Footer() {
  return (
    <footer className="border-t border-rule mt-16">
      <div className="mx-auto max-w-[1240px] px-8 py-6 flex flex-wrap items-center justify-between gap-3 text-paper-subtle">
        <div className="font-mono text-[11px] uppercase tracking-[0.16em]">
          third-party client · aptly rest api
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
