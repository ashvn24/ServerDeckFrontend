import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Users, Mail, Shield, Plus, Trash2, ShieldCheck, Loader2 } from 'lucide-react';
import { usersAPI } from '../api/endpoints';

export default function Settings() {
  const { user } = useAuth();
  const [teamUsers, setTeamUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  // Direct create states (Owner only)
  const [createMode, setCreateMode] = useState('invite'); // 'invite' | 'direct'
  const [directName, setDirectName] = useState('');
  const [directPassword, setDirectPassword] = useState('');

  const isAdmin = user?.role === 'owner' || user?.role === 'admin';
  const isOwner = user?.role === 'owner';

  const fetchUsers = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const res = await usersAPI.list();
      setTeamUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [isAdmin]);

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    try {
      if (createMode === 'direct' && isOwner) {
        await usersAPI.directCreate({ 
          email: inviteEmail, 
          role: inviteRole,
          name: directName,
          password: directPassword
        });
      } else {
        await usersAPI.invite({ email: inviteEmail, role: inviteRole });
      }
      
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('member');
      setDirectName('');
      setDirectPassword('');
      fetchUsers();
    } catch (err) {
      alert('Action failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setInviting(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to remove this user from the team?')) return;
    try {
      await usersAPI.delete(userId);
      fetchUsers();
    } catch (err) {
      alert('Failed to delete user');
    }
  };

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8 tracking-tight">Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/60 backdrop-blur-xl border border-white/60 shadow-glass rounded-[2rem] p-8">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-20 h-20 bg-primary-50 rounded-3xl flex items-center justify-center mb-4 ring-8 ring-primary-50/50 shadow-inner">
                <User className="w-10 h-10 text-primary-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
              <p className="text-sm text-gray-500 font-medium">{user?.email}</p>
              <span className={`mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                user?.role === 'owner' ? 'bg-amber-100 text-amber-700' : 
                user?.role === 'admin' ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {user?.role}
              </span>
            </div>

            <div className="space-y-4 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Shield className="w-4 h-4 text-gray-400" />
                <span>Security: Password Protected</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <ShieldCheck className="w-4 h-4 text-gray-400" />
                <span>MFA: Not Enabled</span>
              </div>
            </div>
          </div>
        </div>

        {/* Team Management Column */}
        <div className="lg:col-span-2">
          {isAdmin ? (
            <div className="bg-white/60 backdrop-blur-xl border border-white/60 shadow-glass rounded-[2rem] p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">Team Management</h2>
                    <p className="text-sm text-gray-500 font-medium">Manage who has access to your servers</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowInviteModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary-600 text-white text-sm font-bold shadow-lg shadow-primary-200 hover:bg-primary-700 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" /> Invite User
                </button>
              </div>

              {loading ? (
                <div className="py-20 flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading team members...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {teamUsers.map(u => (
                    <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-white/40 border border-white/60 hover:bg-white transition-all group gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-500 flex-shrink-0">
                          {u.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{u.name} {u.id === user?.id && <span className="text-[10px] text-primary-500 ml-1">(You)</span>}</p>
                          <p className="text-xs text-gray-500 font-medium truncate">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg ${
                          u.role === 'owner' ? 'bg-amber-100 text-amber-600' :
                          u.role === 'admin' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {u.role}
                        </span>
                        {u.id !== user?.id && u.role !== 'owner' && (
                          <button 
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-2 rounded-xl text-red-400 hover:text-red-500 hover:bg-red-50 transition-all sm:opacity-0 sm:group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white/60 backdrop-blur-xl border border-white/60 shadow-glass rounded-[2rem] p-8 flex flex-col items-center justify-center text-center py-20">
              <div className="p-5 rounded-3xl bg-gray-50 text-gray-400 mb-6">
                <Shield className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Restricted Access</h2>
              <p className="text-gray-500 max-w-sm leading-relaxed">
                Only team administrators can manage users and roles. Contact your team owner to invite new members.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowInviteModal(false)} />
          <form 
            onSubmit={handleInvite} 
            className="bg-white rounded-[2.5rem] shadow-2xl border border-white/40 w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-300 my-auto max-h-[calc(100vh-2rem)] flex flex-col"
          >
            <div className="p-8 overflow-y-auto no-scrollbar">
              <div className="w-16 h-16 bg-primary-50 rounded-3xl flex items-center justify-center mb-6 ring-8 ring-primary-50/50">
                {createMode === 'invite' ? <Mail className="w-8 h-8 text-primary-500" /> : <User className="w-8 h-8 text-primary-500" />}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {createMode === 'invite' ? 'Invite Team Member' : 'Create User Directly'}
              </h3>
              <p className="text-gray-500 leading-relaxed mb-6">
                {createMode === 'invite' 
                  ? 'Send an invitation to join your ServerDeck team.' 
                  : 'Instantly create an account for a new team member.'}
              </p>

              {isOwner && (
                <div className="flex p-1 bg-gray-100 rounded-2xl mb-8">
                  <button
                    type="button"
                    onClick={() => setCreateMode('invite')}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${createMode === 'invite' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                  >
                    Invitation Flow
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateMode('direct')}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${createMode === 'direct' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                  >
                    Direct Create
                  </button>
                </div>
              )}
              
              <div className="space-y-5">
                {createMode === 'direct' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                    <input
                      required
                      type="text"
                      className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 ring-primary-500 font-medium"
                      placeholder="John Doe"
                      value={directName}
                      onChange={e => setDirectName(e.target.value)}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                  <input
                    required
                    type="email"
                    className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 ring-primary-500 font-medium"
                    placeholder="name@company.com"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Assigned Role</label>
                  <select
                    className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 ring-primary-500 font-medium appearance-none"
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value)}
                  >
                    <option value="member">Member (View Only)</option>
                    <option value="admin">Admin (Manage Servers & Users)</option>
                  </select>
                </div>
                {createMode === 'direct' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Initial Password</label>
                    <input
                      required
                      type="text"
                      className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 ring-primary-500 font-medium font-mono"
                      placeholder="••••••••"
                      value={directPassword}
                      onChange={e => setDirectPassword(e.target.value)}
                    />
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 mt-10">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-6 py-4 rounded-2xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  disabled={inviting}
                  type="submit"
                  className="flex-1 px-6 py-4 rounded-2xl bg-primary-600 text-white font-bold hover:bg-primary-700 shadow-lg shadow-primary-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : (createMode === 'invite' ? 'Send Invite' : 'Create Account')}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
