import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Server, Globe, ArrowUpRight, ArrowDownRight, Activity, Cpu, HardDrive, Wifi, WifiOff } from 'lucide-react';
import { serversAPI } from '../api/endpoints';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Dashboard() {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServers = async () => {
      try {
        const res = await serversAPI.list();
        setServers(res.data);
      } catch (err) {
        console.error('Failed to fetch servers for analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchServers();
    const interval = setInterval(fetchServers, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) return <LoadingSpinner size="lg" text="Analyzing infrastructure..." />;

  const onlineServers = servers.filter(s => s.is_online);
  const avgCpu = servers.length > 0 
    ? (servers.reduce((acc, s) => acc + (s.cpu_percent || 0), 0) / servers.length).toFixed(1)
    : 0;
  
  const totalSites = servers.reduce((acc, s) => {
    const sites = s.nginx_sites || [];
    return acc + (Array.isArray(sites) ? sites.length : Object.keys(sites).length);
  }, 0);

  const totalRamUsed = servers.reduce((acc, s) => acc + (s.ram_used_mb || 0), 0);
  const totalRam = servers.reduce((acc, s) => acc + (s.ram_total_mb || 0), 0);
  const ramPercent = totalRam > 0 ? ((totalRamUsed / totalRam) * 100).toFixed(1) : 0;

  const topCpuServers = [...servers]
    .sort((a, b) => (b.cpu_percent || 0) - (a.cpu_percent || 0))
    .slice(0, 5);

  const stats = [
    { label: 'Avg CPU Usage', value: `${avgCpu}%`, icon: Cpu, color: 'blue' },
    { label: 'Global Memory', value: `${ramPercent}%`, icon: BarChart3, color: 'violet' },
    { label: 'Active Sites', value: totalSites.toString(), icon: Globe, color: 'emerald' },
    { label: 'Total Servers', value: servers.length.toString(), icon: Server, color: 'amber' },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Analytics Overview</h1>
          <p className="text-gray-500 font-medium mt-1">Real-time health and performance across {servers.length} servers</p>
        </div>
        <div className="flex gap-3">
          <div className="px-4 py-2 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-700">{onlineServers.length} Online</span>
          </div>
          <div className="px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gray-400" />
            <span className="text-xs font-bold text-gray-600">{servers.length - onlineServers.length} Offline</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2rem] p-6 shadow-glass relative overflow-hidden group">
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full bg-${stat.color}-50 blur-2xl opacity-50 group-hover:opacity-80 transition-opacity`} />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className={`p-3 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 ring-1 ring-inset ring-${stat.color}-100`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top Consumers */}
        <div className="lg:col-span-1 bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2.5rem] p-8 shadow-glass">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-500" />
            Top CPU Consumers
          </h3>
          <div className="space-y-6">
            {topCpuServers.map(server => (
              <div key={server.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${server.is_online ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                  <span className="text-sm font-bold text-gray-700 truncate max-w-[120px]">{server.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${server.cpu_percent > 80 ? 'bg-red-500' : server.cpu_percent > 50 ? 'bg-amber-500' : 'bg-primary-500'}`}
                      style={{ width: `${server.cpu_percent || 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-extrabold text-gray-900 w-8">{(server.cpu_percent || 0).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resource Charts Placeholder */}
        <div className="lg:col-span-2 bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2.5rem] p-8 shadow-glass flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mb-6">
            <Activity className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Resource Utilization Over Time</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Aggregated metrics for all servers. Integration with time-series data coming soon to visualize performance trends across your cluster.
          </p>
        </div>
      </div>
    </div>
  );
}
