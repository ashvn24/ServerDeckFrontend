import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, RefreshCw, Shield, AlertTriangle, Loader2, Mail, Globe, CheckCircle2, ShieldCheck, Clock } from 'lucide-react';
import { serversAPI } from '../api/endpoints';
import { useWebSocket } from '../hooks/useWebSocket';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AlertModal from '../components/common/AlertModal';
import ConfirmModal from '../components/common/ConfirmModal';

export default function SSLManager() {
  const { id: serverId } = useParams();
  const navigate = useNavigate();
  const { sendCommand } = useWebSocket();
  const [server, setServer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueDomain, setIssueDomain] = useState('');
  const [issueEmail, setIssueEmail] = useState('');
  const [issuing, setIssuing] = useState(false);
  const [renewingCert, setRenewingCert] = useState(null);
  const [alertConfig, setAlertConfig] = useState({ open: false, title: '', message: '', type: 'error' });

  const fetchServer = useCallback(async () => {
    try {
      const res = await serversAPI.get(serverId);
      setServer(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [serverId]);

  useEffect(() => { fetchServer(); }, [fetchServer]);

  const handleIssue = async (e) => {
    e.preventDefault();
    setIssuing(true);
    try {
      await sendCommand(serverId, 'ssl.issue', {
        domain: issueDomain,
        email: issueEmail || undefined,
      });
      setShowIssueModal(false);
      setIssueDomain('');
      setIssueEmail('');
      setAlertConfig({
        open: true,
        title: 'Success',
        message: 'SSL Certificate has been successfully issued.',
        type: 'success'
      });
      setTimeout(fetchServer, 2000);
    } catch (err) {
      setAlertConfig({
        open: true,
        title: 'Provisioning Failed',
        message: err.message,
        type: 'error'
      });
    } finally {
      setIssuing(false);
    }
  };

  const handleRenew = async (certName) => {
    setRenewingCert(certName);
    try {
      await sendCommand(serverId, 'ssl.renew', { domain: certName });
      setAlertConfig({
        open: true,
        title: 'Success',
        message: 'SSL Certificate renewal initiated successfully.',
        type: 'success'
      });
      setTimeout(fetchServer, 2000);
    } catch (err) {
      setAlertConfig({
        open: true,
        title: 'Renewal Failed',
        message: err.message,
        type: 'error'
      });
    } finally {
      setRenewingCert(null);
    }
  };

  const isExpiringSoon = (expiryStr) => {
    if (!expiryStr) return false;
    const expiry = new Date(expiryStr);
    const now = new Date();
    const daysLeft = (expiry - now) / (1000 * 60 * 60 * 24);
    return daysLeft < 14;
  };

  if (loading) return <LoadingSpinner size="lg" text="Syncing certificate vault..." />;

  const certs = server?.ssl_certs || [];

  return (
    <div className="animate-in fade-in duration-700 space-y-12">
      <AlertModal 
        isOpen={alertConfig.open}
        onClose={() => setAlertConfig({ ...alertConfig, open: false })}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
        <div className="flex items-center gap-8">
          <button onClick={() => navigate(`/servers/${serverId}`)} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
            <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-white transition-colors" />
          </button>
          <div>
            <h1 className="text-5xl font-black text-white uppercase tracking-tighter font-display leading-none">SSL Security</h1>
            <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.4em] mt-6 flex items-center gap-3">
              {server?.name} <span className="opacity-20">•</span> ENCRYPTION LAYER
            </p>
          </div>
        </div>
        <button 
          onClick={() => setShowIssueModal(true)} 
          className="px-10 py-4 rounded-2xl bg-[var(--accent-mint)] text-black text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-mint-500/10"
        >
          <Plus className="w-4 h-4 inline-block mr-2" /> Provision New Token
        </button>
      </div>

      {/* Content Grid */}
      {certs.length === 0 ? (
        <div className="glass-card py-48 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center mb-10 border border-white/5">
            <Shield className="w-10 h-10 text-[var(--text-secondary)]" />
          </div>
          <h3 className="text-3xl font-black uppercase tracking-tight mb-4 font-display text-white">No active deployments</h3>
          <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-12 max-w-sm leading-relaxed">
            Your server currently has no active SSL certificates. Provision a new one to enable secure HTTPS communication.
          </p>
          <button
            onClick={() => setShowIssueModal(true)}
            className="px-12 py-4 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
          >
            Start Provisioning
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {certs.map((cert, idx) => {
            const expiringSoon = isExpiringSoon(cert.expiry);
            return (
              <div key={idx} className="glass-card group p-10 hover:bg-white/5 transition-all duration-500 relative overflow-hidden border border-white/5">
                <div className={`absolute top-0 right-0 w-32 h-32 blur-[80px] -mr-16 -mt-16 opacity-20 transition-all duration-700 group-hover:opacity-40 ${expiringSoon ? 'bg-amber-500' : 'bg-[var(--accent-mint)]'}`} />
                
                <div className="flex items-center justify-between mb-10 relative z-10">
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-500 ${
                      expiringSoon 
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' 
                        : 'bg-[var(--accent-mint)]/10 border-[var(--accent-mint)]/20 text-[var(--accent-mint)]'
                    }`}>
                      <ShieldCheck className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-white uppercase tracking-tight font-display">{cert.name}</h4>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(cert.domains || []).map(d => (
                          <span key={d} className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-md">{d}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-10 mt-12 relative z-10">
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] flex items-center gap-2">
                      <Clock className="w-3 h-3" /> Expiration
                    </p>
                    <p className="text-sm font-black text-white uppercase tracking-tight">{cert.expiry || 'PENDING'}</p>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] flex items-center gap-2">
                      <Globe className="w-3 h-3" /> Status
                    </p>
                    <div className="flex items-center gap-2">
                       <div className={`w-1.5 h-1.5 rounded-full animate-pulse-dot ${expiringSoon ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-[var(--accent-mint)] shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} />
                       <span className={`text-[10px] font-black uppercase tracking-widest ${expiringSoon ? 'text-amber-500' : 'text-[var(--accent-mint)]'}`}>
                          {expiringSoon ? 'Renewal Required' : 'Active Deployment'}
                       </span>
                    </div>
                  </div>
                </div>

                <div className="mt-12 flex justify-end relative z-10">
                   <button
                    onClick={() => handleRenew(cert.name)}
                    disabled={renewingCert === cert.name}
                    className={`flex items-center gap-3 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      expiringSoon 
                        ? 'bg-amber-500 text-black hover:scale-105 shadow-lg shadow-amber-500/20' 
                        : 'bg-white/5 text-white hover:bg-white/10'
                    }`}
                  >
                    {renewingCert === cert.name ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    {renewingCert === cert.name ? 'SYNCING...' : 'RELAY RENEWAL'}
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Provision Modal */}
      <Modal isOpen={showIssueModal} onClose={() => setShowIssueModal(false)} title="Provision SSL Token">
        <form onSubmit={handleIssue} className="space-y-10">
          <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem] flex gap-5">
            <div className="w-10 h-10 rounded-2xl bg-[var(--accent-violet)]/10 flex items-center justify-center flex-shrink-0">
               <AlertTriangle className="w-5 h-5 text-[var(--accent-violet)]" />
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed font-bold uppercase tracking-widest">
              Domain DNS must resolve to this node IP before provisioning. Let's Encrypt will verify ownership automatically.
            </p>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.3em] px-1">Network Identity (Domain)</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                  <Globe className="w-5 h-5 text-[var(--text-secondary)] group-focus-within:text-white transition-colors" />
                </div>
                <input 
                  type="text" 
                  value={issueDomain} 
                  onChange={(e) => setIssueDomain(e.target.value)} 
                  required 
                  placeholder="e.g. node.production.com" 
                  className="w-full pl-16 pr-8 py-5 bg-black/40 border border-white/5 rounded-2xl text-sm text-white font-bold focus:border-[var(--accent-violet)] outline-none transition-all placeholder:text-gray-700"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.3em] px-1">Emergency Recovery Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-[var(--text-secondary)] group-focus-within:text-white transition-colors" />
                </div>
                <input 
                  type="email" 
                  value={issueEmail} 
                  onChange={(e) => setIssueEmail(e.target.value)} 
                  placeholder="admin@security.relay" 
                  className="w-full pl-16 pr-8 py-5 bg-black/40 border border-white/5 rounded-2xl text-sm text-white font-bold focus:border-[var(--accent-violet)] outline-none transition-all placeholder:text-gray-700"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={issuing || !issueDomain} 
            className="w-full py-5 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all shadow-2xl shadow-white/10"
          >
            {issuing ? 'PROVISIONING SECURITY LAYER...' : 'EXECUTE PROVISIONING'}
          </button>
        </form>
      </Modal>
    </div>
  );
}

