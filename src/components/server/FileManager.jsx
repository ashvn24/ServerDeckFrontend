import { useState, useEffect, useCallback } from 'react';
import { 
  Folder, File, ChevronRight, Home, ArrowLeft, RefreshCw, 
  Trash2, Edit3, Plus, Save, X, Search, MoreVertical, 
  Download, AlertTriangle, FileText, WifiOff, Maximize2, Minimize2,
  ShieldAlert
} from 'lucide-react';
import { formatBytes } from '../../utils/formatters';
import ConfirmModal from '../common/ConfirmModal';

export default function FileManager({ serverId, sendCommand, isOnline, isAdmin }) {
  const [path, setPath] = useState('/');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  const [editingFile, setEditingFile] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [newItemType, setNewItemType] = useState(null);
  const [newItemName, setNewItemName] = useState('');
  
  const [isUploading, setIsUploading] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ open: false, title: '', message: '', onConfirm: null, type: 'warning' });

  const fetchFiles = useCallback(async (targetPath) => {
    if (!isOnline) return;
    setLoading(true);
    setError(null);
    try {
      const res = await sendCommand(serverId, 'files.list', { path: targetPath });
      if (res.error) {
        setError(res.error);
      } else {
        setItems(res.data.items || []);
        setPath(res.data.path);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [serverId, isOnline, sendCommand]);

  useEffect(() => {
    fetchFiles(path);
  }, [serverId]);

  const navigateTo = (newPath) => {
    if (editingFile) {
      setConfirmConfig({
        open: true,
        title: 'Unsaved Changes',
        message: 'You have unsaved changes in the editor. Discard them and navigate?',
        type: 'warning',
        confirmText: 'Discard & Move',
        onConfirm: () => {
          setEditingFile(null);
          fetchFiles(newPath);
        }
      });
      return;
    }
    fetchFiles(newPath);
  };

  const openFile = async (filePath) => {
    setEditLoading(true);
    try {
      const res = await sendCommand(serverId, 'files.read', { path: filePath });
      if (res.error) throw new Error(res.error);
      setEditingFile({ path: filePath, content: res.data.content });
    } catch (err) {
      console.error('Read failed:', err);
    } finally {
      setEditLoading(false);
    }
  };

  const saveFile = async () => {
    if (!editingFile) return;
    setIsSaving(true);
    try {
      const res = await sendCommand(serverId, 'files.write', { 
        path: editingFile.path, 
        content: editingFile.content 
      });
      if (res.error) throw new Error(res.error);
      setEditingFile(null);
      fetchFiles(path);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteItem = async (targetPath, isDir) => {
    setConfirmConfig({
      open: true,
      title: 'Delete Object',
      message: `Are you sure you want to permanently delete ${targetPath}?`,
      type: 'danger',
      confirmText: 'Delete Permanently',
      requiresVerification: true,
      onConfirm: async () => {
        try {
          const res = await sendCommand(serverId, 'files.delete', { path: targetPath });
          if (res.error) throw new Error(res.error);
          fetchFiles(path);
        } catch (err) {
          console.error('Delete failed:', err);
        }
      }
    });
  };

  const createItem = async () => {
    if (!newItemName) return;
    const fullPath = `${path === '/' ? '' : path}/${newItemName}`;
    try {
      const action = newItemType === 'file' ? 'files.write' : 'files.mkdir';
      const res = await sendCommand(serverId, action, { path: fullPath, content: '' });
      if (res.error) throw new Error(res.error);
      setNewItemType(null);
      setNewItemName('');
      fetchFiles(path);
    } catch (err) {
      console.error('Creation failed:', err);
    }
  };

  const downloadItem = async (targetPath) => {
    setLoading(true);
    try {
      const res = await sendCommand(serverId, 'files.download', { path: targetPath });
      if (res.error) throw new Error(res.error);
      const link = document.createElement('a');
      link.href = `data:${res.data.mime};base64,${res.data.content}`;
      link.download = res.data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target.result.split(',')[1];
      try {
        const res = await sendCommand(serverId, 'files.upload', {
          path,
          filename: file.name,
          content
        });
        if (res.error) throw new Error(res.error);
        fetchFiles(path);
      } catch (err) {
        console.error('Upload failed:', err);
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const parts = path.split('/').filter(Boolean);
  const breadcrumbs = [{ name: 'ROOT', path: '/' }];
  let current = '';
  parts.forEach(p => {
    current += '/' + p;
    breadcrumbs.push({ name: p.toUpperCase(), path: current });
  });

  if (!isOnline) {
    return (
      <div className="flex flex-col items-center justify-center py-32 glass-card text-[var(--text-secondary)]">
        <WifiOff className="w-16 h-16 mb-6 opacity-20" />
        <p className="text-[10px] font-black uppercase tracking-widest">Connect to cloud node to index files</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col glass-card overflow-hidden transition-all duration-500 ${
      isFullScreen 
        ? 'fixed inset-0 z-[200] rounded-none border-none h-screen w-screen bg-[var(--bg-main)]' 
        : 'h-[700px]'
    }`}>
      <ConfirmModal 
        isOpen={confirmConfig.open}
        onClose={() => setConfirmConfig({ ...confirmConfig, open: false })}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        confirmText={confirmConfig.confirmText}
        onConfirm={confirmConfig.onConfirm}
        requiresVerification={confirmConfig.requiresVerification}
      />
      
      {/* ── File Explorer Header ── */}
      <div className="p-8 border-b border-[var(--border-color)] space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
            {breadcrumbs.map((bc, i) => (
              <div key={bc.path} className="flex items-center flex-shrink-0">
                {i > 0 && <ChevronRight className="w-4 h-4 text-[var(--text-secondary)] mx-2" />}
                <button 
                  onClick={() => navigateTo(bc.path)}
                  className={`text-[10px] font-black tracking-widest transition-all ${
                    i === breadcrumbs.length - 1 ? 'text-[var(--accent-mint)]' : 'text-[var(--text-secondary)] hover:text-white'
                  }`}
                >
                  {bc.name}
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4">
             {!isAdmin && (
               <div className="px-4 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
                 <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                 <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">View Only Mode</span>
               </div>
             )}
             <button onClick={() => fetchFiles(path)} className="p-2.5 rounded-xl bg-white/5 text-[var(--text-secondary)] hover:text-white hover:bg-white/10 transition-all">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
             </button>
             <button 
                onClick={() => setIsFullScreen(!isFullScreen)} 
                className="p-2.5 rounded-xl bg-white/5 text-[var(--text-secondary)] hover:text-white hover:bg-white/10 transition-all ml-2"
                title={isFullScreen ? "Exit Fullscreen" : "Maximize"}
             >
                {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
             </button>
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-4">
            <button onClick={() => setNewItemType('folder')} className="flex items-center gap-2 px-6 py-2.5 bg-white/5 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all">
              <Folder className="w-4 h-4 text-amber-500" /> New Dir
            </button>
            <button onClick={() => setNewItemType('file')} className="flex items-center gap-2 px-6 py-2.5 bg-white/5 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all">
              <Plus className="w-4 h-4 text-[var(--accent-violet)]" /> New File
            </button>
            <label className="flex items-center gap-2 px-8 py-2.5 bg-[var(--accent-violet)] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all cursor-pointer shadow-lg shadow-violet-500/20">
              <Download className="w-4 h-4 rotate-180" /> {isUploading ? 'SYNCING...' : 'UPLOAD'}
              <input type="file" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        )}
      </div>

      {/* ── Content Grid ── */}
      <div className="flex-1 overflow-hidden relative flex">
        <div className={`flex-1 overflow-y-auto p-8 ${editingFile ? 'hidden lg:block' : ''}`}>
          {error && (
            <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-center gap-4 mb-8">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <p className="text-[10px] font-black uppercase tracking-widest text-red-500">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {path !== '/' && (
              <div 
                onClick={() => navigateTo(path.split('/').slice(0, -1).join('/') || '/')}
                className="p-6 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all cursor-pointer group flex items-center gap-4"
              >
                <div className="p-2.5 rounded-xl bg-white/5 text-[var(--text-secondary)] group-hover:text-white transition-all">
                  <ArrowLeft className="w-5 h-5" />
                </div>
                <span className="text-xs font-black text-[var(--text-secondary)] group-hover:text-white uppercase tracking-widest">Parent Node</span>
              </div>
            )}

            {items.map(item => (
              <div 
                key={item.name}
                className="group p-6 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/10 transition-all flex flex-col justify-between min-h-[160px] relative overflow-hidden"
              >
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div 
                  className="flex-1 cursor-pointer z-10"
                  onClick={() => item.is_dir ? navigateTo(`${path === '/' ? '' : path}/${item.name}`) : openFile(`${path === '/' ? '' : path}/${item.name}`)}
                >
                  <div className={`w-12 h-12 rounded-2xl mb-4 flex items-center justify-center transition-all ${
                    item.is_dir ? 'bg-amber-500/10 text-amber-500' : 'bg-[var(--accent-violet)]/10 text-[var(--accent-violet)]'
                  }`}>
                    {item.is_dir ? <Folder className="w-6 h-6 fill-current" /> : <FileText className="w-6 h-6" />}
                  </div>
                  <p className="text-sm font-black text-white uppercase tracking-tight truncate mb-1">{item.name}</p>
                  <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">
                    {item.is_dir ? 'Directory' : formatBytes(item.size)}
                  </p>
                </div>

                <div className="flex items-center gap-2 mt-6 z-10 opacity-0 group-hover:opacity-100 transition-all">
                   <button onClick={() => downloadItem(`${path === '/' ? '' : path}/${item.name}`)} className="p-2 rounded-lg bg-white/5 text-[var(--text-secondary)] hover:text-white transition-all">
                      <Download className="w-4 h-4" />
                   </button>
                   {isAdmin && (
                     <button onClick={() => deleteItem(`${path === '/' ? '' : path}/${item.name}`, item.is_dir)} className="p-2 rounded-lg bg-white/5 text-[var(--text-secondary)] hover:text-red-500 transition-all">
                        <Trash2 className="w-4 h-4" />
                     </button>
                   )}
                </div>
              </div>
            ))}
          </div>

          {!loading && items.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center py-20 text-[var(--text-secondary)]">
              <Folder className="w-12 h-12 mb-4 opacity-10" />
              <p className="text-[10px] font-black uppercase tracking-widest">No objects in current scope</p>
            </div>
          )}
        </div>

        {/* Editor Modal Integration */}
        {editingFile && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
             <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => !isSaving && setEditingFile(null)} />
             <div className="glass-card w-full max-w-6xl h-full relative z-10 flex flex-col overflow-hidden">
                <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/5 rounded-2xl text-[var(--accent-violet)]">
                       <Edit3 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black uppercase tracking-tight font-display">Source Editor</h3>
                      <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-1 truncate max-w-md">{editingFile.path}</p>
                    </div>
                  </div>
                  {!isAdmin && (
                    <div className="px-4 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Read Only</span>
                    </div>
                  )}
                  <button onClick={() => setEditingFile(null)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                    <X className="w-6 h-6 text-[var(--text-secondary)]" />
                  </button>
                </div>

                <div className="flex-1 overflow-hidden p-6">
                  <textarea 
                    className="w-full h-full p-6 bg-black/60 text-gray-300 font-mono text-sm rounded-3xl border border-[var(--border-color)] focus:border-[var(--accent-violet)] outline-none resize-none leading-relaxed"
                    value={editingFile.content}
                    onChange={(e) => isAdmin && setEditingFile({ ...editingFile, content: e.target.value })}
                    readOnly={!isAdmin}
                    spellCheck="false"
                  />
                </div>


                <div className="p-6 border-t border-[var(--border-color)] flex justify-end gap-4">
                   <button onClick={() => setEditingFile(null)} className="px-8 py-3 rounded-xl bg-white/5 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Cancel</button>
                   {isAdmin && (
                     <button onClick={saveFile} disabled={isSaving} className="flex items-center gap-2 px-10 py-3 rounded-xl bg-[var(--accent-violet)] text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-violet-500/20">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Commit Changes
                     </button>
                   )}
                </div>
             </div>
          </div>
        )}
      </div>

      {/* ── Status Overlay ── */}
      {newItemType && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-8">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setNewItemType(null)} />
           <div className="glass-card w-full max-w-sm p-10 relative z-10">
              <h3 className="text-xl font-black uppercase tracking-tight font-display mb-8">
                {newItemType === 'file' ? 'New Source' : 'New Directory'}
              </h3>
              <input 
                autoFocus
                type="text"
                className="w-full px-6 py-4 rounded-xl bg-black/40 border border-[var(--border-color)] text-white text-sm font-bold uppercase tracking-widest mb-8 focus:border-[var(--accent-violet)] outline-none"
                placeholder="NAME..."
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
              />
              <div className="flex gap-4">
                <button onClick={() => setNewItemType(null)} className="flex-1 py-3.5 rounded-xl bg-white/5 text-white text-[10px] font-black uppercase tracking-widest">Cancel</button>
                <button onClick={createItem} className="flex-1 py-3.5 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-widest">Create</button>
              </div>
           </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="px-8 py-4 border-t border-[var(--border-color)] bg-black/40 flex items-center justify-between text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">
        <span>{items.length} OBJECTS INDEXED</span>
        <div className="flex items-center gap-2">
           <div className="w-1.5 h-1.5 rounded-full accent-bg-green animate-pulse-dot" />
           FILE AGENT: CONNECTED
        </div>
      </div>
    </div>
  );
}
