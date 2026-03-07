import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Square, Loader2 } from 'lucide-react';
import { serversAPI } from '../api/endpoints';
import { useWebSocket } from '../hooks/useWebSocket';
import Terminal from '../components/common/Terminal';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function LogViewer() {
  const { id: serverId } = useParams();
  const navigate = useNavigate();
  const { sendCommand, on, watchServer, unwatchServer } = useWebSocket();
  const [server, setServer] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [source, setSource] = useState('systemd');
  const [serviceName, setServiceName] = useState('');
  
  const [logLines, setLogLines] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamLoading, setStreamLoading] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  
  const activeStreamId = useRef(null);

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

  // Handle incoming stream chunks
  useEffect(() => {
    const removeChunkListener = on('stream_chunk', (data) => {
      console.log('Got Stream Chunk:', data);
      
      // Temporarily bypass strict ID checks to debug
      if (data.server_id === serverId) {
        setLogLines((prev) => {
          const newLines = [...prev, data.chunk];
          if (newLines.length > 2000) return newLines.slice(-2000);
          return newLines;
        });
      }
    });

    const removeEndListener = on('stream_ended', (data) => {
      console.log('Stream Ended:', data);
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

  // Clean up stream on unmount or unselect
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  // Stop stream if source/service changes
  useEffect(() => {
    stopStream();
    setLogLines([]);
  }, [source, serviceName, stopStream]);

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
    setLogLines([`Connecting to ${serviceName} logs...`]);
    try {
      const result = await sendCommand(serverId, 'logs.stream', {
        source,
        name: serviceName,
      });
      // The initial response just gives us the command ID representing the stream task
      activeStreamId.current = result.id;
      setIsStreaming(true);
      setLogLines([`--- Connected to ${source}: ${serviceName} ---`]);
    } catch (err) {
      setLogLines([`Error: ${err.message}`]);
      setIsStreaming(false);
    } finally {
      setStreamLoading(false);
    }
  };

  const serviceOptions = getServiceOptions();

  if (loading) return <LoadingSpinner size="lg" text="Loading..." />;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(`/servers/${serverId}`)} className="p-2 rounded-xl hover:bg-gray-200 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Log Viewer</h1>
          <p className="text-sm text-gray-500 mt-0.5">{server?.name}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Source</label>
            <select
              value={source}
              onChange={(e) => { setSource(e.target.value); setServiceName(''); }}
              className="px-3 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              disabled={isStreaming || streamLoading}
            >
              <option value="systemd">Systemd</option>
              <option value="nginx">Nginx</option>
              <option value="pm2">PM2</option>
            </select>
          </div>

          <div className="flex-1 min-w-48">
            <label className="block text-xs font-medium text-gray-500 mb-1">Service</label>
            <select
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              disabled={isStreaming || streamLoading}
            >
              <option value="">Select a service...</option>
              {serviceOptions.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={handleToggleStream}
              disabled={!serviceName || streamLoading}
              className={`flex items-center justify-center min-w-[130px] gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium transition-colors disabled:opacity-50 mt-5 ${
                isStreaming ? 'bg-red-500 hover:bg-red-600' : 'bg-primary-600 hover:bg-primary-700'
              }`}
            >
              {streamLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isStreaming ? (
                <Square className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current" />
              )}
              {streamLoading ? 'Connecting...' : isStreaming ? 'Stop Stream' : 'Start Stream'}
            </button>
            <button
              onClick={() => setLogLines([])}
              className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors mt-5"
            >
              Clear
            </button>
          </div>

          <div className="flex items-center gap-2 mt-5">
            <input type="checkbox" id="autoscroll" checked={autoScroll} onChange={(e) => setAutoScroll(e.target.checked)} className="rounded" />
            <label htmlFor="autoscroll" className="text-xs text-gray-600">Auto-scroll</label>
          </div>
        </div>
      </div>

      {/* Terminal */}
      <Terminal lines={logLines} autoScroll={autoScroll} />
    </div>
  );
}
