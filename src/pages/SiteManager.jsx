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

export default function SiteManager() {
  const { id: serverId } = useParams();
  const navigate = useNavigate();
  const { sendCommand } = useWebSocket();
  const [server, setServer] = useState(null);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBackendModal, setShowBackendModal] = useState(false);
  const [showFrontendModal, setShowFrontendModal] = useState(false);

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

  const handleDeleteSite = async (siteId) => {
    if (!confirm('Delete this site?')) return;
    try {
      await sitesAPI.delete(siteId);
      fetchData();
    } catch (err) {
      console.error('Failed to delete site:', err);
    }
  };

  if (loading) return <LoadingSpinner size="lg" text="Loading sites..." />;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/servers/${serverId}`)} className="p-2 rounded-xl hover:bg-gray-200 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sites</h1>
            <p className="text-sm text-gray-500 mt-0.5">{server?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowBackendModal(true)} className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors">
            <Plus className="w-4 h-4" /> Backend Site
          </button>
          <button onClick={() => setShowFrontendModal(true)} className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors">
            <Plus className="w-4 h-4" /> Frontend Site
          </button>
        </div>
      </div>

      {/* Site List */}
      {sites.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-sm mb-4">No sites configured on this server</p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => setShowBackendModal(true)} className="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700">
              Create Backend Site
            </button>
            <button onClick={() => setShowFrontendModal(true)} className="px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-700">
              Create Frontend Site
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {sites.map((site) => (
            <SiteCard key={site.id} site={site} onDelete={handleDeleteSite} />
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
