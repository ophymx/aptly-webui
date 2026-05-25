import { useState } from 'react'
import { ConfirmDelete } from '@/components/ui/confirm-delete'
import { Button } from '@/components/ui/button'
import { useDropPublish } from '@/lib/mutations'
import { useCanWrite } from '@/lib/queries'
import type { Publish } from '@/lib/api'

export function DropPublishAction({ publish }: { publish: Publish }) {
  const canWrite = useCanWrite()
  const [open, setOpen] = useState(false)
  const [force, setForce] = useState(false)
  const mut = useDropPublish()
  if (!canWrite) return null

  const label = `${publish.Prefix || '.'}/${publish.Distribution ?? ''}`

  function confirm() {
    mut.mutate(
      {
        prefix: publish.Prefix ?? '.',
        distribution: publish.Distribution ?? '',
        force,
      },
      { onSuccess: () => setOpen(false) },
    )
  }

  return (
    <>
      <Button
        size="sm"
        onClick={() => setOpen(true)}
        className="border-err/40 text-err hover:border-err"
      >
        Drop
      </Button>
      <ConfirmDelete
        open={open}
        onOpenChange={setOpen}
        kicker="Drop publication"
        title={
          <>
            Drop <span className="text-err">{label}</span>?
          </>
        }
        description={
          <span>
            APT clients will no longer be able to fetch this distribution.
            <label className="mt-3 flex items-baseline gap-3 cursor-pointer text-paper-muted">
              <input
                type="checkbox"
                checked={force}
                onChange={(e) => setForce(e.target.checked)}
                className="accent-amber"
              />
              <span className="text-[13px]">Force (skip safety checks)</span>
            </label>
          </span>
        }
        confirmText={publish.Distribution ?? ''}
        confirmLabel="Drop publication"
        mutationLoading={mut.isPending}
        onConfirm={confirm}
      />
    </>
  )
}
