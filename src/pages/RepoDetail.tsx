import { Link, useParams } from 'react-router-dom'
import { useState } from 'react'
import { useRepo, useRepoPackages } from '@/lib/queries'
import { PageHeader } from '@/components/data/PageHeader'
import { KeyValueList } from '@/components/data/KeyValue'
import { ErrorState } from '@/components/data/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import { PackageList } from './_packages-shared'

export function RepoDetail() {
  const { name } = useParams<{ name: string }>()
  const repo = useRepo(name)
  const [q, setQ] = useState('')
  const packages = useRepoPackages(name, q)

  if (repo.error) return <ErrorState error={repo.error} />

  return (
    <>
      <PageHeader
        kicker={
          <>
            <Link to="/repos" className="hover:text-amber">
              repositories
            </Link>
            {' / '}
            <span>local</span>
          </>
        }
        title={repo.data?.Name ?? name ?? '—'}
        lede={repo.data?.Comment || undefined}
      />

      {repo.isLoading ? (
        <Skeleton className="h-44 w-full" />
      ) : (
        <section className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-12">
          <div>
            <div className="kicker mb-4">Properties</div>
            <KeyValueList
              items={[
                { key: 'name', value: repo.data?.Name ?? '—' },
                {
                  key: 'distribution',
                  value: repo.data?.DefaultDistribution || '—',
                },
                {
                  key: 'component',
                  value: repo.data?.DefaultComponent || '—',
                },
                {
                  key: 'comment',
                  value: repo.data?.Comment || (
                    <span className="text-paper-subtle italic">none</span>
                  ),
                },
              ]}
            />
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
