import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/layout/Layout';
import ScrollToTop from './components/layout/ScrollToTop';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ServerManagement from './pages/ServerManagement';
import ServerDetail from './pages/ServerDetail';
import SiteManager from './pages/SiteManager';
import LogViewer from './pages/LogViewer';
import SSLManager from './pages/SSLManager';
import Settings from './pages/Settings';
import InviteAccept from './pages/InviteAccept';
import Activity from './pages/Activity';
import Landing from './pages/Landing';
import Organizations from './pages/Organizations';
import Tickets from './pages/Tickets';
import ApiReference from './pages/ApiReference';
import Documentation from './pages/Documentation';
import About from './pages/About';
import Security from './pages/Security';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';



function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

function PlatformOwnerRoute({ children }) {
  const { user, isPlatformOwner, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!isPlatformOwner) return <Navigate to="/dashboard" replace />;
  return children;
}

// Support users can only access /tickets
function NonSupportRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user?.role === 'support') return <Navigate to="/tickets" replace />;
  return children;
}

function AppRoutes() {
  const { user, isPlatformOwner, loading } = useAuth();

  if (loading) return null;

  const defaultRoute = isPlatformOwner 
    ? '/organizations' 
    : user?.role === 'support' 
      ? '/tickets' 
      : '/dashboard';

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={user ? <Navigate to={defaultRoute} replace /> : <Login />} />

      <Route path="/invite" element={<InviteAccept />} />
      <Route path="/api-reference" element={<ProtectedRoute><ApiReference /></ProtectedRoute>} />
      <Route path="/documentation" element={<Documentation />} />
      <Route path="/about" element={<About />} />
      <Route path="/security" element={<Security />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<Terms />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<NonSupportRoute><Dashboard /></NonSupportRoute>} />

        <Route path="/servers" element={<NonSupportRoute><ServerManagement /></NonSupportRoute>} />
        <Route path="/activity" element={<NonSupportRoute><Activity /></NonSupportRoute>} />
        <Route path="/servers/:id" element={<NonSupportRoute><ServerDetail /></NonSupportRoute>} />
        <Route path="/servers/:id/sites" element={<NonSupportRoute><SiteManager /></NonSupportRoute>} />
        <Route path="/servers/:id/logs" element={<NonSupportRoute><LogViewer /></NonSupportRoute>} />
        <Route path="/servers/:id/ssl" element={<NonSupportRoute><SSLManager /></NonSupportRoute>} />
        <Route path="/settings" element={<NonSupportRoute><Settings /></NonSupportRoute>} />
        <Route path="/tickets" element={<Tickets />} />
        <Route path="/organizations" element={
          <PlatformOwnerRoute>
            <Organizations />
          </PlatformOwnerRoute>
        } />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <ThemeProvider>
          <NotificationProvider>
            <AppRoutes />
          </NotificationProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
