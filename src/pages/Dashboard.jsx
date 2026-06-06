import { useState, useEffect } from 'react';
import { Box, Server, Globe, Cpu, MemoryStick, HardDrive, Activity, Wifi, WifiOff, Clock } from 'lucide-react';
import { serversAPI } from '../api/endpoints';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useMobile } from '../hooks/useMobile';

export default function Dashboard() {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useMobile();

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

  /* ─── Mobile layout ─────────────────────────────────────────────── */
  if (isMobile) {
    return (
      <div className="space-y-4">
        {/* Mobile Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight uppercase font-display">Overview</h1>
          <div className="text-right">
            <p className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest">
              {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
            </p>
          </div>
        </div>

        {/* Status hero card */}
        <div className="glass-card p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">Network Status</p>
            <p className="text-4xl font-black tracking-tighter leading-none">{onlineServers.length}<span className="text-xl text-[var(--text-secondary)] font-bold">/{servers.length}</span></p>
            <p className="text-[10px] font-black text-[var(--accent-mint)] uppercase tracking-widest mt-1">Nodes Online</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">Sites</p>
            <p className="text-4xl font-black tracking-tighter leading-none">{totalSites}</p>
            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mt-1">Active</p>
          </div>
        </div>

        {/* Horizontal-scroll stat chips */}
        <div className="mobile-stat-row">
          {[
            { label: 'CPU Load', value: `${avgCpu}%`, sub: 'Avg Cluster' },
            { label: 'RAM', value: `${ramPercent}%`, sub: 'Allocated' },
            { label: 'Disk', value: `${diskAvg}%`, sub: 'Utilized' },
            { label: 'Uptime', value: '94%', sub: 'Avg Cluster' },
          ].map(stat => (
            <div key={stat.label} className="mobile-stat-chip">
              <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">{stat.label}</p>
              <p className="text-2xl font-black tracking-tighter leading-none">{stat.value}</p>
              <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-1">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Mini bar charts row — CPU, RAM, Disk */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold tracking-tight">Infrastructure Load</h2>
            <button className="px-4 py-1.5 rounded-full border border-[var(--border-color)] text-[10px] font-bold uppercase tracking-widest">
              Refresh
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'CPU', value: avgCpu },
              { label: 'RAM', value: ramPercent },
              { label: 'Disk', value: diskAvg },
            ].map(({ label, value }) => (
              <div key={label} className="space-y-2">
                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">{label}</p>
                <div className="flex items-end gap-0.5 h-16">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="flex-1 bg-[var(--bg-card-hover)] rounded-full relative overflow-hidden" style={{ height: `${20 + Math.random() * 80}%` }}>
                      <div className="absolute inset-x-0 bottom-0 bg-white opacity-20" style={{ height: `${value}%` }} />
                    </div>
                  ))}
                </div>
                <p className="text-xl font-black tracking-tighter">0-{value}%</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom 2-col row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Sites tracking */}
          <div className="glass-card accent-bg-green p-4 flex flex-col justify-between min-h-[140px]">
            <div>
              <h3 className="text-base font-bold tracking-tight">Sites</h3>
              <p className="text-[10px] font-bold text-black/60 uppercase tracking-widest">Active Count</p>
            </div>
            <p className="text-4xl font-black tracking-tighter leading-none">{totalSites}</p>
          </div>

          {/* Summary sparkline */}
          <div className="glass-card p-4 flex flex-col justify-between min-h-[140px]">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold tracking-tight">Nodes</h3>
              <button className="px-2 py-1 rounded-full border border-[var(--border-color)] text-[9px] font-bold uppercase">Week</button>
            </div>
            <div className="flex items-end justify-between gap-1 h-10">
              {[60, 80, 40, 70, 90, 50, 65].map((h, i) => (
                <div key={i} className="flex-1 bg-[var(--bg-card-hover)] rounded-sm relative overflow-hidden">
                  <div className="absolute inset-x-0 bottom-0 bg-white/10" style={{ height: `${h}%` }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Uptime card */}
        <div className="glass-card p-5 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold tracking-tight">Service Health</h3>
            <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Active system services</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-black tracking-tighter leading-none">94%</p>
            <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-1">Avg Uptime</p>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Desktop layout (unchanged) ───────────────────────────────── */
  return (
    <div className="space-y-6 md:space-y-12">
      {/* Overview Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight uppercase font-display">Overview</h1>
        <div className="flex items-center gap-4 sm:gap-6 text-sm font-bold tracking-widest text-[var(--text-secondary)] uppercase">
          <div className="flex items-center gap-2">
            <span className="text-white text-2xl sm:text-3xl font-black leading-none">11:37 AM</span>
            <span className="mt-1.5">Time</span>
          </div>
          <span className="text-white text-2xl sm:text-3xl font-black leading-none">{new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Main Stats Card (Reference Style) */}
        <div className="lg:col-span-2 glass-card p-5 sm:p-6 md:p-10 flex flex-col justify-between min-h-0 lg:min-h-[400px]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5 sm:mb-8 md:mb-12">
            <h2 className="text-lg sm:text-2xl font-bold tracking-tight">Total infrastructure load</h2>
            <button className="self-start sm:self-auto px-5 py-2 rounded-full border border-[var(--border-color)] text-xs font-bold uppercase tracking-widest hover:bg-[var(--bg-card-hover)] transition-colors">
              Refresh Node
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 lg:gap-8 mb-6 md:mb-10">
            {/* CPU Bar */}
            <div className="space-y-3 sm:space-y-8">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                <span>CPU Usage ↑</span>
                <span className="text-white">...</span>
              </div>
              <div className="flex items-end gap-1.5 h-20 sm:h-32">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="flex-1 bg-[var(--bg-card-hover)] rounded-full relative overflow-hidden" style={{ height: `${20 + Math.random() * 80}%` }}>
                    <div className="absolute inset-x-0 bottom-0 bg-white opacity-20" style={{ height: `${avgCpu}%` }} />
                  </div>
                ))}
              </div>
              <div>
                <p className="text-3xl sm:text-4xl lg:text-6xl font-black tracking-tighter">0-{avgCpu}</p>
                <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-1">% Load across cluster</p>
              </div>
            </div>

            {/* RAM Bar */}
            <div className="space-y-3 sm:space-y-8">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                <span>RAM Allocation ↓</span>
                <span className="text-white">...</span>
              </div>
              <div className="flex items-end gap-1.5 h-20 sm:h-32">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="flex-1 bg-[var(--bg-card-hover)] rounded-full relative overflow-hidden" style={{ height: `${30 + Math.random() * 70}%` }}>
                    <div className="absolute inset-x-0 bottom-0 bg-white opacity-20" style={{ height: `${ramPercent}%` }} />
                  </div>
                ))}
              </div>
              <div>
                <p className="text-3xl sm:text-4xl lg:text-6xl font-black tracking-tighter">0-{ramPercent}</p>
                <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-1">% Memory allocated</p>
              </div>
            </div>

            {/* Disk Bar */}
            <div className="space-y-3 sm:space-y-8">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                <span>Storage ↓</span>
                <span className="text-white">...</span>
              </div>
              <div className="flex items-end gap-1.5 h-20 sm:h-32">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="flex-1 bg-[var(--bg-card-hover)] rounded-full relative overflow-hidden" style={{ height: `${40 + Math.random() * 60}%` }}>
                    <div className="absolute inset-x-0 bottom-0 bg-white opacity-20" style={{ height: `${diskAvg}%` }} />
                  </div>
                ))}
              </div>
              <div>
                <p className="text-3xl sm:text-4xl lg:text-6xl font-black tracking-tighter">0-{diskAvg}</p>
                <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-1">% Disk utilized</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section Cards */}
        <div className="space-y-6 lg:space-y-8">
          <div className="glass-card p-6 sm:p-8 flex flex-col justify-between h-[220px] sm:h-[280px]">
            <div className="flex items-center justify-between mb-4 sm:mb-8">
              <h3 className="text-lg sm:text-xl font-bold tracking-tight">Active Nodes</h3>
              <div className="w-8 h-8 rounded-lg bg-[var(--bg-card-hover)] flex items-center justify-center text-white">...</div>
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-4">Cluster Health</p>
              <div className="relative aspect-square w-16 sm:w-24 mx-auto mb-4 border-2 border-dashed border-[var(--border-color)] rounded-2xl flex items-center justify-center overflow-hidden">
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

          <div className="glass-card p-6 sm:p-8 h-[160px] sm:h-[200px] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-bold tracking-tight">Status</h3>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
        <div className="glass-card accent-bg-green p-6 sm:p-8 flex flex-col justify-between h-[200px] sm:h-[240px]">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold tracking-tight">Tracking</h3>
              <span className="text-black">...</span>
            </div>
            <p className="text-[10px] font-bold text-black/60 uppercase tracking-widest">Active Site Count</p>
          </div>
          <div>
            <p className="text-4xl sm:text-6xl font-black tracking-tighter leading-none">{totalSites}</p>
            <p className="text-[10px] font-bold text-black/60 uppercase tracking-widest mt-2">Global Sites</p>
          </div>
        </div>

        <div className="lg:col-span-1 glass-card p-6 sm:p-8 flex flex-col justify-between h-[200px] sm:h-[240px]">
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

        <div className="lg:col-span-2 glass-card p-6 sm:p-8 flex flex-col justify-between h-[200px] sm:h-[240px]">
           <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold tracking-tight">Service Health usage</h3>
            <button className="px-4 py-1.5 rounded-full bg-white text-black text-[10px] font-bold uppercase tracking-widest">Change</button>
          </div>
          <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-4">Active system services</p>
          
          <div className="flex items-end justify-between gap-6">
            <div className="shrink-0">
              <p className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter leading-none">94%</p>
              <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-2">Avg Uptime Cluster</p>
            </div>
            <div className="flex-1 ml-0 sm:ml-12 pb-2">
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
