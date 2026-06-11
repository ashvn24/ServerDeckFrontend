import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Users, Mail, Shield, Plus, Trash2, ShieldCheck, Loader2, X, LogOut, Sliders } from 'lucide-react';
import { usersAPI } from '../api/endpoints';
import ConfirmModal from '../components/common/ConfirmModal';

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [teamUsers, setTeamUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModulesModal, setShowUserModulesModal] = useState(false);
  const [inheritOrgModules, setInheritOrgModules] = useState(true);
  const [selectedUserModules, setSelectedUserModules] = useState([]);
  const [savingUserModules, setSavingUserModules] = useState(false);

  const [showDeleteId, setShowDeleteId] = useState(null);
  const pressTimer = useRef(null);

  const handleTouchStart = (userId) => {
    pressTimer.current = setTimeout(() => {
      setShowDeleteId(userId);
    }, 600);
  };

  const handleTouchEnd = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };
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

  const handleOpenUserModules = (targetUser) => {
    setSelectedUser(targetUser);
    const usesInheritance = targetUser.custom_modules === null;
    setInheritOrgModules(usesInheritance);
    setSelectedUserModules(usesInheritance ? targetUser.enabled_modules : targetUser.custom_modules);
    setShowUserModulesModal(true);
  };

  const handleToggleUserModule = (moduleId) => {
    if (inheritOrgModules) return;
    setSelectedUserModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleSaveUserModules = async (e) => {
    e.preventDefault();
    setSavingUserModules(true);
    try {
      const payload = inheritOrgModules ? null : selectedUserModules;
      await usersAPI.updateModules(selectedUser.id, payload);
      setShowUserModulesModal(false);
      fetchUsers();
    } catch (err) {
      console.error('Failed to update user modules:', err);
    } finally {
      setSavingUserModules(false);
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
      <div className="mb-5 md:mb-8 flex items-center gap-2">
        <div className="p-2.5 bg-[var(--accent-violet)] shadow-lg shadow-violet-500/20 rounded-xl shrink-0">
          <Shield className="w-5 h-5 text-[#2c2c2e]" />
        </div>
        <div className="flex-1 min-w-0">
           <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest pl-2">Workspace & Operator Management</span>
        </div>
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
                  <div className="p-3 md:p-4 rounded-2xl bg-white/5 text-[var(--text-primary)] border border-white/5">
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
                    <div 
                      key={u.id} 
                      onPointerDown={() => handleTouchStart(u.id)}
                      onPointerUp={handleTouchEnd}
                      onPointerLeave={handleTouchEnd}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        if (u.id !== user?.id && u.role !== 'owner') setShowDeleteId(u.id);
                      }}
                      className="relative flex items-center justify-between p-4 md:p-6 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group overflow-hidden"
                    >
                      {/* Delete Overlay */}
                      {showDeleteId === u.id && u.id !== user?.id && u.role !== 'owner' && (
                        <div className="absolute inset-0 z-10 flex items-center justify-between px-4 sm:px-6 bg-red-500/95 backdrop-blur-sm animate-in fade-in duration-200">
                          <span className="text-white text-xs sm:text-sm font-black uppercase tracking-widest flex items-center gap-1.5 sm:gap-2 truncate mr-2">
                            <Trash2 className="w-4 h-4 shrink-0" /> 
                            <span className="truncate hidden sm:inline">Remove {u.name}?</span>
                            <span className="truncate sm:hidden">Remove?</span>
                          </span>
                          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                            <button 
                              onClick={() => { setShowDeleteId(null); handleDeleteUser(u.id); }}
                              className="px-3 sm:px-4 py-2 rounded-xl bg-white text-red-600 text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-transform shrink-0"
                            >
                              Confirm
                            </button>
                            <button 
                              onClick={() => setShowDeleteId(null)}
                              className="px-3 sm:px-4 py-2 rounded-xl bg-black/30 text-white text-[10px] font-black uppercase tracking-widest hover:bg-black/50 transition-colors shrink-0"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

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
                        {u.role !== 'owner' && (
                          <button
                            onClick={() => handleOpenUserModules(u)}
                            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all border border-white/5"
                            title="Configure Modules"
                          >
                            <Sliders className="w-3.5 h-3.5" />
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

      {/* User Modules Modal */}
      {showUserModulesModal && selectedUser && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => !savingUserModules && setShowUserModulesModal(false)} />
          <div className="glass-card w-full max-w-2xl p-6 sm:p-10 relative z-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/10">
                  <Sliders className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight font-display">Operator Modules</h3>
                  <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-1">
                    Configuring enabled features for {selectedUser.name}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowUserModulesModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                <X className="w-6 h-6 text-[var(--text-secondary)]" />
              </button>
            </div>

            <form onSubmit={handleSaveUserModules} className="space-y-6">
              {/* Inherit Org Modules Toggler */}
              <div
                onClick={() => {
                  const newInherit = !inheritOrgModules;
                  setInheritOrgModules(newInherit);
                  setSelectedUserModules(newInherit ? selectedUser.enabled_modules : (selectedUser.custom_modules || selectedUser.enabled_modules));
                }}
                className={`p-4 rounded-2xl bg-black/40 border cursor-pointer select-none transition-all flex items-center justify-between hover:bg-white/5 ${
                  inheritOrgModules ? 'border-[var(--accent-violet)] shadow-lg shadow-violet-500/5' : 'border-[var(--border-color)]'
                }`}
              >
                <div>
                  <p className="text-xs font-black text-white uppercase tracking-tight">Inherit Organization Defaults</p>
                  <p className="text-[10px] font-medium text-[var(--text-secondary)] mt-1">
                    Use global organization modules configuration. Custom overrides are disabled.
                  </p>
                </div>
                <div className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ${inheritOrgModules ? 'bg-[var(--accent-violet)]' : 'bg-gray-700'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${inheritOrgModules ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </div>

              {/* Navigation Bar Category */}
              <div className={inheritOrgModules ? 'opacity-50 pointer-events-none' : ''}>
                <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-4 border-b border-white/5 pb-2">
                  Navigation Bar Modules
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { id: 'dashboard', name: 'Dashboard Console', desc: 'Display global status dashboard' },
                    { id: 'servers', name: 'Server Management', desc: 'Manage nodes and view server terminal/stats' },
                    { id: 'tickets', name: 'Support Tickets', desc: 'View customer support desk tickets' },
                    { id: 'settings', name: 'Settings / Team', desc: 'Manage settings and team operator permissions' }
                  ].map(mod => {
                    const isChecked = selectedUserModules.includes(mod.id);
                    return (
                      <div
                        key={mod.id}
                        onClick={() => handleToggleUserModule(mod.id)}
                        className={`p-4 rounded-2xl bg-black/40 border cursor-pointer select-none transition-all flex items-start gap-3 hover:bg-white/5 ${
                          isChecked ? 'border-violet-500/50 shadow-lg' : 'border-[var(--border-color)]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={inheritOrgModules}
                          onChange={() => {}}
                          className="mt-1 accent-violet-500 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                        />
                        <div>
                          <p className="text-xs font-black text-white uppercase tracking-tight">{mod.name}</p>
                          <p className="text-[10px] font-medium text-[var(--text-secondary)] mt-1">{mod.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Server Features Category */}
              <div className={inheritOrgModules ? 'opacity-50 pointer-events-none' : ''}>
                <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-4 border-b border-white/5 pb-2">
                  Server Detail Feature Modules
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { id: 'nginx', name: 'Nginx Sites Manager', desc: 'Create and delete virtual hosts and site configs' },
                    { id: 'pm2', name: 'PM2 Application Manager', desc: 'Monitor process list and restart PM2 node apps' },
                    { id: 'systemd', name: 'Systemd Service Manager', desc: 'Start, stop and restart background Linux daemons' },
                    { id: 'automation', name: 'Automation Manager', desc: 'Configure scheduled tasks and automation scripts' },
                    { id: 'firewall', name: 'Firewall / Security', desc: 'Manage active ufw rules, ports, and bans' },
                    { id: 'processes', name: 'Process Manager', desc: 'View live process list and terminate memory-heavy PIDs' },
                    { id: 'ssl', name: 'SSL Certificate Manager', desc: 'Provision Let\'s Encrypt SSL and auto-renewal certificates' },
                    { id: 'ssh', name: 'SSH Terminal Access', desc: 'Open direct secure browser-based SSH command console' },
                    { id: 'files', name: 'File Browser', desc: 'Navigate filesystems, view logs, edit configs, and upload files' },
                    { id: 'luxegenie', name: 'LuxeGenie AI Diagnostics', desc: 'Use AI agent to diagnose errors and suggest repairs' }
                  ].map(mod => {
                    const isChecked = selectedUserModules.includes(mod.id);
                    return (
                      <div
                        key={mod.id}
                        onClick={() => handleToggleUserModule(mod.id)}
                        className={`p-4 rounded-2xl bg-black/40 border cursor-pointer select-none transition-all flex items-start gap-3 hover:bg-white/5 ${
                          isChecked ? 'border-violet-500/50 shadow-lg' : 'border-[var(--border-color)]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={inheritOrgModules}
                          onChange={() => {}}
                          className="mt-1 accent-violet-500 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                        />
                        <div>
                          <p className="text-xs font-black text-white uppercase tracking-tight">{mod.name}</p>
                          <p className="text-[10px] font-medium text-[var(--text-secondary)] mt-1">{mod.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowUserModulesModal(false)}
                  className="flex-1 px-8 py-4 rounded-xl bg-white/5 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  disabled={savingUserModules}
                  type="submit"
                  className="flex-1 px-8 py-4 rounded-xl bg-[var(--accent-violet)] text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {savingUserModules ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </span>
                  ) : 'Save Changes'}
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
