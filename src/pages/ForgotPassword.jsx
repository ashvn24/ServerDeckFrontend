import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Server, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { authAPI } from '../api/endpoints';
import useSEO from '../hooks/useSEO';

export default function ForgotPassword() {
  useSEO({
    title: 'Forgot Password',
    description: 'Request a password reset link for your ServerDeck account.',
    keywords: ['forgot password', 'reset credentials', 'serverdeck']
  });

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authAPI.forgotPassword({ email });
      setSuccess(true);
      showToast('Password reset link sent if email exists', 'success');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to request reset link. Please try again.';
      setError(msg);
      showToast(`Error: ${msg}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-8 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--accent-violet)]/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--accent-mint)]/5 rounded-full blur-[120px]" />
      
      <div className="relative w-full max-w-md z-10">
        {/* Branding */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-5 bg-white text-[#2c2c2e] rounded-[2rem] mb-6 shadow-2xl shadow-white/10">
            <Server className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter font-display leading-none">ServerDeck</h1>
          <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.3em] mt-4">Enterprise Infrastructure Gateway</p>
        </div>

        {/* Form Module */}
        <div className="glass-card p-10">
          {success ? (
            <div className="text-center py-6">
              <div className="w-20 h-20 bg-[var(--accent-mint)]/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-[var(--accent-mint)]/20">
                <CheckCircle className="w-10 h-10 text-[var(--accent-mint)]" />
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight font-display mb-4">Link Transmitted</h2>
              <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide leading-relaxed mb-8">
                If the email address is associated with an active gateway credential, a password reset link has been dispatched. Check your inbox.
              </p>
              <Link 
                to="/login"
                className="w-full py-4 rounded-2xl bg-white text-[#2c2c2e] text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-10">
                 <h2 className="text-2xl font-black text-white uppercase tracking-tight font-display">
                   Reset Credentials
                 </h2>
                 <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-1">
                   Request secure password reset
                 </p>
              </div>

              {error && (
                <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-6 py-4 rounded-2xl bg-black/40 border border-[var(--border-color)] text-white placeholder-gray-700 text-sm font-bold focus:border-[var(--accent-violet)] outline-none transition-all"
                    placeholder="your@email.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 mt-4 rounded-2xl bg-white text-[#2c2c2e] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-white/5"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Send Reset Instructions
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 text-center border-t border-[var(--border-color)] pt-6">
                <Link to="/login" className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest hover:text-white transition-colors">
                  Return to Gateway
                </Link>
              </div>
            </>
          )}
        </div>

        <div className="mt-12 text-center">
           <p className="text-[10px] font-bold text-white/10 uppercase tracking-[0.5em]">SECURED BY RSA-4096 / TLS 1.3</p>
        </div>
      </div>
    </div>
  );
}
