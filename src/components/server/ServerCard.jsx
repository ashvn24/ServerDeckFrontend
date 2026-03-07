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
      className="group bg-white/60 backdrop-blur-xl border border-white/60 rounded-3xl p-6 cursor-pointer
                 shadow-[0_8px_32px_0_rgba(31,38,135,0.05)]
                 hover:shadow-[0_12px_48px_0_rgba(31,38,135,0.1)] 
                 hover:-translate-y-1.5 hover:bg-white/80 hover:border-white
                 transition-all duration-500 ease-out relative overflow-hidden flex flex-col h-full"
      id={`server-card-${server.id}`}
    >
      {/* Top Gradient Accent (Revealed on hover) */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-400 to-primary-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out" />

      {/* Header */}
      <div className="flex items-start justify-between mb-5 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-gray-50 rounded-[14px] ring-1 ring-inset ring-gray-100/50 group-hover:bg-white group-hover:shadow-[0_4px_12px_rgba(37,99,235,0.08)] group-hover:ring-primary-100 transition-all duration-300">
            <Server className="w-5 h-5 text-gray-500 group-hover:text-primary-600 transition-colors duration-300" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-gray-900 group-hover:text-primary-600 transition-colors duration-300 leading-tight">
              {server.name}
            </h3>
            <p className="text-[11.5px] font-medium text-gray-400 mt-0.5 group-hover:text-gray-500 transition-colors duration-300 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-200 group-hover:bg-primary-200 transition-colors" />
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
