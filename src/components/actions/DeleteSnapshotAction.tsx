import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConfirmDelete } from '@/components/ui/confirm-delete'
import { Button } from '@/components/ui/button'
import { useDeleteSnapshot } from '@/lib/mutations'
import { useCanWrite } from '@/lib/queries'

export function DeleteSnapshotAction({
  name,
  redirectOnSuccess = true,
}: {
  name: string
  redirectOnSuccess?: boolean
}) {
  const canWrite = useCanWrite()
  const [open, setOpen] = useState(false)
  const [force, setForce] = useState(false)
  const mut = useDeleteSnapshot()
  const navigate = useNavigate()
  if (!canWrite) return null

  function confirm() {
    mut.mutate(
      { name, force },
      {
        onSuccess: () => {
          setOpen(false)
          if (redirectOnSuccess) navigate('/snapshots')
        },
      },
    )
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="border-err/40 text-err hover:border-err hover:text-err"
      >
        Delete
      </Button>

      <ConfirmDelete
        open={open}
        onOpenChange={setOpen}
        kicker="Delete snapshot"
        title={
          <>
            Delete <span className="text-err">{name}</span>?
          </>
        }
        description={
          <span>
            This deletes the snapshot but not the underlying packages. If it is
            currently published you must enable “force”.
            <label className="mt-3 flex items-baseline gap-3 cursor-pointer text-paper-muted">
              <input
                type="checkbox"
                checked={force}
                onChange={(e) => setForce(e.target.checked)}
                className="accent-amber"
              />
              <span className="text-[13px]">
                Force (drop even if published)
              </span>
            </label>
          </span>
        }
        confirmText={name}
        confirmLabel="Delete snapshot"
        mutationLoading={mut.isPending}
        onConfirm={confirm}
      />
    </>
  )
}
