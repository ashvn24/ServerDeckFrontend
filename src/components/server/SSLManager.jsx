import { useState, useEffect } from 'react';
import { Globe, Plus, Loader2, RefreshCw, AlertCircle, ShieldCheck, Clock, Calendar, X } from 'lucide-react';

export default function SSLManager({ serverId, sendCommand, isAdmin, nginxSites = [] }) {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueForm, setIssueForm] = useState({ domain: '', email: '' });
  const [actionLoading, setActionLoading] = useState(null);

  const fetchCerts = async () => {
    setLoading(true);
    try {
      const res = await sendCommand(serverId, 'ssl.list');
      if (res.error) throw new Error(res.error);
      setCerts(res.certs || []);
    } catch (err) {
      console.error('Failed to fetch certificates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCerts();
  }, [serverId]);

  const handleIssue = async () => {
    if (!issueForm.domain) return;
    setActionLoading('issue');
    try {
      const res = await sendCommand(serverId, 'ssl.issue', issueForm);
      if (res.error) throw new Error(res.error);
      setShowIssueModal(false);
      setIssueForm({ domain: '', email: '' });
      fetchCerts();
    } catch (err) {
      console.error('Failed to issue certificate:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRenew = async (domain) => {
    setActionLoading(`renew-${domain}`);
    try {
      const res = await sendCommand(serverId, 'ssl.renew', { domain });
      if (res.error) throw new Error(res.error);
      fetchCerts();
    } catch (err) {
      console.error('Failed to renew certificate:', err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="glass-card p-10">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-[var(--accent-mint)] rounded-2xl shadow-lg shadow-mint-500/20 text-black">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight font-display">SSL Gateway</h3>
              <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-1">Let's Encrypt certificates management</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={fetchCerts}
              className="p-3 rounded-xl bg-white/5 text-[var(--text-secondary)] hover:text-white hover:bg-white/10 transition-all"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {isAdmin && (
              <button 
                onClick={() => setShowIssueModal(true)}
                className="px-8 py-3 bg-[var(--accent-mint)] text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all active:scale-95"
              >
                Provision SSL
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-[var(--accent-mint)] animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Fetching certificates...</p>
          </div>
        ) : certs.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-[var(--border-color)]">
            <Globe className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">No SSL deployments detected</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {certs.map((cert) => {
              const expiry = new Date(cert.expiry);
              const isExpired = expiry < new Date();
              const daysLeft = Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24));
              
              return (
                <div key={cert.name} className="p-8 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/10 transition-all group">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-xl ${isExpired ? 'bg-red-500/20 text-red-500' : 'accent-bg-green text-black'}`}>
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-black text-white uppercase tracking-tight">{cert.name}</span>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => handleRenew(cert.name)}
                        disabled={actionLoading === `renew-${cert.name}`}
                        className="px-4 py-1.5 rounded-lg bg-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-[var(--accent-mint)] hover:text-black transition-all disabled:opacity-50"
                      >
                        {actionLoading === `renew-${cert.name}` ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Renew'}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Expiration</p>
                        <p className="text-xs font-bold text-white">{expiry.toLocaleDateString()}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Status</p>
                        <p className={`text-xs font-bold ${isExpired ? 'text-red-500' : daysLeft < 30 ? 'text-amber-500' : 'text-[var(--accent-mint)]'}`}>
                          {isExpired ? 'EXPIRED' : daysLeft < 30 ? `LIFETIME: ${daysLeft}D` : 'SECURED'}
                        </p>
                     </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showIssueModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-8">
           <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => !actionLoading && setShowIssueModal(false)} />
           <div className="glass-card w-full max-w-lg relative z-10 p-10">
              <div className="flex items-center justify-between mb-10">
                 <h3 className="text-2xl font-black uppercase tracking-tight font-display">Deploy New SSL</h3>
                 <button onClick={() => setShowIssueModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                    <X className="w-6 h-6 text-[var(--text-secondary)]" />
                 </button>
              </div>

              <div className="space-y-8">
                <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex gap-4">
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <p className="text-[10px] text-amber-500/80 leading-relaxed font-bold uppercase tracking-widest">
                    Domain must point to this IP before provisioning. Certbot will update Nginx automatically.
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Site Domain</label>
                  <select
                    value={issueForm.domain}
                    onChange={(e) => setIssueForm({ ...issueForm, domain: e.target.value })}
                    className="w-full px-6 py-4 bg-black/40 border border-[var(--border-color)] rounded-2xl text-sm text-white focus:border-[var(--accent-violet)] outline-none transition-all font-bold appearance-none uppercase"
                  >
                    <option value="">Select infrastructure site...</option>
                    {nginxSites.map(site => (
                      <option key={site.server_name} value={site.server_name || site.filename}>
                        {site.server_name || site.filename}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Recovery Email</label>
                  <input
                    type="email"
                    placeholder="e.g. admin@example.com"
                    value={issueForm.email}
                    onChange={(e) => setIssueForm({ ...issueForm, email: e.target.value })}
                    className="w-full px-6 py-4 bg-black/40 border border-[var(--border-color)] rounded-2xl text-sm text-white focus:border-[var(--accent-violet)] outline-none transition-all font-bold"
                  />
                </div>

                <div className="pt-6 flex gap-4">
                  <button onClick={() => setShowIssueModal(false)} className="flex-1 px-8 py-4 rounded-xl bg-white/5 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                    Cancel
                  </button>
                  <button
                    onClick={handleIssue}
                    disabled={actionLoading === 'issue' || !issueForm.domain}
                    className="flex-1 px-8 py-4 rounded-xl bg-[var(--accent-mint)] text-black text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all active:scale-95 shadow-lg shadow-mint-500/20"
                  >
                    {actionLoading === 'issue' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Provision SSL'}
                  </button>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
