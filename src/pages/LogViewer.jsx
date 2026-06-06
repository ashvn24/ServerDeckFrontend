import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Play, Square, Loader2, Maximize2, Minimize2, Terminal as TerminalIcon } from 'lucide-react';
import { serversAPI } from '../api/endpoints';
import { useWebSocket } from '../hooks/useWebSocket';
import Terminal from '../components/common/Terminal';
import SearchableSelect from '../components/common/SearchableSelect';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function LogViewer() {
  const { id: serverId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { connected, sendCommand, on, watchServer, unwatchServer } = useWebSocket();
  const [server, setServer] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [source, setSource] = useState(searchParams.get('source') || 'systemd');
  const [serviceName, setServiceName] = useState(searchParams.get('name') || '');
  
  const [logLines, setLogLines] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamLoading, setStreamLoading] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  
  const activeStreamId = useRef(null);
  const wrapperRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const fetchServer = useCallback(async () => {
    try {
      const res = await serversAPI.get(serverId);
      setServer(res.data);
    } catch (err) {
      console.error('Failed to fetch server:', err);
    } finally {
      setLoading(false);
    }
  }, [serverId]);

  useEffect(() => { 
    fetchServer(); 
    watchServer(serverId);
    return () => unwatchServer(serverId);
  }, [fetchServer, watchServer, unwatchServer, serverId]);

  useEffect(() => {
    const removeChunkListener = on('stream_chunk', (data) => {
      if (data.server_id === serverId) {
        setLogLines((prev) => {
          const newLines = [...prev, data.chunk];
          if (newLines.length > 2000) return newLines.slice(-2000);
          return newLines;
        });
      }
    });

    const removeEndListener = on('stream_ended', (data) => {
      if (data.server_id === serverId) {
        setIsStreaming(false);
        activeStreamId.current = null;
      }
    });

    return () => {
      removeChunkListener();
      removeEndListener();
    };
  }, [on, serverId]);

  const stopStream = useCallback(async () => {
    if (activeStreamId.current) {
      try {
        await sendCommand(serverId, 'logs.stop_stream', { stream_id: activeStreamId.current });
      } catch (err) {
        console.warn('Failed to stop stream gracefully', err);
      }
      activeStreamId.current = null;
    }
    setIsStreaming(false);
    setStreamLoading(false);
  }, [sendCommand, serverId]);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      wrapperRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    stopStream();
    setLogLines([]);
  }, [source, serviceName, stopStream]);

  useEffect(() => {
    if (connected && serviceName && !isStreaming && !streamLoading) {
      handleToggleStream();
    }
  }, [connected]);

  const getServiceOptions = () => {
    if (!server) return [];
    if (source === 'systemd') return (server.systemd_services || []).map((s) => s.name);
    if (source === 'nginx') return (server.nginx_sites || []).map((s) => s.server_name || s.filename);
    if (source === 'pm2') return (server.pm2_apps || []).map((a) => a.name);
    return [];
  };

  const handleToggleStream = async () => {
    if (isStreaming) {
      await stopStream();
      return;
    }

    if (!serviceName) return;
    
    setStreamLoading(true);
    setLogLines([`Handshaking with node for ${serviceName} stream...`]);
    try {
      const result = await sendCommand(serverId, 'logs.stream', {
        source,
        name: serviceName,
      });
      activeStreamId.current = result.id;
      setIsStreaming(true);
      setLogLines([`[GATEWAY] Stream established: ${source} > ${serviceName}`]);
    } catch (err) {
      setLogLines([`[ERROR] Connection failed: ${err.message}`]);
      setIsStreaming(false);
    } finally {
      setStreamLoading(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" text="Syncing..." />;

  return (
    <div className="fixed left-0 right-0 z-40 overflow-y-auto custom-scrollbar bg-[var(--bg-main)]" style={{ top: 'var(--total-header)', bottom: 'var(--bottom-nav)' }}>
      <div className={`p-4 sm:p-6 md:p-10 lg:p-12 w-full mx-auto h-full`}>
      {/* Header */}
      {!isFullscreen && (
        <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-12">
          <button onClick={() => navigate(`/servers/${serverId}`)} className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-xl md:rounded-2xl bg-white/5 text-[var(--text-secondary)] hover:text-white hover:bg-white/10 transition-all border border-white/5">
            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-2xl md:text-4xl font-black uppercase tracking-tight font-display text-white leading-tight truncate">Live Stream Monitor</h1>
            <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-0.5 truncate">{server?.name}</p>
          </div>
        </div>
      )}

      <div ref={wrapperRef} className={`flex flex-col h-full ${isFullscreen ? 'bg-black p-4 sm:p-10' : ''}`}>
        {/* Controls Panel */}
        <div className="glass-card shrink-0 p-5 sm:p-8 md:p-10 mb-6 md:mb-8">
           <div className="flex flex-col lg:flex-row lg:items-end gap-6 md:gap-10">
              <div className="w-full lg:w-64">
                 <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest block mb-2 md:mb-3">Service Scope</label>
                 <select 
                    value={source} 
                    onChange={(e) => { setSource(e.target.value); setServiceName(''); }}
                    className="w-full px-4 sm:px-6 py-3.5 sm:py-4 bg-black/40 border border-[var(--border-color)] rounded-xl sm:rounded-2xl text-xs sm:text-sm text-white focus:border-[var(--accent-violet)] outline-none font-bold uppercase tracking-widest appearance-none"
                    disabled={isStreaming || streamLoading}
                 >
                    <option value="systemd">SYSTEMD</option>
                    <option value="nginx">NGINX SITES</option>
                    <option value="pm2">PM2 CLUSTER</option>
                 </select>
              </div>

              <div className="flex-1 min-w-0">
                 <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest block mb-2 md:mb-3">Node Target</label>
                 <select 
                    value={serviceName} 
                    onChange={(e) => setServiceName(e.target.value)}
                    className="w-full px-4 sm:px-6 py-3.5 sm:py-4 bg-black/40 border border-[var(--border-color)] rounded-xl sm:rounded-2xl text-xs sm:text-sm text-white focus:border-[var(--accent-violet)] outline-none font-bold uppercase tracking-widest appearance-none"
                    disabled={isStreaming || streamLoading}
                 >
                    <option value="">SELECT TARGET...</option>
                    {getServiceOptions().map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
                 </select>
              </div>

              <div className="flex items-center gap-3 sm:gap-4 mt-2 lg:mt-0">
                 <button
                    onClick={handleToggleStream}
                    disabled={!serviceName || streamLoading}
                    className={`flex items-center justify-center gap-2 flex-1 sm:flex-none px-6 sm:px-10 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-30 ${
                      isStreaming ? 'bg-red-500/20 text-red-500 border border-red-500/20' : 'bg-[var(--accent-violet)] text-white shadow-violet-500/20'
                    }`}
                 >
                    {streamLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : isStreaming ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                    <span>{isStreaming ? 'TERMINATE' : 'ESTABLISH'}</span>
                 </button>
                 
                 <button onClick={() => setLogLines([])} className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-white/5 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Clear</button>
                 
                 <button onClick={toggleFullscreen} className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white/5 text-[var(--text-secondary)] hover:text-white transition-all">
                    {isFullscreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
                 </button>
              </div>
           </div>
           
           <div className="mt-8 pt-8 border-t border-[var(--border-color)] flex items-center gap-6">
              <div className="flex items-center gap-2">
                 <input type="checkbox" id="autoscroll" checked={autoScroll} onChange={(e) => setAutoScroll(e.target.checked)} className="accent-[var(--accent-violet)]" />
                 <label htmlFor="autoscroll" className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest cursor-pointer">Live Scroll</label>
              </div>
              <div className="flex items-center gap-2">
                 <div className={`w-1.5 h-1.5 rounded-full ${isStreaming ? 'accent-bg-green animate-pulse-dot' : 'bg-white/10'}`} />
                 <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">{isStreaming ? 'SYNCING DATA' : 'STANDBY'}</span>
              </div>
           </div>
        </div>

        {/* Terminal Container */}
        <div className="flex-1 min-h-[500px]">
          <Terminal 
            lines={logLines} 
            autoScroll={autoScroll} 
            style={{ 
               backgroundColor: '#000000', 
               borderRadius: '1.5rem', 
               border: '1px solid var(--border-color)',
               padding: window.innerWidth < 640 ? '1rem' : '2rem',
               height: '100%',
               maxHeight: isFullscreen ? 'unset' : '600px'
            }} 
          />
        </div>
      </div>
      </div>
    </div>
  );
}
