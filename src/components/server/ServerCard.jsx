import { useNavigate } from 'react-router-dom';
import { Server, Monitor } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import ResourceGauge from './ResourceGauge';

export default function ServerCard({ server }) {
  const navigate = useNavigate();
  const ramPercent = server.ram_total_mb
    ? (server.ram_used_mb / server.ram_total_mb) * 100
    : 0;

  return (
    <div
      onClick={() => navigate(`/servers/${server.id}`)}
      className="group bg-white border border-gray-200 rounded-2xl p-5 cursor-pointer
                 hover:shadow-lg hover:shadow-gray-200/50 hover:border-gray-300
                 transition-all duration-300 ease-out"
      id={`server-card-${server.id}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary-50 rounded-xl group-hover:bg-primary-100 transition-colors">
            <Server className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
              {server.name}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {server.ip_address || 'No IP yet'}
            </p>
          </div>
        </div>
        <StatusBadge status={server.is_online ? 'online' : 'offline'} />
      </div>

      {/* Resource Bars */}
      <div className="space-y-3 mb-4">
        <ResourceGauge label="CPU" value={server.cpu_percent || 0} max={100} />
        <ResourceGauge label="RAM" value={ramPercent} max={100} />
        <ResourceGauge label="Disk" value={server.disk_used_percent || 0} max={100} />
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        <Monitor className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-xs text-gray-500">{server.os_info || 'Waiting for agent...'}</span>
      </div>
    </div>
  );
}
