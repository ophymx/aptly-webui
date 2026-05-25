import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import {
  useCreateSnapshotFromMirror,
  useCreateSnapshotFromRepo,
} from '@/lib/mutations'

export function CreateSnapshotAction({
  source,
  sourceName,
  defaultPrefix,
}: {
  source: 'mirror' | 'repo'
  sourceName: string
  defaultPrefix?: string
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const fromMirror = useCreateSnapshotFromMirror()
  const fromRepo = useCreateSnapshotFromRepo()
  const mut = source === 'mirror' ? fromMirror : fromRepo
  const navigate = useNavigate()

  function defaultName() {
    const d = new Date().toISOString().slice(0, 10)
    return `${defaultPrefix ?? sourceName}-${d}`
  }

  function submit() {
    const body = { Name: name || defaultName(), Description: description }
    const args =
      source === 'mirror'
        ? { mirror: sourceName, body }
        : { repo: sourceName, body }
    mut.mutate(args as never, {
      onSuccess: () => {
        setOpen(false)
        setName('')
        setDescription('')
        // After a moment the snapshot will appear; nudge user toward it.
        setTimeout(
          () => navigate(`/snapshots/${encodeURIComponent(body.Name)}`),
          400,
        )
      },
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (v && !name) setName(defaultName())
      }}
    >
      <DialogTrigger asChild>
        <Button>Create snapshot</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader kicker={`Snapshot · from ${source}`}>
          <DialogTitle>Snapshot of “{sourceName}”</DialogTitle>
          <DialogDescription>
            Capture the current state of this {source} as a named, immutable
            snapshot. You can then publish or filter it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="kicker block mb-2">Snapshot name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={defaultName()}
              autoFocus
            />
          </div>
          <div>
            <label className="kicker block mb-2">Description (optional)</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. weekly cut for release X"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={mut.isPending}>
            {mut.isPending ? 'submitting…' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
