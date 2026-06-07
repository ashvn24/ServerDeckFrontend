import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2, Activity, HardDrive, Cpu, AlertTriangle, Globe, ServerCrash } from 'lucide-react';
import api from '../api/client';
import { useNotification } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';

const metricIcons = {
  cpu: <Cpu className="w-4 h-4" />,
  ram: <Activity className="w-4 h-4" />,
  disk: <HardDrive className="w-4 h-4" />,
  server_offline: <ServerCrash className="w-4 h-4" />,
  service_down: <AlertTriangle className="w-4 h-4" />,
  ssl_expiry: <Globe className="w-4 h-4" />
};

const metricLabels = {
  cpu: 'CPU Usage %',
  ram: 'RAM Usage %',
  disk: 'Disk Usage %',
  server_offline: 'Server Offline',
  service_down: 'Service Down',
  ssl_expiry: 'SSL Expiry'
};

export default function AlertRulesModal({ serverId, onClose }) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useNotification();
  const { theme } = useTheme();

  // Form state
  const [name, setName] = useState('');
  const [metric, setMetric] = useState('cpu');
  const [threshold, setThreshold] = useState(90);
  const [serviceName, setServiceName] = useState('');
  const [sslDomain, setSslDomain] = useState('');

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/servers/${serverId}/alert-rules`);
      setRules(res.data);
    } catch (e) {
      showToast('Failed to load rules', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRules();
  }, [serverId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name,
        metric,
        threshold: metric === 'server_offline' ? null : Number(threshold),
        service_name: metric === 'service_down' ? serviceName : null,
        ssl_domain: metric === 'ssl_expiry' ? sslDomain : null,
      };
      await api.post(`/servers/${serverId}/alert-rules`, payload);
      showToast('Rule created successfully', 'success');
      setName('');
      fetchRules();
    } catch (e) {
      showToast('Failed to create rule', 'error');
    }
  };

  const handleToggle = async (id, currentEnabled) => {
    try {
      await api.patch(`/servers/${serverId}/alert-rules/${id}`, { enabled: !currentEnabled });
      fetchRules();
    } catch (e) {
      showToast('Failed to update rule', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/servers/${serverId}/alert-rules/${id}`);
      showToast('Rule deleted', 'success');
      fetchRules();
    } catch (e) {
      showToast('Failed to delete rule', 'error');
    }
  };

  const inputClasses = "w-full bg-[var(--bg-main)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-[var(--accent-mint)] focus:ring-2 focus:ring-[var(--accent-mint)]/20 transition-all";

  return createPortal(
    <div data-theme={theme === 'light' ? 'light' : undefined} className="fixed inset-0 z-50 flex items-start justify-center pt-[120px] px-4 pb-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200 text-[var(--text-primary)]">
      <div className="glass-card w-full max-w-xl flex flex-col max-h-[calc(100vh-160px)] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-4 md:p-5 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-card)] rounded-t-3xl">
          <div>
            <h3 className="text-lg md:text-xl font-bold tracking-tight">Alert Configuration</h3>
            <p className="text-xs md:text-sm text-[var(--text-secondary)] mt-1">Manage automated monitoring and incident generation.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto space-y-5 custom-scrollbar min-h-0">
          {/* Create Rule Form */}
          <div className="bg-[var(--bg-main)]/50 rounded-2xl p-4 md:p-5 border border-[var(--border-color)]">
            <h4 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] mb-3 md:mb-4">Create New Rule</h4>
            <form onSubmit={handleCreate}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Rule Name</label>
                  <input required type="text" value={name} onChange={e => setName(e.target.value)} className={inputClasses} placeholder="e.g. Critical CPU Spikes" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Metric</label>
                  <select value={metric} onChange={e => setMetric(e.target.value)} className={inputClasses}>
                    {Object.entries(metricLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                {metric !== 'server_offline' && metric !== 'service_down' && metric !== 'ssl_expiry' && (
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Threshold Value</label>
                    <div className="relative">
                      <input required type="number" step="0.1" value={threshold} onChange={e => setThreshold(e.target.value)} className={inputClasses} />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] text-sm font-medium">%</span>
                    </div>
                  </div>
                )}

                {metric === 'service_down' && (
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Service Name</label>
                    <input required type="text" value={serviceName} onChange={e => setServiceName(e.target.value)} className={inputClasses} placeholder="e.g. nginx, mysql" />
                  </div>
                )}

                {metric === 'ssl_expiry' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Domain Name</label>
                      <input required type="text" value={sslDomain} onChange={e => setSslDomain(e.target.value)} className={inputClasses} placeholder="e.g. api.example.com" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Days Until Expiry Threshold</label>
                      <div className="relative">
                        <input required type="number" value={threshold} onChange={e => setThreshold(e.target.value)} className={inputClasses} />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] text-sm font-medium">Days</span>
                      </div>
                    </div>
                  </>
                )}

                <div className={`flex justify-end ${metric === 'ssl_expiry' || metric === 'server_offline' ? 'md:col-span-2 pt-2' : ''}`}>
                  <button type="submit" className="w-full md:w-auto h-[42px] bg-[var(--accent-mint)] hover:opacity-90 text-black px-5 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg shadow-[var(--accent-mint)]/20">
                    <Plus className="w-4 h-4" /> Add Monitoring Rule
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* List Rules */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] mb-4 px-1">Active Monitoring Rules</h4>
            {loading ? (
              <div className="text-center p-8">
                <div className="w-8 h-8 border-4 border-[var(--accent-mint)] border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : rules.length === 0 ? (
              <div className="text-center p-8 bg-[var(--bg-main)]/30 rounded-2xl border border-dashed border-[var(--border-color)]">
                <p className="text-[var(--text-secondary)] font-medium">No monitoring rules configured for this server.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rules.map(rule => (
                  <div
                    key={rule.id}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', overflow: 'visible' }}
                    className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--accent-mint)]/50 rounded-2xl p-4 transition-colors group shadow-sm"
                  >
                    {/* Icon */}
                    <div className={`flex-shrink-0 p-2 rounded-xl flex items-center justify-center ${rule.enabled ? 'bg-[var(--accent-mint)]/10 text-[var(--accent-mint)]' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}>
                      {metricIcons[rule.metric] || <Activity className="w-4 h-4" />}
                    </div>

                    {/* Text content — flex:1 + min-width:0 lets it shrink without pushing toggle */}
                    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                      <h5 className={`font-bold text-sm truncate ${!rule.enabled && 'opacity-60'}`}>{rule.name}</h5>
                      <p className="text-xs font-medium text-[var(--text-secondary)] mt-1 flex items-center flex-wrap gap-1.5">
                        <span className="uppercase tracking-wider bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded">{rule.metric.replace(/_/g, ' ')}</span>
                        {rule.threshold !== null && (
                          <span className="bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded">
                            Threshold: <span className="text-[var(--text-primary)] font-bold">{rule.threshold}</span>
                            {rule.metric !== 'ssl_expiry' ? '%' : ' days'}
                          </span>
                        )}
                        {rule.service_name && (
                          <span className="bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded">Svc: <span className="text-[var(--text-primary)] font-bold">{rule.service_name}</span></span>
                        )}
                        {rule.ssl_domain && (
                          <span className="bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded truncate max-w-[140px] block"><span className="text-[var(--text-primary)] font-bold">{rule.ssl_domain}</span></span>
                        )}
                      </p>
                    </div>

                    {/* Toggle + Delete — flex-shrink:0 so it's NEVER pushed off screen */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <button
                        onClick={() => handleToggle(rule.id, rule.enabled)}
                        aria-label={rule.enabled ? 'Disable rule' : 'Enable rule'}
                        style={{
                          height: '28px',
                          width: '52px',
                          padding: '3px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          backgroundColor: rule.enabled ? 'var(--accent-mint)' : '#d1d5db',
                          borderRadius: '9999px',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s ease',
                          flexShrink: 0,
                          position: 'relative',
                          WebkitTapHighlightColor: 'transparent',
                          outline: 'none',
                        }}
                      >
                        <span
                          style={{
                            display: 'block',
                            height: '22px',
                            width: '22px',
                            borderRadius: '9999px',
                            backgroundColor: 'white',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                            transform: rule.enabled ? 'translateX(24px)' : 'translateX(0px)',
                            transition: 'transform 0.2s ease',
                            pointerEvents: 'none',
                            flexShrink: 0,
                          }}
                        />
                      </button>
                      <button
                        onClick={() => handleDelete(rule.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
