import { useState, useEffect } from 'react';
import { Plus, Server, Copy, Check, ServerOff } from 'lucide-react';
import ServerCard from '../components/server/ServerCard';
import FolderCard from '../components/server/FolderCard';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { foldersAPI, serversAPI } from '../api/endpoints';
import { ChevronRight, Home, FolderPlus } from 'lucide-react';

import { useAuth } from '../context/AuthContext';

export default function ServerManagement() {
  const { user } = useAuth();
  const [servers, setServers] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [newServerName, setNewServerName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [installCommand, setInstallCommand] = useState('');
  const [createdServer, setCreatedServer] = useState(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Move states
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [itemToMove, setItemToMove] = useState(null); // { id, type: 'server' | 'folder' }
  const [targetFolderId, setTargetFolderId] = useState('');

  const isAdmin = user?.role === 'owner' || user?.role === 'admin';

  const fetchData = async () => {
    try {
      const [sRes, fRes] = await Promise.all([
        serversAPI.list(),
        foldersAPI.list()
      ]);
      setServers(sRes.data);
      setFolders(fRes.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddServer = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await serversAPI.create({ 
        name: newServerName,
        folder_id: currentFolderId 
      });
      setCreatedServer(res.data);
      const cmdRes = await serversAPI.getInstallCommand(res.data.id);
      setInstallCommand(cmdRes.data.install_command);
      fetchData();
    } catch (err) {
      console.error('Failed to create server:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleAddFolder = async (e) => {
    e.preventDefault();
    try {
      await foldersAPI.create({ 
        name: newFolderName,
        parent_id: currentFolderId
      });
      setShowFolderModal(false);
      setNewFolderName('');
      fetchData();
    } catch (err) {
      console.error('Failed to create folder:', err);
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

  const handleMove = async () => {
    try {
      if (itemToMove.type === 'server') {
        await serversAPI.move(itemToMove.id, targetFolderId);
      } else {
        await foldersAPI.move(itemToMove.id, targetFolderId);
      }
      setShowMoveModal(false);
      setItemToMove(null);
      setTargetFolderId('');
      fetchData();
    } catch (err) {
      console.error('Move failed:', err);
      alert('Failed to move item');
    }
  };

  const currentFolders = folders.filter(f => f.parent_id === currentFolderId);
  const currentServers = servers.filter(s => s.folder_id === currentFolderId);
  
  const getBreadcrumbs = () => {
    const crumbs = [];
    let curr = folders.find(f => f.id === currentFolderId);
    while (curr) {
      crumbs.unshift(curr);
      curr = folders.find(f => f.id === curr.parent_id);
    }
    return crumbs;
  };

  return (
    <div>
      {/* Breadcrumbs & Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
          <button 
            onClick={() => setCurrentFolderId(null)}
            className={`hover:text-primary-600 transition-colors ${!currentFolderId ? 'text-primary-600' : ''}`}
          >
            <Home className="w-3.5 h-3.5" />
          </button>
          {getBreadcrumbs().map(crumb => (
            <div key={crumb.id} className="flex items-center gap-2">
              <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
              <button 
                onClick={() => setCurrentFolderId(crumb.id)}
                className={`hover:text-primary-600 transition-colors ${currentFolderId === crumb.id ? 'text-primary-600' : ''}`}
              >
                {crumb.name}
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {currentFolderId ? folders.find(f => f.id === currentFolderId)?.name : 'Infrastructure'}
            </h1>
            <p className="text-sm font-medium text-gray-500 mt-1">
              {currentFolders.length} folders, {currentServers.length} servers here
            </p>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFolderModal(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/60 backdrop-blur-md border border-white shadow-sm text-sm font-bold text-gray-700 hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
              >
                <FolderPlus className="w-4 h-4 text-amber-500" />
                <span className="whitespace-nowrap">New Folder</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-black hover:shadow-lg hover:shadow-black/10 hover:-translate-y-0.5 transition-all duration-300"
                id="add-server-btn"
              >
                <Plus className="w-4 h-4" />
                <span className="whitespace-nowrap">Add Server</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Server Grid */}
      {currentFolders.length === 0 && currentServers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 px-4 bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-transparent pointer-events-none" />
          <div className="p-5 bg-gradient-to-br from-primary-50/80 to-indigo-50/80 rounded-[2rem] shadow-[inset_0_2px_12px_rgba(255,255,255,0.8)] backdrop-blur-md mb-8 relative z-10 border border-white/50">
            <ServerOff className="w-12 h-12 text-primary-500 drop-shadow-sm" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">Empty Workspace</h3>
          <p className="text-sm font-medium text-gray-500 mb-8 text-center max-w-sm leading-relaxed">
            This folder is empty. Start organizing your infrastructure by adding servers or creating sub-folders.
          </p>
          {isAdmin && (
            <div className="flex gap-4">
              <button
                onClick={() => setShowFolderModal(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
              >
                <FolderPlus className="w-4 h-4 text-amber-500" />
                Create Folder
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-black hover:shadow-lg transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Server
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {currentFolders.map((folder) => (
            <FolderCard 
              key={folder.id} 
              folder={folder} 
              onClick={() => setCurrentFolderId(folder.id)}
              onMore={() => {
                setItemToMove({ id: folder.id, type: 'folder', name: folder.name });
                setShowMoveModal(true);
              }} 
            />
          ))}
          {currentServers.map((server) => (
            <ServerCard 
              key={server.id} 
              server={server} 
              isAdmin={isAdmin}
              onMove={(s) => {
                setItemToMove({ id: s.id, type: 'server', name: s.name });
                setShowMoveModal(true);
              }}
            />
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

      {/* New Folder Modal */}
      <Modal isOpen={showFolderModal} onClose={() => setShowFolderModal(false)} title="Create New Folder">
        <form onSubmit={handleAddFolder} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Folder Name</label>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              required
              placeholder="e.g. Production Cluster"
              className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-primary-500 font-medium"
              autoFocus
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowFolderModal(false)}
              className="flex-1 px-6 py-3 rounded-2xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 rounded-2xl bg-primary-600 text-white font-bold hover:bg-primary-700 shadow-lg shadow-primary-200 transition-all"
            >
              Create Folder
            </button>
          </div>
        </form>
      </Modal>

      {/* Move Item Modal */}
      <Modal isOpen={showMoveModal} onClose={() => setShowMoveModal(false)} title={`Move ${itemToMove?.name}`}>
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Select a destination folder for this {itemToMove?.type}:</p>
          <select 
            className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-primary-500 font-medium appearance-none"
            value={targetFolderId}
            onChange={(e) => setTargetFolderId(e.target.value)}
          >
            <option value="">(Root Infrastructure)</option>
            {folders.filter(f => f.id !== itemToMove?.id).map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setShowMoveModal(false)}
              className="flex-1 px-6 py-3 rounded-2xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleMove}
              className="flex-1 px-6 py-3 rounded-2xl bg-primary-600 text-white font-bold hover:bg-primary-700 shadow-lg shadow-primary-200 transition-all"
            >
              Move Here
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
