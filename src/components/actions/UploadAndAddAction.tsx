import { useState, useRef } from 'react'
import { Upload } from 'lucide-react'
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
import { useUploadAndAddToRepo } from '@/lib/mutations'
import { Mono } from '@/components/data/Mono'
import { cn } from '@/lib/utils'

export function UploadAndAddAction({ repoName }: { repoName: string }) {
  const [open, setOpen] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [dragging, setDragging] = useState(false)
  const [forceReplace, setForceReplace] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const mut = useUploadAndAddToRepo()

  function setFromList(list: FileList | null) {
    if (!list) return
    const debs = Array.from(list).filter(
      (f) => f.name.endsWith('.deb') || f.name.endsWith('.udeb'),
    )
    setFiles(debs)
  }

  function submit() {
    if (!files.length) return
    mut.mutate(
      { repo: repoName, files, forceReplace },
      {
        onSuccess: () => {
          setOpen(false)
          setFiles([])
        },
      },
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setFiles([])
        setOpen(v)
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Upload className="h-3.5 w-3.5" /> Upload .debs
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader kicker={`Upload · ${repoName}`}>
          <DialogTitle>Add packages to “{repoName}”</DialogTitle>
          <DialogDescription>
            Upload one or more <Mono>.deb</Mono> files to a staging area, then
            atomically add them to this repository.
          </DialogDescription>
        </DialogHeader>

        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            setFromList(e.dataTransfer.files)
          }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'border border-dashed p-8 text-center cursor-pointer transition-colors',
            dragging
              ? 'border-amber bg-amber/5'
              : 'border-rule-strong hover:border-amber/60',
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".deb,.udeb"
            multiple
            onChange={(e) => setFromList(e.target.files)}
            className="hidden"
          />
          <div className="font-display text-[18px] text-paper-muted italic mb-1">
            {files.length === 0
              ? 'drop .deb files here'
              : `${files.length} file${files.length === 1 ? '' : 's'} ready`}
          </div>
          <div className="kicker">or click to browse</div>
        </div>

        {files.length > 0 && (
          <ul className="max-h-40 overflow-y-auto border border-rule divide-y divide-rule">
            {files.map((f) => (
              <li
                key={f.name}
                className="flex items-baseline justify-between px-3 py-2"
              >
                <Mono className="truncate">{f.name}</Mono>
                <Mono dim className="text-[10.5px] tracking-[0.1em] shrink-0">
                  {(f.size / 1024).toFixed(1)} kB
                </Mono>
              </li>
            ))}
          </ul>
        )}

        <label className="flex items-baseline gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={forceReplace}
            onChange={(e) => setForceReplace(e.target.checked)}
            className="accent-amber"
          />
          <span className="text-[13px]">
            Force-replace existing versions
            <span className="block kicker mt-0.5">
              overwrite if name/arch/version collides
            </span>
          </span>
        </label>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={!files.length || mut.isPending}
          >
            {mut.isPending ? 'uploading…' : 'Upload & add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
