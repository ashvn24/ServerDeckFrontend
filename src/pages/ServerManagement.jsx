import { useState, useEffect } from 'react';
import { Plus, Server, Copy, Check, ServerOff, ChevronRight, FolderPlus, X, Command } from 'lucide-react';
import ServerCard from '../components/server/ServerCard';
import FolderCard from '../components/server/FolderCard';
import { foldersAPI, serversAPI } from '../api/endpoints';
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
  
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [itemToMove, setItemToMove] = useState(null);
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
    <div className="space-y-12">
      {/* Breadcrumbs & Header */}
      <div className="space-y-10">
        <div className="flex items-center gap-4 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">
          <button 
            onClick={() => setCurrentFolderId(null)}
            className={`hover:text-white transition-all ${!currentFolderId ? 'text-[var(--accent-mint)]' : ''}`}
          >
            Infrastructure
          </button>
          {getBreadcrumbs().map(crumb => (
            <div key={crumb.id} className="flex items-center gap-4">
              <ChevronRight className="w-4 h-4 text-[var(--border-color)]" />
              <button 
                onClick={() => setCurrentFolderId(crumb.id)}
                className={`hover:text-white transition-all ${currentFolderId === crumb.id ? 'text-[var(--accent-mint)]' : ''}`}
              >
                {crumb.name}
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
          <div>
            <h1 className="text-5xl font-black text-white uppercase tracking-tight font-display leading-none">
              {currentFolderId ? folders.find(f => f.id === currentFolderId)?.name : 'Node Explorer'}
            </h1>
            <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-4">
              {currentFolders.length} Containers <span className="mx-3 text-white/10">/</span> {currentServers.length} Provisioned Nodes
            </p>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFolderModal(true)}
                className="px-8 py-3 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all"
              >
                Create Group
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-10 py-3 rounded-xl bg-[var(--accent-violet)] text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-violet-500/20"
              >
                Provision Node
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      {currentFolders.length === 0 && currentServers.length === 0 ? (
        <div className="glass-card py-48 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center mb-10 border border-white/5">
            <ServerOff className="w-10 h-10 text-[var(--text-secondary)]" />
          </div>
          <h3 className="text-3xl font-black uppercase tracking-tight mb-4 font-display">No nodes detected in scope</h3>
          <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-12">
            Initialize a new deployment to start indexing your infrastructure
          </p>
          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-12 py-4 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
            >
              Start Deployment
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
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

      {/* Provision Node Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-8">
           <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={closeAddModal} />
           <div className="glass-card w-full max-w-lg p-10 relative z-10">
              <div className="flex items-center justify-between mb-10">
                 <h3 className="text-2xl font-black uppercase tracking-tight font-display">Node Deployment</h3>
                 <button onClick={closeAddModal} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                    <X className="w-6 h-6 text-[var(--text-secondary)]" />
                 </button>
              </div>

              {!createdServer ? (
                <form onSubmit={handleAddServer} className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Identifier Name</label>
                    <input
                      type="text"
                      value={newServerName}
                      onChange={(e) => setNewServerName(e.target.value)}
                      required
                      placeholder="e.g. US-EAST-PRODUCTION"
                      className="w-full px-6 py-4 bg-black/40 border border-[var(--border-color)] rounded-2xl text-sm text-white focus:border-[var(--accent-violet)] outline-none transition-all font-bold"
                    />
                  </div>
                  <button type="submit" disabled={creating} className="w-full py-4 rounded-xl bg-[var(--accent-violet)] text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-violet-500/20">
                    {creating ? 'HANDSHAKING...' : 'INITIATE PROVISION'}
                  </button>
                </form>
              ) : (
                <div className="space-y-8">
                  <div className="p-6 bg-[var(--accent-mint)]/10 border border-[var(--accent-mint)]/20 rounded-2xl flex gap-4">
                    <div className="w-1.5 h-1.5 rounded-full accent-bg-green animate-pulse-dot mt-1.5" />
                    <p className="text-[10px] text-[var(--accent-mint)] font-black uppercase tracking-widest leading-relaxed">
                      Handshake successful. Provisioning script generated.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Deployment Script</label>
                    <div className="relative group">
                      <pre className="bg-black/60 p-8 rounded-3xl text-xs text-gray-300 font-mono leading-relaxed overflow-x-auto border border-white/5 group-hover:border-[var(--accent-violet)]/30 transition-all">
                        {installCommand}
                      </pre>
                      <button onClick={handleCopy} className="absolute top-4 right-4 p-3 rounded-xl bg-white/5 hover:bg-[var(--accent-violet)] text-white transition-all shadow-lg">
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <button onClick={closeAddModal} className="w-full py-4 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">
                    COMPLETE SETUP
                  </button>
                </div>
              )}
           </div>
        </div>
      )}

      {/* New Group Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-8">
           <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowFolderModal(false)} />
           <div className="glass-card w-full max-w-sm p-10 relative z-10">
              <h3 className="text-xl font-black uppercase tracking-tight font-display mb-8">Infrastructure Group</h3>
              <form onSubmit={handleAddFolder} className="space-y-8">
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Group Label</label>
                   <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    required
                    placeholder="e.g. CORE SERVICES"
                    className="w-full px-6 py-4 bg-black/40 border border-[var(--border-color)] rounded-2xl text-sm text-white focus:border-[var(--accent-violet)] outline-none transition-all font-bold uppercase tracking-widest"
                  />
                </div>
                <div className="flex gap-4">
                   <button type="button" onClick={() => setShowFolderModal(false)} className="flex-1 py-3.5 rounded-xl bg-white/5 text-white text-[10px] font-black uppercase tracking-widest">CANCEL</button>
                   <button type="submit" className="flex-1 py-3.5 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-widest">CREATE</button>
                </div>
              </form>
           </div>
        </div>
      )}

      {/* Move Item Modal */}
      {showMoveModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-8">
           <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowMoveModal(false)} />
           <div className="glass-card w-full max-w-sm p-10 relative z-10 text-center">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 text-[var(--accent-violet)]">
                 <Command className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight font-display mb-2">Relocate Object</h3>
              <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-8">{itemToMove?.name}</p>
              
              <div className="space-y-6">
                <select 
                  className="w-full px-6 py-4 bg-black/40 border border-[var(--border-color)] rounded-2xl text-sm text-white focus:border-[var(--accent-violet)] outline-none font-bold uppercase tracking-widest appearance-none"
                  value={targetFolderId}
                  onChange={(e) => setTargetFolderId(e.target.value)}
                >
                  <option value="">ROOT INFRASTRUCTURE</option>
                  {folders.filter(f => f.id !== itemToMove?.id).map(f => (
                    <option key={f.id} value={f.id}>{f.name.toUpperCase()}</option>
                  ))}
                </select>
                
                <div className="flex gap-4">
                   <button onClick={() => setShowMoveModal(false)} className="flex-1 py-4 rounded-xl bg-white/5 text-white text-[10px] font-black uppercase tracking-widest">CANCEL</button>
                   <button onClick={handleMove} className="flex-1 py-4 rounded-xl bg-[var(--accent-violet)] text-white text-[10px] font-black uppercase tracking-widest">RELOCATE</button>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
