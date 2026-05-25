import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div className="py-24 text-center">
      <div className="kicker text-amber">404 · not in the catalog</div>
      <h1 className="mt-6 font-display text-[64px] leading-none tracking-[-0.02em] italic">
        Out of print.
      </h1>
      <p className="mt-4 text-paper-muted">
        The page you're looking for isn't filed under any drawer here.
      </p>
      <Link
        to="/"
        className="inline-block mt-8 font-mono uppercase text-[11px] tracking-[0.16em] text-amber hover:underline underline-offset-4"
      >
        ← return to the library
      </Link>
    </div>
  )
}
