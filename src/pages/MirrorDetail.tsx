import { Link, useParams } from 'react-router-dom'
import { useState } from 'react'
import { useMirror, useMirrorPackages } from '@/lib/queries'
import { PageHeader } from '@/components/data/PageHeader'
import { KeyValueList } from '@/components/data/KeyValue'
import { ErrorState } from '@/components/data/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { PackageList } from './_packages-shared'
import { fmtDate, fmtRelative } from '@/lib/format'

export function MirrorDetail() {
  const { name } = useParams<{ name: string }>()
  const mirror = useMirror(name)
  const [q, setQ] = useState('')
  const packages = useMirrorPackages(name, q)

  if (mirror.error) return <ErrorState error={mirror.error} />

  const m = mirror.data

  return (
    <>
      <PageHeader
        kicker={
          <>
            <Link to="/mirrors" className="hover:text-amber">
              mirrors
            </Link>
            {' / '}
            <span>upstream</span>
          </>
        }
        title={m?.Name ?? name ?? '—'}
        lede={m?.ArchiveURL}
      />

      {mirror.isLoading ? (
        <Skeleton className="h-44 w-full" />
      ) : (
        <section className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-12">
          <div className="space-y-8">
            <div>
              <div className="kicker mb-4">Source</div>
              <KeyValueList
                items={[
                  { key: 'name', value: m?.Name ?? '—' },
                  { key: 'archive url', value: m?.ArchiveURL ?? '—' },
                  { key: 'distribution', value: m?.Distribution ?? '—' },
                  {
                    key: 'components',
                    value: m?.Components?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {m.Components.map((c) => (
                          <Badge key={c} tone="neutral">
                            {c}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      '—'
                    ),
                  },
                  {
                    key: 'architectures',
                    value: m?.Architectures?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {m.Architectures.map((a) => (
                          <Badge key={a} tone="neutral">
                            {a}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      '—'
                    ),
                  },
                ]}
              />
            </div>

            <div>
              <div className="kicker mb-4">State</div>
              <KeyValueList
                items={[
                  {
                    key: 'last download',
                    value: m?.LastDownloadDate ? (
                      <span>
                        {fmtDate(m.LastDownloadDate)}
                        <span className="text-paper-subtle ml-2">
                          ({fmtRelative(m.LastDownloadDate)})
                        </span>
                      </span>
                    ) : (
                      'never'
                    ),
                  },
                  { key: 'filter', value: m?.Filter || '—' },
                  {
                    key: 'sources',
                    value: m?.DownloadSources ? 'yes' : 'no',
                  },
                  { key: 'udebs', value: m?.DownloadUdebs ? 'yes' : 'no' },
                  {
                    key: 'installer',
                    value: m?.DownloadInstaller ? 'yes' : 'no',
                  },
                ]}
              />
            </div>
          </div>

          <PackageList
            title="Packages"
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
