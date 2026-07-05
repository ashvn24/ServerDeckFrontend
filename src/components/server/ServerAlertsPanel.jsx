import { useState, useEffect } from 'react';
import { ShieldAlert, Terminal, CheckCircle2, Clock, Play, X, MessageSquare } from 'lucide-react';
import api from '../../api/client';
import { Link } from 'react-router-dom';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useNotification } from '../../context/NotificationContext';
import AlertRulesModal from '../AlertRulesModal';
import Modal from '../common/Modal';
import { ticketsAPI } from '../../api/endpoints';

export default function ServerAlertsPanel({ serverId, sendCommand }) {
  const [alerts, setAlerts] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const { on } = useWebSocket();
  const { showToast } = useNotification();
  const [expandedAlert, setExpandedAlert] = useState(null);

  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketForm, setTicketForm] = useState({ title: '', description: '', priority: 'Medium', alert_id: null });
  const [raisingTicket, setRaisingTicket] = useState(false);

  const handleOpenTicketModal = (alert) => {
    const defaultTitle = `[Alert] ${alert.rule_name} on ${alert.server_name}`;
    
    let defaultPriority = 'Medium';
    if (alert.diagnosis?.urgency) {
      const urgency = alert.diagnosis.urgency.toLowerCase();
      if (urgency === 'critical') defaultPriority = 'Urgent';
      else if (urgency === 'high') defaultPriority = 'High';
      else if (urgency === 'medium') defaultPriority = 'Medium';
      else if (urgency === 'low') defaultPriority = 'Low';
    }
    
    let defaultDesc = `Alert: ${alert.rule_name}\n`;
    defaultDesc += `Server: ${alert.server_name} (ID: ${alert.server_id})\n`;
    defaultDesc += `Metric: ${alert.metric || 'N/A'}\n`;
    defaultDesc += `Current Value: ${alert.metric_value ? alert.metric_value.toFixed(2) : 'N/A'}\n`;
    defaultDesc += `Status: ${alert.status}\n`;
    defaultDesc += `Duration: ${formatDuration(alert.duration)}\n`;
    
    if (alert.diagnosis?.explanation) {
      defaultDesc += `\nAI Diagnosis:\n${alert.diagnosis.explanation}\n`;
    }
    if (alert.diagnosis?.suggested_fix) {
      defaultDesc += `\nSuggested Fix:\n${alert.diagnosis.suggested_fix}\n`;
    }
    
    defaultDesc += `\nAdditional Context:\n`;

    setTicketForm({
      title: defaultTitle,
      description: defaultDesc,
      priority: defaultPriority,
      alert_id: alert.id
    });
    setShowTicketModal(true);
  };

  const handleRaiseTicket = async (e) => {
    e.preventDefault();
    setRaisingTicket(true);
    try {
      await ticketsAPI.create(ticketForm);
      showToast('Support ticket raised successfully!', 'success');
      setShowTicketModal(false);
      fetchAlerts();
    } catch (err) {
      showToast('Failed to raise ticket', 'error');
    } finally {
      setRaisingTicket(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const [alertsRes, ticketsRes] = await Promise.all([
        api.get(`/servers/${serverId}/alerts`),
        ticketsAPI.list()
      ]);
      setAlerts(alertsRes.data.filter(a => ['active', 'acknowledged'].includes(a.status)));
      setTickets(ticketsRes.data || []);
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
                  {alert.ticket_id || tickets.some(t => t.alert_id === alert.id || t.title === `[Alert] ${alert.rule_name} on ${alert.server_name}`) ? (
                    <Link
                      to="/tickets"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[10px] font-bold uppercase bg-violet-600/20 text-violet-400 border border-violet-500/30 px-2 py-1 rounded hover:bg-violet-600/30 flex items-center gap-1 transition-colors"
                    >
                      <MessageSquare className="w-3 h-3" /> Ticket Raised
                    </Link>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenTicketModal(alert);
                      }}
                      className="text-[10px] font-bold uppercase bg-white/5 text-white px-2 py-1 rounded hover:bg-white/10 flex items-center gap-1 transition-colors"
                    >
                      <MessageSquare className="w-3 h-3 text-violet-400" /> Raise Ticket
                    </button>
                  )}
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

      <Modal isOpen={showTicketModal} onClose={() => setShowTicketModal(false)} title="Raise Support Ticket">
        <form onSubmit={handleRaiseTicket} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-2 block ml-1">Ticket Title</label>
            <input
              type="text"
              required
              value={ticketForm.title}
              onChange={e => setTicketForm(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-5 py-3 rounded-xl bg-black/40 border border-[var(--border-color)] text-white text-xs font-bold focus:border-[var(--accent-blue)] outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-2 block ml-1">Priority</label>
            <select
              value={ticketForm.priority}
              onChange={e => setTicketForm(prev => ({ ...prev, priority: e.target.value }))}
              className="w-full px-5 py-3 rounded-xl bg-black/40 border border-[var(--border-color)] text-white text-xs font-bold focus:border-[var(--accent-blue)] outline-none transition-all cursor-pointer"
            >
              <option value="Low" className="bg-[#1c1c1e]">Low</option>
              <option value="Medium" className="bg-[#1c1c1e]">Medium</option>
              <option value="High" className="bg-[#1c1c1e]">High</option>
              <option value="Urgent" className="bg-[#1c1c1e]">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-2 block ml-1">Description & Details</label>
            <textarea
              required
              rows={8}
              value={ticketForm.description}
              onChange={e => setTicketForm(prev => ({ ...prev, description: e.target.value }))}
              className="w-full p-5 rounded-xl bg-black/40 border border-[var(--border-color)] text-white text-xs font-bold focus:border-[var(--accent-blue)] outline-none transition-all resize-none font-mono"
            />
          </div>

          <div className="flex gap-4 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={() => setShowTicketModal(false)}
              className="flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/5 text-white hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
            <button
              disabled={raisingTicket}
              type="submit"
              className="flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-violet-600 hover:bg-violet-500 text-white hover:scale-[1.03] active:scale-[0.97] transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50 disabled:hover:scale-100 disabled:active:scale-100"
            >
              {raisingTicket ? 'Submitting...' : 'Raise Ticket'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
