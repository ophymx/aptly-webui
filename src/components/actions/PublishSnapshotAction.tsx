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
import { Input } from '@/components/ui/input'
import { useCreatePublish } from '@/lib/mutations'
import { useCanWrite } from '@/lib/queries'

export function PublishSnapshotAction({
  snapshotName,
}: {
  snapshotName: string
}) {
  const canWrite = useCanWrite()
  const [open, setOpen] = useState(false)
  const [prefix, setPrefix] = useState('.')
  const [distribution, setDistribution] = useState('')
  const [component, setComponent] = useState('main')
  const [skipSigning, setSkipSigning] = useState(true)
  const [gpgKey, setGpgKey] = useState('')
  const mut = useCreatePublish()
  if (!canWrite) return null

  function submit() {
    mut.mutate(
      {
        prefix: prefix || '.',
        body: {
          SourceKind: 'snapshot',
          Sources: [{ Name: snapshotName, Component: component || 'main' }],
          Distribution: distribution || undefined,
          Signing: skipSigning
            ? { Skip: true }
            : gpgKey
              ? { Batch: true, GpgKey: gpgKey }
              : undefined,
        },
      },
      { onSuccess: () => setOpen(false) },
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Publish…</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader kicker="Publish · new">
          <DialogTitle>Publish “{snapshotName}”</DialogTitle>
          <DialogDescription>
            Create a new published distribution backed by this snapshot.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="kicker block mb-2">Prefix</label>
            <Input
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="."
            />
          </div>
          <div>
            <label className="kicker block mb-2">Distribution</label>
            <Input
              value={distribution}
              onChange={(e) => setDistribution(e.target.value)}
              placeholder="auto (from snapshot)"
            />
          </div>
          <div className="col-span-2">
            <label className="kicker block mb-2">Component</label>
            <Input
              value={component}
              onChange={(e) => setComponent(e.target.value)}
              placeholder="main"
            />
          </div>
        </div>

        <div className="border-t border-rule pt-4 space-y-3">
          <label className="flex items-baseline gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={skipSigning}
              onChange={(e) => setSkipSigning(e.target.checked)}
              className="accent-amber"
            />
            <span className="text-[13px]">
              Skip GPG signing
              <span className="block kicker mt-0.5">
                clients will need [trusted=yes]
              </span>
            </span>
          </label>
          {!skipSigning && (
            <div>
              <label className="kicker block mb-2">GPG key id</label>
              <Input
                value={gpgKey}
                onChange={(e) => setGpgKey(e.target.value)}
                placeholder="0xABCDEF…"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={mut.isPending}>
            {mut.isPending ? 'submitting…' : 'Publish'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
