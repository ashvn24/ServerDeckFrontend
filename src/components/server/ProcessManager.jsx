import { useState, useEffect, useMemo } from 'react';
import { Cpu, Search, Trash2, Loader2, RefreshCw, X, AlertTriangle } from 'lucide-react';

export default function ProcessManager({ serverId, sendCommand, isAdmin }) {
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchProcesses = async () => {
    setLoading(true);
    try {
      const res = await sendCommand(serverId, 'process.list');
      if (res.error) throw new Error(res.error);
      setProcesses(res.processes || []);
    } catch (err) {
      console.error('Failed to fetch processes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcesses();
    const interval = setInterval(fetchProcesses, 5000);
    return () => clearInterval(interval);
  }, [serverId]);

  const handleKill = async (pid) => {
    setActionLoading(pid);
    try {
      const res = await sendCommand(serverId, 'process.kill', { pid });
      if (res.error) throw new Error(res.error);
      fetchProcesses();
    } catch (err) {
      console.error('Failed to kill process:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredProcesses = useMemo(() => {
    if (!search.trim()) return processes;
    const s = search.toLowerCase();
    return processes.filter(p => 
      p.name.toLowerCase().includes(s) || 
      p.user.toLowerCase().includes(s) || 
      String(p.pid).includes(s)
    );
  }, [processes, search]);

  return (
    <div className="glass-card p-10">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-red-500 rounded-2xl shadow-lg shadow-red-500/20 text-white">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight font-display">System Monitor</h3>
            <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-1">Live node process distribution</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] group-focus-within:text-white transition-colors" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter tasks..."
              className="pl-12 pr-12 py-3 bg-black/40 border border-[var(--border-color)] rounded-xl text-xs text-white focus:border-[var(--accent-violet)] outline-none transition-all w-full lg:w-64 font-bold uppercase tracking-widest"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
              </button>
            )}
          </div>
          <button 
            onClick={fetchProcesses}
            className="p-3 rounded-xl bg-white/5 text-[var(--text-secondary)] hover:text-white hover:bg-white/10 transition-all"
          >
            <RefreshCw className={`w-5 h-5 ${loading && processes.length === 0 ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading && processes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-[var(--accent-violet)] animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Fetching process tree...</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-6 px-6 mb-4 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">
            <span>PID</span>
            <span className="col-span-2">Task</span>
            <span>CPU</span>
            <span>Memory</span>
            <span className="text-right">Action</span>
          </div>
          {filteredProcesses.map((p) => (
            <div key={p.pid} className="grid grid-cols-6 items-center p-5 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all group">
              <span className="text-xs font-bold text-[var(--text-secondary)]">{p.pid}</span>
              <div className="col-span-2 min-w-0">
                <p className="text-sm font-black text-white uppercase tracking-tight truncate">{p.name}</p>
                <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">{p.user}</p>
              </div>
              <div>
                <div className="flex items-center gap-3">
                   <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${p.cpu_percent > 80 ? 'bg-red-500' : p.cpu_percent > 50 ? 'bg-amber-500' : 'accent-bg-green'}`}
                        style={{ width: `${Math.min(p.cpu_percent, 100)}%` }}
                      />
                   </div>
                   <span className="text-xs font-bold text-white">{p.cpu_percent.toFixed(0)}%</span>
                </div>
              </div>
              <span className="text-xs font-bold text-white">{p.memory_mb} MB</span>
              <div className="text-right">
                {isAdmin && (
                  <button
                    onClick={() => handleKill(p.pid)}
                    disabled={actionLoading === p.pid}
                    className="p-2.5 rounded-xl text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/10 transition-all"
                  >
                    {actionLoading === p.pid ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
