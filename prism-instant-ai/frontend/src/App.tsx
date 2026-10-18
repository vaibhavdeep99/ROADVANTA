import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { UserDashboardPage } from './pages/UserDashboardPage';
import { ImageScannerPage } from './pages/ImageScannerPage';
import { VideoScannerPage } from './pages/VideoScannerPage';
import { MyReportsPage } from './pages/MyReportsPage';
import { ReportDetailsPage } from './pages/ReportDetailsPage';
import { MapViewPage } from './pages/MapViewPage';
import { AuthorityDashboardPage } from './pages/AuthorityDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AuditLogsPage } from './pages/AuditLogsPage';

// Layout with Sidebar and Navbar
const AppLayout: React.FC = () => {
  return (
    <div className="flex h-screen w-screen bg-[#0b0f19] text-gray-100 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// Route Protection Guard
const ProtectedRoute: React.FC<{
  requireAdmin?: boolean;
  requireAuthority?: boolean;
}> = ({ requireAdmin, requireAuthority }) => {
  const { user, loading, isAdmin, isAuthority } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center text-cyan-400 font-mono text-xs">
        VALIDATING AUTHENTICATED SESSION...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireAuthority && !isAuthority && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <AppLayout />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Visitor Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Authenticated User / Patrol Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<UserDashboardPage />} />
            <Route path="/scanner/image" element={<ImageScannerPage />} />
            <Route path="/scanner/video" element={<VideoScannerPage />} />
            <Route path="/reports" element={<MyReportsPage />} />
            <Route path="/reports/:id" element={<ReportDetailsPage />} />
            <Route path="/map" element={<MapViewPage />} />
          </Route>

          {/* Authority Routes */}
          <Route element={<ProtectedRoute requireAuthority />}>
            <Route path="/authority/tasks" element={<AuthorityDashboardPage />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<ProtectedRoute requireAdmin />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminDashboardPage />} />
            <Route path="/admin/approvals" element={<AdminDashboardPage />} />
            <Route path="/admin/audit" element={<AuditLogsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
