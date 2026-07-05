import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Users, Mail, Shield, Plus, Trash2, ShieldCheck, Loader2, X, LogOut, Sliders, ArrowRight, Database, Cpu, Globe, Eye, EyeOff } from 'lucide-react';
import { usersAPI } from '../api/endpoints';
import ConfirmModal from '../components/common/ConfirmModal';
import Modal from '../components/common/Modal';
import { useNotification } from '../context/NotificationContext';

export default function Settings() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const [activeTab, setActiveTab] = useState('profile');

  // Two-Factor Authentication state
  const [showMfaModal, setShowMfaModal] = useState(false);
  const [mfaSetupStep, setMfaSetupStep] = useState(1);
  const [mfaMethod, setMfaMethod] = useState('totp');
  const [mfaSecret, setMfaSecret] = useState('');
  const [mfaQrCode, setMfaQrCode] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState('');

  const [showDisableMfaModal, setShowDisableMfaModal] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [disableError, setDisableError] = useState('');
  const [disableLoading, setDisableLoading] = useState(false);

  const handleStart2FA = async (method) => {
    setMfaMethod(method);
    setMfaError('');
    setMfaLoading(true);
    try {
      const res = await usersAPI.setup2FA({ method });
      if (method === 'totp') {
        setMfaSecret(res.data.secret);
        setMfaQrCode(res.data.qr_code_url);
        setMfaSetupStep(2);
      } else {
        showToast('Verification code sent to your email', 'success');
        setMfaSetupStep(2);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to initialize 2FA setup.';
      setMfaError(msg);
      showToast(`Error: ${msg}`, 'error');
    } finally {
      setMfaLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setMfaError('');
    if (mfaCode.length !== 6) {
      setMfaError('Verification code must be 6 digits.');
      return;
    }
    setMfaLoading(true);
    try {
      await usersAPI.verify2FA({
        method: mfaMethod,
        code: mfaCode,
        secret: mfaMethod === 'totp' ? mfaSecret : null
      });
      showToast('Two-Factor Authentication activated successfully.', 'success');
      await refreshUser();
      setShowMfaModal(false);
      resetMfaState();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid verification code.';
      setMfaError(msg);
      showToast(`Error: ${msg}`, 'error');
    } finally {
      setMfaLoading(false);
    }
  };

  const handleStartDisable2FA = async () => {
    setDisableError('');
    setDisableCode('');
    if (user.two_factor_method === 'email') {
      setDisableLoading(true);
      try {
        await usersAPI.disable2FA({ code: 'send_otp' });
        showToast('Verification code sent to your email', 'success');
      } catch (err) {
        showToast('Failed to send verification code.', 'error');
      } finally {
        setDisableLoading(false);
      }
    }
    setShowDisableMfaModal(true);
  };

  const handleDisable2FA = async (e) => {
    e.preventDefault();
    setDisableError('');
    setDisableLoading(true);
    try {
      await usersAPI.disable2FA({ code: disableCode });
      showToast('Two-Factor Authentication disabled.', 'success');
      await refreshUser();
      setShowDisableMfaModal(false);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid verification code.';
      setDisableError(msg);
      showToast(`Error: ${msg}`, 'error');
    } finally {
      setDisableLoading(false);
    }
  };

  const resetMfaState = () => {
    setMfaSetupStep(1);
    setMfaSecret('');
    setMfaQrCode('');
    setMfaCode('');
    setMfaError('');
  };
  
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDirectPassword, setShowDirectPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }
    setPasswordLoading(true);
    try {
      await usersAPI.changePassword({
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword
      });
      showToast('Password updated successfully', 'success');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to update password. Verify current password.';
      setPasswordError(msg);
      showToast(`Error: ${msg}`, 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Navigation Sidebar */}
        <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 border-b lg:border-b-0 lg:border-r border-white/5 pr-0 lg:pr-6 custom-scrollbar shrink-0">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-white text-black shadow-lg shadow-white/5'
                : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/5'
            }`}
          >
            <User className="w-4 h-4" />
            Account Profile
          </button>
          
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === 'security'
                ? 'bg-white text-black shadow-lg shadow-white/5'
                : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/5'
            }`}
          >
            <Shield className="w-4 h-4" />
            Security & Keys
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab('operators')}
              className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                activeTab === 'operators'
                  ? 'bg-white text-black shadow-lg shadow-white/5'
                  : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-4 h-4" />
              Team Operators
            </button>
          )}
        </div>

        {/* Settings Content Pane */}
        <div className="lg:col-span-3">
          
          {activeTab === 'profile' && (
            <div className="max-w-3xl space-y-6">
              
              {/* Profile Passport Card */}
              <div className="glass-card relative overflow-hidden p-6 md:p-10 flex flex-col md:flex-row gap-8 items-center border border-white/10 shadow-2xl">
                {/* Subtle decorative glow */}
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Stylish Avatar Squircle */}
                <div className="relative shrink-0 group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-pink-500 rounded-[2rem] blur-md opacity-70 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
                  <div className="relative w-24 h-24 md:w-28 md:h-28 bg-gradient-to-br from-[var(--accent-violet)]/10 to-[var(--accent-violet)]/20 rounded-[2rem] flex items-center justify-center border border-[var(--accent-violet)]/30 ring-4 ring-black/10 overflow-hidden">
                    <span className="text-3xl md:text-4xl font-black text-[var(--text-primary)] select-none font-display">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Profile Identification */}
                <div className="flex-1 text-center md:text-left min-w-0">
                  <div className="flex flex-col md:flex-row items-center gap-3">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight font-display truncate">
                      {user?.name}
                    </h2>
                    <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${
                      user?.role === 'owner' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.05)]' : 
                      user?.role === 'admin' ? 'bg-violet-500/10 text-violet-500 border-violet-500/20 shadow-[0_0_15px_rgba(139,92,246,0.05)]' :
                      user?.role === 'support' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                      'bg-white/5 text-[var(--text-secondary)] border-white/10'
                    }`}>
                      {user?.role}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em] mt-1.5 truncate">
                    Operator ID: <span className="font-mono text-white font-black">{user?.id?.substring(0, 8)}...</span>
                  </p>
                  
                  {/* Metadata Badges */}
                  <div className="mt-5 flex flex-wrap justify-center md:justify-start gap-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                    <div className="flex items-center gap-2 px-3.5 py-2 bg-[var(--bg-main)] rounded-xl border border-[var(--border-color)]">
                      <Mail className="w-3.5 h-3.5 text-violet-400" />
                      <span className="text-white select-all">{user?.email}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3.5 py-2 bg-[var(--bg-main)] rounded-xl border border-[var(--border-color)]">
                      <Database className="w-3.5 h-3.5 text-fuchsia-400" />
                      <span>Schema Scope: <span className="text-white font-mono">tenant_db</span></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Session telemetry and security metadata */}
              <div className="glass-card p-6 md:p-10 border border-white/5 shadow-xl relative overflow-hidden">
                <h3 className="text-xs font-black text-white uppercase tracking-tight mb-6 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-violet-400" />
                  Session Details & Telemetry
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)]">
                    <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Active Device</p>
                    <p className="text-xs font-black text-white uppercase tracking-tight mt-1">macOS / Chrome</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)]">
                    <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Gateway IP</p>
                    <p className="text-xs font-black text-white font-mono tracking-wide mt-1">192.168.1.108</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)]">
                    <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Network Access</p>
                    <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      Encrypted SSL
                    </span>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-tight">Active Gateway Session</h4>
                    <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-1">Securely end this operator session and clear tokens.</p>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-95 duration-200 shrink-0"
                  >
                    Terminate Session
                  </button>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'security' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-start">
              
              {/* Two-Factor Authentication */}
              <div className="glass-card p-6 md:p-8">
                <div className="mb-6">
                  <h2 className="text-base md:text-lg font-black text-white uppercase tracking-tight font-display">Two-Factor Authentication</h2>
                  <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-1">Protect your account with an extra security layer</p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${user?.two_factor_enabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-white uppercase tracking-tight">Status</p>
                      <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-0.5">
                        {user?.two_factor_enabled 
                          ? `ENABLED (${user.two_factor_method === 'totp' ? 'Authenticator' : 'Email OTP'})` 
                          : 'DISABLED'}
                      </p>
                    </div>
                  </div>
                  <div>
                    {user?.two_factor_enabled ? (
                      <button
                        onClick={handleStartDisable2FA}
                        className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                      >
                        Disable 2FA
                      </button>
                    ) : (
                      <button
                        onClick={() => { resetMfaState(); setShowMfaModal(true); }}
                        className="w-full py-3 rounded-xl bg-white text-[#2c2c2e] text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg"
                      >
                        Enable 2FA
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Change Password */}
              <div className="glass-card p-6 md:p-8">
                <div className="mb-6">
                  <h2 className="text-base md:text-lg font-black text-white uppercase tracking-tight font-display">Change Password</h2>
                  <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-1">Update your gateway credentials</p>
                </div>

                {passwordError && (
                  <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest text-center">
                    {passwordError}
                  </div>
                )}

                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1">Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        required
                        className="w-full pl-5 pr-11 py-3.5 rounded-xl bg-black/40 border border-[var(--border-color)] text-white placeholder-gray-700 text-xs font-bold focus:border-[var(--accent-violet)] outline-none transition-all font-mono"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-white transition-colors"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        required
                        minLength={8}
                        className="w-full pl-5 pr-11 py-3.5 rounded-xl bg-black/40 border border-[var(--border-color)] text-white placeholder-gray-700 text-xs font-bold focus:border-[var(--accent-violet)] outline-none transition-all font-mono"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-white transition-colors"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        required
                        minLength={8}
                        className="w-full pl-5 pr-11 py-3.5 rounded-xl bg-black/40 border border-[var(--border-color)] text-white placeholder-gray-700 text-xs font-bold focus:border-[var(--accent-violet)] outline-none transition-all font-mono"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-white transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="w-full py-3.5 mt-4 rounded-xl bg-white text-[#2c2c2e] text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50"
                  >
                    {passwordLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Update Password
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'operators' && isAdmin && (
            <div className="glass-card p-6 md:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 border-b border-white/5 pb-6">
                <div>
                  <h2 className="text-base md:text-lg font-black text-white uppercase tracking-tight font-display">Operators</h2>
                  <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-1">Direct access control for the cluster</p>
                </div>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-[var(--accent-violet)] text-white text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all active:scale-95 shadow-lg shadow-violet-500/20"
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
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
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
                      className="relative flex items-center justify-between p-4 md:p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group overflow-hidden"
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

                      <div className="flex items-center gap-3 md:gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center font-black text-white uppercase tracking-widest text-sm shrink-0">
                          {u.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-white uppercase tracking-tight truncate flex items-center gap-2">
                            {u.name} {u.id === user?.id && <span className="text-[9px] text-[var(--accent-mint)]">(YOU)</span>}
                          </p>
                          <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest truncate">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${
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
          )}
        </div>
      </div>

      {/* Invite Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => !inviting && setShowInviteModal(false)}
        title="Provision Access"
        maxWidth="max-w-md"
      >
        <div className="flex p-1 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl mb-6">
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

        <form onSubmit={handleInvite} className="space-y-5">
          {createMode === 'direct' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Full Name</label>
              <input
                required
                type="text"
                className="w-full px-6 py-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm font-bold focus:border-[var(--accent-violet)] outline-none transition-all"
                placeholder="OPERATOR NAME..."
                value={directName}
                onChange={e => setDirectName(e.target.value)}
              />
            </div>
          )}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Email Identity</label>
            <input
              required
              type="email"
              className="w-full px-6 py-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm font-bold focus:border-[var(--accent-violet)] outline-none transition-all"
              placeholder="EMAIL ADDRESS..."
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Authorization Role</label>
            <select
              className="w-full px-6 py-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm font-bold focus:border-[var(--accent-violet)] outline-none transition-all appearance-none uppercase"
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value)}
            >
              <option value="member" className="text-black dark:text-white">MEMBER (View Scope)</option>
              <option value="support" className="text-black dark:text-white">SUPPORT (Tickets Only)</option>
              <option value="admin" className="text-black dark:text-white">ADMIN (Full Access)</option>
            </select>
          </div>
          {createMode === 'direct' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Security Token</label>
              <div className="relative">
                <input
                  required
                  type={showDirectPassword ? "text" : "password"}
                  className="w-full pl-6 pr-12 py-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm font-bold focus:border-[var(--accent-violet)] outline-none transition-all font-mono"
                  placeholder="••••••••"
                  value={directPassword}
                  onChange={e => setDirectPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowDirectPassword(!showDirectPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-white transition-colors"
                >
                  {showDirectPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}
          
          <div className="flex gap-4 pt-4 border-t border-[var(--border-color)]">
            <button type="button" onClick={() => setShowInviteModal(false)} className="flex-1 py-3.5 rounded-xl bg-white/5 text-[var(--text-primary)] text-[10px] font-black uppercase tracking-widest border border-[var(--border-color)]">Cancel</button>
            <button
              disabled={inviting}
              type="submit"
              className="flex-1 py-3.5 rounded-xl bg-[var(--accent-violet)] text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-violet-500/20"
            >
              {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Provision'}
            </button>
          </div>
        </form>
      </Modal>

      {/* User Modules Modal */}
      {/* User Modules Modal */}
      <Modal
        isOpen={showUserModulesModal}
        onClose={() => !savingUserModules && setShowUserModulesModal(false)}
        title="Operator Modules"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSaveUserModules} className="space-y-5">
          {/* Inherit Org Modules Toggler */}
          <div
            onClick={() => {
              const newInherit = !inheritOrgModules;
              setInheritOrgModules(newInherit);
              setSelectedUserModules(newInherit ? selectedUser.enabled_modules : (selectedUser.custom_modules || selectedUser.enabled_modules));
            }}
            className={`p-4 rounded-2xl bg-[var(--bg-main)] border cursor-pointer select-none transition-all flex items-center justify-between hover:bg-white/5 ${
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
            <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-4 border-b border-[var(--border-color)] pb-2">
              Navigation Bar Modules
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: 'dashboard', name: 'Dashboard Console', desc: 'Display global status dashboard' },
                { id: 'servers', name: 'Server Management', desc: 'Manage nodes and view server terminal/stats' },
                { id: 'tickets', name: 'Support Tickets', desc: 'View customer support desk tickets' },
                { id: 'settings', name: 'Settings / Team', desc: 'Manage settings and team operator permissions' }
              ].filter(mod => !user?.org_modules || user.org_modules.includes(mod.id)).map(mod => {
                const isChecked = selectedUserModules.includes(mod.id);
                return (
                  <div
                    key={mod.id}
                    onClick={() => handleToggleUserModule(mod.id)}
                    className={`p-3 rounded-2xl bg-[var(--bg-main)] border cursor-pointer select-none transition-all flex items-start gap-3 hover:bg-white/5 ${
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
            <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-4 border-b border-[var(--border-color)] pb-2">
              Server Detail Feature Modules
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                { id: 'luxegenie', name: 'LuxeGenie AI Diagnostics', desc: 'Use AI agent to diagnose errors and suggest repairs' },
                { id: 'sql', name: 'SQL Explorer', desc: 'Query databases with natural language using AI — PostgreSQL, MySQL, SQLite' }
              ].filter(mod => !user?.org_modules || user.org_modules.includes(mod.id)).map(mod => {
                const isChecked = selectedUserModules.includes(mod.id);
                return (
                  <div
                    key={mod.id}
                    onClick={() => handleToggleUserModule(mod.id)}
                    className={`p-3 rounded-2xl bg-[var(--bg-main)] border cursor-pointer select-none transition-all flex items-start gap-3 hover:bg-white/5 ${
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
          <div className="flex gap-4 pt-4 border-t border-[var(--border-color)]">
            <button
              type="button"
              onClick={() => setShowUserModulesModal(false)}
              className="flex-1 py-3.5 rounded-xl bg-white/5 text-[var(--text-primary)] text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-[var(--border-color)]"
            >
              Cancel
            </button>
            <button
              disabled={savingUserModules}
              type="submit"
              className="flex-1 py-3.5 rounded-xl bg-[var(--accent-violet)] text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50 disabled:hover:scale-100"
            >
              {savingUserModules ? (
                <span className="flex items-center justify-center gap-2 mx-auto">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </span>
              ) : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
      {/* 2FA Setup Modal */}
      <Modal
        isOpen={showMfaModal}
        onClose={() => !mfaLoading && setShowMfaModal(false)}
        title="Configure Two-Factor Auth"
        maxWidth="max-w-md"
      >
        {mfaError && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest text-center">
            {mfaError}
          </div>
        )}

        {mfaSetupStep === 1 ? (
          <div className="space-y-6">
            <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide leading-relaxed">
              Choose your preferred secondary verification channel:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => handleStart2FA('totp')}
                className="p-5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] hover:border-violet-500/50 cursor-pointer select-none transition-all flex flex-col justify-between h-36"
              >
                <div>
                  <p className="text-xs font-black text-white uppercase tracking-tight">Authenticator App</p>
                  <p className="text-[10px] font-medium text-[var(--text-secondary)] mt-2">Use Google Authenticator, Authy, or Microsoft Authenticator to generate verification codes.</p>
                </div>
                <span className="text-[9px] font-black text-violet-400 uppercase tracking-widest">Recommended</span>
              </div>

              <div
                onClick={() => handleStart2FA('email')}
                className="p-5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] hover:border-violet-500/50 cursor-pointer select-none transition-all flex flex-col justify-between h-36"
              >
                <div>
                  <p className="text-xs font-black text-white uppercase tracking-tight">Email OTP</p>
                  <p className="text-[10px] font-medium text-[var(--text-secondary)] mt-2">Receive temporary 6-digit one-time verification codes sent directly to your registered email inbox.</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleVerify2FA} className="space-y-5">
            {mfaMethod === 'totp' ? (
              <div className="space-y-4">
                
                {/* Global Instruction */}
                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider text-center">
                  Scan the QR code, then input the 6-digit code below:
                </p>

                {/* Symmetric Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                  
                  {/* Left Column: QR Code */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-32 h-32 bg-white p-2.5 rounded-2xl shadow-md flex items-center justify-center border border-white/5 shrink-0">
                      {mfaQrCode ? (
                        <img src={mfaQrCode} alt="TOTP QR Code" className="w-full h-full" />
                      ) : (
                        <Loader2 className="w-6 h-6 text-[#2c2c2e] animate-spin shrink-0" />
                      )}
                    </div>
                  </div>

                  {/* Right Column: Code Input */}
                  <div className="space-y-2 flex flex-col justify-center">
                    <label className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest text-center sm:text-left ml-1">
                      Verification Code
                    </label>
                    <input
                      required
                      type="text"
                      maxLength={6}
                      pattern="[0-9]{6}"
                      className="w-full px-4 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)] text-center text-lg font-black tracking-[0.4em] focus:border-[var(--accent-violet)] outline-none transition-all font-mono"
                      placeholder="000000"
                      value={mfaCode}
                      onChange={e => setMfaCode(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>

                </div>

                {/* Manual Secret Key (Full Width) */}
                <div className="space-y-1.5 pt-2">
                  <p className="text-[9px] font-black text-center text-[var(--text-secondary)] uppercase tracking-widest">
                    Manual Entry Secret Key:
                  </p>
                  <div className="px-4 py-2.5 bg-[var(--bg-main)] rounded-xl border border-[var(--border-color)] font-mono text-xs text-[var(--text-primary)] font-bold text-center select-all break-all tracking-widest">
                    {mfaSecret}
                  </div>
                </div>

              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide leading-relaxed">
                  A verification OTP has been dispatched to <span className="text-[var(--text-primary)] font-bold">{user?.email}</span>. Please input the code below:
                </p>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1">6-Digit Code</label>
                  <input
                    required
                    type="text"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    className="w-full px-6 py-3.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)] text-center text-lg font-black tracking-[0.4em] focus:border-[var(--accent-violet)] outline-none transition-all font-mono"
                    placeholder="000000"
                    value={mfaCode}
                    onChange={e => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-4 border-t border-[var(--border-color)]">
              <button
                type="button"
                onClick={resetMfaState}
                disabled={mfaLoading}
                className="flex-1 py-3.5 rounded-xl bg-white/5 text-[var(--text-primary)] text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-[var(--border-color)]"
              >
                Back
              </button>
              <button
                disabled={mfaLoading}
                type="submit"
                className="flex-1 py-3.5 rounded-xl bg-[var(--accent-violet)] text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg"
              >
                {mfaLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Activate 2FA'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* 2FA Disable Modal */}
      <Modal
        isOpen={showDisableMfaModal}
        onClose={() => !disableLoading && setShowDisableMfaModal(false)}
        title="Disable Two-Factor Auth"
        maxWidth="max-w-md"
      >
        {disableError && (
          <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest text-center">
            {disableError}
          </div>
        )}

        <form onSubmit={handleDisable2FA} className="space-y-5">
          <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide leading-relaxed">
            {user?.two_factor_method === 'totp' 
              ? 'Input the 6-digit code from your authenticator app to disable 2FA:' 
              : 'Input the 6-digit code sent to your email to disable 2FA:'}
          </p>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1">Verification Code</label>
            <input
              required
              type="text"
              maxLength={6}
              pattern="[0-9]{6}"
              className="w-full px-6 py-3.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)] text-center text-lg font-black tracking-[0.4em] focus:border-[var(--accent-violet)] outline-none transition-all font-mono"
              placeholder="000000"
              value={disableCode}
              onChange={e => setDisableCode(e.target.value.replace(/\D/g, ''))}
            />
          </div>

          <div className="flex gap-4 pt-4 border-t border-[var(--border-color)]">
            <button
              type="button"
              disabled={disableLoading}
              onClick={() => setShowDisableMfaModal(false)}
              className="flex-1 py-3.5 rounded-xl bg-white/5 text-[var(--text-primary)] text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-[var(--border-color)]"
            >
              Cancel
            </button>
            <button
              disabled={disableLoading}
              type="submit"
              className="flex-1 py-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
            >
              {disableLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Confirm Disable'}
            </button>
          </div>
        </form>
      </Modal>
      </div>
    </div>
  );
}
