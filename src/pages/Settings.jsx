import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Users, Mail, Shield, Plus, Trash2, ShieldCheck, Loader2, X, LogOut } from 'lucide-react';
import { usersAPI } from '../api/endpoints';
import ConfirmModal from '../components/common/ConfirmModal';

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [teamUsers, setTeamUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  const [createMode, setCreateMode] = useState('invite'); // 'invite' | 'direct'
  const [directName, setDirectName] = useState('');
  const [directPassword, setDirectPassword] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const isAdmin = user?.role === 'owner' || user?.role === 'admin';
  const isOwner = user?.role === 'owner';
  const isSupport = user?.role === 'support';

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
      console.error('Action failed:', err);
    } finally {
      setInviting(false);
    }
  };

  const handleDeleteUser = (userId) => {
    setUserToDelete(userId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await usersAPI.delete(userToDelete);
      fetchUsers();
    } catch (err) {
      console.error('Failed to delete user');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="fixed left-0 right-0 z-40 overflow-y-auto custom-scrollbar bg-[var(--bg-main)]" style={{ top: 'var(--total-header)', bottom: 'var(--bottom-nav)' }}>
      <div className="p-4 sm:p-6 md:p-10 lg:p-12 w-full mx-auto">
      <ConfirmModal 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Remove Operator"
        message="Are you sure you want to remove this operator from the team? They will lose all access immediately."
        type="danger"
        confirmText="Remove Operator"
        onConfirm={confirmDeleteUser}
      />
      <div className="mb-5 md:mb-12">
        <h1 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight font-display leading-none">Security &amp; Team</h1>
        <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-2 md:mt-4">Workspace authorization and operator management</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">

        {/* Profile Column */}
        <div className="lg:col-span-1 space-y-4 md:space-y-8">
          <div className="glass-card p-5 md:p-10">
            <div className="flex flex-col items-center text-center mb-6 md:mb-10">
              <div className="w-14 h-14 md:w-24 md:h-24 bg-white/5 rounded-2xl md:rounded-[2rem] flex items-center justify-center mb-3 md:mb-6 border border-white/5 ring-4 ring-white/5 shrink-0">
                <User className="w-6 h-6 md:w-10 md:h-10 text-white" />
              </div>
              <h2 className="text-base md:text-xl font-black text-white uppercase tracking-tight font-display">{user?.name}</h2>
              <p className="text-[9px] md:text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-0.5 md:mt-1 truncate max-w-full px-2">{user?.email}</p>
              <div className="mt-3 md:mt-4">
                 <span className={`inline-flex items-center px-3 py-1 md:px-4 md:py-1.5 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest ${
                    user?.role === 'owner' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/10' : 
                    user?.role === 'admin' ? 'bg-violet-500/10 text-violet-500 border border-violet-500/10' :
                    user?.role === 'support' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/10' :
                    'bg-white/5 text-[var(--text-secondary)] border border-white/5'
                 }`}>
                    {user?.role}
                 </span>
              </div>
            </div>

            <div className="space-y-3 md:space-y-4 pt-6 md:pt-8 border-t border-[var(--border-color)]">
              <div className="flex items-center gap-3 md:gap-4 text-[9px] md:text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">
                <Shield className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500 shrink-0" />
                <span className="truncate">Security: Protected</span>
              </div>
              <div className="flex items-center gap-3 md:gap-4 text-[9px] md:text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">
                <ShieldCheck className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-500 shrink-0" />
                <span className="truncate">MFA: Handshake Pending</span>
              </div>
            </div>

            <div className="mt-6 md:mt-10">
               <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 md:gap-3 py-3 md:py-4 rounded-xl md:rounded-2xl bg-red-500/5 text-red-500 text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-lg"
               >
                  <LogOut className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  Terminate Session
               </button>
            </div>
          </div>
        </div>

        {/* Team Management Column */}
        <div className="lg:col-span-2">
          {isAdmin ? (
            <div className="glass-card p-5 sm:p-10">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 md:mb-12">
                <div className="flex items-center gap-4 md:gap-6">
                  <div className="p-3 md:p-4 rounded-2xl bg-white/5 text-white border border-white/5">
                    <Users className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-tight font-display">Operators</h2>
                    <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-1">Direct access control for the cluster</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[var(--accent-violet)] text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all active:scale-95 shadow-lg shadow-violet-500/20"
                >
                  Provision Access
                </button>
              </div>

              {loading ? (
                <div className="py-20 flex flex-col items-center gap-4">
                  <Loader2 className="w-10 h-10 text-[var(--accent-violet)] animate-spin" />
                  <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Syncing team registry...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {teamUsers.map(u => (
                    <div key={u.id} className="flex items-center justify-between p-4 md:p-6 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
                      <div className="flex items-center gap-3 md:gap-5 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center font-black text-white uppercase tracking-widest text-sm shrink-0">
                          {u.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-white uppercase tracking-tight truncate flex items-center gap-2">
                            {u.name} {u.id === user?.id && <span className="text-[10px] text-[var(--accent-mint)]">(YOU)</span>}
                          </p>
                          <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest truncate">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 md:px-3 py-1.5 rounded-lg ${
                          u.role === 'owner' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/10' :
                          u.role === 'admin' ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/10' :
                          u.role === 'support' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/10' :
                          'bg-white/5 text-[var(--text-secondary)] border border-white/5'
                        }`}>
                          {u.role}
                        </span>
                        {u.id !== user?.id && u.role !== 'owner' && (
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-2.5 rounded-xl bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white transition-all"
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
            <div className="glass-card p-6 sm:p-10 flex flex-col items-center justify-center text-center py-20 md:py-32">
              <div className="p-6 rounded-[2.5rem] bg-white/5 text-white/10 mb-8 border border-white/5">
                <Shield className="w-12 h-12" />
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight font-display mb-3">Restricted Scope</h2>
              <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest max-w-sm leading-relaxed">
                Team administration is reserved for authorized operators. Contact your cluster owner to modify access.
              </p>
            </div>
          )}

        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8">
           <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => !inviting && setShowInviteModal(false)} />
           <div className="glass-card w-full max-w-lg p-6 sm:p-10 relative z-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-10">
                 <h3 className="text-2xl font-black uppercase tracking-tight font-display">Provision Access</h3>
                 <button onClick={() => setShowInviteModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                    <X className="w-6 h-6 text-[var(--text-secondary)]" />
                 </button>
              </div>

              <div className="flex p-1 bg-black/40 border border-[var(--border-color)] rounded-2xl mb-10">
                <button
                  type="button"
                  onClick={() => setCreateMode('invite')}
                  className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${createMode === 'invite' ? 'bg-white text-[#2c2c2e]' : 'text-[var(--text-secondary)] hover:text-white'}`}
                >
                  Invitation
                </button>
                <button
                  type="button"
                  onClick={() => setCreateMode('direct')}
                  className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${createMode === 'direct' ? 'bg-white text-[#2c2c2e]' : 'text-[var(--text-secondary)] hover:text-white'}`}
                >
                  Direct Entry
                </button>
              </div>

              <form onSubmit={handleInvite} className="space-y-8">
                {createMode === 'direct' && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Full Name</label>
                    <input
                      required
                      type="text"
                      className="w-full px-6 py-4 rounded-2xl bg-black/40 border border-[var(--border-color)] text-white text-sm font-bold focus:border-[var(--accent-violet)] outline-none transition-all"
                      placeholder="OPERATOR NAME..."
                      value={directName}
                      onChange={e => setDirectName(e.target.value)}
                    />
                  </div>
                )}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Email Identity</label>
                  <input
                    required
                    type="email"
                    className="w-full px-6 py-4 rounded-2xl bg-black/40 border border-[var(--border-color)] text-white text-sm font-bold focus:border-[var(--accent-violet)] outline-none transition-all"
                    placeholder="EMAIL ADDRESS..."
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Authorization Role</label>
                  <select
                    className="w-full px-6 py-4 rounded-2xl bg-black/40 border border-[var(--border-color)] text-white text-sm font-bold focus:border-[var(--accent-violet)] outline-none transition-all appearance-none uppercase"
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value)}
                  >
                    <option value="member">MEMBER (View Scope)</option>
                    <option value="support">SUPPORT (Tickets Only)</option>
                    <option value="admin">ADMIN (Full Access)</option>
                  </select>
                </div>
                {createMode === 'direct' && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Security Token</label>
                    <input
                      required
                      type="text"
                      className="w-full px-6 py-4 rounded-2xl bg-black/40 border border-[var(--border-color)] text-white text-sm font-bold focus:border-[var(--accent-violet)] outline-none transition-all font-mono"
                      placeholder="••••••••"
                      value={directPassword}
                      onChange={e => setDirectPassword(e.target.value)}
                    />
                  </div>
                )}
                
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowInviteModal(false)} className="flex-1 px-8 py-4 rounded-xl bg-white/5 text-white text-[10px] font-black uppercase tracking-widest">Cancel</button>
                  <button
                    disabled={inviting}
                    type="submit"
                    className="flex-1 px-8 py-4 rounded-xl bg-[var(--accent-violet)] text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-violet-500/20"
                  >
                    {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Provision'}
                  </button>
                </div>
              </form>
           </div>
        </div>
      )}
      </div>
    </div>
  );
}
