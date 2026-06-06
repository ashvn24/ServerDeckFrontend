import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Folder, File, ChevronRight, Home, ArrowLeft, RefreshCw,
  Trash2, Edit3, Plus, Save, X, Search, MoreVertical,
  Download, Upload, Loader2, AlertTriangle, FileText, WifiOff, Maximize2, Minimize2,
  ShieldAlert, TerminalSquare, Settings, ScrollText, Braces, Code2
} from 'lucide-react';
import { formatBytes } from '../../utils/formatters';
import ConfirmModal from '../common/ConfirmModal';
import { useIsPWA } from '../../hooks/useIsPWA';
import { useMobile } from '../../hooks/useMobile';

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

  const isPWA = useIsPWA();
  const isMobile = useMobile();
  const [pwaCreateSheet, setPwaCreateSheet] = useState(false);
  const [pwaRowSheet, setPwaRowSheet] = useState(null); // item targeted by the context menu
  const [pwaRename, setPwaRename] = useState(null);      // { full, name }
  const [renameInput, setRenameInput] = useState('');
  const uploadInputRef = useRef(null);
  const longPressTimer = useRef(null);
  const longPressedRef = useRef(false);

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

  const renameItem = async () => {
    if (!pwaRename) return;
    const val = renameInput.trim();
    if (!val || val === pwaRename.name) { setPwaRename(null); return; }
    const parent = pwaRename.full.slice(0, pwaRename.full.lastIndexOf('/'));
    const newFull = `${parent}/${val}`;
    try {
      // The agent has no files.rename in its ACTION_ALLOWLIST — rename via the
      // existing automation.run handler (shell `mv`).
      const res = await sendCommand(serverId, 'automation.run', { script: `mv "${pwaRename.full}" "${newFull}"` });
      if (res.error) throw new Error(res.error);
      if (res.returncode !== 0) throw new Error(res.stderr || 'Rename failed');
      fetchFiles(path);
    } catch (err) {
      setError(err.message);
    } finally {
      setPwaRename(null);
    }
  };

  // Long-press → iOS context menu (without blocking a normal tap).
  const handleTouchStart = (e, item) => {
    e.stopPropagation();
    longPressedRef.current = false;
    longPressTimer.current = setTimeout(() => { 
      longPressedRef.current = true; 
      setPwaRowSheet(item); 
    }, 500);
  };
  const handleTouchEnd = () => clearTimeout(longPressTimer.current);
  const handleTouchMove = () => clearTimeout(longPressTimer.current);

  const handleCellTap = (open) => {
    if (longPressedRef.current) { longPressedRef.current = false; return; }
    open();
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

  // Icon + tint for a file by extension (iOS Files style).
  const fileMeta = (name) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (['sh', 'bash', 'zsh'].includes(ext)) return { Icon: TerminalSquare, color: 'text-emerald-400' };
    if (['conf', 'env', 'ini', 'cfg', 'toml'].includes(ext)) return { Icon: Settings, color: 'text-[var(--text-secondary)]' };
    if (ext === 'log') return { Icon: ScrollText, color: 'text-[var(--text-secondary)]' };
    if (['json', 'yaml', 'yml'].includes(ext)) return { Icon: Braces, color: 'text-sky-400' };
    if (ext === 'py') return { Icon: Code2, color: 'text-yellow-400' };
    if (['txt', 'md', 'markdown', 'rtf'].includes(ext)) return { Icon: FileText, color: 'text-white/80' };
    return { Icon: File, color: 'text-[var(--text-secondary)]' };
  };

  /* ─────────── iOS Files-app style browser (mobile + PWA) ─────────── */
  if (isPWA || isMobile) {
    return (
      <div className="pwa-server space-y-3">
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

        {/* Breadcrumb */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar -mx-4 px-4 py-1">
          {breadcrumbs.map((bc, i) => (
            <div key={bc.path} className="flex items-center shrink-0">
              {i > 0 && <ChevronRight className="w-4 h-4 text-[var(--text-secondary)] mx-0.5" />}
              <button
                onClick={() => navigateTo(bc.path)}
                className={`text-sm font-semibold whitespace-nowrap ${i === breadcrumbs.length - 1 ? 'text-[var(--accent-mint)]' : 'text-[var(--text-secondary)]'}`}
              >
                {bc.name}
              </button>
            </div>
          ))}
          <button
            onClick={() => fetchFiles(path)}
            aria-label="Refresh"
            className="ml-auto shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-[var(--text-secondary)]"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {!isAdmin && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-semibold text-amber-500">View Only Mode</span>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-xs font-semibold text-red-500">{error}</span>
          </div>
        )}

        {/* File grid — iOS Files folder grid; slides in on navigation (push feel) */}
        <div key={path} className="grid grid-cols-3 gap-3 animate-in slide-in-from-right-4 fade-in duration-200">
          {items.map((item) => {
            const full = `${path === '/' ? '' : path}/${item.name}`;
            const open = () => (item.is_dir ? navigateTo(full) : openFile(full));
            const meta = item.is_dir ? { Icon: Folder, color: 'text-amber-500' } : fileMeta(item.name);
            const Icon = meta.Icon;
            return (
              <button
                key={item.name}
                onClick={() => handleCellTap(open)}
                onTouchStart={(e) => handleTouchStart(e, item)}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchMove}
                style={{ WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none' }}
                className="file-grid-cell flex flex-col items-center text-center gap-1 p-2 rounded-xl bg-white/5 active:scale-95 active:opacity-80 transition-all"
              >
                <Icon className={`w-8 h-8 ${meta.color} ${item.is_dir ? 'fill-amber-500/30' : ''}`} />
                <p style={{ WebkitUserSelect: 'none', userSelect: 'none' }} className="text-xs text-white leading-tight line-clamp-2 break-all w-full">{item.name}</p>
                <p className={`text-[var(--text-secondary)] uppercase tracking-wide ${item.is_dir ? 'hidden md:block' : ''}`} style={{ fontSize: '10px', WebkitUserSelect: 'none', userSelect: 'none' }}>{item.is_dir ? 'DIRECTORY' : formatBytes(item.size)}</p>
              </button>
            );
          })}
          {!loading && items.length === 0 && !error && (
            <div className="col-span-3 flex flex-col items-center justify-center py-16 text-[var(--text-secondary)]">
              <Folder className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-xs font-semibold">No items here</p>
            </div>
          )}
        </div>

        {/* + FAB */}
        {isAdmin && (
          <button
            onClick={() => setPwaCreateSheet(true)}
            aria-label="Add"
            className="fixed right-4 z-30 w-14 h-14 rounded-full bg-[var(--accent-violet)] text-white shadow-lg shadow-violet-500/30 flex items-center justify-center active:scale-95 transition-transform"
            style={{ bottom: 'calc(var(--bottom-nav) + 1rem)' }}
          >
            <Plus className="w-7 h-7" />
          </button>
        )}
        <input ref={uploadInputRef} type="file" className="hidden" onChange={handleFileUpload} />

        {/* Row action sheet */}
        {pwaRowSheet && (
          <div className="fixed inset-0 z-[200] flex items-end">
            <div className="absolute inset-0 bg-black/50" onClick={() => setPwaRowSheet(null)} />
            <div className="relative w-full p-3 space-y-2" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}>
              <div className="glass-card rounded-2xl overflow-hidden divide-y divide-[var(--border-color)]">
                <p className="px-4 py-3 text-center text-xs text-[var(--text-secondary)] truncate">{pwaRowSheet.name}</p>
                {isAdmin && (
                  <button
                    onClick={() => { const f = `${path === '/' ? '' : path}/${pwaRowSheet.name}`; const n = pwaRowSheet.name; setPwaRowSheet(null); setRenameInput(n); setPwaRename({ full: f, name: n }); }}
                    className="w-full py-4 text-sm font-semibold text-[var(--text-primary)] active:bg-[var(--text-primary)]/5"
                  >
                    Rename
                  </button>
                )}
                {!pwaRowSheet.is_dir && (
                  <button
                    onClick={() => { const f = `${path === '/' ? '' : path}/${pwaRowSheet.name}`; setPwaRowSheet(null); downloadItem(f); }}
                    className="w-full py-4 text-sm font-semibold text-[var(--text-primary)] active:bg-[var(--text-primary)]/5"
                  >
                    Download
                  </button>
                )}
                {isAdmin && (
                  <button
                    onClick={() => { const f = `${path === '/' ? '' : path}/${pwaRowSheet.name}`; const d = pwaRowSheet.is_dir; setPwaRowSheet(null); deleteItem(f, d); }}
                    className="w-full py-4 text-sm font-semibold text-red-500 active:bg-[var(--text-primary)]/5"
                  >
                    Delete
                  </button>
                )}
              </div>
              <button onClick={() => setPwaRowSheet(null)} className="w-full glass-card rounded-2xl py-4 text-sm font-bold text-[var(--text-primary)] active:bg-[var(--text-primary)]/5">Cancel</button>
            </div>
          </div>
        )}

        {/* Create / upload action sheet */}
        {pwaCreateSheet && (
          <div className="fixed inset-0 z-[200] flex items-end">
            <div className="absolute inset-0 bg-black/50" onClick={() => setPwaCreateSheet(false)} />
            <div className="relative w-full p-3 space-y-2" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}>
              <div className="glass-card rounded-2xl overflow-hidden divide-y divide-[var(--border-color)]">
                <button onClick={() => { setPwaCreateSheet(false); setNewItemType('folder'); }} className="w-full py-4 flex items-center justify-center gap-2 text-sm font-semibold text-[var(--text-primary)] active:bg-[var(--text-primary)]/5"><Folder className="w-4 h-4 text-amber-500" /> New Folder</button>
                <button onClick={() => { setPwaCreateSheet(false); setNewItemType('file'); }} className="w-full py-4 flex items-center justify-center gap-2 text-sm font-semibold text-[var(--text-primary)] active:bg-[var(--text-primary)]/5"><FileText className="w-4 h-4 text-[var(--accent-violet)]" /> New File</button>
                <button onClick={() => { setPwaCreateSheet(false); uploadInputRef.current?.click(); }} className="w-full py-4 flex items-center justify-center gap-2 text-sm font-semibold text-[var(--text-primary)] active:bg-[var(--text-primary)]/5"><Upload className="w-4 h-4 text-[var(--accent-mint)]" /> {isUploading ? 'Uploading…' : 'Upload File'}</button>
              </div>
              <button onClick={() => setPwaCreateSheet(false)} className="w-full glass-card rounded-2xl py-4 text-sm font-bold text-[var(--text-primary)] active:bg-[var(--text-primary)]/5">Cancel</button>
            </div>
          </div>
        )}

        {/* New file/dir name prompt */}
        {newItemType && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setNewItemType(null)} />
            <div className="glass-card w-full max-w-sm p-5 relative z-10">
              <h3 className="text-base font-bold mb-4">{newItemType === 'file' ? 'New File' : 'New Folder'}</h3>
              <input
                autoFocus
                type="text"
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-[var(--border-color)] text-white text-base mb-5 focus:border-[var(--accent-violet)] outline-none"
                placeholder="Name…"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
              />
              <div className="flex gap-3">
                <button onClick={() => setNewItemType(null)} className="flex-1 h-11 rounded-xl border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--text-primary)]/5 text-sm font-semibold">Cancel</button>
                <button onClick={createItem} className="flex-1 h-11 rounded-xl bg-[var(--accent-violet)] text-white text-sm font-semibold">Create</button>
              </div>
            </div>
          </div>
        )}

        {/* Rename prompt */}
        {pwaRename && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setPwaRename(null)} />
            <div className="glass-card w-full max-w-sm p-5 relative z-10">
              <h3 className="text-base font-bold mb-4">Rename</h3>
              <input
                autoFocus
                type="text"
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-[var(--border-color)] text-white text-base mb-5 focus:border-[var(--accent-violet)] outline-none"
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value)}
              />
              <div className="flex gap-3">
                <button onClick={() => setPwaRename(null)} className="flex-1 h-11 rounded-xl border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--text-primary)]/5 text-sm font-semibold">Cancel</button>
                <button onClick={renameItem} className="flex-1 h-11 rounded-xl bg-[var(--accent-violet)] text-white text-sm font-semibold">Rename</button>
              </div>
            </div>
          </div>
        )}

        {/* Full-screen editor */}
        {editingFile && (
          <div
            className="fixed inset-0 z-[300] flex flex-col bg-[var(--bg-main)]"
            style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-color)]">
              <button onClick={() => setEditingFile(null)} className="text-[var(--accent-violet)] text-sm font-semibold">Close</button>
              <p className="flex-1 text-center text-sm font-semibold truncate">{editingFile.path.split('/').pop()}</p>
              {isAdmin ? (
                <button onClick={saveFile} disabled={isSaving} className="text-[var(--accent-violet)] text-sm font-bold flex items-center gap-1 disabled:opacity-50">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                </button>
              ) : (
                <span className="text-xs font-semibold text-amber-500">Read only</span>
              )}
            </div>
            <textarea
              className="flex-1 w-full p-4 bg-black text-gray-200 font-mono text-sm outline-none resize-none"
              value={editingFile.content}
              onChange={(e) => isAdmin && setEditingFile({ ...editingFile, content: e.target.value })}
              readOnly={!isAdmin}
              spellCheck="false"
            />
          </div>
        )}
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

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8 gap-3">
            {path !== '/' && (
              <button
                onClick={() => navigateTo(path.split('/').slice(0, -1).join('/') || '/')}
                className="file-grid-cell flex flex-col items-center text-center gap-1 p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all"
              >
                <ArrowLeft className="w-8 h-8 text-[var(--text-secondary)]" />
                <p className="text-xs text-white leading-tight w-full truncate">..</p>
                <p className="text-[var(--text-secondary)] uppercase tracking-wide" style={{ fontSize: '10px' }}>PARENT</p>
              </button>
            )}

            {items.map((item) => {
              const full = `${path === '/' ? '' : path}/${item.name}`;
              const meta = item.is_dir ? { Icon: Folder, color: 'text-amber-500' } : fileMeta(item.name);
              const Icon = meta.Icon;
              return (
                <div key={item.name} className="relative group">
                  <button
                    onClick={() => handleCellTap(() => (item.is_dir ? navigateTo(full) : openFile(full)))}
                    onTouchStart={(e) => handleTouchStart(e, item)}
                    onTouchEnd={handleTouchEnd}
                    onTouchMove={handleTouchMove}
                    style={{ WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none' }}
                    className="file-grid-cell w-full flex flex-col items-center text-center gap-1 p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all"
                  >
                    <Icon className={`w-8 h-8 ${meta.color} ${item.is_dir ? 'fill-amber-500/30' : ''}`} />
                    <p style={{ WebkitUserSelect: 'none', userSelect: 'none' }} className="text-xs text-white leading-tight line-clamp-2 break-all w-full">{item.name}</p>
                    <p className={`text-[var(--text-secondary)] uppercase tracking-wide ${item.is_dir ? 'hidden md:block' : ''}`} style={{ fontSize: '10px', WebkitUserSelect: 'none', userSelect: 'none' }}>{item.is_dir ? 'DIRECTORY' : formatBytes(item.size)}</p>
                  </button>
                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => downloadItem(full)} className="p-1.5 rounded-lg bg-black/40 text-[var(--text-secondary)] hover:text-white transition-all">
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    {isAdmin && (
                      <button onClick={() => deleteItem(full, item.is_dir)} className="p-1.5 rounded-lg bg-black/40 text-[var(--text-secondary)] hover:text-red-500 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
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
