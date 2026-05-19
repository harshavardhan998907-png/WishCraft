import { Route, Routes } from 'react-router-dom'
import { PageWrapper } from './components/layout/PageWrapper'
import { AdminRoute } from './components/layout/AdminRoute'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { AdminLayout } from './modules/admin/layouts/AdminLayout'
import { AdminDashboard } from './modules/admin/pages/AdminDashboard'
import { AdminOrders } from './modules/admin/pages/AdminOrders'
import { AdminSettings } from './modules/admin/pages/AdminSettings'
import { AdminTemplates } from './modules/admin/pages/AdminTemplates'
import { AdminUsers } from './modules/admin/pages/AdminUsers'
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
import { Unauthorized } from './pages/Unauthorized'

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
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="templates" element={<AdminTemplates />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="/w/:slug" element={<WishPage />} />
        <Route path="/expired" element={<Expired />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </PageWrapper>
  )
}
