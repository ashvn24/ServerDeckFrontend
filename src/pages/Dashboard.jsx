import { useState, useEffect } from 'react';
import { Plus, Server, Copy, Check, ServerOff } from 'lucide-react';
import { serversAPI } from '../api/endpoints';
import ServerCard from '../components/server/ServerCard';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Dashboard() {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newServerName, setNewServerName] = useState('');
  const [installCommand, setInstallCommand] = useState('');
  const [createdServer, setCreatedServer] = useState(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchServers = async () => {
    try {
      const res = await serversAPI.list();
      setServers(res.data);
    } catch (err) {
      console.error('Failed to fetch servers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchServers(); }, []);

  const handleAddServer = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await serversAPI.create({ name: newServerName });
      setCreatedServer(res.data);
      // Get install command
      const cmdRes = await serversAPI.getInstallCommand(res.data.id);
      setInstallCommand(cmdRes.data.install_command);
      fetchServers();
    } catch (err) {
      console.error('Failed to create server:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(installCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setNewServerName('');
    setInstallCommand('');
    setCreatedServer(null);
  };

  const onlineCount = servers.filter((s) => s.is_online).length;

  if (loading) return <LoadingSpinner size="lg" text="Loading servers..." />;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Servers</h1>
          <p className="text-sm text-gray-500 mt-1">
            {onlineCount} of {servers.length} online
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-black hover:shadow-lg hover:shadow-black/10 hover:-translate-y-0.5 transition-all duration-300"
          id="add-server-btn"
        >
          <Plus className="w-4 h-4" />
          Add Server
        </button>
      </div>

      {/* Server Grid */}
      {servers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 px-4 bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-transparent pointer-events-none" />
          <div className="p-5 bg-gradient-to-br from-primary-50/80 to-indigo-50/80 rounded-[2rem] shadow-[inset_0_2px_12px_rgba(255,255,255,0.8)] backdrop-blur-md mb-8 relative z-10 border border-white/50">
            <ServerOff className="w-12 h-12 text-primary-500 drop-shadow-sm" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">No servers connected</h3>
          <p className="text-sm font-medium text-gray-500 mb-8 text-center max-w-sm leading-relaxed">
            Add your first server to start managing its resources, processes, and applications directly from this dashboard.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-black hover:shadow-lg hover:shadow-black/10 hover:-translate-y-0.5 transition-all duration-300"
          >
            <Plus className="w-4 h-4" />
            Connect First Server
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {servers.map((server) => (
            <ServerCard key={server.id} server={server} />
          ))}
        </div>
      )}

      {/* Add Server Modal */}
      <Modal isOpen={showAddModal} onClose={closeAddModal} title="Add Server">
        {!createdServer ? (
          <form onSubmit={handleAddServer} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Server Name</label>
              <input
                type="text"
                value={newServerName}
                onChange={(e) => setNewServerName(e.target.value)}
                required
                placeholder="e.g. Production API"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={creating}
              className="w-full py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Server'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <p className="text-sm text-emerald-700 font-medium">✓ Server created!</p>
            </div>
            <p className="text-sm text-gray-600">
              Run this command on your Linux server to install the agent:
            </p>
            <div className="relative">
              <pre className="bg-gray-950 text-green-400 p-4 rounded-xl text-xs overflow-x-auto font-mono leading-relaxed">
                {installCommand}
              </pre>
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                title="Copy"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
            <button onClick={closeAddModal} className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors">
              Done
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
