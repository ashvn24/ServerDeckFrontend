import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { Wrench, Mail, RefreshCw, AlertTriangle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import client from '../../api/client';

export default function MaintenanceModal() {
  const [isDown, setIsDown] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [retryMessage, setRetryMessage] = useState('');
  const { theme } = useTheme();
  const location = useLocation();

  useEffect(() => {
    const handleApiDown = () => setIsDown(true);
    const handleApiUp = () => {
      setIsDown(false);
      setRetryMessage('');
    };

    window.addEventListener('serverdeck:api-down', handleApiDown);
    window.addEventListener('serverdeck:api-up', handleApiUp);

    return () => {
      window.removeEventListener('serverdeck:api-down', handleApiDown);
      window.removeEventListener('serverdeck:api-up', handleApiUp);
    };
  }, []);

  const handleRetry = async () => {
    setRetrying(true);
    setRetryMessage('');
    try {
      // Perform a ping / lightweight request to check if API is reachable
      await client.get('/dashboard/');
      setIsDown(false);
    } catch (err) {
      if (err.response && ![502, 503, 504].includes(err.response.status)) {
        // API responded with standard status (e.g., 401, 403, 404), meaning it is alive
        setIsDown(false);
      } else {
        setRetryMessage('Server is still unreachable. Please try again shortly.');
      }
    } finally {
      setRetrying(false);
    }
  };

  // Do not display modal if server is up, or if user is currently on the Landing page ('/')
  if (!isDown || location.pathname === '/') return null;

  return createPortal(
    <div
      data-theme={theme === 'light' ? 'light' : undefined}
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" />

      {/* Modal Card */}
      <div className="glass-card relative z-10 w-full max-w-lg border border-[var(--border-color)] bg-[var(--bg-card)] shadow-2xl rounded-3xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        
        {/* Top Accent Light Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 animate-pulse" />

        <div className="p-8 sm:p-10 text-center">
          
          {/* Maintenance Icon Badge */}
          <div className="mx-auto w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6 relative">
            <Wrench className="w-10 h-10 text-amber-500 animate-bounce" style={{ animationDuration: '3s' }} />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
            </span>
          </div>

          {/* Header */}
          <h2 className="text-2xl font-black uppercase tracking-tight text-[var(--text-primary)] font-display leading-tight mb-3">
            System Under Maintenance
          </h2>
          
          {/* Main Body Description */}
          <p className="text-[var(--text-secondary)] text-sm sm:text-base leading-relaxed mb-6">
            ServerDeck is currently undergoing scheduled maintenance or temporary service updates. Some features may be temporarily unavailable.
          </p>

          {/* Contact Box */}
          <div className="p-4 rounded-2xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] mb-6 text-left flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 flex-shrink-0 mt-0.5">
              <Mail className="w-5 h-5" />
            </div>
            <div className="text-sm">
              <span className="block font-semibold text-[var(--text-primary)] mb-0.5">
                Urgent Assistance Needed?
              </span>
              <span className="text-[var(--text-secondary)]">
                For urgent inquiries or critical support, please reach out directly to{' '}
                <a
                  href="mailto:ashwinvk77@gmail.com"
                  className="font-bold text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors inline-flex items-center gap-1"
                >
                  ashwinvk77@gmail.com
                </a>
              </span>
            </div>
          </div>

          {/* Error / Status Feedback */}
          {retryMessage && (
            <div className="mb-4 text-xs font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 rounded-xl flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{retryMessage}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm tracking-wide transition-all duration-300 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
              <span>{retrying ? 'Checking Connection...' : 'Retry Connection'}</span>
            </button>
          </div>

        </div>

        {/* Footer info bar */}
        <div className="px-8 py-4 bg-[var(--bg-card-hover)] border-t border-[var(--border-color)] text-center text-xs text-[var(--text-secondary)] flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Backend Connection Offline
          </span>
          <span>ServerDeck Status</span>
        </div>

      </div>
    </div>,
    document.body
  );
}
