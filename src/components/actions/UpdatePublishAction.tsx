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
import { useCanWrite, useSnapshots } from '@/lib/queries'
import { useUpdatePublish } from '@/lib/mutations'
import type { Publish, PublishSourceInput } from '@/lib/api'

export function UpdatePublishAction({ publish }: { publish: Publish }) {
  const canWrite = useCanWrite()
  const snapshots = useSnapshots()
  const mut = useUpdatePublish()
  const isLocal = publish.SourceKind === 'local'

  const initial: PublishSourceInput[] =
    publish.Sources?.map((s) => ({
      Name: s.Name,
      Component: s.Component ?? 'main',
    })) ?? []
  const [open, setOpen] = useState(false)
  const [selections, setSelections] = useState<PublishSourceInput[]>(initial)
  const [skipSigning, setSkipSigning] = useState(true)
  if (!canWrite) return null

  function submit() {
    mut.mutate(
      {
        prefix: publish.Prefix ?? '.',
        distribution: publish.Distribution ?? '',
        storage: publish.Storage,
        body: {
          // Local-repo publishes re-render against the repo's current
          // state; the API rejects a Snapshots field for them.
          ...(isLocal ? {} : { Snapshots: selections }),
          Signing: skipSigning ? { Skip: true } : undefined,
        },
      },
      { onSuccess: () => setOpen(false) },
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">{isLocal ? 'Update' : 'Switch sources'}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader kicker="Publish · update">
          <DialogTitle>
            {isLocal
              ? `Update ${publish.Distribution}`
              : `Switch sources for ${publish.Distribution}`}
          </DialogTitle>
          <DialogDescription>
            {isLocal
              ? 'Re-render the published indexes against the current contents of the backing local repositories. Run this after adding or removing packages.'
              : 'Replace the snapshot backing each component of this published distribution. The published Release file is regenerated atomically.'}
          </DialogDescription>
        </DialogHeader>

        {!isLocal && (
          <div className="space-y-3">
            {selections.map((sel, i) => (
              <div
                key={`${sel.Component}-${i}`}
                className="grid grid-cols-[1fr_2fr] gap-3 items-baseline"
              >
                <span className="kicker">{sel.Component || 'main'}</span>
                <select
                  value={sel.Name}
                  onChange={(e) =>
                    setSelections((cur) =>
                      cur.map((s, idx) =>
                        idx === i ? { ...s, Name: e.target.value } : s,
                      ),
                    )
                  }
                  className="h-9 bg-transparent border-b border-rule-strong font-mono text-[13px] text-paper focus:outline-none focus:border-amber"
                >
                  {snapshots.data?.map((s) => (
                    <option key={s.Name} value={s.Name} className="bg-ink-elev">
                      {s.Name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}

        <label className="flex items-baseline gap-3 cursor-pointer border-t border-rule pt-4">
          <input
            type="checkbox"
            checked={skipSigning}
            onChange={(e) => setSkipSigning(e.target.checked)}
            className="accent-amber"
          />
          <span className="text-[13px]">Skip GPG signing</span>
        </label>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={mut.isPending}>
            {mut.isPending
              ? 'submitting…'
              : isLocal
                ? 'Update'
                : 'Switch'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
