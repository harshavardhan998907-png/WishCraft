import { Route, Routes } from 'react-router-dom'
import { PageWrapper } from './components/layout/PageWrapper'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { Home } from './pages/Home'
import { Browse } from './pages/Browse'
import { Auth } from './pages/Auth'
import { Editor } from './pages/Editor'
import { Preview } from './pages/Preview'
import { Dashboard } from './pages/Dashboard'
import { WishPage } from './pages/WishPage'
import { Expired } from './pages/Expired'
import { NotFound } from './pages/NotFound'
import { Share } from './pages/Share'

export default function App() {
  return (
    <PageWrapper>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/editor/:templateSlug" element={<ProtectedRoute><Editor /></ProtectedRoute>} />
        <Route path="/preview" element={<ProtectedRoute><Preview /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/share/:slug" element={<ProtectedRoute><Share /></ProtectedRoute>} />
        <Route path="/w/:slug" element={<WishPage />} />
        <Route path="/expired" element={<Expired />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </PageWrapper>
  )
}
