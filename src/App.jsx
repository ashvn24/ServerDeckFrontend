import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ServerManagement from './pages/ServerManagement';
import ServerDetail from './pages/ServerDetail';
import SiteManager from './pages/SiteManager';
import LogViewer from './pages/LogViewer';
import SSLManager from './pages/SSLManager';
import Settings from './pages/Settings';
import InviteAccept from './pages/InviteAccept';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/invite" element={<InviteAccept />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/servers" element={<ServerManagement />} />
        <Route path="/activity" element={<Dashboard />} />
        <Route path="/servers/:id" element={<ServerDetail />} />
        <Route path="/servers/:id/sites" element={<SiteManager />} />
        <Route path="/servers/:id/logs" element={<LogViewer />} />
        <Route path="/servers/:id/ssl" element={<SSLManager />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
