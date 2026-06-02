import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { PageWrapper } from './components/layout/PageWrapper'
import { AdminRoute } from './components/layout/AdminRoute'
import { CreatorRoute } from './components/layout/CreatorRoute'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { ErrorBoundary } from './modules/performance/components/ErrorBoundary'

const Home = lazy(() => import('./pages/Home').then((module) => ({ default: module.Home })))
const Browse = lazy(() => import('./pages/Browse').then((module) => ({ default: module.Browse })))
const Auth = lazy(() => import('./pages/Auth').then((module) => ({ default: module.Auth })))
const Editor = lazy(() => import('./pages/Editor').then((module) => ({ default: module.Editor })))
const Preview = lazy(() => import('./pages/Preview').then((module) => ({ default: module.Preview })))
const Dashboard = lazy(() => import('./pages/Dashboard').then((module) => ({ default: module.Dashboard })))
const WishPage = lazy(() => import('./pages/WishPage').then((module) => ({ default: module.WishPage })))
const Expired = lazy(() => import('./pages/Expired').then((module) => ({ default: module.Expired })))
const NotFound = lazy(() => import('./pages/NotFound').then((module) => ({ default: module.NotFound })))
const Share = lazy(() => import('./pages/Share').then((module) => ({ default: module.Share })))
const Unauthorized = lazy(() => import('./pages/Unauthorized').then((module) => ({ default: module.Unauthorized })))
const PaymentHistory = lazy(() => import('./modules/payments/pages/PaymentHistory').then((module) => ({ default: module.PaymentHistory })))
const NotificationPreferences = lazy(() => import('./modules/notifications/pages/NotificationPreferences').then((module) => ({ default: module.NotificationPreferences })))
const SecuritySettings = lazy(() => import('./modules/security/pages/SecuritySettings').then((module) => ({ default: module.SecuritySettings })))
const DeveloperAPIKeys = lazy(() => import('./modules/developer/pages/DeveloperAPIKeys').then((module) => ({ default: module.DeveloperAPIKeys })))
const AdminLayout = lazy(() => import('./modules/admin/layouts/AdminLayout').then((module) => ({ default: module.AdminLayout })))
const AdminDashboard = lazy(() => import('./modules/admin/pages/AdminDashboard').then((module) => ({ default: module.AdminDashboard })))
const AdminAnalytics = lazy(() => import('./modules/admin/pages/AdminAnalytics').then((module) => ({ default: module.AdminAnalytics })))
const AdminAIAnalytics = lazy(() => import('./modules/admin/pages/AdminAIAnalytics').then((module) => ({ default: module.AdminAIAnalytics })))
const AdminAutomationDashboard = lazy(() => import('./modules/admin/pages/AdminAutomationDashboard').then((module) => ({ default: module.AdminAutomationDashboard })))
const AdminEngagementModeration = lazy(() => import('./modules/admin/pages/AdminEngagementModeration').then((module) => ({ default: module.AdminEngagementModeration })))
const AdminGovernanceDashboard = lazy(() => import('./modules/admin/pages/AdminGovernanceDashboard').then((module) => ({ default: module.AdminGovernanceDashboard })))
const AdminPlatformIntelligenceDashboard = lazy(() => import('./modules/admin/pages/AdminPlatformIntelligenceDashboard').then((module) => ({ default: module.AdminPlatformIntelligenceDashboard })))
const AdminOrders = lazy(() => import('./modules/admin/pages/AdminOrders').then((module) => ({ default: module.AdminOrders })))
const AdminPayments = lazy(() => import('./modules/admin/pages/AdminPayments').then((module) => ({ default: module.AdminPayments })))
const AdminProductionDashboard = lazy(() => import('./modules/admin/pages/AdminProductionDashboard').then((module) => ({ default: module.AdminProductionDashboard })))
const AdminSettings = lazy(() => import('./modules/admin/pages/AdminSettings').then((module) => ({ default: module.AdminSettings })))
const AdminStorageDashboard = lazy(() => import('./modules/admin/pages/AdminStorageDashboard').then((module) => ({ default: module.AdminStorageDashboard })))
const AdminTemplates = lazy(() => import('./modules/admin/pages/AdminTemplates').then((module) => ({ default: module.AdminTemplates })))
const AdminUsers = lazy(() => import('./modules/admin/pages/AdminUsers').then((module) => ({ default: module.AdminUsers })))
const CreatorLayout = lazy(() => import('./modules/creator/layouts/CreatorLayout').then((module) => ({ default: module.CreatorLayout })))
const CreatorDashboard = lazy(() => import('./modules/creator/pages/CreatorDashboard').then((module) => ({ default: module.CreatorDashboard })))
const CreatorTemplates = lazy(() => import('./modules/creator/pages/CreatorTemplates').then((module) => ({ default: module.CreatorTemplates })))
const CreatorAnalytics = lazy(() => import('./modules/creator/pages/CreatorAnalytics').then((module) => ({ default: module.CreatorAnalytics })))
const CreatorSettings = lazy(() => import('./modules/creator/pages/CreatorSettings').then((module) => ({ default: module.CreatorSettings })))

export default function App() {
  return (
    <ErrorBoundary>
      <PageWrapper>
        <Suspense fallback={<div className="grid min-h-screen place-items-center font-bold">Loading...</div>}>
          <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/editor/:templateSlug" element={<ProtectedRoute><Editor /></ProtectedRoute>} />
        <Route path="/preview" element={<ProtectedRoute><Preview /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute><PaymentHistory /></ProtectedRoute>} />
        <Route path="/notifications/preferences" element={<ProtectedRoute><NotificationPreferences /></ProtectedRoute>} />
        <Route path="/security" element={<ProtectedRoute><SecuritySettings /></ProtectedRoute>} />
        <Route path="/developer/api-keys" element={<ProtectedRoute><DeveloperAPIKeys /></ProtectedRoute>} />
        <Route path="/share/:slug" element={<ProtectedRoute><Share /></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="governance" element={<AdminGovernanceDashboard />} />
          <Route path="intelligence" element={<AdminPlatformIntelligenceDashboard />} />
          <Route path="ai" element={<AdminAIAnalytics />} />
          <Route path="automation" element={<AdminAutomationDashboard />} />
          <Route path="production" element={<AdminProductionDashboard />} />
          <Route path="engagement" element={<AdminEngagementModeration />} />
          <Route path="templates" element={<AdminTemplates />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="storage" element={<AdminStorageDashboard />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="/creator" element={<CreatorRoute><CreatorLayout /></CreatorRoute>}>
          <Route index element={<CreatorDashboard />} />
          <Route path="templates" element={<CreatorTemplates />} />
          <Route path="analytics" element={<CreatorAnalytics />} />
          <Route path="settings" element={<CreatorSettings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="/w/:slug" element={<WishPage />} />
        <Route path="/expired" element={<Expired />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </PageWrapper>
    </ErrorBoundary>
  )
}
