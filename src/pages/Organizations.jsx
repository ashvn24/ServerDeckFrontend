import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminAPI } from '../api/endpoints';
import { 
  Building2, Plus, Trash2, Loader2, X, Globe, Key, User, Mail, 
  Lock, Shield, Calendar, Database, Search, AlertTriangle
} from 'lucide-react';
import ConfirmModal from '../components/common/ConfirmModal';

export default function Organizations() {
  const { user } = useAuth();
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    org_key: '',
    domain: '',
    admin_name: '',
    admin_email: '',
    admin_password: '',
  });
  const [autoKey, setAutoKey] = useState(true);

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState(null);

  const fetchOrgs = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.listOrgs();
      setOrgs(res.data);
    } catch (err) {
      console.error('Failed to fetch organizations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  const handleDomainChange = (value) => {
    setFormData(prev => ({ ...prev, domain: value }));
    if (autoKey && value) {
      const parts = value.split('.');
      if (parts.length >= 2) {
        setFormData(prev => ({ ...prev, org_key: parts[0].toLowerCase() }));
      }
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      await adminAPI.createOrg(formData);
      setShowCreateModal(false);
      setFormData({ name: '', org_key: '', domain: '', admin_name: '', admin_email: '', admin_password: '' });
      setAutoKey(true);
      fetchOrgs();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create organization');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (org) => {
    setOrgToDelete(org);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!orgToDelete) return;
    try {
      await adminAPI.deleteOrg(orgToDelete.id);
      fetchOrgs();
    } catch (err) {
      console.error('Failed to delete org:', err);
    }
  };

  const filteredOrgs = orgs.filter(org =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.org_key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full">
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Organization"
        message={`Are you sure you want to delete "${orgToDelete?.name}"? This will permanently destroy all data in the ${orgToDelete?.schema_name} schema. This action cannot be undone.`}
        type="danger"
        confirmText="Delete Organization"
        onConfirm={confirmDelete}
      />

      {/* Header */}
      <div className="mb-6 md:mb-12">
        <div className="flex items-center gap-3 md:gap-4 mb-2">
          <div className="p-2 md:p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/10">
            <Building2 className="w-5 h-5 md:w-7 md:h-7 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight font-display leading-none">Organizations</h1>
            <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-1 md:mt-2">Platform-level tenant management</p>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-10">
        <div className="glass-card p-4 md:p-6 flex items-center gap-4 md:gap-5">
          <div className="p-2 md:p-3 rounded-2xl bg-violet-500/10 border border-violet-500/10 shrink-0">
            <Building2 className="w-4 h-4 md:w-5 md:h-5 text-violet-500" />
          </div>
          <div>
            <p className="text-xl md:text-2xl font-black text-white">{orgs.length}</p>
            <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Total Organizations</p>
          </div>
        </div>
        <div className="glass-card p-4 md:p-6 flex items-center gap-4 md:gap-5">
          <div className="p-2 md:p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/10 shrink-0">
            <Database className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-xl md:text-2xl font-black text-white">{orgs.length}</p>
            <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Active Schemas</p>
          </div>
        </div>
        <div className="glass-card p-4 md:p-6 flex items-center gap-4 md:gap-5">
          <div className="p-2 md:p-3 rounded-2xl bg-amber-500/10 border border-amber-500/10 shrink-0">
            <Shield className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-xl md:text-2xl font-black text-white">Isolated</p>
            <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Data Separation</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 md:gap-6 mb-5 md:mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder="Search organizations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-[var(--border-color)] text-white text-sm font-bold focus:border-amber-500 outline-none transition-all placeholder:text-gray-400"
          />
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" />
          Add Organization
        </button>
      </div>

      {/* Organizations List */}
      <div className="glass-card overflow-hidden">
        {loading ? (
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
                {searchQuery ? 'No matches' : 'No Organizations'}
              </h3>
              <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">
                {searchQuery ? 'Try a different search term' : 'Create your first organization to get started'}
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

            {/* Rows */}
            {filteredOrgs.map(org => (
              <div key={org.id} className="px-4 md:px-8 py-4 md:py-5 hover:bg-white/5 transition-all group">
                {/* Mobile card row */}
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
                      onClick={() => handleDelete(org)}
                      className="p-2 rounded-xl bg-red-500/5 text-red-500 active:bg-red-500 active:text-white transition-all"
                      title="Delete organization"
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

                {/* Desktop grid layout (unchanged) */}
                <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-3 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/10 flex items-center justify-center font-black text-amber-500 text-sm">
                      {org.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-black text-white uppercase tracking-tight">{org.name}</p>
                    </div>
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
                      onClick={() => handleDelete(org)}
                      className="p-2.5 rounded-xl bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                      title="Delete organization"
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

      {/* Create Organization Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-8">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => !creating && setShowCreateModal(false)} />
          <div className="glass-card w-full max-w-2xl p-10 relative z-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/10">
                  <Building2 className="w-5 h-5 text-amber-500" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight font-display">New Organization</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                <X className="w-6 h-6 text-[var(--text-secondary)]" />
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-8">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-xs font-bold text-red-400">{error}</p>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-8">
              {/* Organization Details Section */}
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
                      value={formData.name}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
                        value={formData.domain}
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
                        value={formData.org_key}
                        onChange={e => {
                          setAutoKey(false);
                          setFormData(prev => ({ ...prev, org_key: e.target.value }));
                        }}
                      />
                      <p className="text-[9px] font-bold text-[var(--text-secondary)] tracking-wide">Schema: tenant_{formData.org_key || '...'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-[var(--border-color)]" />

              {/* Administrator Section */}
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
                      value={formData.admin_name}
                      onChange={e => setFormData(prev => ({ ...prev, admin_name: e.target.value }))}
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
                        value={formData.admin_email}
                        onChange={e => setFormData(prev => ({ ...prev, admin_email: e.target.value }))}
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
                        value={formData.admin_password}
                        onChange={e => setFormData(prev => ({ ...prev, admin_password: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-8 py-4 rounded-xl bg-white/5 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  disabled={creating}
                  type="submit"
                  className="flex-1 px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {creating ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Provisioning...
                    </span>
                  ) : (
                    'Create Organization'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
