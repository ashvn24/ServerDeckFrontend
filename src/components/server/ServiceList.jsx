import { Play, Square, RefreshCw, Loader2, FileText, Search, X, Code, Save } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ServiceList({ serverId, services = [], type = 'systemd', onAction, isAdmin, sendCommand }) {
  const navigate = useNavigate();
  const [loadingAction, setLoadingAction] = useState(null);
  const [search, setSearch] = useState('');
  
  const [editingConfig, setEditingConfig] = useState(null);
  const [configContent, setConfigContent] = useState('');
  const [isFetchingConfig, setIsFetchingConfig] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  const filteredServices = useMemo(() => {
    if (!search.trim()) return services;
    const s = search.toLowerCase();
    return services.filter(svc => {
      const name = (svc.name || svc.server_name || svc.filename || '').toLowerCase();
      const desc = (svc.description || '').toLowerCase();
      return name.includes(s) || desc.includes(s);
    });
  }, [services, search]);

  const handleAction = async (name, action) => {
    setLoadingAction(`${name}-${action}`);
    try {
      await onAction(name, action);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleOpenConfig = async (name) => {
    setEditingConfig(name);
    setIsFetchingConfig(true);
    try {
      const res = await sendCommand(serverId, 'nginx.get_config', { domain: name });
      if (res.error) throw new Error(res.error);
      setConfigContent(res.config);
    } catch (err) {
      console.error('Failed to fetch config:', err);
      setEditingConfig(null);
    } finally {
      setIsFetchingConfig(false);
    }
  };

  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    try {
      const res = await sendCommand(serverId, 'nginx.update_config', { 
        domain: editingConfig, 
        config: configContent 
      });
      if (res.error) throw new Error(res.error);
      setEditingConfig(null);
      onAction(null, 'list');
    } catch (err) {
      console.error('Failed to save config:', err);
    } finally {
      setIsSavingConfig(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] group-focus-within:text-white transition-colors" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${type === 'nginx' ? 'sites' : type === 'pm2' ? 'apps' : 'services'}...`}
          className="w-full pl-12 pr-12 py-3.5 bg-black/40 border border-[var(--border-color)] rounded-2xl text-sm text-white focus:border-[var(--accent-violet)] outline-none transition-all placeholder:text-gray-700 font-bold uppercase tracking-tight"
        />
        {search && (
          <button 
            onClick={() => setSearch('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>
        )}
      </div>

      <div className="space-y-3">
        {filteredServices.length === 0 ? (
          <div className="text-center py-16 bg-white/5 rounded-3xl border border-dashed border-[var(--border-color)]">
            <p className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-widest">
              {search ? 'No matches found' : `No ${type} available`}
            </p>
          </div>
        ) : (
          filteredServices.map((svc, idx) => {
            const name = svc.name || svc.server_name || svc.filename || `service-${idx}`;
            const isActive = type === 'nginx'
              ? true
              : (svc.active_state === 'active' || svc.status === 'online' || svc.sub_state === 'running');

            return (
              <div
                key={name}
                className="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all group"
              >
                <div className="flex items-center gap-5 min-w-0">
                  <div className={`w-2 h-2 rounded-full ${isActive ? 'accent-bg-green animate-pulse-dot' : 'bg-[var(--text-secondary)]'}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-black text-white uppercase tracking-tight truncate group-hover:text-[var(--accent-mint)] transition-colors">{name}</p>
                    {svc.description && (
                      <p className="text-[10px] text-[var(--text-secondary)] mt-1 truncate uppercase tracking-widest font-bold">{svc.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate(`/servers/${serverId}/logs?source=${type}&name=${name}`)}
                    className="p-2.5 rounded-xl text-[var(--text-secondary)] hover:text-white hover:bg-white/5 transition-all"
                    title="View Logs"
                  >
                    <FileText className="w-5 h-5" />
                  </button>

                  {type === 'nginx' && isAdmin && (
                    <button
                      onClick={() => handleOpenConfig(name)}
                      className="p-2.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--accent-violet)] hover:bg-[var(--accent-violet)]/10 transition-all"
                      title="Edit Nginx Config"
                    >
                      <Code className="w-5 h-5" />
                    </button>
                  )}

                  {isAdmin && (
                    <>
                      {!isActive && (
                        <button
                          onClick={() => handleAction(name, 'start')}
                          disabled={!!loadingAction}
                          className="p-2.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--accent-mint)] hover:bg-[var(--accent-mint)]/10 transition-all disabled:opacity-50"
                          title="Start"
                        >
                          {loadingAction === `${name}-start` ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                        </button>
                      )}
                      {isActive && (
                        <button
                          onClick={() => handleAction(name, 'stop')}
                          disabled={!!loadingAction}
                          className="p-2.5 rounded-xl text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-50"
                          title="Stop"
                        >
                          {loadingAction === `${name}-stop` ? <Loader2 className="w-5 h-5 animate-spin" /> : <Square className="w-5 h-5 fill-current" />}
                        </button>
                      )}
                      <button
                        onClick={() => handleAction(name, 'restart')}
                        disabled={!!loadingAction}
                        className="p-2.5 rounded-xl text-[var(--text-secondary)] hover:text-white hover:bg-white/5 transition-all disabled:opacity-50"
                        title="Restart"
                      >
                        {loadingAction === `${name}-restart` ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Nginx Config Modal Integration */}
      {editingConfig && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-8">
           <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => !isSavingConfig && setEditingConfig(null)} />
           <div className="glass-card w-full max-w-5xl relative z-10 flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight font-display">Edit Site Config</h3>
                  <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-1">{editingConfig}</p>
                </div>
                <button onClick={() => setEditingConfig(null)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                  <X className="w-6 h-6 text-[var(--text-secondary)]" />
                </button>
              </div>

              <div className="flex-1 overflow-hidden p-6">
                {isFetchingConfig ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <Loader2 className="w-10 h-10 text-[var(--accent-violet)] animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Loading configuration...</p>
                  </div>
                ) : (
                  <textarea
                    value={configContent}
                    onChange={(e) => setConfigContent(e.target.value)}
                    spellCheck={false}
                    className="w-full h-full p-6 bg-black/60 text-gray-300 font-mono text-sm rounded-3xl border border-[var(--border-color)] focus:border-[var(--accent-violet)] outline-none resize-none leading-relaxed"
                  />
                )}
              </div>

              <div className="p-6 border-t border-[var(--border-color)] flex items-center justify-between">
                <div className="flex items-center gap-3 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 rounded-full accent-bg-green" />
                  Auto-test on save
                </div>
                <div className="flex gap-4">
                  <button disabled={isSavingConfig} onClick={() => setEditingConfig(null)} className="px-8 py-3 rounded-xl bg-white/5 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                    Cancel
                  </button>
                  <button disabled={isSavingConfig || isFetchingConfig} onClick={handleSaveConfig} className="flex items-center gap-2 px-10 py-3 rounded-xl bg-[var(--accent-violet)] text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all active:scale-95 shadow-lg shadow-violet-500/20">
                    {isSavingConfig ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Node
                  </button>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
