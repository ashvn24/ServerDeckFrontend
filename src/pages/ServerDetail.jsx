import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, FileText, Shield, Cpu, HardDrive, MemoryStick, Clock, Wifi, Terminal, Trash2, AlertTriangle } from 'lucide-react';
import { serversAPI } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { formatUptime, formatMB } from '../utils/formatters';
import StatusBadge from '../components/common/StatusBadge';
import ResourceGauge from '../components/server/ResourceGauge';
import ServiceList from '../components/server/ServiceList';
import LoadingSpinner from '../components/common/LoadingSpinner';
import SSHTerminal from '../components/server/SSHTerminal';
import FileManager from '../components/server/FileManager';

const TABS = ['Overview', 'Nginx Sites', 'PM2 Apps', 'Services', 'SSH', 'Files'];

export default function ServerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [server, setServer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { user } = useAuth();
  const { watchServer, unwatchServer, sendCommand, on, send, connected } = useWebSocket();

  const isAdmin = user?.role === 'owner' || user?.role === 'admin';

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

  // Listen for real-time telemetry
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
      alert('Failed to delete server. Please try again.');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleServiceAction = async (name, action) => {
    const prefix = activeTab === 1 ? 'nginx' : activeTab === 2 ? 'pm2' : 'systemd';
    try {
      await sendCommand(id, `${prefix}.${action}`, { name });
      // Refresh server data after action
      setTimeout(fetchServer, 1000);
    } catch (err) {
      console.error(`${prefix}.${action} failed:`, err);
    }
  };

  if (loading) return <LoadingSpinner size="lg" text="Loading server details..." />;
  if (!server) return <div className="text-center py-20 text-gray-500">Server not found</div>;

  const ramPercent = server.ram_total_mb ? (server.ram_used_mb / server.ram_total_mb) * 100 : 0;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/servers')} className="p-2.5 rounded-2xl bg-white/40 border border-white/60 shadow-sm hover:bg-white/80 hover:shadow-md transition-all duration-300 flex-shrink-0">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight truncate">{server.name}</h1>
              <StatusBadge status={server.is_online ? 'online' : 'offline'} size="sm" />
            </div>
            <p className="text-xs md:text-sm font-medium text-gray-500 truncate">
              {server.ip_address || '—'} <span className="mx-2 text-gray-300">•</span> {server.os_info || 'Unknown OS'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 -mb-2 no-scrollbar lg:pb-0 lg:mb-0">
          <button onClick={() => navigate(`/servers/${id}/sites`)} className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/60 backdrop-blur-md border border-white/80 shadow-sm text-xs font-bold text-gray-700 hover:bg-white transition-all whitespace-nowrap">
            <Globe className="w-3.5 h-3.5 text-primary-500" /> Sites
          </button>
          <button onClick={() => navigate(`/servers/${id}/logs`)} className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/60 backdrop-blur-md border border-white/80 shadow-sm text-xs font-bold text-gray-700 hover:bg-white transition-all whitespace-nowrap">
            <FileText className="w-3.5 h-3.5 text-amber-500" /> Logs
          </button>
          <button onClick={() => navigate(`/servers/${id}/ssl`)} className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/60 backdrop-blur-md border border-white/80 shadow-sm text-xs font-bold text-gray-700 hover:bg-white transition-all whitespace-nowrap">
            <Shield className="w-3.5 h-3.5 text-emerald-500" /> SSL
          </button>
          <button onClick={() => setActiveTab(4)} className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/60 backdrop-blur-md border border-white/80 shadow-sm text-xs font-bold text-gray-700 hover:bg-white transition-all whitespace-nowrap">
            <Terminal className="w-3.5 h-3.5 text-violet-500" /> SSH
          </button>
          {isAdmin && (
            <button 
              onClick={() => setShowDeleteModal(true)} 
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-50 border border-red-100 shadow-sm text-xs font-bold text-red-600 hover:bg-red-100 transition-all whitespace-nowrap"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-8 bg-white/40 backdrop-blur-xl border border-white/60 p-1.5 rounded-2xl w-full lg:w-max shadow-sm overflow-x-auto no-scrollbar">
        {TABS.map((tab, idx) => (
          <button
            key={tab}
            onClick={() => setActiveTab(idx)}
            className={`py-2.5 px-5 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap
              ${activeTab === idx 
                ? 'bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] text-primary-600 border border-white/80' 
                : 'text-gray-500 hover:text-gray-900 border border-transparent hover:bg-white/40'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard icon={Cpu} label="CPU" value={`${(server.cpu_percent || 0).toFixed(1)}%`} color="blue">
            <ResourceGauge label="" value={server.cpu_percent || 0} max={100} />
          </StatCard>
          <StatCard icon={MemoryStick} label="Memory" value={formatMB(server.ram_used_mb)} subtitle={`of ${formatMB(server.ram_total_mb)}`} color="violet">
            <ResourceGauge label="" value={ramPercent} max={100} />
          </StatCard>
          <StatCard icon={HardDrive} label="Disk" value={`${(server.disk_used_percent || 0).toFixed(1)}%`} color="amber">
            <ResourceGauge label="" value={server.disk_used_percent || 0} max={100} />
          </StatCard>
          <StatCard icon={Clock} label="Uptime" value={formatUptime(server.uptime_seconds)} color="emerald">
            <div className="flex items-center gap-1.5 mt-2">
              <Wifi className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs text-gray-500">Connected</span>
            </div>
          </StatCard>
        </div>
      )}

      {activeTab === 1 && (
        <div className="bg-white/60 backdrop-blur-xl border border-white/60 shadow-glass rounded-[2rem] p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Nginx Sites</h3>
          <ServiceList services={server.nginx_sites || []} type="nginx" onAction={handleServiceAction} isAdmin={isAdmin} />
        </div>
      )}

      {activeTab === 2 && (
        <div className="bg-white/60 backdrop-blur-xl border border-white/60 shadow-glass rounded-[2rem] p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">PM2 Applications</h3>
          <ServiceList services={server.pm2_apps || []} type="pm2" onAction={handleServiceAction} isAdmin={isAdmin} />
        </div>
      )}

      {activeTab === 3 && (
        <div className="bg-white/60 backdrop-blur-xl border border-white/60 shadow-glass rounded-[2rem] p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Systemd Services</h3>
          <ServiceList services={server.systemd_services || []} type="systemd" onAction={handleServiceAction} isAdmin={isAdmin} />
        </div>
      )}

      {/* SSH tab — always mounted so the PTY session survives tab switches */}
      <div style={{ display: activeTab === 4 ? 'block' : 'none' }}>
        <SSHTerminal serverId={id} isOnline={server.is_online} wsConnected={connected} send={send} on={on} isActive={activeTab === 4} />
      </div>

      {activeTab === 5 && (
        <FileManager serverId={id} sendCommand={sendCommand} isOnline={server.is_online} isAdmin={isAdmin} />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => !deleting && setShowDeleteModal(false)} />
          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-white/40 w-full max-w-md relative z-10 overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8">
              <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center mb-6 ring-8 ring-red-50/50">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Delete Server?</h3>
              <p className="text-gray-500 leading-relaxed mb-8">
                This will permanently remove <span className="font-bold text-gray-900">{server.name}</span> from your dashboard. 
                {server.is_online && (
                  <span className="block mt-2 font-medium text-red-600 bg-red-50 p-3 rounded-2xl border border-red-100 text-sm leading-snug">
                    The agent is online. Deletion will attempt to uninstall the service and remove all related files from the server automatically.
                  </span>
                )}
              </p>
              
              <div className="flex gap-3">
                <button
                  disabled={deleting}
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-6 py-3.5 rounded-2xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  disabled={deleting}
                  onClick={handleDeleteServer}
                  className="flex-1 px-6 py-3.5 rounded-2xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Deleting...
                    </>
                  ) : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, subtitle, color, children }) {
  const bgColors = {
    blue: 'bg-blue-50', violet: 'bg-violet-50', amber: 'bg-amber-50', emerald: 'bg-emerald-50',
  };
  const iconColors = {
    blue: 'text-blue-600', violet: 'text-violet-600', amber: 'text-amber-600', emerald: 'text-emerald-600',
  };

  return (
    <div className="bg-white/60 backdrop-blur-xl border border-white/60 shadow-glass rounded-[2rem] p-6 relative overflow-hidden">
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full ${bgColors[color]} blur-2xl opacity-50 pointer-events-none`} />
      <div className="flex items-center gap-4 mb-4 relative z-10">
        <div className={`p-3 rounded-2xl ${bgColors[color]} ring-1 ring-inset ring-white/50 shadow-sm`}>
          <Icon className={`w-6 h-6 ${iconColors[color]}`} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
            {subtitle && <span className="text-xs font-medium text-gray-500">{subtitle}</span>}
          </div>
        </div>
      </div>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
