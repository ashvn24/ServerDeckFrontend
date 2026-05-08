import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Settings, Server, Shield, 
  ChevronRight, ChevronDown, Folder, BarChart3,
  Activity, Plus, Search
} from 'lucide-react';
import { serversAPI, foldersAPI } from '../../api/endpoints';

export default function Sidebar({ isOpen, onClose }) {
  const [folders, setFolders] = useState([]);
  const [servers, setServers] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const location = useLocation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fRes, sRes] = await Promise.all([
          foldersAPI.list(),
          serversAPI.list()
        ]);
        setFolders(fRes.data);
        setServers(sRes.data);
      } catch (err) {
        console.error('Sidebar fetch failed:', err);
      }
    };
    fetchData();
  }, [location.pathname]);

  const toggleFolder = (id) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedFolders(newExpanded);
  };

  const handleNav = () => {
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const renderTree = (parentId = null, level = 0) => {
    const levelFolders = folders.filter(f => f.parent_id === parentId);
    const levelServers = servers.filter(s => s.folder_id === parentId);

    if (levelFolders.length === 0 && levelServers.length === 0 && parentId === null) {
      return (
        <div className="px-3 py-4 text-center">
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-tighter">No servers found</p>
        </div>
      );
    }

    return (
      <div className="space-y-0.5">
        {levelFolders.map(folder => (
          <div key={folder.id}>
            <button
              onClick={() => toggleFolder(folder.id)}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-100 hover:bg-white/5 transition-colors group"
              style={{ paddingLeft: `${level * 12 + 12}px` }}
            >
              {expandedFolders.has(folder.id) ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
              <Folder className={`w-4 h-4 ${expandedFolders.has(folder.id) ? 'text-amber-400' : 'text-amber-500/60'}`} />
              <span className="truncate">{folder.name}</span>
            </button>
            {expandedFolders.has(folder.id) && renderTree(folder.id, level + 1)}
          </div>
        ))}
        {levelServers.map(server => (
          <NavLink
            key={server.id}
            to={`/servers/${server.id}`}
            onClick={handleNav}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
              ${isActive 
                ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20' 
                : 'text-gray-500 hover:text-gray-200 hover:bg-white/5 border border-transparent'}`
            }
            style={{ marginLeft: `${level * 12 + 28}px` }}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${server.is_online ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-gray-600'}`} />
            <span className="truncate">{server.name}</span>
          </NavLink>
        ))}
      </div>
    );
  };

  return (
    <aside className={`fixed left-0 top-0 bottom-0 w-64 bg-[#0a0f1c]/95 backdrop-blur-3xl border-r border-white/5 flex flex-col z-50 shadow-[4px_0_24px_rgba(0,0,0,0.3)] transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      {/* Header */}
      <div className="px-6 py-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-xl shadow-lg shadow-primary-500/20">
            <Server className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight leading-none mb-1">ServerDeck</h1>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Live System</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-6 space-y-8">
        
        {/* Dashboard Group */}
        <div>
          <p className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Main Console</p>
          <div className="space-y-1">
            <NavLink to="/" end onClick={handleNav} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-gray-100 hover:bg-white/5'}`}>
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </NavLink>
            <NavLink to="/servers" onClick={handleNav} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-gray-100 hover:bg-white/5'}`}>
              <Server className="w-4 h-4" /> Management
            </NavLink>
          </div>
        </div>

        {/* Servers Group */}
        <div>
          <div className="flex items-center justify-between px-3 mb-3">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Servers</p>
            <button className="p-1 rounded-md hover:bg-white/10 text-gray-500 hover:text-white transition-colors">
              <Plus className="w-3 h-3" />
            </button>
          </div>
          {renderTree()}
        </div>

        {/* System Group */}
        <div>
          <p className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">System</p>
          <div className="space-y-1">
            <NavLink to="/settings" onClick={handleNav} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-gray-100 hover:bg-white/5'}`}>
              <Settings className="w-4 h-4" /> Settings
            </NavLink>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/5 bg-white/2">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-primary-500" />
            <span className="text-[10px] font-bold text-gray-500 tracking-tight">v0.1.0-alpha</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-tighter">Secure</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
