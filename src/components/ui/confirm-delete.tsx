import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog'
import { Input } from './input'
import { cn } from '@/lib/utils'

/**
 * Type-to-confirm destructive action. The delete button is disabled until the
 * user types `confirmText` exactly. Use `mutationLoading` to show a spinner
 * while the mutation is in flight.
 */
export function ConfirmDelete({
  open,
  onOpenChange,
  kicker,
  title,
  description,
  confirmText,
  confirmLabel = 'Delete',
  onConfirm,
  mutationLoading,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  kicker?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  /** The exact string the user must type to enable the confirm button. */
  confirmText: string
  confirmLabel?: string
  onConfirm: () => void
  mutationLoading?: boolean
}) {
  const [typed, setTyped] = useState('')
  const match = typed.trim() === confirmText

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setTyped('')
        onOpenChange(v)
      }}
    >
      <DialogContent>
        <DialogHeader kicker={kicker ?? 'Confirm deletion'}>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-2">
          <label className="kicker block">
            Type{' '}
            <span className="font-mono normal-case text-paper">
              {confirmText}
            </span>{' '}
            to confirm
          </label>
          <Input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={confirmText}
            autoFocus
          />
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-9 px-3.5 font-mono uppercase tracking-[0.16em] text-[11px] text-paper-muted hover:text-paper transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!match || mutationLoading}
            onClick={onConfirm}
            className={cn(
              'h-9 px-4 border font-mono uppercase tracking-[0.16em] text-[11px] transition-colors',
              match && !mutationLoading
                ? 'border-err/70 text-err hover:bg-err/10'
                : 'border-rule text-paper-subtle cursor-not-allowed',
            )}
          >
            {mutationLoading ? '…' : confirmLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
