import { Globe, Lock, ExternalLink, Trash2 } from 'lucide-react';

export default function SiteCard({ site, onDelete, isAdmin }) {
  return (
    <div className="glass-card group p-6 hover:bg-white/10 transition-all duration-500 relative overflow-hidden">
      {/* Background Accent */}
      <div className={`absolute -right-8 -top-8 w-24 h-24 rounded-full blur-2xl opacity-10 transition-opacity group-hover:opacity-20 ${
        site.site_type === 'backend' ? 'bg-violet-500' : 'bg-emerald-500'
      }`} />

      <div className="flex items-start justify-between relative z-10">
        <div className="flex items-center gap-5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border border-white/5 shadow-inner ${
            site.site_type === 'backend' ? 'bg-violet-500/10 text-violet-500' : 'bg-emerald-500/10 text-emerald-500'
          }`}>
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h4 className="text-sm font-black text-white uppercase tracking-tight font-display">{site.domain}</h4>
              {site.ssl_enabled && (
                <Lock className="w-3.5 h-3.5 text-[var(--accent-mint)]" title="SSL SECURED" />
              )}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${
                site.site_type === 'backend' ? 'bg-violet-500/5 text-violet-400 border-violet-500/10' : 'bg-emerald-500/5 text-emerald-400 border-emerald-500/10'
              }`}>
                {site.site_type}
              </span>
              {site.upstream_port && (
                <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-md">
                   Port {site.upstream_port}
                </span>
              )}
              {site.is_ssr && (
                <span className="text-[10px] font-bold text-[var(--accent-mint)] uppercase tracking-widest bg-[var(--accent-mint)]/5 px-2 py-0.5 rounded-md border border-[var(--accent-mint)]/10">
                   SSR READY
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={`w-1.5 h-1.5 rounded-full ${site.is_active ? 'accent-bg-green animate-pulse-dot' : 'bg-red-500'}`} />
          
          {isAdmin && onDelete && (
            <button
              onClick={() => onDelete(site.id)}
              className="p-2.5 rounded-xl bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          
          <a 
            href={`https://${site.domain}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2.5 rounded-xl bg-white/5 text-[var(--text-secondary)] hover:text-white hover:bg-white/10 transition-all"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

