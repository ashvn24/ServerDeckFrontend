import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Server, ArrowRight, Loader2, CheckCircle2, User, Building, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { authAPI } from '../api/endpoints';
import useSEO from '../hooks/useSEO';

export default function Login() {
  useSEO({
    title: 'Sign In',
    description: 'Sign in to your ServerDeck dashboard to manage your servers, Nginx configurations, SSL certificates, and support tickets.',
    keywords: ['login serverdeck', 'infrastructure management sign in']
  });

  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'signup'
  const [signupType, setSignupType] = useState('personal'); // 'personal' or 'org'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '', orgName: '' });
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, complete2FALogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useNotification();

  // Two-Factor Authentication state
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaToken, setMfaToken] = useState('');
  const [mfaMethod, setMfaMethod] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(form.email, form.password);
      if (res && res.mfa_required) {
        setMfaToken(res.mfa_token);
        setMfaMethod(res.mfa_method);
        setMfaRequired(true);
        showToast('Two-Factor Authentication Required', 'info');
        return;
      }
      showToast('Login Successful', 'success');
      
      const from = location.state?.from;
      const isPO = localStorage.getItem('serverdeck_is_platform_owner') === 'true';
      const dest = from
        ? `${from.pathname}${from.search || ''}${from.hash || ''}`
        : (isPO ? '/organizations' : '/dashboard');
      navigate(dest, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.detail || 'Handshake failed. Verify credentials.';
      setError(msg);
      showToast(`Authentication Error: ${msg}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (mfaCode.length !== 6) {
      setError('Verification code must be 6 digits.');
      return;
    }
    setMfaLoading(true);
    try {
      await complete2FALogin(mfaToken, mfaCode);
      showToast('Login Successful', 'success');
      
      const from = location.state?.from;
      const isPO = localStorage.getItem('serverdeck_is_platform_owner') === 'true';
      const dest = from
        ? `${from.pathname}${from.search || ''}${from.hash || ''}`
        : (isPO ? '/organizations' : '/dashboard');
      navigate(dest, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid verification code.';
      setError(msg);
      showToast(`Verification Error: ${msg}`, 'error');
    } finally {
      setMfaLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authAPI.joinWaitlist({
        email: signupForm.email,
        name: signupForm.name,
        password: signupForm.password,
        request_type: signupType === 'org' ? 'organization' : 'personal',
        org_name: signupType === 'org' ? signupForm.orgName : null
      });
      setSignupSuccess(true);
      showToast('Access Request Submitted Successfully', 'success');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to submit request. Please try again.';
      setError(msg);
      showToast(`Request Error: ${msg}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (tab) => {
    setError('');
    setActiveTab(tab);
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

        {/* Auth Module */}
        <div className="glass-card p-10">
          {mfaRequired ? (
            <div className="text-center py-6">
              <div className="mb-8">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight font-display">Two-Factor Auth</h2>
                <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-1">
                  Verify your identity to proceed
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleMfaSubmit} className="space-y-6 text-left">
                <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide leading-relaxed text-center">
                  Enter the 6-digit code from your {mfaMethod === 'totp' ? 'authenticator app' : 'email inbox'}:
                </p>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1">Verification Code</label>
                  <input
                    required
                    type="text"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    className="w-full px-6 py-4 rounded-2xl bg-black/40 border border-[var(--border-color)] text-white text-center text-lg font-black tracking-[0.4em] focus:border-[var(--accent-violet)] outline-none transition-all font-mono"
                    placeholder="000000"
                    value={mfaCode}
                    onChange={e => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  />
                </div>

                <button
                  type="submit"
                  disabled={mfaLoading}
                  className="w-full py-4 mt-4 rounded-2xl bg-white text-[#2c2c2e] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-white/5"
                >
                  {mfaLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#2c2c2e]" />
                  ) : (
                    <>
                      Verify & Sign In
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 text-center border-t border-[var(--border-color)] pt-6">
                <button 
                  onClick={() => {
                    setMfaRequired(false);
                    setMfaToken('');
                    setMfaCode('');
                    setError('');
                  }}
                  className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest hover:text-white transition-colors"
                >
                  Cancel and Sign In Again
                </button>
              </div>
            </div>
          ) : signupSuccess ? (
            <div className="text-center py-6">
              <div className="w-20 h-20 bg-[var(--accent-mint)]/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-[var(--accent-mint)]/20">
                <ShieldCheck className="w-10 h-10 text-[var(--accent-mint)]" />
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight font-display mb-4">Request Submitted</h2>
              <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide leading-relaxed mb-8">
                Your request for access has been registered and sent to the owner for provisioning. You will receive an email once approved.
              </p>
              <button 
                onClick={() => {
                  setSignupSuccess(false);
                  setSignupForm({ name: '', email: '', password: '', orgName: '' });
                  setActiveTab('login');
                }}
                className="w-full py-4 rounded-2xl bg-white text-[#2c2c2e] text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all active:scale-95"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <>
              {/* Tab Selector */}
              <div className="flex border-b border-[var(--border-color)] mb-8">
                <button
                  type="button"
                  onClick={() => switchTab('login')}
                  className={`flex-1 pb-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${
                    activeTab === 'login'
                      ? 'text-white border-white'
                      : 'text-[var(--text-secondary)] border-transparent hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => switchTab('signup')}
                  className={`flex-1 pb-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${
                    activeTab === 'signup'
                      ? 'text-white border-white'
                      : 'text-[var(--text-secondary)] border-transparent hover:text-white'
                  }`}
                >
                  Request Access
                </button>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight font-display">
                  {activeTab === 'login' ? 'Login' : 'Sign Up'}
                </h2>
                <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-1">
                  {activeTab === 'login' ? 'Access your infrastructure' : 'Request gateway credentials'}
                </p>
              </div>

              {error && (
                <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest text-center">
                  {error}
                </div>
              )}

              {activeTab === 'login' ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                      className="w-full px-6 py-4 rounded-2xl bg-black/40 border border-[var(--border-color)] text-white placeholder-gray-700 text-sm font-bold focus:border-[var(--accent-violet)] outline-none transition-all"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Password</label>
                      <Link to="/forgot-password" className="text-[9px] font-bold text-[var(--accent-violet)] uppercase tracking-widest hover:underline">
                        Forgot?
                      </Link>
                    </div>
                    <div className="relative">
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        required
                        minLength={6}
                        className="w-full pl-6 pr-12 py-4 rounded-2xl bg-black/40 border border-[var(--border-color)] text-white placeholder-gray-700 text-sm font-bold focus:border-[var(--accent-violet)] outline-none transition-all font-mono"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-white transition-colors"
                      >
                        {showLoginPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
                        Sign In
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSignupSubmit} className="space-y-6">
                  {/* Account Type Selector */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1">Usage Scope</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setSignupType('personal')}
                        className={`py-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest flex flex-col items-center gap-2 transition-all ${
                          signupType === 'personal'
                            ? 'bg-[var(--accent-violet)]/10 border-[var(--accent-violet)] text-white'
                            : 'bg-black/20 border-[var(--border-color)] text-[var(--text-secondary)] hover:text-white'
                        }`}
                      >
                        <User className="w-5 h-5" />
                        Personal Use
                      </button>
                      <button
                        type="button"
                        onClick={() => setSignupType('org')}
                        className={`py-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest flex flex-col items-center gap-2 transition-all ${
                          signupType === 'org'
                            ? 'bg-[var(--accent-violet)]/10 border-[var(--accent-violet)] text-white'
                            : 'bg-black/20 border-[var(--border-color)] text-[var(--text-secondary)] hover:text-white'
                        }`}
                      >
                        <Building className="w-5 h-5" />
                        Organization
                      </button>
                    </div>
                  </div>

                  {signupType === 'org' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1">Organization Name</label>
                      <input
                        type="text"
                        value={signupForm.orgName}
                        onChange={(e) => setSignupForm({ ...signupForm, orgName: e.target.value })}
                        required={signupType === 'org'}
                        className="w-full px-6 py-4 rounded-2xl bg-black/40 border border-[var(--border-color)] text-white placeholder-gray-700 text-sm font-bold focus:border-[var(--accent-violet)] outline-none transition-all"
                        placeholder="Company name"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1">Name</label>
                    <input
                      type="text"
                      value={signupForm.name}
                      onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                      required
                      className="w-full px-6 py-4 rounded-2xl bg-black/40 border border-[var(--border-color)] text-white placeholder-gray-700 text-sm font-bold focus:border-[var(--accent-violet)] outline-none transition-all"
                      placeholder="Your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1">Email</label>
                    <input
                      type="email"
                      value={signupForm.email}
                      onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                      required
                      className="w-full px-6 py-4 rounded-2xl bg-black/40 border border-[var(--border-color)] text-white placeholder-gray-700 text-sm font-bold focus:border-[var(--accent-violet)] outline-none transition-all"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1">Password</label>
                    <div className="relative">
                      <input
                        type={showSignupPassword ? "text" : "password"}
                        value={signupForm.password}
                        onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                        required
                        minLength={8}
                        className="w-full pl-6 pr-12 py-4 rounded-2xl bg-black/40 border border-[var(--border-color)] text-white placeholder-gray-700 text-sm font-bold focus:border-[var(--accent-violet)] outline-none transition-all font-mono"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-white transition-colors"
                      >
                        {showSignupPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
                        Request for Access
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
