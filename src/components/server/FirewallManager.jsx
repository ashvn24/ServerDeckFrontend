import { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, Loader2, RefreshCw, AlertCircle, X } from 'lucide-react';

export default function FirewallManager({ serverId, sendCommand, isAdmin }) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRule, setNewRule] = useState({ port: '', proto: 'tcp', action: 'allow' });
  const [actionLoading, setActionLoading] = useState(null);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await sendCommand(serverId, 'firewall.list');
      if (res.error) throw new Error(res.error);
      setRules(res.rules || []);
    } catch (err) {
      console.error('Failed to fetch firewall rules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, [serverId]);

  const handleAddRule = async () => {
    if (!newRule.port) return;
    setActionLoading('add');
    try {
      const action = newRule.action === 'allow' ? 'firewall.allow' : 'firewall.deny';
      const res = await sendCommand(serverId, action, { 
        port: newRule.port, 
        proto: newRule.proto 
      });
      if (res.error) throw new Error(res.error);
      setShowAddModal(false);
      setNewRule({ port: '', proto: 'tcp', action: 'allow' });
      fetchRules();
    } catch (err) {
      console.error('Failed to add rule:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteRule = async (ruleNumber) => {
    setActionLoading(`delete-${ruleNumber}`);
    try {
      const res = await sendCommand(serverId, 'firewall.delete', { rule_number: ruleNumber });
      if (res.error) throw new Error(res.error);
      fetchRules();
    } catch (err) {
      console.error('Failed to delete rule:', err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="glass-card p-10">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-[var(--accent-violet)] rounded-2xl shadow-lg shadow-violet-500/20 text-white">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight font-display">Firewall Security</h3>
              <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-1">Managed UFW rules & node access</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={fetchRules}
              className="p-3 rounded-xl bg-white/5 text-[var(--text-secondary)] hover:text-white hover:bg-white/10 transition-all"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {isAdmin && (
              <button 
                onClick={() => setShowAddModal(true)}
                className="px-8 py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all active:scale-95"
              >
                New Policy
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-[var(--accent-violet)] animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Scanning policies...</p>
          </div>
        ) : rules.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-[var(--border-color)]">
            <AlertCircle className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">No active firewall rules detected</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-4 px-6 mb-4 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">
              <span>Rule ID</span>
              <span>Network Protocol</span>
              <span>Status</span>
              <span className="text-right">Action</span>
            </div>
            {rules.map((rule) => {
              const isAllowed = rule.rule.toLowerCase().includes('allow');
              return (
                <div key={rule.number} className="grid grid-cols-4 items-center p-6 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all group">
                  <span className="text-xs font-bold text-[var(--text-secondary)]">{rule.number}</span>
                  <span className="text-xs font-black text-white uppercase tracking-tight">{rule.rule}</span>
                  <div>
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      isAllowed ? 'accent-bg-green' : 'bg-red-500/20 text-red-500'
                    }`}>
                      <span className={`w-1 h-1 rounded-full ${isAllowed ? 'bg-black' : 'bg-red-500'}`}></span>
                      {isAllowed ? 'Allowed' : 'Denied'}
                    </span>
                  </div>
                  <div className="text-right">
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteRule(rule.number)}
                        disabled={actionLoading === `delete-${rule.number}`}
                        className="p-2 text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                      >
                        {actionLoading === `delete-${rule.number}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-8">
           <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => !actionLoading && setShowAddModal(false)} />
           <div className="glass-card w-full max-w-lg relative z-10 p-10">
              <div className="flex items-center justify-between mb-10">
                 <h3 className="text-2xl font-black uppercase tracking-tight font-display">New Policy Rule</h3>
                 <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                    <X className="w-6 h-6 text-[var(--text-secondary)]" />
                 </button>
              </div>

              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Port Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 80, 443, 3000"
                    value={newRule.port}
                    onChange={(e) => setNewRule({ ...newRule, port: e.target.value })}
                    className="w-full px-6 py-4 bg-black/40 border border-[var(--border-color)] rounded-2xl text-sm text-white focus:border-[var(--accent-violet)] outline-none transition-all font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Protocol</label>
                    <select
                      value={newRule.proto}
                      onChange={(e) => setNewRule({ ...newRule, proto: e.target.value })}
                      className="w-full px-6 py-4 bg-black/40 border border-[var(--border-color)] rounded-2xl text-sm text-white focus:border-[var(--accent-violet)] outline-none transition-all font-bold appearance-none uppercase"
                    >
                      <option value="tcp">TCP</option>
                      <option value="udp">UDP</option>
                      <option value="any">ANY</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Action</label>
                    <select
                      value={newRule.action}
                      onChange={(e) => setNewRule({ ...newRule, action: e.target.value })}
                      className="w-full px-6 py-4 bg-black/40 border border-[var(--border-color)] rounded-2xl text-sm text-white focus:border-[var(--accent-violet)] outline-none transition-all font-bold appearance-none uppercase"
                    >
                      <option value="allow">Allow</option>
                      <option value="deny">Deny</option>
                    </select>
                  </div>
                </div>

                <div className="pt-6 flex gap-4">
                  <button onClick={() => setShowAddModal(false)} className="flex-1 px-8 py-4 rounded-xl bg-white/5 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                    Cancel
                  </button>
                  <button
                    onClick={handleAddRule}
                    disabled={actionLoading === 'add' || !newRule.port}
                    className="flex-1 px-8 py-4 rounded-xl bg-[var(--accent-violet)] text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all active:scale-95 shadow-lg shadow-violet-500/20"
                  >
                    {actionLoading === 'add' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Policy'}
                  </button>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
