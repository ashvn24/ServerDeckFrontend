import { useState, useEffect } from 'react';
import { Box, Server, Globe, Cpu, MemoryStick, HardDrive, Activity, Wifi, WifiOff, Clock } from 'lucide-react';
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
    const interval = setInterval(fetchServers, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <LoadingSpinner size="lg" text="Analyzing infrastructure..." />;

  const onlineServers = servers.filter(s => s.is_online);
  const avgCpu = servers.length > 0 
    ? (servers.reduce((acc, s) => acc + (s.cpu_percent || 0), 0) / servers.length).toFixed(0)
    : 0;
  
  const totalSites = servers.reduce((acc, s) => {
    const sites = s.nginx_sites || [];
    return acc + (Array.isArray(sites) ? sites.length : Object.keys(sites).length);
  }, 0);

  const totalRamUsed = servers.reduce((acc, s) => acc + (s.ram_used_mb || 0), 0);
  const totalRam = servers.reduce((acc, s) => acc + (s.ram_total_mb || 0), 0);
  const ramPercent = totalRam > 0 ? ((totalRamUsed / totalRam) * 100).toFixed(0) : 0;

  const diskAvg = servers.length > 0 
    ? (servers.reduce((acc, s) => acc + (s.disk_used_percent || 0), 0) / servers.length).toFixed(0)
    : 0;

  return (
    <div className="space-y-12">
      {/* Overview Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-black tracking-tight uppercase font-display">Overview</h1>
        <div className="flex items-center gap-6 text-sm font-bold tracking-widest text-[var(--text-secondary)] uppercase">
          <div className="flex items-center gap-2">
            <span className="text-white text-3xl font-black leading-none">11:37 AM</span>
            <span className="mt-1.5">Time</span>
          </div>
          <span className="text-white text-3xl font-black leading-none">{new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Stats Card (Reference Style) */}
        <div className="lg:col-span-2 glass-card p-10 flex flex-col justify-between min-h-[400px]">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-2xl font-bold tracking-tight">Total infrastructure load</h2>
            <button className="px-5 py-2 rounded-full border border-[var(--border-color)] text-xs font-bold uppercase tracking-widest hover:bg-[var(--bg-card-hover)] transition-colors">
              Refresh Node
            </button>
          </div>

          <div className="flex items-end justify-between gap-8 mb-10">
            {/* CPU Bar */}
            <div className="flex-1 space-y-8">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                <span>CPU Usage ↑</span>
                <span className="text-white">...</span>
              </div>
              <div className="flex items-end gap-1.5 h-32">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="flex-1 bg-[var(--bg-card-hover)] rounded-full relative overflow-hidden" style={{ height: `${20 + Math.random() * 80}%` }}>
                    <div className="absolute inset-x-0 bottom-0 bg-white opacity-20" style={{ height: `${avgCpu}%` }} />
                  </div>
                ))}
              </div>
              <div>
                <p className="text-6xl font-black tracking-tighter">0-{avgCpu}</p>
                <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-1">% Load across cluster</p>
              </div>
            </div>

            {/* RAM Bar */}
            <div className="flex-1 space-y-8">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                <span>RAM Allocation ↓</span>
                <span className="text-white">...</span>
              </div>
              <div className="flex items-end gap-1.5 h-32">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="flex-1 bg-[var(--bg-card-hover)] rounded-full relative overflow-hidden" style={{ height: `${30 + Math.random() * 70}%` }}>
                    <div className="absolute inset-x-0 bottom-0 bg-white opacity-20" style={{ height: `${ramPercent}%` }} />
                  </div>
                ))}
              </div>
              <div>
                <p className="text-6xl font-black tracking-tighter">0-{ramPercent}</p>
                <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-1">% Memory allocated</p>
              </div>
            </div>

            {/* Disk Bar */}
            <div className="flex-1 space-y-8">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                <span>Storage ↓</span>
                <span className="text-white">...</span>
              </div>
              <div className="flex items-end gap-1.5 h-32">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="flex-1 bg-[var(--bg-card-hover)] rounded-full relative overflow-hidden" style={{ height: `${40 + Math.random() * 60}%` }}>
                    <div className="absolute inset-x-0 bottom-0 bg-white opacity-20" style={{ height: `${diskAvg}%` }} />
                  </div>
                ))}
              </div>
              <div>
                <p className="text-6xl font-black tracking-tighter">0-{diskAvg}</p>
                <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-1">% Disk utilized</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section Cards */}
        <div className="space-y-8">
          <div className="glass-card p-8 flex flex-col justify-between h-[280px]">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold tracking-tight">Active Nodes</h3>
              <div className="w-8 h-8 rounded-lg bg-[var(--bg-card-hover)] flex items-center justify-center text-white">...</div>
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-4">Cluster Health</p>
              <div className="relative aspect-square w-24 mx-auto mb-4 border-2 border-dashed border-[var(--border-color)] rounded-2xl flex items-center justify-center overflow-hidden">
                <div className="cube-container">
                  <div className="cube">
                    <div className="cube-face face-front"></div>
                    <div className="cube-face face-back"></div>
                    <div className="cube-face face-right"></div>
                    <div className="cube-face face-left"></div>
                    <div className="cube-face face-top"></div>
                    <div className="cube-face face-bottom"></div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--accent-mint)]/10 to-transparent pointer-events-none" />
              </div>
              <div className="flex items-center justify-between text-sm font-bold">
                <span className="text-[var(--text-secondary)] uppercase tracking-widest text-[10px]">Portal Connection</span>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-1.5 bg-[var(--bg-card-hover)] rounded-full overflow-hidden">
                    <div className="h-full accent-bg-green" style={{ width: '83%' }} />
                  </div>
                  <span className="text-white">83%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-8 h-[200px] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold tracking-tight">Status</h3>
              <div className="w-8 h-8 rounded-lg bg-[var(--bg-card-hover)] flex items-center justify-center text-white">...</div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Network Reachability</p>
              <p className="text-4xl font-black tracking-tight">{onlineServers.length}/{servers.length}</p>
              <p className="text-[10px] font-bold text-[var(--accent-mint)] uppercase tracking-widest mt-1">Servers Online</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="glass-card accent-bg-green p-8 flex flex-col justify-between h-[240px]">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold tracking-tight">Tracking</h3>
              <span className="text-black">...</span>
            </div>
            <p className="text-[10px] font-bold text-black/60 uppercase tracking-widest">Active Site Count</p>
          </div>
          <div>
            <p className="text-6xl font-black tracking-tighter leading-none">{totalSites}</p>
            <p className="text-[10px] font-bold text-black/60 uppercase tracking-widest mt-2">Global Sites</p>
          </div>
        </div>

        <div className="lg:col-span-1 glass-card p-8 flex flex-col justify-between h-[240px]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold tracking-tight">Summary</h3>
            <button className="px-3 py-1 rounded-full border border-[var(--border-color)] text-[10px] font-bold uppercase tracking-widest">Week ↓</button>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-6">Nodes Distribution</p>
            <div className="flex items-end justify-between h-16 gap-2">
              {[60, 80, 40, 70, 90, 50, 65].map((h, i) => (
                <div key={i} className="flex-1 bg-[var(--bg-card-hover)] rounded-sm relative group overflow-hidden">
                   <div 
                    className="absolute inset-x-0 bottom-0 bg-white/10 group-hover:bg-white/30 transition-all" 
                    style={{ height: `${h}%` }} 
                  />
                  {i === 2 && <div className="absolute inset-x-0 bottom-0 bg-white h-2" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 glass-card p-8 flex flex-col justify-between h-[240px]">
           <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold tracking-tight">Service Health usage</h3>
            <button className="px-4 py-1.5 rounded-full bg-white text-black text-[10px] font-bold uppercase tracking-widest">Change</button>
          </div>
          <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-4">Active system services</p>
          
          <div className="flex items-end justify-between">
            <div>
              <p className="text-6xl font-black tracking-tighter leading-none">94%</p>
              <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-2">Avg Uptime Cluster</p>
            </div>
            <div className="flex-1 ml-12 pb-2">
               <div className="relative h-1 bg-[var(--border-color)] rounded-full">
                  <div className="absolute inset-y-0 left-0 bg-white/20 w-full rounded-full" />
                  <div className="absolute -top-1.5 left-[10%] w-4 h-4 rounded-full border-2 border-[var(--bg-main)] bg-[var(--bg-card-hover)]" />
                  <div className="absolute -top-1.5 left-[30%] w-4 h-4 rounded-full border-2 border-[var(--bg-main)] bg-[var(--bg-card-hover)]" />
                  <div className="absolute -top-1.5 left-[50%] w-4 h-4 rounded-full border-2 border-[var(--bg-main)] bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                  <div className="absolute -top-1.5 left-[70%] w-4 h-4 rounded-full border-2 border-[var(--bg-main)] bg-white" />
                  <div className="absolute -top-1.5 left-[90%] w-4 h-4 rounded-full border-2 border-[var(--bg-main)] bg-white" />
               </div>
               <div className="flex justify-between mt-4 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">
                  <span>11AM</span>
                  <span>12PM</span>
                  <span>1PM</span>
                  <span>2PM</span>
                  <span>3PM</span>
                  <span>4PM</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
