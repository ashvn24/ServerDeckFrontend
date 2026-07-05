import { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2, AlertTriangle, Clock, Terminal, Check, AlertCircle, Copy, Play, X, MessageSquare } from 'lucide-react';
import api from '../api/client';
import { useWebSocket } from '../hooks/useWebSocket';
import { useNotification } from '../context/NotificationContext';
import { Link } from 'react-router-dom';
import Modal from '../components/common/Modal';
import { ticketsAPI } from '../api/endpoints';

export default function Alerts() {
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { on, sendCommand } = useWebSocket();
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
      fetchData();
    } catch (err) {
      showToast('Failed to raise ticket', 'error');
    } finally {
      setRaisingTicket(false);
    }
  };

  const fetchData = async () => {
    try {
      const [sumRes, alertsRes, ticketsRes] = await Promise.all([
        api.get('/alerts/summary'),
        api.get('/alerts'),
        ticketsAPI.list()
      ]);
      setSummary(sumRes.data);
      setAlerts(alertsRes.data);
      setTickets(ticketsRes.data || []);
    } catch (e) {
      showToast('Failed to load alerts', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    const unsubFired = on('alert_fired', () => {
      fetchData(); // reload on new alert
    });

    const unsubDiag = on('alert_diagnosis_ready', (data) => {
      setAlerts(prev => prev.map(a => 
        a.id === data.alert_id 
          ? { ...a, diagnosis: data } 
          : a
      ));
    });

    return () => {
      unsubFired();
      unsubDiag();
    };
  }, [on]);

  const handleAcknowledge = async (id, e) => {
    e.stopPropagation();
    try {
      await api.post(`/alerts/${id}/acknowledge`);
      fetchData();
    } catch (err) {
      showToast('Failed to acknowledge', 'error');
    }
  };

  const handleResolve = async (id, e) => {
    e.stopPropagation();
    try {
      await api.post(`/alerts/${id}/resolve`);
      fetchData();
    } catch (err) {
      showToast('Failed to resolve', 'error');
    }
  };

  const handleExecuteFix = async (alert) => {
    if (!alert.diagnosis?.suggested_command) return;
    try {
      const res = await sendCommand(alert.server_id, 'run_script', {
        script: alert.diagnosis.suggested_command,
        interpreter: '/bin/bash'
      });
      if (res.status === 'success') {
        showToast('Fix executed successfully', 'success');
      } else {
        showToast(`Fix failed: ${res.error || 'Unknown error'}`, 'error');
      }
    } catch (e) {
      showToast('Failed to execute fix', 'error');
    }
  };

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${Math.floor(seconds)}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 border-4 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Active Incidents</h1>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-4">
            <p className="text-sm text-[var(--text-secondary)] font-medium">Active Alerts</p>
            <p className="text-2xl font-black mt-1 text-red-400">{summary.active_count}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-sm text-[var(--text-secondary)] font-medium">Servers Affected</p>
            <p className="text-2xl font-black mt-1 text-amber-400">{summary.servers_affected}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-sm text-[var(--text-secondary)] font-medium">Critical</p>
            <p className="text-2xl font-black mt-1 text-red-500">{summary.critical_count}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-sm text-[var(--text-secondary)] font-medium">Resolved (24h)</p>
            <p className="text-2xl font-black mt-1 text-[var(--accent-mint)]">{summary.resolved_last_24h}</p>
          </div>
        </div>
      )}

      {/* Alerts List */}
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="glass-panel p-8 text-center text-[var(--text-secondary)] flex flex-col items-center">
            <CheckCircle2 className="w-12 h-12 mb-3 text-[var(--accent-mint)]/50" />
            <p className="text-lg">All systems green</p>
            <p className="text-sm">No active alerts found.</p>
          </div>
        ) : (
          alerts.map(alert => (
            <div key={alert.id} className="glass-card overflow-hidden">
              <div 
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer hover:bg-white/5 transition-colors gap-4"
                onClick={() => setExpandedAlert(expandedAlert === alert.id ? null : alert.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${alert.status === 'active' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold flex items-center gap-2">
                      {alert.rule_name}
                      <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-black ${
                        alert.status === 'active' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {alert.status}
                      </span>
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                      <Link to={`/servers/${alert.server_id}`} className="text-[var(--accent-blue)] hover:underline" onClick={e => e.stopPropagation()}>{alert.server_name}</Link>
                      <span className="mx-2">•</span>
                      Value: <span className="text-white font-medium">{alert.metric_value ? alert.metric_value.toFixed(1) : 'N/A'}</span>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 sm:ml-auto">
                  <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDuration(alert.duration)}
                  </div>
                  <div className="flex items-center gap-2">
                    {alert.status === 'active' && (
                      <button onClick={(e) => handleAcknowledge(alert.id, e)} className="glass-button text-xs py-1.5">Acknowledge</button>
                    )}
                    {alert.ticket_id || tickets.some(t => t.alert_id === alert.id || t.title === `[Alert] ${alert.rule_name} on ${alert.server_name}`) ? (
                      <Link
                        to="/tickets"
                        onClick={(e) => e.stopPropagation()}
                        className="glass-button text-xs py-1.5 flex items-center gap-1 bg-violet-600/20 text-violet-400 border-violet-500/30 hover:bg-violet-600/30"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Ticket Raised
                      </Link>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenTicketModal(alert);
                        }}
                        className="glass-button text-xs py-1.5 flex items-center gap-1 hover:bg-white/10"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-violet-400" /> Raise Ticket
                      </button>
                    )}
                    <button onClick={(e) => handleResolve(alert.id, e)} className="bg-[var(--accent-mint)]/20 hover:bg-[var(--accent-mint)]/30 text-[var(--accent-mint)] text-xs py-1.5 px-3 rounded-lg font-medium transition-colors">Resolve</button>
                  </div>
                </div>
              </div>

              {/* Expandable AI Diagnosis */}
              {expandedAlert === alert.id && (
                <div className="border-t border-white/5 bg-black/20 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-black tracking-widest uppercase text-[var(--accent-violet)] flex items-center gap-2">
                      <Terminal className="w-4 h-4" /> AI Root Cause Diagnosis
                    </h4>
                    {alert.diagnosis && !alert.diagnosis.failed && (
                      <div className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${
                        alert.diagnosis.urgency === 'critical' ? 'bg-red-500/20 text-red-400' :
                        alert.diagnosis.urgency === 'high' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        Urgency: {alert.diagnosis.urgency}
                      </div>
                    )}
                  </div>
                  
                  {!alert.diagnosis ? (
                    <div className="flex items-center gap-3 text-[var(--text-secondary)] text-sm">
                      <div className="w-4 h-4 border-2 border-[var(--accent-violet)] border-t-transparent rounded-full animate-spin" />
                      Analyzing telemetry and logs...
                    </div>
                  ) : alert.diagnosis.failed ? (
                    <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
                      <AlertCircle className="w-4 h-4" />
                      Diagnosis unavailable at this time.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <p className="text-sm leading-relaxed">{alert.diagnosis.explanation}</p>
                        <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                          <p className="text-xs font-semibold text-[var(--text-secondary)] mb-1">Suggested Action</p>
                          <p className="text-sm font-medium">{alert.diagnosis.suggested_fix}</p>
                        </div>
                      </div>

                      {alert.diagnosis.suggested_command && (
                        <div className="mt-4">
                          <p className="text-xs font-semibold text-[var(--text-secondary)] mb-2">Execute Fix</p>
                          <div className="flex items-stretch gap-2">
                            <code className="flex-1 bg-black/50 p-3 rounded-lg border border-white/10 font-mono text-xs overflow-x-auto text-green-400">
                              {alert.diagnosis.suggested_command}
                            </code>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(alert.diagnosis.suggested_command);
                                showToast('Copied to clipboard', 'info');
                              }}
                              className="p-3 glass-button !px-3" title="Copy"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            {alert.metric === 'service_down' && (
                              <button 
                                onClick={() => handleExecuteFix(alert)}
                                className="glass-button !bg-[var(--accent-mint)] !text-black hover:!bg-[var(--accent-mint)]/90 flex items-center gap-2"
                              >
                                <Play className="w-4 h-4" /> Fix Now
                              </button>
                            )}
                          </div>
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
