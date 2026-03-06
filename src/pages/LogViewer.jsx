import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { serversAPI } from '../api/endpoints';
import { useWebSocket } from '../hooks/useWebSocket';
import Terminal from '../components/common/Terminal';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function LogViewer() {
  const { id: serverId } = useParams();
  const navigate = useNavigate();
  const { sendCommand } = useWebSocket();
  const [server, setServer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('systemd');
  const [serviceName, setServiceName] = useState('');
  const [logLines, setLogLines] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

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

  useEffect(() => { fetchServer(); }, [fetchServer]);

  // Get service name options based on source
  const getServiceOptions = () => {
    if (!server) return [];
    if (source === 'systemd') {
      return (server.systemd_services || []).map((s) => s.name);
    }
    if (source === 'nginx') {
      return (server.nginx_sites || []).map((s) => s.server_name || s.filename);
    }
    if (source === 'pm2') {
      return (server.pm2_apps || []).map((a) => a.name);
    }
    return [];
  };

  const handleFetch = async () => {
    if (!serviceName) return;
    setFetching(true);
    try {
      const result = await sendCommand(serverId, 'logs.fetch', {
        source,
        name: serviceName,
        lines: 100,
      });
      setLogLines(result.data?.lines || []);
    } catch (err) {
      setLogLines([`Error: ${err.message}`]);
    } finally {
      setFetching(false);
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
          <h1 className="text-2xl font-bold text-gray-900">Log Viewer</h1>
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
            >
              <option value="">Select a service...</option>
              {serviceOptions.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={handleFetch}
              disabled={!serviceName || fetching}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 mt-5"
            >
              {fetching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Fetch
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
