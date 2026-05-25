import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useUpdateMirror } from '@/lib/mutations'
import { useCanWrite } from '@/lib/queries'

export function UpdateMirrorAction({ mirrorName }: { mirrorName: string }) {
  const canWrite = useCanWrite()
  const [open, setOpen] = useState(false)
  const [ignoreSigs, setIgnoreSigs] = useState(false)
  const [skipExisting, setSkipExisting] = useState(true)
  const mut = useUpdateMirror()
  if (!canWrite) return null

  function submit() {
    mut.mutate(
      {
        name: mirrorName,
        opts: {
          IgnoreSignatures: ignoreSigs,
          SkipExistingPackages: skipExisting,
        },
      },
      { onSuccess: () => setOpen(false) },
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Update from upstream</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader kicker="Mirror update">
          <DialogTitle>Update “{mirrorName}”</DialogTitle>
          <DialogDescription>
            Aptly will fetch the latest indices from the upstream archive and
            download new packages. This runs asynchronously — watch progress in
            the tasks drawer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <label className="flex items-baseline gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={skipExisting}
              onChange={(e) => setSkipExisting(e.target.checked)}
              className="accent-amber"
            />
            <span className="text-[13px]">
              Skip already-downloaded packages
              <span className="block kicker mt-0.5">faster reruns</span>
            </span>
          </label>
          <label className="flex items-baseline gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={ignoreSigs}
              onChange={(e) => setIgnoreSigs(e.target.checked)}
              className="accent-amber"
            />
            <span className="text-[13px]">
              Ignore signatures
              <span className="block kicker mt-0.5">
                only when upstream is unsigned
              </span>
            </span>
          </label>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={mut.isPending}>
            {mut.isPending ? 'submitting…' : 'Start update'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
