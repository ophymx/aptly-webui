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
import { useCanWrite, useRepo } from '@/lib/queries'

export function PublishAction({
  sourceKind,
  sourceName,
}: {
  sourceKind: 'snapshot' | 'local'
  sourceName: string
}) {
  const canWrite = useCanWrite()
  const [open, setOpen] = useState(false)
  const [prefix, setPrefix] = useState('.')
  const [distribution, setDistribution] = useState('')
  const [component, setComponent] = useState('')
  const [architectures, setArchitectures] = useState('')
  const [skipSigning, setSkipSigning] = useState(true)
  const [gpgKey, setGpgKey] = useState('')
  const mut = useCreatePublish()
  // Pulls from the query cache when RepoDetail already loaded it.
  const repo = useRepo(sourceKind === 'local' ? sourceName : undefined)
  if (!canWrite) return null

  const sourceLabel = sourceKind === 'snapshot' ? 'snapshot' : 'repository'
  const defaultDistribution = repo.data?.DefaultDistribution || ''
  const defaultComponent = repo.data?.DefaultComponent || 'main'

  function submit() {
    const archList = architectures
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    mut.mutate(
      {
        prefix: prefix || '.',
        body: {
          SourceKind: sourceKind,
          Sources: [
            { Name: sourceName, Component: component || defaultComponent },
          ],
          Distribution: distribution || defaultDistribution || undefined,
          Architectures: archList.length ? archList : undefined,
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
          <DialogTitle>Publish “{sourceName}”</DialogTitle>
          <DialogDescription>
            Create a new published distribution backed by this {sourceLabel}.
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
              placeholder={
                defaultDistribution || `required (e.g. stable, jammy)`
              }
            />
          </div>
          <div>
            <label className="kicker block mb-2">Component</label>
            <Input
              value={component}
              onChange={(e) => setComponent(e.target.value)}
              placeholder={defaultComponent}
            />
          </div>
          <div className="col-span-2">
            <label className="kicker block mb-2">Architectures</label>
            <Input
              value={architectures}
              onChange={(e) => setArchitectures(e.target.value)}
              placeholder="amd64, arm64, all"
            />
            <p className="kicker mt-2">
              {sourceKind === 'local'
                ? 'comma-separated; required for local repos'
                : 'comma-separated; aptly infers from the snapshot if blank'}
            </p>
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
