import { Link } from 'react-router-dom';
import { ChevronRight, MoreVertical } from 'lucide-react';

export default function ServerCard({ server, isAdmin, onMove }) {
  const ramPercent = server.ram_total_mb ? (server.ram_used_mb / server.ram_total_mb) * 100 : 0;

  return (
    <Link 
      to={`/servers/${server.id}`}
      className="glass-card group p-5 md:p-8 flex flex-col justify-between min-h-[180px] md:min-h-[260px] relative overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:bg-[var(--bg-card-hover)] active:scale-[0.98]"
    >
      {/* Status Background Glow */}
      <div className={`absolute -right-12 -top-12 w-32 h-32 rounded-full blur-[80px] opacity-20 transition-opacity duration-500 ${
        server.is_online ? 'bg-[var(--accent-mint)] group-hover:opacity-40' : 'bg-red-500 group-hover:opacity-30'
      }`} />

      <div className="flex items-start justify-between mb-5 md:mb-8 relative z-10">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-2 h-2 rounded-full ${server.is_online ? 'bg-[var(--accent-mint)]' : 'bg-red-500'} animate-pulse-dot`} />
            <h3 className="text-base md:text-xl font-black text-white uppercase tracking-tight font-display truncate">
              {server.name}
            </h3>
          </div>
          <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest truncate">
            {server.ip_address || 'Unassigned IP'}
          </p>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          {isAdmin && (
            <button 
              onClick={(e) => { 
                e.preventDefault(); 
                e.stopPropagation();
                onMove(server); 
              }}
              className="p-2 md:p-3 text-[var(--text-secondary)] hover:text-white hover:bg-white/10 rounded-xl transition-all relative z-20"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          )}
          <div className="p-2 md:p-3 bg-white/5 text-white rounded-xl group-hover:bg-[var(--accent-violet)] transition-all">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="space-y-4 md:space-y-6 relative z-10">
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          <div className="space-y-1 md:space-y-2">
            <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">CPU</p>
            <p className="text-base md:text-lg font-black text-white">{(server.cpu_percent || 0).toFixed(0)}%</p>
          </div>
          <div className="space-y-1 md:space-y-2">
            <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">RAM</p>
            <p className="text-base md:text-lg font-black text-white">{ramPercent.toFixed(0)}%</p>
          </div>
          <div className="space-y-1 md:space-y-2 text-right">
            <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">DISK</p>
            <p className="text-base md:text-lg font-black text-white">{(server.disk_used_percent || 0).toFixed(0)}%</p>
          </div>
        </div>

        {/* Connection status bar */}
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${server.is_online ? 'bg-[var(--accent-mint)]' : 'bg-red-500'}`} 
            style={{ width: `${server.is_online ? 100 : 0}%` }} 
          />
        </div>
      </div>
    </Link>
  );
}
