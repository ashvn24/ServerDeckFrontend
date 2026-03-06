import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, FileText, Shield, Cpu, HardDrive, MemoryStick, Clock, Wifi } from 'lucide-react';
import { serversAPI } from '../api/endpoints';
import { useWebSocket } from '../hooks/useWebSocket';
import { formatUptime, formatMB } from '../utils/formatters';
import StatusBadge from '../components/common/StatusBadge';
import ResourceGauge from '../components/server/ResourceGauge';
import ServiceList from '../components/server/ServiceList';
import LoadingSpinner from '../components/common/LoadingSpinner';

const TABS = ['Overview', 'Nginx Sites', 'PM2 Apps', 'Services'];

export default function ServerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [server, setServer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const { watchServer, unwatchServer, sendCommand, on } = useWebSocket();

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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 rounded-xl hover:bg-gray-200 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{server.name}</h1>
              <StatusBadge status={server.is_online ? 'online' : 'offline'} size="md" />
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {server.ip_address || '—'} · {server.os_info || 'Unknown OS'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => navigate(`/servers/${id}/sites`)} className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Globe className="w-4 h-4" /> Sites
          </button>
          <button onClick={() => navigate(`/servers/${id}/logs`)} className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <FileText className="w-4 h-4" /> Logs
          </button>
          <button onClick={() => navigate(`/servers/${id}/ssl`)} className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Shield className="w-4 h-4" /> SSL
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1">
        {TABS.map((tab, idx) => (
          <button
            key={tab}
            onClick={() => setActiveTab(idx)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200
              ${activeTab === idx ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
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
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Nginx Sites</h3>
          <ServiceList services={server.nginx_sites || []} type="nginx" onAction={handleServiceAction} />
        </div>
      )}

      {activeTab === 2 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">PM2 Applications</h3>
          <ServiceList services={server.pm2_apps || []} type="pm2" onAction={handleServiceAction} />
        </div>
      )}

      {activeTab === 3 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Systemd Services</h3>
          <ServiceList services={server.systemd_services || []} type="systemd" onAction={handleServiceAction} />
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
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-xl ${bgColors[color]}`}>
          <Icon className={`w-5 h-5 ${iconColors[color]}`} />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
          <div className="flex items-baseline gap-1.5">
            <p className="text-xl font-bold text-gray-900">{value}</p>
            {subtitle && <span className="text-xs text-gray-500">{subtitle}</span>}
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
