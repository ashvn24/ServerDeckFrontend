import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Server, ArrowRight, Loader2 } from 'lucide-react';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register(form.name, form.email, form.password);
      } else {
        await login(form.email, form.password);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Handshake failed. Verify credentials.');
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
          <div className="inline-flex items-center justify-center p-5 bg-white text-black rounded-[2rem] mb-6 shadow-2xl shadow-white/10">
            <Server className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter font-display leading-none">ServerDeck</h1>
          <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.3em] mt-4">Enterprise Infrastructure Gateway</p>
        </div>

        {/* Auth Module */}
        <div className="glass-card p-10">
          <div className="mb-10">
             <h2 className="text-2xl font-black text-white uppercase tracking-tight font-display">
               {isRegister ? 'Provision Account' : 'Identify Operator'}
             </h2>
             <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-1">
               {isRegister ? 'Initialize a new operator profile' : 'Establish an encrypted session'}
             </p>
          </div>

          {error && (
            <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {isRegister && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1">Identity Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full px-6 py-4 rounded-2xl bg-black/40 border border-[var(--border-color)] text-white placeholder-gray-700 text-sm font-bold focus:border-[var(--accent-violet)] outline-none transition-all"
                  placeholder="e.g. CORE-ADMIN-01"
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1">Email Protocol</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full px-6 py-4 rounded-2xl bg-black/40 border border-[var(--border-color)] text-white placeholder-gray-700 text-sm font-bold focus:border-[var(--accent-violet)] outline-none transition-all"
                placeholder="identity@portal.net"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1">Security Token</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
                className="w-full px-6 py-4 rounded-2xl bg-black/40 border border-[var(--border-color)] text-white placeholder-gray-700 text-sm font-bold focus:border-[var(--accent-violet)] outline-none transition-all font-mono"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-4 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-white/5"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isRegister ? 'Deploy Profile' : 'Authorize Handshake'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
            <button
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest hover:text-white transition-colors"
            >
              {isRegister ? 'Returning Operator? Sign In' : 'New System Member? Provision Here'}
            </button>
          </div>
        </div>

        <div className="mt-12 text-center">
           <p className="text-[10px] font-bold text-white/10 uppercase tracking-[0.5em]">SECURED BY RSA-4096 / TLS 1.3</p>
        </div>
      </div>
    </div>
  );
}
