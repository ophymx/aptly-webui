import { Link, useParams } from 'react-router-dom'
import { useState } from 'react'
import { useSnapshot, useSnapshotPackages } from '@/lib/queries'
import { PageHeader } from '@/components/data/PageHeader'
import { KeyValueList } from '@/components/data/KeyValue'
import { ErrorState } from '@/components/data/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import { PackageList } from './_packages-shared'
import { fmtDate, fmtRelative } from '@/lib/format'
import { PublishAction } from '@/components/actions/PublishAction'
import { DeleteSnapshotAction } from '@/components/actions/DeleteSnapshotAction'

export function SnapshotDetail() {
  const { name } = useParams<{ name: string }>()
  const snap = useSnapshot(name)
  const [q, setQ] = useState('')
  const packages = useSnapshotPackages(name, q)

  if (snap.error) return <ErrorState error={snap.error} />

  const s = snap.data

  return (
    <>
      <PageHeader
        kicker={
          <>
            <Link to="/snapshots" className="hover:text-amber">
              snapshots
            </Link>
            {' / '}
            <span>point-in-time</span>
          </>
        }
        title={s?.Name ?? name ?? '—'}
        lede={s?.Description}
        actions={
          name && (
            <>
              <PublishAction sourceKind="snapshot" sourceName={name} />
              <DeleteSnapshotAction name={name} />
            </>
          )
        }
      />

      {snap.isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <section className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-12">
          <div>
            <div className="kicker mb-4">Captured</div>
            <KeyValueList
              items={[
                { key: 'name', value: s?.Name ?? '—' },
                {
                  key: 'created',
                  value: s?.CreatedAt ? (
                    <span>
                      {fmtDate(s.CreatedAt)}
                      <span className="text-paper-subtle ml-2">
                        ({fmtRelative(s.CreatedAt)})
                      </span>
                    </span>
                  ) : (
                    '—'
                  ),
                },
                { key: 'origin', value: s?.Origin || '—' },
                {
                  key: 'description',
                  value: s?.Description || (
                    <span className="text-paper-subtle italic">none</span>
                  ),
                },
              ]}
            />
          </div>

          <PackageList
            title="Packages in this snapshot"
            q={q}
            setQ={setQ}
            keys={packages.data}
            loading={packages.isLoading}
            error={packages.error}
          />
        </section>
      )}
    </>
  )
}
