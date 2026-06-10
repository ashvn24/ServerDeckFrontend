import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, FileText, Shield, Cpu, HardDrive, MemoryStick, Clock, Wifi, Terminal, Trash2, AlertTriangle, Box, Activity, ChevronRight } from 'lucide-react';
import { serversAPI } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { useIsPWA } from '../hooks/useIsPWA';
import { useMobile } from '../hooks/useMobile';
import { useWebSocket } from '../hooks/useWebSocket';
import { useNotification } from '../context/NotificationContext';
import { formatUptime, formatMB } from '../utils/formatters';
import StatusBadge from '../components/common/StatusBadge';
import ResourceGauge from '../components/server/ResourceGauge';
import ServiceList from '../components/server/ServiceList';
import LoadingSpinner from '../components/common/LoadingSpinner';
import SSHTerminal from '../components/server/SSHTerminal';
import FileManager from '../components/server/FileManager';
import FirewallManager from '../components/server/FirewallManager';
import ProcessManager from '../components/server/ProcessManager';
import SSLManager from '../components/server/SSLManager';
import AutomationManager from '../components/server/AutomationManager';
import LuxeGenieManager from '../components/server/LuxeGenieManager';

import RestrictedView from '../components/common/RestrictedView';
import AlertModal from '../components/common/AlertModal';
import ConfirmModal from '../components/common/ConfirmModal';
import ServerAlertsPanel from '../components/server/ServerAlertsPanel';

const TABS = ['Overview', 'Nginx Sites', 'PM2 Apps', 'Systemd', 'Automation', 'Security', 'Processes', 'SSL', 'SSH', 'Files', 'LuxeGenie'];

export default function ServerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const [server, setServer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { user } = useAuth();
  const { watchServer, unwatchServer, sendCommand, on, send, connected } = useWebSocket();
  const [alertConfig, setAlertConfig] = useState({ open: false, title: '', message: '', type: 'error' });
  const isPWA = useIsPWA();
  const isMobile = useMobile();
  // Use native mobile layout on any mobile screen (PWA or browser)
  const useMobileLayout = isPWA || isMobile;
  const tabStripRef = useRef(null);

  const isAdmin = user?.role === 'owner' || user?.role === 'admin';

  // Keep the active tab scrolled into view on the iOS-style tab strip.
  useEffect(() => {
    const el = tabStripRef.current?.querySelector('[data-active="true"]');
    el?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [activeTab]);

  const fetchServer = useCallback(async () => {
    try {
      const res = await serversAPI.get(id);
      setServer(res.data);
    } catch (err) {
      console.error('Failed to fetch server:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchServer();
    watchServer(id);
    return () => unwatchServer(id);
  }, [id, fetchServer, watchServer, unwatchServer]);

  useEffect(() => {
    const unsubTelemetry = on('telemetry', (msg) => {
      if (msg.server_id === id) {
        setServer((prev) => prev ? { ...prev, ...msg.data, is_online: true } : prev);
      }
    });
    const unsubScan = on('scan', (msg) => {
      if (msg.server_id === id) {
        setServer((prev) => prev ? { ...prev, ...msg.data } : prev);
      }
    });
    return () => { unsubTelemetry(); unsubScan(); };
  }, [id, on]);

  const handleDeleteServer = async () => {
    setDeleting(true);
    try {
      await serversAPI.delete(id);
      navigate('/');
    } catch (err) {
      console.error('Failed to delete server:', err);
      setAlertConfig({
        open: true,
        title: 'Decommission Failed',
        message: 'Could not remove the node from the registry. Please ensure all sessions are terminated and try again.',
        type: 'error'
      });
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleServiceAction = async (name, action) => {
    const prefix = activeTab === 1 ? 'nginx' : activeTab === 2 ? 'pm2' : 'systemd';
    try {
      await sendCommand(id, `${prefix}.${action}`, { name });
      setTimeout(fetchServer, 1000);
    } catch (err) {
      console.error(`${prefix}.${action} failed:`, err);
    }
  };

  if (loading) return <LoadingSpinner size="lg" text="Loading server details..." />;
  if (!server) return <div className="text-center py-20 text-gray-500">Server not found</div>;

  const ramPercent = server.ram_total_mb ? (server.ram_used_mb / server.ram_total_mb) * 100 : 0;

  const handleQuickAction = (action) => {
    if (!isAdmin) {
      setAlertConfig({
        open: true,
        title: 'Access Restricted',
        message: 'This action is not available for your current authorization level.',
        type: 'error'
      });
      showToast('Action restricted: Admin privileges required', 'error');
      return;
    }
    if (action === 'sites') navigate(`/servers/${id}/sites`);
    if (action === 'ssh') setActiveTab(8);
  };

  return (
    <div className="fixed left-0 right-0 z-40 overflow-y-auto custom-scrollbar bg-[var(--bg-main)]" style={{ top: 'var(--total-header)', bottom: 'var(--bottom-nav)' }}>
      <div className={`px-4 sm:px-6 md:px-10 lg:px-12 pt-4 pb-4 sm:pb-6 md:pb-10 lg:pb-12 w-full mx-auto ${useMobileLayout ? 'pwa-server space-y-4' : 'space-y-4'}`}>
      <AlertModal
        isOpen={alertConfig.open}
        onClose={() => setAlertConfig({ ...alertConfig, open: false })}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />

      {/* Header */}
      {useMobileLayout ? (
        <>
          {/* Mobile / PWA sticky navigation bar */}
          <div
            className="sticky top-0 z-30 -mt-4 -mx-4 sm:-mt-6 sm:-mx-6 md:-mt-10 md:-mx-10 lg:-mt-12 lg:-mx-12 px-4 sm:px-6 md:px-10 lg:px-12 py-2.5 mb-4 flex items-center gap-3 bg-[var(--bg-main)]/85 backdrop-blur-xl border-b border-[var(--border-color)]"
          >
            <button
              onClick={() => navigate('/servers')}
              className="flex items-center justify-center w-10 h-10 -ml-1 rounded-full text-[var(--accent-mint)] active:scale-95 transition-transform"
              aria-label="Back to servers"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-bold tracking-tight truncate leading-tight">{server.name}</h1>
              <p className="text-xs text-[var(--text-secondary)] truncate">{server.ip_address || '—'} · {server.os_info || 'Unknown OS'}</p>
            </div>
            <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold ${server.is_online ? 'accent-bg-green' : 'bg-red-500 text-white'}`}>
              {server.is_online ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* Action row */}
          <div className="server-action-buttons flex items-center gap-2.5">
            <button
              onClick={() => handleQuickAction('sites')}
              className={`server-action-btn flex-1 h-11 rounded-2xl text-sm font-semibold transition-transform active:scale-[0.97] ${!isAdmin ? 'bg-[var(--bg-card)] opacity-50' : 'bg-[var(--bg-card)] border border-[var(--border-color)]'}`}
            >
              Quick Sites
            </button>
            <button
              onClick={() => handleQuickAction('ssh')}
              className={`server-action-btn flex-1 h-11 rounded-2xl text-sm font-semibold text-[#2c2c2e] shadow-lg transition-transform active:scale-[0.97] ${!isAdmin ? 'bg-gray-500/30 opacity-50 text-white' : 'accent-bg-green shadow-emerald-500/20'}`}
            >
              Launch SSH
            </button>
            {isAdmin && (
              <button
                onClick={() => setShowDeleteModal(true)}
                aria-label="Delete server"
                className="w-11 h-11 shrink-0 flex items-center justify-center rounded-2xl text-red-500 bg-red-500/10 active:scale-[0.97] transition-transform"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/servers')} className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-card-hover)] transition-all group">
              <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-white transition-colors" />
            </button>
            <div>
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-4xl font-black tracking-tight uppercase font-display">{server.name}</h1>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${server.is_online ? 'accent-bg-green' : 'bg-red-500 text-white'}`}>
                  {server.is_online ? 'Online' : 'Offline'}
                </div>
              </div>
              <p className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-widest">
                {server.ip_address || '—'} <span className="mx-3 text-[var(--border-color)]">•</span> {server.os_info || 'Unknown OS'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleQuickAction('sites')}
              className={`px-5 py-2.5 rounded-xl border border-[var(--border-color)] text-xs font-bold uppercase tracking-widest transition-all ${!isAdmin ? 'bg-white/5 opacity-50 cursor-not-allowed' : 'bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)]'}`}
            >
              Quick Sites
            </button>
            <button
              onClick={() => handleQuickAction('ssh')}
              className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold uppercase tracking-widest shadow-lg transition-all active:scale-95 ${!isAdmin ? 'bg-gray-500/20 opacity-50 cursor-not-allowed' : 'bg-[var(--accent-violet)] shadow-violet-500/20 hover:scale-105'}`}
            >
              Launch SSH
            </button>
            {isAdmin && (
              <button onClick={() => setShowDeleteModal(true)} className="p-2.5 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors">
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      {useMobileLayout ? (
        <div ref={tabStripRef} className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-3 px-3 py-1">
          {TABS.map((tab, idx) => (
            <button
              key={tab}
              data-active={activeTab === idx}
              onClick={() => setActiveTab(idx)}
              className={`shrink-0 px-4 h-9 rounded-full text-sm font-semibold whitespace-nowrap transition-transform active:scale-[0.97] ${activeTab === idx ? 'bg-white text-[#2c2c2e]' : 'bg-[var(--bg-card)] text-[var(--text-secondary)]'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-1.5 p-1.5 glass-card w-max max-w-full overflow-x-auto no-scrollbar">
          {TABS.map((tab, idx) => (
            <button
              key={tab}
              onClick={() => setActiveTab(idx)}
              className={`py-2 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap
                ${activeTab === idx
                  ? 'bg-white text-[#2c2c2e] shadow-lg'
                  : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/5'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Tab Content */}
      <div className="pt-3">
        {activeTab === 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-8">
            <StatCard icon={Cpu} label="CPU Load" value={`${(server.cpu_percent || 0).toFixed(0)}%`} color="white">
               <div className="mt-6 flex items-end gap-1 h-12">
                 {[...Array(12)].map((_, i) => (
                   <div key={i} className="flex-1 bg-white/5 rounded-sm" style={{ height: `${20 + Math.random() * 80}%` }} />
                 ))}
               </div>
            </StatCard>
            <StatCard icon={MemoryStick} label="Memory Usage" value={`${ramPercent.toFixed(0)}%`} color="white">
              <div className="mt-6 flex items-center justify-between text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">
                <span>{formatMB(server.ram_used_mb)} used</span>
                <span>{formatMB(server.ram_total_mb)} total</span>
              </div>
              <div className="mt-2 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-white/40" style={{ width: `${ramPercent}%` }} />
              </div>
            </StatCard>
            <StatCard icon={HardDrive} label="Storage" value={`${(server.disk_used_percent || 0).toFixed(0)}%`} color="white">
               <div className="mt-6 flex items-center gap-2">
                  <Activity className="w-4 h-4 accent-text-green" />
                  <span className="text-[10px] font-bold accent-text-green uppercase tracking-widest">Drive Health Optimal</span>
               </div>
            </StatCard>
            <StatCard icon={Clock} label="Uptime" value={formatUptime(server.uptime_seconds).split(' ')[0]} subtitle={formatUptime(server.uptime_seconds).split(' ')[1] || 'Running'} color="white">
               <div className="mt-6 flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-white/40" />
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Last ping 2s ago</span>
               </div>
            </StatCard>
          </div>
          
          <ServerAlertsPanel serverId={id} sendCommand={sendCommand} />
        </>
        )}

        {activeTab === 1 && (
          <div className="glass-card p-5 md:p-10">
            <h3 className="text-lg font-bold tracking-tight mb-5 md:mb-8">Nginx Sites</h3>
            <ServiceList serverId={id} services={server.nginx_sites || []} type="nginx" onAction={handleServiceAction} isAdmin={isAdmin} sendCommand={sendCommand} />
          </div>
        )}

        {activeTab === 2 && (
          <div className="glass-card p-5 md:p-10">
            <h3 className="text-lg font-bold tracking-tight mb-5 md:mb-8">PM2 Applications</h3>
            <ServiceList serverId={id} services={server.pm2_apps || []} type="pm2" onAction={handleServiceAction} isAdmin={isAdmin} sendCommand={sendCommand} />
          </div>
        )}

        {activeTab === 3 && (
          <div className="glass-card p-5 md:p-10">
            <h3 className="text-lg font-bold tracking-tight mb-5 md:mb-8">Systemd Services</h3>
            <ServiceList serverId={id} services={server.systemd_services || []} type="systemd" onAction={handleServiceAction} isAdmin={isAdmin} sendCommand={sendCommand} />
          </div>
        )}

        {activeTab === 4 && (
          isAdmin ? <AutomationManager serverId={id} sendCommand={sendCommand} isAdmin={isAdmin} /> : <RestrictedView title="Automation Restricted" />
        )}
        {activeTab === 5 && <FirewallManager serverId={id} sendCommand={sendCommand} isAdmin={isAdmin} />}
        {activeTab === 6 && <ProcessManager serverId={id} sendCommand={sendCommand} isAdmin={isAdmin} />}
        {activeTab === 7 && <SSLManager serverId={id} sendCommand={sendCommand} isAdmin={isAdmin} nginxSites={server.nginx_sites || []} />}

        <div style={{ display: activeTab === 8 ? 'block' : 'none' }}>
          {isAdmin ? (
            <div className="glass-card overflow-hidden">
              <SSHTerminal serverId={id} isOnline={server.is_online} wsConnected={connected} send={send} on={on} isActive={activeTab === 8} />
            </div>
          ) : (
            <RestrictedView title="SSH Access Restricted" />
          )}
        </div>

        {activeTab === 9 && <FileManager serverId={id} sendCommand={sendCommand} isOnline={server.is_online} isAdmin={isAdmin} />}
        {activeTab === 10 && <LuxeGenieManager serverId={id} sendCommand={sendCommand} luxegenieHealth={server.luxegenie_health} isOnline={server.is_online} />}
      </div>


      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Decommission Node"
        message={`You are about to permanently decommission ${server.name}.`}
        type="danger"
        confirmText={deleting ? "Processing..." : "Confirm Decommission"}
        onConfirm={handleDeleteServer}
        requiresVerification={true}
      />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, subtitle, color, children }) {
  return (
    <div className="glass-card p-5 md:p-10 flex flex-col justify-between min-h-[160px] md:min-h-[280px]">
      <div className="flex items-center justify-between mb-4 md:mb-10">
        <div className="p-2 md:p-3 rounded-xl bg-white/5 border border-white/10">
          <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </div>
        <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 text-xs">...</div>
      </div>
      <div>
        <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1 md:mb-2">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl md:text-6xl font-black tracking-tighter leading-none">{value}</p>
          {subtitle && <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">{subtitle}</span>}
        </div>
        {children}
      </div>
    </div>
  );
}
