import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Lock, User, CheckCircle2, AlertCircle, Loader2, ArrowRight, Server } from 'lucide-react';
import { usersAPI } from '../api/endpoints';

export default function InviteAccept() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [inviteDetails, setInviteDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing invitation token.');
      setLoading(false);
      return;
    }

    const fetchDetails = async () => {
      try {
        const res = await usersAPI.getInviteDetails(token);
        setInviteDetails(res.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Invitation is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await usersAPI.acceptInvite({ token, name, password });
      setSuccess(true);
    } catch (err) {
      console.error('Accept failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="w-12 h-12 text-[var(--accent-violet)] animate-spin mb-6" />
        <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.4em]">Verifying Authorization Token...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-8">
        <div className="max-w-md w-full glass-card p-12 text-center">
          <div className="w-20 h-20 bg-red-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-red-500/20">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight font-display mb-4">Token Expired</h1>
          <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest leading-relaxed mb-10">{error}</p>
          <Link to="/login" className="inline-flex items-center gap-3 px-8 py-3 rounded-xl bg-white/5 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">
            Return to Gateway <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-8">
        <div className="max-w-md w-full glass-card p-12 text-center">
          <div className="w-20 h-20 bg-[var(--accent-mint)]/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-[var(--accent-mint)]/20">
            <CheckCircle2 className="w-10 h-10 text-[var(--accent-mint)]" />
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight font-display mb-4">Access Granted</h1>
          <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest leading-relaxed mb-10">
            Identity provisioned successfully. You are now authorized to access the ServerDeck cluster.
          </p>
          <button 
            onClick={() => navigate('/login')}
            className="w-full py-4 rounded-2xl bg-[var(--accent-violet)] text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-violet-500/20"
          >
            Authorize Handshake
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-5 bg-white text-black rounded-[2rem] mb-6 shadow-2xl shadow-white/10">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight font-display mb-2">Join Infrastructure</h1>
          <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Provisioning access as <span className="text-[var(--accent-violet)]">{inviteDetails?.role}</span></p>
        </div>

        <div className="glass-card p-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1">Identity Endpoint</label>
              <div className="w-full px-6 py-4 rounded-2xl bg-black/40 border border-[var(--border-color)] text-white/30 font-bold text-sm tracking-tight">
                {inviteDetails?.email}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1">Full Identity Name</label>
              <div className="relative">
                <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                <input
                  required
                  type="text"
                  className="w-full pl-16 pr-6 py-4 rounded-2xl bg-black/40 border border-[var(--border-color)] text-white placeholder-gray-700 text-sm font-bold focus:border-[var(--accent-violet)] outline-none transition-all"
                  placeholder="e.g. OPERATOR-01"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1">Establish Security Key</label>
              <div className="relative">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                <input
                  required
                  type="password"
                  minLength={8}
                  className="w-full pl-16 pr-6 py-4 rounded-2xl bg-black/40 border border-[var(--border-color)] text-white placeholder-gray-700 text-sm font-bold focus:border-[var(--accent-violet)] outline-none transition-all font-mono"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
              <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-2 ml-1">8+ CHARACTERS REQUIRED</p>
            </div>

            <button
              disabled={submitting}
              type="submit"
              className="w-full py-4 mt-4 rounded-2xl bg-[var(--accent-violet)] text-white text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-violet-500/20 flex items-center justify-center gap-3"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  Deploy Identity
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
