import { Routes, Route } from 'react-router-dom'
import { Shell } from './components/layout/Shell'
import { Overview } from './pages/Overview'
import { ReposList } from './pages/ReposList'
import { RepoDetail } from './pages/RepoDetail'
import { MirrorsList } from './pages/MirrorsList'
import { MirrorDetail } from './pages/MirrorDetail'
import { SnapshotsList } from './pages/SnapshotsList'
import { SnapshotDetail } from './pages/SnapshotDetail'
import { PublishList } from './pages/PublishList'
import { PackageSearch } from './pages/PackageSearch'
import { PackageDetail } from './pages/PackageDetail'
import { NotFound } from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Overview />} />
        <Route path="repos" element={<ReposList />} />
        <Route path="repos/:name" element={<RepoDetail />} />
        <Route path="mirrors" element={<MirrorsList />} />
        <Route path="mirrors/:name" element={<MirrorDetail />} />
        <Route path="snapshots" element={<SnapshotsList />} />
        <Route path="snapshots/:name" element={<SnapshotDetail />} />
        <Route path="publish" element={<PublishList />} />
        <Route path="packages" element={<PackageSearch />} />
        <Route path="packages/:key" element={<PackageDetail />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
