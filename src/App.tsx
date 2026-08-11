import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AppProvider, useApp } from '@/lib/store';
import { DataProvider } from '@/lib/data-context';
import { ContentProvider } from '@/lib/content-context';
import { Layout } from '@/components/layout/Layout';
import { HomePage } from '@/pages/HomePage';
import { DashboardPage } from '@/pages/DashboardPage';
import { DonationsPage } from '@/pages/DonationsPage';
import { ExpensesPage } from '@/pages/ExpensesPage';
import { SponsorsPage } from '@/pages/SponsorsPage';
import { EventsPage } from '@/pages/EventsPage';
import { GalleryPage } from '@/pages/GalleryPage';
import { ContactPage } from '@/pages/ContactPage';
import { DonatePage } from '@/pages/DonatePage';
import { AdminLoginPage } from '@/pages/AdminLoginPage';
import { AdminPage } from '@/pages/AdminPage';
import { Loader } from '@/components/ui';
import { t } from '@/lib/i18n';

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, adminChecked, authLoading, lang } = useApp();
  if (authLoading || !adminChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream dark:bg-maroon-950">
        <Loader label={t('common.loading', lang)} />
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

function DeepLinkHandler() {
  const navigate = useNavigate();
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.path) {
        navigate(detail.path);
      }
    };
    window.addEventListener('app:deeplink', handler);
    return () => window.removeEventListener('app:deeplink', handler);
  }, [navigate]);
  return null;
}

function AppRoutes() {
  return (
    <DataProvider>
      <ContentProvider>
      <BrowserRouter>
        <DeepLinkHandler />
        <Routes>
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/login" element={<Navigate to="/admin/login" replace />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Layout adminMode>
                  <AdminPage />
                </Layout>
              </AdminRoute>
            }
          />
          <Route
            path="/*"
            element={
              <Layout>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/donations" element={<DonationsPage />} />
                  <Route path="/expenses" element={<ExpensesPage />} />
                  <Route path="/sponsors" element={<SponsorsPage />} />
                  <Route path="/events" element={<EventsPage />} />
                  <Route path="/gallery" element={<GalleryPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/donate" element={<DonatePage />} />
                  <Route path="/committee" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            }
          />
        </Routes>
      </BrowserRouter>
      </ContentProvider>
    </DataProvider>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
}
