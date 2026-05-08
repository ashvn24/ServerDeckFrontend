import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Lock, User, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
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
      alert(err.response?.data?.detail || 'Failed to create account.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Verifying invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-6">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-glass border border-white p-10 text-center">
          <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6 ring-8 ring-red-50/50">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Invitation Error</h1>
          <p className="text-gray-500 leading-relaxed mb-8">{error}</p>
          <Link to="/login" className="inline-flex items-center gap-2 text-primary-600 font-bold hover:gap-3 transition-all">
            Go to Login <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-6">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-glass border border-white p-10 text-center">
          <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-6 ring-8 ring-emerald-50/50">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Welcome Aboard!</h1>
          <p className="text-gray-500 leading-relaxed mb-8">
            Your account has been created successfully. You can now log in to the ServerDeck portal.
          </p>
          <button 
            onClick={() => navigate('/login')}
            className="w-full py-4 rounded-2xl bg-primary-600 text-white font-bold shadow-lg shadow-primary-200 hover:bg-primary-700 transition-all active:scale-95"
          >
            Login to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Join ServerDeck</h1>
          <p className="text-gray-500 font-medium">You've been invited to join as <span className="text-primary-600 font-bold uppercase text-xs">{inviteDetails?.role}</span></p>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-glass border border-white p-8 md:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Email</label>
              <div className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-gray-100 text-gray-400 font-medium cursor-not-allowed">
                {inviteDetails?.email}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Your Name</label>
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  required
                  type="text"
                  className="w-full pl-14 pr-5 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 ring-primary-500 font-medium"
                  placeholder="John Doe"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Set Password</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  required
                  type="password"
                  minLength={8}
                  className="w-full pl-14 pr-5 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 ring-primary-500 font-medium"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-2 ml-1">Must be at least 8 characters long.</p>
            </div>

            <button
              disabled={submitting}
              type="submit"
              className="w-full py-4 rounded-2xl bg-primary-600 text-white font-bold shadow-lg shadow-primary-200 hover:bg-primary-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
