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
import { SSHFullscreenProvider } from './context/SSHFullscreenContext';
import SSHFullscreenOverlay from './components/server/SSHFullscreenOverlay';
import Alerts from './pages/Alerts';
import AlertsListener from './components/AlertsListener';

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

function ModuleProtectedRoute({ module, children }) {
  const { user, isPlatformOwner, loading } = useAuth();
  if (loading) return null;
  if (isPlatformOwner) return children;
  
  if (user?.role === 'support') {
    if (['tickets', 'settings'].includes(module)) return children;
    return <Navigate to="/tickets" replace />;
  }
  
  const isModuleEnabled = user?.enabled_modules ? user.enabled_modules.includes(module) : true;
  if (!isModuleEnabled) {
    const fallback = user?.enabled_modules?.includes('dashboard') ? '/dashboard'
      : user?.enabled_modules?.includes('servers') ? '/servers'
      : user?.enabled_modules?.includes('tickets') ? '/tickets'
      : user?.enabled_modules?.includes('settings') ? '/settings'
      : '/';
    return <Navigate to={fallback} replace />;
  }
  return children;
}

function AppRoutes() {
  const { user, isPlatformOwner, loading } = useAuth();

  if (loading) return null;

  const getDefaultRoute = () => {
    if (isPlatformOwner) return '/organizations';
    if (user?.role === 'support') return '/tickets';
    
    const isModuleEnabled = (moduleName) => {
      return user?.enabled_modules ? user.enabled_modules.includes(moduleName) : true;
    };
    
    if (isModuleEnabled('dashboard')) return '/dashboard';
    if (isModuleEnabled('servers')) return '/servers';
    if (isModuleEnabled('tickets')) return '/tickets';
    if (isModuleEnabled('settings')) return '/settings';
    
    return '/';
  };

  const defaultRoute = getDefaultRoute();

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
        <Route path="/dashboard" element={<ModuleProtectedRoute module="dashboard"><Dashboard /></ModuleProtectedRoute>} />
        <Route path="/alerts" element={<ModuleProtectedRoute module="servers"><Alerts /></ModuleProtectedRoute>} />
        <Route path="/servers" element={<ModuleProtectedRoute module="servers"><ServerManagement /></ModuleProtectedRoute>} />
        <Route path="/activity" element={<ModuleProtectedRoute module="dashboard"><Activity /></ModuleProtectedRoute>} />
        <Route path="/servers/:id" element={<ModuleProtectedRoute module="servers"><ServerDetail /></ModuleProtectedRoute>} />
        <Route path="/servers/:id/sites" element={<ModuleProtectedRoute module="servers"><SiteManager /></ModuleProtectedRoute>} />
        <Route path="/servers/:id/logs" element={<ModuleProtectedRoute module="servers"><LogViewer /></ModuleProtectedRoute>} />
        <Route path="/servers/:id/ssl" element={<ModuleProtectedRoute module="servers"><SSLManager /></ModuleProtectedRoute>} />
        <Route path="/settings" element={<ModuleProtectedRoute module="settings"><Settings /></ModuleProtectedRoute>} />
        <Route path="/tickets" element={<ModuleProtectedRoute module="tickets"><Tickets /></ModuleProtectedRoute>} />
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
            <SSHFullscreenProvider>
              <AlertsListener />
              <AppRoutes />
              <SSHFullscreenOverlay />
            </SSHFullscreenProvider>
          </NotificationProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
