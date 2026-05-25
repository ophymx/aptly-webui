import { Link, useParams } from 'react-router-dom'
import { usePackage } from '@/lib/queries'
import { parsePackageKey } from '@/lib/api'
import { PageHeader } from '@/components/data/PageHeader'
import { KeyValueList } from '@/components/data/KeyValue'
import { ErrorState } from '@/components/data/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Mono } from '@/components/data/Mono'
import { truncMiddle } from '@/lib/format'

const PRIMARY = [
  'Package',
  'Version',
  'Architecture',
  'Section',
  'Priority',
  'Maintainer',
  'Homepage',
  'Source',
  'Filename',
  'Size',
  'InstalledSize',
]

const HASHES = ['MD5sum', 'SHA1', 'SHA256']

const RELATIONS = [
  'Depends',
  'Pre-Depends',
  'Recommends',
  'Suggests',
  'Conflicts',
  'Breaks',
  'Provides',
  'Replaces',
]

export function PackageDetail() {
  const { key } = useParams<{ key: string }>()
  const decoded = key ? decodeURIComponent(key) : ''
  const parsed = parsePackageKey(decoded)
  const pkg = usePackage(decoded)

  return (
    <>
      <PageHeader
        kicker={
          <>
            <Link to="/packages" className="hover:text-amber">
              packages
            </Link>
            {' / '}
            <Badge tone="neutral">{parsed.arch || '?'}</Badge>
          </>
        }
        title={parsed.name || decoded}
        lede={
          <span className="font-mono text-[13px]">
            {parsed.version}
            {parsed.hash && (
              <span className="ml-3 text-paper-subtle">
                {truncMiddle(parsed.hash, 24)}
              </span>
            )}
          </span>
        }
      />

      {pkg.error ? (
        <ErrorState error={pkg.error} />
      ) : pkg.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : pkg.data ? (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12">
          <div className="space-y-10">
            {pkg.data.Description && (
              <section>
                <div className="kicker mb-3">Description</div>
                <p className="text-paper leading-relaxed whitespace-pre-line text-[14px]">
                  {pkg.data.Description}
                </p>
              </section>
            )}

            <section>
              <div className="kicker mb-4">Control</div>
              <KeyValueList
                items={PRIMARY.filter((k) => pkg.data?.[k]).map((k) => ({
                  key: prettyKey(k),
                  value:
                    k === 'Homepage' ? (
                      <a
                        href={String(pkg.data![k])}
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber hover:underline break-all"
                      >
                        {String(pkg.data![k])}
                      </a>
                    ) : (
                      <Mono>{String(pkg.data![k])}</Mono>
                    ),
                }))}
              />
            </section>

            {RELATIONS.some((r) => pkg.data?.[r]) && (
              <section>
                <div className="kicker mb-4">Relations</div>
                <KeyValueList
                  items={RELATIONS.filter((r) => pkg.data?.[r]).map((r) => ({
                    key: prettyKey(r),
                    value: (
                      <div className="text-paper-muted leading-relaxed">
                        {String(pkg.data![r])}
                      </div>
                    ),
                  }))}
                />
              </section>
            )}
          </div>

          <aside className="space-y-8 lg:border-l lg:border-rule lg:pl-10">
            <section>
              <div className="kicker mb-4">Hashes</div>
              <div className="space-y-3">
                {HASHES.filter((h) => pkg.data?.[h]).map((h) => (
                  <div key={h}>
                    <div className="field-key">{h}</div>
                    <Mono dim className="break-all text-[11.5px]">
                      {String(pkg.data![h])}
                    </Mono>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <div className="kicker mb-4">Aptly key</div>
              <Mono dim className="break-all">
                {decoded}
              </Mono>
            </section>
          </aside>
        </div>
      ) : null}
    </>
  )
}

function prettyKey(k: string): string {
  return k
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/-/g, ' ')
    .toLowerCase()
}
