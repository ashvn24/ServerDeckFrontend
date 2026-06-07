import { useState, useEffect } from 'react';
import { ShieldAlert, Terminal, CheckCircle2, Clock, Play } from 'lucide-react';
import api from '../../api/client';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useNotification } from '../../context/NotificationContext';
import AlertRulesModal from '../AlertRulesModal';

export default function ServerAlertsPanel({ serverId, sendCommand }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const { on } = useWebSocket();
  const { showToast } = useNotification();
  const [expandedAlert, setExpandedAlert] = useState(null);

  const fetchAlerts = async () => {
    try {
      const res = await api.get(`/servers/${serverId}/alerts`);
      // Filter only active/acknowledged
      setAlerts(res.data.filter(a => ['active', 'acknowledged'].includes(a.status)));
    } catch (e) {
      // 
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAlerts();

    const unsubFired = on('alert_fired', (data) => {
      if (data.server_id === serverId) fetchAlerts();
    });

    const unsubDiag = on('alert_diagnosis_ready', (data) => {
      setAlerts(prev => prev.map(a => 
        a.id === data.alert_id ? { ...a, diagnosis: data } : a
      ));
    });

    return () => {
      unsubFired();
      unsubDiag();
    };
  }, [serverId, on]);

  const handleResolve = async (id, e) => {
    e.stopPropagation();
    try {
      await api.post(`/alerts/${id}/resolve`);
      fetchAlerts();
    } catch (err) {
      showToast('Failed to resolve', 'error');
    }
  };

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${Math.floor(seconds)}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  if (loading) return null;

  return (
    <div className="glass-card mt-8 p-5 md:p-10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold tracking-tight">Active Alerts</h3>
        <button 
          onClick={() => setShowRulesModal(true)}
          className="text-xs font-bold uppercase tracking-widest px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
        >
          Manage Rules
        </button>
      </div>

      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-white/10 rounded-2xl text-[var(--text-secondary)]">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-[var(--accent-mint)]/50" />
            <p className="text-sm">No active alerts for this server.</p>
          </div>
        ) : (
          alerts.map(alert => (
            <div key={alert.id} className="border border-white/10 rounded-2xl overflow-hidden">
              <div 
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors gap-4"
                onClick={() => setExpandedAlert(expandedAlert === alert.id ? null : alert.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${alert.status === 'active' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm flex items-center gap-2">
                      {alert.rule_name}
                      <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm font-black ${
                        alert.status === 'active' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {alert.status}
                      </span>
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      {alert.metric} • Value: {alert.metric_value ? alert.metric_value.toFixed(1) : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                    <Clock className="w-3 h-3" />
                    {formatDuration(alert.duration)}
                  </div>
                  <button onClick={(e) => handleResolve(alert.id, e)} className="text-[10px] font-bold uppercase bg-[var(--accent-mint)]/20 text-[var(--accent-mint)] px-2 py-1 rounded hover:bg-[var(--accent-mint)]/30">
                    Resolve
                  </button>
                </div>
              </div>

              {expandedAlert === alert.id && (
                <div className="border-t border-white/5 bg-black/20 p-4">
                  <h5 className="text-[10px] font-black tracking-widest uppercase text-[var(--accent-violet)] flex items-center gap-1.5 mb-3">
                    <Terminal className="w-3.5 h-3.5" /> AI Diagnosis
                  </h5>
                  {!alert.diagnosis ? (
                    <div className="text-xs text-[var(--text-secondary)] flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-[var(--accent-violet)] border-t-transparent rounded-full animate-spin" />
                      Analyzing...
                    </div>
                  ) : alert.diagnosis.failed ? (
                    <div className="text-xs text-red-400 bg-red-500/10 p-2 rounded">Diagnosis unavailable</div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm">{alert.diagnosis.explanation}</p>
                      <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                        <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1">Suggested Fix</p>
                        <p className="text-sm font-medium">{alert.diagnosis.suggested_fix}</p>
                      </div>
                      {alert.diagnosis.suggested_command && (
                        <div className="flex items-stretch gap-2 mt-2">
                          <code className="flex-1 bg-black p-2 rounded border border-white/10 font-mono text-xs text-green-400 overflow-x-auto">
                            {alert.diagnosis.suggested_command}
                          </code>
                          {alert.metric === 'service_down' && (
                            <button 
                              onClick={() => {
                                sendCommand(serverId, 'run_script', {
                                  script: alert.diagnosis.suggested_command,
                                  interpreter: '/bin/bash'
                                }).then(() => showToast('Command sent', 'success')).catch(() => showToast('Failed', 'error'))
                              }}
                              className="bg-[var(--accent-mint)] text-black px-3 rounded text-xs font-bold uppercase flex items-center gap-1"
                            >
                              <Play className="w-3 h-3" /> Run
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {showRulesModal && (
        <AlertRulesModal serverId={serverId} onClose={() => setShowRulesModal(false)} />
      )}
    </div>
  );
}
