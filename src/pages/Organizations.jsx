import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminAPI } from '../api/endpoints';
import {
  Building2, Plus, Trash2, Loader2, X, Globe, Key, User, Mail,
  Lock, Shield, Calendar, Database, Search, AlertTriangle, Users, UserPlus, CheckCircle2, Copy
} from 'lucide-react';
import ConfirmModal from '../components/common/ConfirmModal';

// ─── Tab IDs ──────────────────────────────────────────────────────────────────
const TAB_ORGS = 'orgs';
const TAB_USERS = 'users';

export default function Organizations() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(TAB_ORGS);

  // ── Organizations state ───────────────────────────────────────────────────
  const [orgs, setOrgs] = useState([]);
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [orgError, setOrgError] = useState('');
  const [orgSearchQuery, setOrgSearchQuery] = useState('');
  const [orgFormData, setOrgFormData] = useState({
    name: '', org_key: '', domain: '', admin_name: '', admin_email: '', admin_password: '',
  });
  const [autoKey, setAutoKey] = useState(true);
  const [showDeleteOrgConfirm, setShowDeleteOrgConfirm] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState(null);

  // ── Individual Users state ────────────────────────────────────────────────
  const [indvUsers, setIndvUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [userError, setUserError] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userFormData, setUserFormData] = useState({ email: '' });
  const [createdInvite, setCreatedInvite] = useState(null);
  const [showDeleteUserConfirm, setShowDeleteUserConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // ── Data fetching ─────────────────────────────────────────────────────────
  const fetchOrgs = async () => {
    setOrgsLoading(true);
    try {
      const res = await adminAPI.listOrgs();
      setOrgs(res.data);
    } catch (err) {
      console.error('Failed to fetch organizations:', err);
    } finally {
      setOrgsLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await adminAPI.listUsers();
      setIndvUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch individual users:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => { fetchOrgs(); }, []);

  useEffect(() => {
    if (activeTab === TAB_USERS && indvUsers.length === 0) fetchUsers();
  }, [activeTab]);

  // ── Org handlers ──────────────────────────────────────────────────────────
  const handleDomainChange = (value) => {
    setOrgFormData(prev => ({ ...prev, domain: value }));
    if (autoKey && value) {
      const parts = value.split('.');
      if (parts.length >= 2) {
        setOrgFormData(prev => ({ ...prev, org_key: parts[0].toLowerCase() }));
      }
    }
  };

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    setCreatingOrg(true);
    setOrgError('');
    try {
      await adminAPI.createOrg(orgFormData);
      setShowCreateOrgModal(false);
      setOrgFormData({ name: '', org_key: '', domain: '', admin_name: '', admin_email: '', admin_password: '' });
      setAutoKey(true);
      fetchOrgs();
    } catch (err) {
      setOrgError(err.response?.data?.detail || 'Failed to create organization');
    } finally {
      setCreatingOrg(false);
    }
  };

  const handleDeleteOrg = (org) => { setOrgToDelete(org); setShowDeleteOrgConfirm(true); };

  const confirmDeleteOrg = async () => {
    if (!orgToDelete) return;
    try {
      await adminAPI.deleteOrg(orgToDelete.id);
      fetchOrgs();
    } catch (err) {
      console.error('Failed to delete org:', err);
    }
  };

  // ── Individual User handlers ──────────────────────────────────────────────
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreatingUser(true);
    setUserError('');
    try {
      const res = await adminAPI.createUser(userFormData);
      setCreatedInvite(res.data.invite_url);
      setUserFormData({ email: '' });
      // Don't fetch users yet since they haven't accepted the invite
    } catch (err) {
      console.error('[createUser] Error:', err);
      console.error('[createUser] Response data:', err.response?.data);
      console.error('[createUser] Status:', err.response?.status);
      const detail = err.response?.data?.detail;
      setUserError(typeof detail === 'string' ? detail : JSON.stringify(detail) || 'Failed to create invite');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = (u) => { setUserToDelete(u); setShowDeleteUserConfirm(true); };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await adminAPI.deleteUser(userToDelete.id);
      fetchUsers();
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  // ── Filtered lists ────────────────────────────────────────────────────────
  const filteredOrgs = orgs.filter(org =>
    org.name.toLowerCase().includes(orgSearchQuery.toLowerCase()) ||
    org.domain.toLowerCase().includes(orgSearchQuery.toLowerCase()) ||
    org.org_key.toLowerCase().includes(orgSearchQuery.toLowerCase())
  );

  const filteredUsers = indvUsers.filter(u =>
    u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  return (
    <div className="w-full">
      {/* Confirm Modals */}
      <ConfirmModal
        isOpen={showDeleteOrgConfirm}
        onClose={() => setShowDeleteOrgConfirm(false)}
        title="Delete Organization"
        message={`Are you sure you want to delete "${orgToDelete?.name}"? This will permanently destroy all data in the ${orgToDelete?.schema_name} schema. This action cannot be undone.`}
        type="danger"
        confirmText="Delete Organization"
        onConfirm={confirmDeleteOrg}
      />
      <ConfirmModal
        isOpen={showDeleteUserConfirm}
        onClose={() => setShowDeleteUserConfirm(false)}
        title="Delete User"
        message={`Are you sure you want to delete "${userToDelete?.name}" (${userToDelete?.email})? All their servers and data will be permanently removed.`}
        type="danger"
        confirmText="Delete User"
        onConfirm={confirmDeleteUser}
      />

      {/* Header */}
      <div className="mb-6 md:mb-10">
        <div className="flex items-center gap-3 md:gap-4 mb-2">
          <div className="p-2 md:p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/10">
            <Building2 className="w-5 h-5 md:w-7 md:h-7 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight font-display leading-none">
              Tenant Management
            </h1>
            <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-1 md:mt-2">
              Platform-level tenant &amp; user management
            </p>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="glass-card p-4 md:p-5 flex items-center gap-3 md:gap-4">
          <div className="p-2 rounded-2xl bg-amber-500/10 border border-amber-500/10 shrink-0">
            <Building2 className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <p className="text-xl md:text-2xl font-black text-white">{orgs.length}</p>
            <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Organizations</p>
          </div>
        </div>
        <div className="glass-card p-4 md:p-5 flex items-center gap-3 md:gap-4">
          <div className="p-2 rounded-2xl bg-violet-500/10 border border-violet-500/10 shrink-0">
            <Users className="w-4 h-4 text-violet-500" />
          </div>
          <div>
            <p className="text-xl md:text-2xl font-black text-white">{indvUsers.length}</p>
            <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Ind. Users</p>
          </div>
        </div>
        <div className="glass-card p-4 md:p-5 flex items-center gap-3 md:gap-4">
          <div className="p-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/10 shrink-0">
            <Database className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <p className="text-xl md:text-2xl font-black text-white">{orgs.length}</p>
            <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Schemas</p>
          </div>
        </div>
        <div className="glass-card p-4 md:p-5 flex items-center gap-3 md:gap-4">
          <div className="p-2 rounded-2xl bg-blue-500/10 border border-blue-500/10 shrink-0">
            <Shield className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <p className="text-xl md:text-2xl font-black text-white">Isolated</p>
            <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Data Sep.</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl bg-white/5 border border-[var(--border-color)] w-fit">
        <button
          onClick={() => setActiveTab(TAB_ORGS)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === TAB_ORGS
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20'
              : 'text-[var(--text-secondary)] hover:text-white'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          Organizations
        </button>
        <button
          onClick={() => setActiveTab(TAB_USERS)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === TAB_USERS
              ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/20'
              : 'text-[var(--text-secondary)] hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Individual Users
        </button>
      </div>

      {/* ── ORGANIZATIONS TAB ──────────────────────────────────────────────── */}
      {activeTab === TAB_ORGS && (
        <>
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-5 md:mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
              <input
                type="text"
                placeholder="Search organizations..."
                value={orgSearchQuery}
                onChange={(e) => setOrgSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-[var(--border-color)] text-white text-sm font-bold focus:border-amber-500 outline-none transition-all placeholder:text-gray-400"
              />
            </div>
            <button
              onClick={() => setShowCreateOrgModal(true)}
              className="flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              Add Organization
            </button>
          </div>

          <div className="glass-card overflow-hidden">
            {orgsLoading ? (
              <div className="py-32 flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Loading organizations...</p>
              </div>
            ) : filteredOrgs.length === 0 ? (
              <div className="py-32 flex flex-col items-center gap-6">
                <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/5">
                  <Building2 className="w-14 h-14 text-white/10" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">
                    {orgSearchQuery ? 'No matches' : 'No Organizations'}
                  </h3>
                  <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">
                    {orgSearchQuery ? 'Try a different search term' : 'Create your first organization to get started'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-color)]">
                {/* Table Header */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-4 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest bg-white/2">
                  <div className="col-span-3">Organization</div>
                  <div className="col-span-2">Domain</div>
                  <div className="col-span-2">Org Key</div>
                  <div className="col-span-2">Schema</div>
                  <div className="col-span-2">Created</div>
                  <div className="col-span-1 text-right">Actions</div>
                </div>
                {filteredOrgs.map(org => (
                  <div key={org.id} className="px-4 md:px-8 py-4 md:py-5 hover:bg-white/5 transition-all group">
                    {/* Mobile */}
                    <div className="md:hidden">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/10 flex items-center justify-center font-black text-amber-500 text-sm shrink-0">
                            {org.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-black text-white uppercase tracking-tight">{org.name}</p>
                            <p className="text-[10px] font-bold text-[var(--text-secondary)]">{org.domain}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteOrg(org)}
                          className="p-2 rounded-xl bg-red-500/5 text-red-500 active:bg-red-500 active:text-white transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-4 mt-2 ml-12">
                        <div className="flex items-center gap-1.5">
                          <Key className="w-3 h-3 text-violet-500" />
                          <span className="text-[10px] font-mono font-bold text-violet-400">{org.org_key}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Database className="w-3 h-3 text-emerald-500" />
                          <span className="text-[10px] font-mono font-bold text-emerald-400">{org.schema_name}</span>
                        </div>
                      </div>
                    </div>
                    {/* Desktop */}
                    <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-3 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/10 flex items-center justify-center font-black text-amber-500 text-sm">
                          {org.name.charAt(0).toUpperCase()}
                        </div>
                        <p className="text-sm font-black text-white uppercase tracking-tight">{org.name}</p>
                      </div>
                      <div className="col-span-2 flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                        <span className="text-xs font-bold text-[var(--text-secondary)]">{org.domain}</span>
                      </div>
                      <div className="col-span-2 flex items-center gap-2">
                        <Key className="w-3.5 h-3.5 text-violet-500" />
                        <span className="text-xs font-mono font-bold text-violet-400">{org.org_key}</span>
                      </div>
                      <div className="col-span-2 flex items-center gap-2">
                        <Database className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-xs font-mono font-bold text-emerald-400">{org.schema_name}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-xs font-bold text-[var(--text-secondary)]">
                          {new Date(org.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button
                          onClick={() => handleDeleteOrg(org)}
                          className="p-2.5 rounded-xl bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── INDIVIDUAL USERS TAB ──────────────────────────────────────────── */}
      {activeTab === TAB_USERS && (
        <>
          {/* Info Banner */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-violet-500/5 border border-violet-500/15 mb-5">
            <Shield className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
            <p className="text-[10px] font-bold text-violet-300 leading-relaxed">
              Individual users sign up with personal email addresses (Gmail, Outlook, etc.) and are stored in a shared{' '}
              <span className="font-mono text-violet-400">tenant_individual</span> schema. Each user's data is fully
              isolated by their own team — they can only see their own servers and resources.
            </p>
          </div>

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-5 md:mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
              <input
                type="text"
                placeholder="Search users..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-[var(--border-color)] text-white text-sm font-bold focus:border-violet-500 outline-none transition-all placeholder:text-gray-400"
              />
            </div>
            <button
              onClick={() => setShowCreateUserModal(true)}
              className="flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-violet-500/20"
            >
              <UserPlus className="w-4 h-4" />
              Add User
            </button>
          </div>

          <div className="glass-card overflow-hidden">
            {usersLoading ? (
              <div className="py-32 flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-32 flex flex-col items-center gap-6">
                <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/5">
                  <Users className="w-14 h-14 text-white/10" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">
                    {userSearchQuery ? 'No matches' : 'No Individual Users'}
                  </h3>
                  <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">
                    {userSearchQuery ? 'Try a different search term' : 'Users with Gmail, Outlook etc. will appear here'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-color)]">
                {/* Table Header */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-4 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest bg-white/2">
                  <div className="col-span-4">User</div>
                  <div className="col-span-4">Email</div>
                  <div className="col-span-3">Created</div>
                  <div className="col-span-1 text-right">Actions</div>
                </div>
                {filteredUsers.map(u => (
                  <div key={u.id} className="px-4 md:px-8 py-4 md:py-5 hover:bg-white/5 transition-all group">
                    {/* Mobile */}
                    <div className="md:hidden flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/10 flex items-center justify-center font-black text-violet-400 text-sm shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-black text-white uppercase tracking-tight">{u.name}</p>
                          <p className="text-[10px] font-bold text-[var(--text-secondary)]">{u.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteUser(u)}
                        className="p-2 rounded-xl bg-red-500/5 text-red-500 active:bg-red-500 active:text-white transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {/* Desktop */}
                    <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/10 flex items-center justify-center font-black text-violet-400 text-sm">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <p className="text-sm font-black text-white uppercase tracking-tight">{u.name}</p>
                      </div>
                      <div className="col-span-4 flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                        <span className="text-xs font-bold text-[var(--text-secondary)]">{u.email}</span>
                      </div>
                      <div className="col-span-3">
                        <span className="text-xs font-bold text-[var(--text-secondary)]">
                          {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="p-2.5 rounded-xl bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── CREATE ORGANIZATION MODAL ─────────────────────────────────────── */}
      {showCreateOrgModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-8">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => !creatingOrg && setShowCreateOrgModal(false)} />
          <div className="glass-card w-full max-w-2xl p-10 relative z-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/10">
                  <Building2 className="w-5 h-5 text-amber-500" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight font-display">New Organization</h3>
              </div>
              <button onClick={() => setShowCreateOrgModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                <X className="w-6 h-6 text-[var(--text-secondary)]" />
              </button>
            </div>

            {orgError && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-8">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-xs font-bold text-red-400">{orgError}</p>
              </div>
            )}

            <form onSubmit={handleCreateOrg} className="space-y-8">
              <div>
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5" />
                  Organization Details
                </p>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Organization Name</label>
                    <input
                      required
                      type="text"
                      className="w-full px-5 py-3.5 rounded-xl bg-black/40 border border-[var(--border-color)] text-white text-sm font-bold focus:border-amber-500 outline-none transition-all"
                      placeholder="Acme Corporation"
                      value={orgFormData.name}
                      onChange={e => setOrgFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest flex items-center gap-2">
                        <Globe className="w-3 h-3" /> Email Domain
                      </label>
                      <input
                        required
                        type="text"
                        className="w-full px-5 py-3.5 rounded-xl bg-black/40 border border-[var(--border-color)] text-white text-sm font-bold focus:border-amber-500 outline-none transition-all"
                        placeholder="acme.com"
                        value={orgFormData.domain}
                        onChange={e => handleDomainChange(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest flex items-center gap-2">
                        <Key className="w-3 h-3" /> Org Key
                      </label>
                      <input
                        required
                        type="text"
                        className="w-full px-5 py-3.5 rounded-xl bg-black/40 border border-[var(--border-color)] text-white text-sm font-mono font-bold focus:border-amber-500 outline-none transition-all"
                        placeholder="acme"
                        value={orgFormData.org_key}
                        onChange={e => { setAutoKey(false); setOrgFormData(prev => ({ ...prev, org_key: e.target.value })); }}
                      />
                      <p className="text-[9px] font-bold text-[var(--text-secondary)] tracking-wide">Schema: tenant_{orgFormData.org_key || '...'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-[var(--border-color)]" />

              <div>
                <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5" />
                  Organization Administrator (Superadmin)
                </p>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest flex items-center gap-2">
                      <User className="w-3 h-3" /> Administrator Name
                    </label>
                    <input
                      required
                      type="text"
                      className="w-full px-5 py-3.5 rounded-xl bg-black/40 border border-[var(--border-color)] text-white text-sm font-bold focus:border-violet-500 outline-none transition-all"
                      placeholder="John Doe"
                      value={orgFormData.admin_name}
                      onChange={e => setOrgFormData(prev => ({ ...prev, admin_name: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest flex items-center gap-2">
                        <Mail className="w-3 h-3" /> Admin Email
                      </label>
                      <input
                        required
                        type="email"
                        className="w-full px-5 py-3.5 rounded-xl bg-black/40 border border-[var(--border-color)] text-white text-sm font-bold focus:border-violet-500 outline-none transition-all"
                        placeholder="admin@acme.com"
                        value={orgFormData.admin_email}
                        onChange={e => setOrgFormData(prev => ({ ...prev, admin_email: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest flex items-center gap-2">
                        <Lock className="w-3 h-3" /> Admin Password
                      </label>
                      <input
                        required
                        type="password"
                        className="w-full px-5 py-3.5 rounded-xl bg-black/40 border border-[var(--border-color)] text-white text-sm font-bold focus:border-violet-500 outline-none transition-all"
                        placeholder="••••••••"
                        value={orgFormData.admin_password}
                        onChange={e => setOrgFormData(prev => ({ ...prev, admin_password: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateOrgModal(false)}
                  className="flex-1 px-8 py-4 rounded-xl bg-white/5 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  disabled={creatingOrg}
                  type="submit"
                  className="flex-1 px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {creatingOrg ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Provisioning...
                    </span>
                  ) : 'Create Organization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CREATE INDIVIDUAL USER MODAL ──────────────────────────────────── */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-8">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => { if (!creatingUser) { setShowCreateUserModal(false); setCreatedInvite(null); } }} />
          <div className="glass-card w-full max-w-lg p-10 relative z-10">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/10">
                  <UserPlus className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight font-display">New User</h3>
                  <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-0.5">Personal email account</p>
                </div>
              </div>
              <button onClick={() => { setShowCreateUserModal(false); setCreatedInvite(null); }} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                <X className="w-6 h-6 text-[var(--text-secondary)]" />
              </button>
            </div>

            {userError && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-8">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-xs font-bold text-red-400">{userError}</p>
              </div>
            )}

            {/* Info note */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-violet-500/5 border border-violet-500/15 mb-8">
              <Shield className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
              <p className="text-[9px] font-bold text-violet-300 leading-relaxed">
                Only personal email domains (Gmail, Outlook, etc.) are accepted here. Business domains should be onboarded as organizations.
              </p>
            </div>

            {createdInvite ? (
              <div className="text-center space-y-6 mt-4">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/20">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-white uppercase tracking-tight">Invite Sent!</h4>
                  <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-2 leading-relaxed">
                    An email has been sent to the user. You can also share this invite link directly:
                  </p>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-black/40 border border-[var(--border-color)]">
                  <input 
                    readOnly 
                    value={createdInvite} 
                    className="flex-1 bg-transparent text-xs text-white font-mono outline-none" 
                  />
                  <button 
                    onClick={() => navigator.clipboard.writeText(createdInvite)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[var(--text-secondary)] hover:text-white transition-all"
                    title="Copy Link"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => {
                    setShowCreateUserModal(false);
                    setCreatedInvite(null);
                  }}
                  className="w-full py-4 rounded-xl bg-white/5 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all mt-4"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateUser} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest flex items-center gap-2">
                    <Mail className="w-3 h-3" /> Email Address
                  </label>
                  <input
                    required
                    type="email"
                    className="w-full px-5 py-3.5 rounded-xl bg-black/40 border border-[var(--border-color)] text-white text-sm font-bold focus:border-violet-500 outline-none transition-all"
                    placeholder="jane@gmail.com"
                    value={userFormData.email}
                    onChange={e => setUserFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateUserModal(false)}
                    className="flex-1 px-8 py-4 rounded-xl bg-white/5 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={creatingUser}
                    type="submit"
                    className="flex-1 px-8 py-4 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {creatingUser ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </span>
                    ) : 'Send Invite'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
