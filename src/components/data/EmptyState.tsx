export function EmptyState({
  title,
  hint,
}: {
  title: string
  hint?: React.ReactNode
}) {
  return (
    <div className="py-16 text-center">
      <div className="font-display text-[20px] italic text-paper-muted">
        {title}
      </div>
      {hint && (
        <div className="mt-2 font-mono text-[12px] text-paper-subtle">
          {hint}
        </div>
      )}
    </div>
  )
}
