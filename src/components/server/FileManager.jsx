import { useState, useEffect, useCallback } from 'react';
import { 
  Folder, File, ChevronRight, Home, ArrowLeft, RefreshCw, 
  Trash2, Edit3, Plus, Save, X, Search, MoreVertical, 
  Download, AlertTriangle, FileText
} from 'lucide-react';
import { formatBytes } from '../../utils/formatters';

export default function FileManager({ serverId, sendCommand, isOnline, isAdmin }) {
  const [path, setPath] = useState('/');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Editor state
  const [editingFile, setEditingFile] = useState(null); // { path, content }
  const [editLoading, setEditLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Modals/Dialogs
  const [newItemType, setNewItemType] = useState(null); // 'file' | 'folder'
  const [newItemName, setNewItemName] = useState('');
  
  // Upload state
  const [isUploading, setIsUploading] = useState(false);

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
  }, [serverId]); // Only fetch on mount or server change

  const navigateTo = (newPath) => {
    if (editingFile) {
      if (!confirm('You have unsaved changes. Discard them?')) return;
      setEditingFile(null);
    }
    fetchFiles(newPath);
  };

  const openFile = async (filePath) => {
    setEditLoading(true);
    try {
      const res = await sendCommand(serverId, 'files.read', { path: filePath });
      if (res.error) {
        alert(res.error);
      } else {
        setEditingFile({ path: filePath, content: res.data.content });
      }
    } catch (err) {
      alert('Failed to read file: ' + err.message);
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
      if (res.error) {
        alert(res.error);
      } else {
        setEditingFile(null);
        fetchFiles(path);
      }
    } catch (err) {
      alert('Failed to save file: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteItem = async (targetPath, isDir) => {
    if (!confirm(`Are you sure you want to delete this ${isDir ? 'folder' : 'file'}?`)) return;
    try {
      const res = await sendCommand(serverId, 'files.delete', { path: targetPath });
      if (res.error) {
        alert(res.error);
      } else {
        fetchFiles(path);
      }
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const createItem = async () => {
    if (!newItemName) return;
    const fullPath = `${path === '/' ? '' : path}/${newItemName}`;
    try {
      const action = newItemType === 'file' ? 'files.write' : 'files.mkdir';
      const res = await sendCommand(serverId, action, { path: fullPath, content: '' });
      if (res.error) {
        alert(res.error);
      } else {
        setNewItemType(null);
        setNewItemName('');
        fetchFiles(path);
      }
    } catch (err) {
      alert('Creation failed: ' + err.message);
    }
  };

  const downloadItem = async (targetPath) => {
    setLoading(true);
    try {
      const res = await sendCommand(serverId, 'files.download', { path: targetPath });
      if (res.error) {
        alert(res.error);
      } else {
        // Create a download link and click it
        const link = document.createElement('a');
        link.href = `data:${res.data.mime};base64,${res.data.content}`;
        link.download = res.data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      alert('Download failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      alert('File too large (max 50MB)');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target.result.split(',')[1]; // Get base64 part
      try {
        const res = await sendCommand(serverId, 'files.upload', {
          path,
          filename: file.name,
          content
        });
        if (res.error) {
          alert(res.error);
        } else {
          fetchFiles(path);
        }
      } catch (err) {
        alert('Upload failed: ' + err.message);
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Breadcrumb generation
  const parts = path.split('/').filter(Boolean);
  const breadcrumbs = [{ name: 'Root', path: '/' }];
  let current = '';
  parts.forEach(p => {
    current += '/' + p;
    breadcrumbs.push({ name: p, path: current });
  });

  if (!isOnline) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2rem] text-gray-500">
        <WifiOff className="w-12 h-12 mb-4 opacity-20" />
        <p className="font-medium">Connect to the server to manage files</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] bg-white/60 backdrop-blur-xl border border-white/60 shadow-glass rounded-[2rem] overflow-hidden">
      
      {/* ── Toolbar ── */}
      <div className="px-4 py-4 border-b border-white/40 flex flex-col gap-4 bg-white/30">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
          <div className="flex items-center bg-gray-100/50 rounded-xl p-1 shrink-0">
            {breadcrumbs.map((bc, i) => (
              <div key={bc.path} className="flex items-center whitespace-nowrap">
                {i > 0 && <ChevronRight className="w-4 h-4 text-gray-400 mx-1 flex-shrink-0" />}
                <button 
                  onClick={() => navigateTo(bc.path)}
                  className={`px-2 py-1 rounded-lg text-xs md:text-sm font-semibold transition-all ${
                    i === breadcrumbs.length - 1 
                      ? 'text-primary-600 bg-white shadow-sm' 
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
                  }`}
                >
                  {bc.name}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button 
            onClick={() => fetchFiles(path)} 
            className="p-2.5 rounded-xl bg-white/80 border border-white shadow-sm text-gray-600 hover:text-primary-600 transition-all shrink-0"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {isAdmin && (
            <>
              <div className="w-px h-6 bg-gray-200 mx-1 shrink-0" />
              <button 
                onClick={() => setNewItemType('folder')}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/80 border border-white shadow-sm text-xs font-bold text-gray-700 hover:bg-white hover:text-primary-600 transition-all shrink-0"
              >
                <Folder className="w-3.5 h-3.5 text-amber-500" /> Folder
              </button>
              <button 
                onClick={() => setNewItemType('file')}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary-600 text-white shadow-lg text-xs font-bold hover:bg-primary-700 transition-all shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> File
              </button>
              <label className={`flex items-center gap-2 px-3 py-2 rounded-xl border border-primary-200 bg-primary-50 text-xs font-bold text-primary-600 hover:bg-primary-100 transition-all cursor-pointer shrink-0 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <Plus className="w-3.5 h-3.5" />
                {isUploading ? '...' : 'Upload'}
                <input type="file" className="hidden" onChange={handleFileUpload} />
              </label>
            </>
          )}
        </div>
      </div>

      {/* ── Main Area ── */}
      <div className="flex-1 overflow-hidden relative flex">
        
        {/* File List */}
        <div className={`flex-1 overflow-y-auto p-4 custom-scrollbar ${editingFile ? 'hidden lg:block' : ''}`}>
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm flex items-center gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {/* Parent Directory */}
            {path !== '/' && (
              <button 
                onClick={() => navigateTo(path.split('/').slice(0, -1).join('/') || '/')}
                className="flex items-center gap-4 p-4 rounded-[1.5rem] bg-white/40 border border-white/60 hover:bg-white/80 hover:border-primary-200 hover:shadow-lg transition-all text-left group"
              >
                <div className="p-3 rounded-2xl bg-gray-100 text-gray-400 group-hover:bg-primary-50 group-hover:text-primary-500 transition-all">
                  <ArrowLeft className="w-6 h-6" />
                </div>
                <div className="font-bold text-gray-500 group-hover:text-gray-900 transition-all">..</div>
              </button>
            )}

            {/* Directory Items */}
            {items.map(item => (
              <div 
                key={item.name}
                className="group relative flex items-center gap-4 p-4 rounded-[1.5rem] bg-white/40 border border-white/60 hover:bg-white hover:border-primary-100 hover:shadow-lg transition-all"
              >
                <button 
                  className="flex-1 flex items-center gap-4 text-left overflow-hidden"
                  onClick={() => item.is_dir ? navigateTo(`${path === '/' ? '' : path}/${item.name}`) : openFile(`${path === '/' ? '' : path}/${item.name}`)}
                >
                  <div className={`p-3 rounded-2xl transition-all ${
                    item.is_dir 
                      ? 'bg-amber-50 text-amber-500 group-hover:bg-amber-100' 
                      : 'bg-primary-50 text-primary-500 group-hover:bg-primary-100'
                  }`}>
                    {item.is_dir ? <Folder className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-gray-900 truncate">{item.name}</p>
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mt-0.5">
                      {item.is_dir ? 'Directory' : formatBytes(item.size)}
                    </p>
                  </div>
                </button>
                
                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                  <button 
                    onClick={() => downloadItem(`${path === '/' ? '' : path}/${item.name}`)}
                    className="p-2 rounded-xl text-primary-400 hover:bg-primary-50 hover:text-primary-600 transition-all"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  {isAdmin && (
                    <button 
                      onClick={() => deleteItem(`${path === '/' ? '' : path}/${item.name}`, item.is_dir)}
                      className="p-2 rounded-xl text-red-400 hover:bg-red-50 hover:text-red-600 transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {!loading && items.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Folder className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-medium text-sm">Directory is empty</p>
            </div>
          )}
        </div>

        {/* Editor Overlay/Panel */}
        {editingFile && (
          <div className="absolute lg:relative inset-0 lg:w-1/2 bg-white/90 backdrop-blur-2xl border-l border-white/60 flex flex-col z-10 animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-white/40 flex items-center justify-between bg-white/50">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 rounded-xl bg-primary-50 text-primary-500 flex-shrink-0">
                  <Edit3 className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-gray-900 truncate">{editingFile.path.split('/').pop()}</span>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button 
                    onClick={saveFile}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all disabled:opacity-50"
                  >
                    {isSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    Save
                  </button>
                )}
                <button 
                  onClick={() => setEditingFile(null)}
                  className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <textarea 
              className="flex-1 p-6 font-mono text-sm bg-transparent outline-none resize-none leading-relaxed text-gray-800"
              value={editingFile.content}
              onChange={(e) => setEditingFile({ ...editingFile, content: e.target.value })}
              spellCheck="false"
            />
          </div>
        )}

        {/* Create Modal Overlay */}
        {newItemType && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-900/10 backdrop-blur-[2px] p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl border border-white p-6 w-full max-w-sm animate-in zoom-in-95 duration-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                {newItemType === 'file' ? <Plus className="w-5 h-5 text-primary-500" /> : <Folder className="w-5 h-5 text-amber-500" />}
                New {newItemType === 'file' ? 'File' : 'Folder'}
              </h3>
              <input 
                autoFocus
                type="text"
                className="w-full px-4 py-3 rounded-xl bg-gray-100 border-none outline-none focus:ring-2 ring-primary-500 text-sm font-semibold mb-4"
                placeholder={`Enter ${newItemType} name...`}
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createItem()}
              />
              <div className="flex gap-2">
                <button 
                  onClick={() => { setNewItemType(null); setNewItemName(''); }}
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={createItem}
                  disabled={!newItemName}
                  className="flex-1 px-4 py-3 rounded-xl bg-primary-600 text-white font-bold text-sm hover:bg-primary-700 transition-all disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Global Loading Spinner */}
        {loading && !editingFile && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/40 backdrop-blur-[1px]">
            <div className="p-4 rounded-3xl bg-white shadow-2xl flex flex-col items-center gap-3 border border-white">
              <RefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Listing files...</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Status Bar ── */}
      <div className="px-6 py-3 border-t border-white/40 bg-white/20 flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
        <div className="flex items-center gap-4">
          <span>{items.length} Items</span>
          <span>•</span>
          <span className="truncate max-w-[200px]">{path}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
          <span>Agent {isOnline ? 'Online' : 'Offline'}</span>
        </div>
      </div>
    </div>
  );
}

