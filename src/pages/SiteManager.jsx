import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { serversAPI, sitesAPI } from '../api/endpoints';
import { useWebSocket } from '../hooks/useWebSocket';
import SiteCard from '../components/sites/SiteCard';
import Modal from '../components/common/Modal';
import CreateBackendSite from '../components/sites/CreateBackendSite';
import CreateFrontendSite from '../components/sites/CreateFrontendSite';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ConfirmModal from '../components/common/ConfirmModal';

import { useAuth } from '../context/AuthContext';
import RestrictedView from '../components/common/RestrictedView';

export default function SiteManager() {
  const { id: serverId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sendCommand } = useWebSocket();
  const [server, setServer] = useState(null);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBackendModal, setShowBackendModal] = useState(false);
  const [showFrontendModal, setShowFrontendModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [siteToDelete, setSiteToDelete] = useState(null);

  const isAdmin = user?.role === 'owner' || user?.role === 'admin';

  const fetchData = useCallback(async () => {
    try {
      const [srvRes, sitesRes] = await Promise.all([
        serversAPI.get(serverId),
        sitesAPI.list(serverId),
      ]);
      setServer(srvRes.data);
      setSites(sitesRes.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, [serverId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDeleteSite = (siteId) => {
    if (!isAdmin) return;
    setSiteToDelete(siteId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteSite = async () => {
    if (!siteToDelete) return;
    try {
      await sitesAPI.delete(siteToDelete);
      fetchData();
    } catch (err) {
      console.error('Failed to delete site:', err);
    }
  };

  if (loading) return <LoadingSpinner size="lg" text="Loading sites..." />;

  if (!isAdmin) {
    return (
      <div className="space-y-8">
        <button onClick={() => navigate(`/servers/${serverId}`)} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
          <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-white transition-colors" />
        </button>
        <RestrictedView title="Site Management Restricted" />
      </div>
    );
  }

  return (
    <div>
      <ConfirmModal 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Site"
        message="Are you sure you want to permanently delete this site configuration?"
        type="danger"
        confirmText="Delete Site"
        onConfirm={confirmDeleteSite}
        requiresVerification={true}
      />
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(`/servers/${serverId}`)} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
            <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-white transition-colors" />
          </button>
          <div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tight font-display leading-none">Sites</h1>
            <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-4">{server?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setShowBackendModal(true)} className="px-8 py-3 rounded-xl bg-[var(--accent-violet)] text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-violet-500/20">
            <Plus className="w-4 h-4 inline mr-2" /> Backend Site
          </button>
          <button onClick={() => setShowFrontendModal(true)} className="px-8 py-3 rounded-xl bg-[var(--accent-mint)] text-black text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">
            <Plus className="w-4 h-4 inline mr-2" /> Frontend Site
          </button>
        </div>
      </div>

      {/* Site List */}
      {sites.length === 0 ? (
        <div className="glass-card py-32 flex flex-col items-center justify-center text-center">
          <p className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-widest mb-8">No sites configured on this server</p>
          <div className="flex items-center justify-center gap-4">
            <button onClick={() => setShowBackendModal(true)} className="px-8 py-4 rounded-2xl bg-[var(--accent-violet)] text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">
              Create Backend Site
            </button>
            <button onClick={() => setShowFrontendModal(true)} className="px-8 py-4 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">
              Create Frontend Site
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sites.map((site) => (
            <SiteCard key={site.id} site={site} onDelete={handleDeleteSite} isAdmin={isAdmin} />
          ))}
        </div>
      )}

      {/* Modals */}
      <Modal isOpen={showBackendModal} onClose={() => setShowBackendModal(false)} title="Create Backend Site">
        <CreateBackendSite serverId={serverId} sendCommand={sendCommand} onClose={() => setShowBackendModal(false)} onSuccess={fetchData} />
      </Modal>
      <Modal isOpen={showFrontendModal} onClose={() => setShowFrontendModal(false)} title="Create Frontend Site">
        <CreateFrontendSite serverId={serverId} sendCommand={sendCommand} onClose={() => setShowFrontendModal(false)} onSuccess={fetchData} />
      </Modal>
    </div>
  );
}

