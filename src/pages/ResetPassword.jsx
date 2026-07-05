import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Server, ArrowRight, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { authAPI } from '../api/endpoints';
import useSEO from '../hooks/useSEO';

export default function ResetPassword() {
  useSEO({
    title: 'Reset Password',
    description: 'Establish a new password for your ServerDeck account.',
    keywords: ['reset password', 'change credentials', 'serverdeck']
  });

  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Authorization token is missing. Access cannot be verified.');
      showToast('Error: Token missing', 'error');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      showToast('Error: Passwords do not match', 'error');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      showToast('Error: Password too short', 'error');
      return;
    }

    setLoading(true);
    try {
      await authAPI.resetPassword({ token, new_password: password });
      setSuccess(true);
      showToast('Password reset successfully', 'success');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to reset password. Token may have expired.';
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
                <CheckCircle2 className="w-10 h-10 text-[var(--accent-mint)]" />
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight font-display mb-4">Credentials Updated</h2>
              <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide leading-relaxed mb-8">
                Your password has been reset successfully. You may now log in to the gateway with your new credentials.
              </p>
              <button 
                onClick={() => navigate('/login')}
                className="w-full py-4 rounded-2xl bg-white text-[#2c2c2e] text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all active:scale-95"
              >
                Log In
              </button>
            </div>
          ) : (
            <>
              <div className="mb-10">
                 <h2 className="text-2xl font-black text-white uppercase tracking-tight font-display">
                   Create Password
                 </h2>
                 <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-1">
                   Establish new account credentials
                 </p>
              </div>

              {error && (
                <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest text-center">
                  {error}
                </div>
              )}

              {!token ? (
                <div className="text-center">
                  <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide leading-relaxed mb-6">
                    A password reset token is required. If you arrived via a link, it may be malformed or incomplete.
                  </p>
                  <Link to="/forgot-password" className="text-[10px] font-black text-white uppercase tracking-widest underline">
                    Request new instructions
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1">New Password</label>
                     <div className="relative">
                       <input
                         type={showPassword ? "text" : "password"}
                         value={password}
                         onChange={(e) => setPassword(e.target.value)}
                         required
                         minLength={8}
                         className="w-full pl-6 pr-12 py-4 rounded-2xl bg-black/40 border border-[var(--border-color)] text-white placeholder-gray-700 text-sm font-bold focus:border-[var(--accent-violet)] outline-none transition-all font-mono"
                         placeholder="••••••••"
                       />
                       <button
                         type="button"
                         onClick={() => setShowPassword(!showPassword)}
                         className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-white transition-colors"
                       >
                         {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                       </button>
                     </div>
                   </div>

                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1">Confirm Password</label>
                     <div className="relative">
                       <input
                         type={showConfirmPassword ? "text" : "password"}
                         value={confirmPassword}
                         onChange={(e) => setConfirmPassword(e.target.value)}
                         required
                         minLength={8}
                         className="w-full pl-6 pr-12 py-4 rounded-2xl bg-black/40 border border-[var(--border-color)] text-white placeholder-gray-700 text-sm font-bold focus:border-[var(--accent-violet)] outline-none transition-all font-mono"
                         placeholder="••••••••"
                       />
                       <button
                         type="button"
                         onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                         className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-white transition-colors"
                       >
                         {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                       </button>
                     </div>
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
                        Reset Password
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
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
