import { Play, Square, RefreshCw, Loader2 } from 'lucide-react';
import { useState } from 'react';
import StatusBadge from '../common/StatusBadge';

export default function ServiceList({ services = [], type = 'systemd', onAction }) {
  const [loadingAction, setLoadingAction] = useState(null);

  const handleAction = async (name, action) => {
    setLoadingAction(`${name}-${action}`);
    try {
      await onAction(name, action);
    } finally {
      setLoadingAction(null);
    }
  };

  if (services.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-sm">No {type} services found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {services.map((svc, idx) => {
        const name = svc.name || svc.server_name || svc.filename || `service-${idx}`;
        // Nginx sites from sites-enabled are always active/enabled
        // PM2 apps have svc.status === 'online'
        // Systemd services have svc.active_state === 'active'
        const isActive = type === 'nginx'
          ? true  // present in sites-enabled = enabled
          : (svc.active_state === 'active' || svc.status === 'online' || svc.sub_state === 'running');

        return (
          <div
            key={name}
            className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <StatusBadge status={isActive ? 'online' : 'offline'} size="sm" />
              <div>
                <p className="text-sm font-medium text-gray-900">{name}</p>
                {svc.description && (
                  <p className="text-xs text-gray-500 mt-0.5">{svc.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {!isActive && (
                <button
                  onClick={() => handleAction(name, 'start')}
                  disabled={!!loadingAction}
                  className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                  title="Start"
                >
                  {loadingAction === `${name}-start` ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </button>
              )}
              {isActive && (
                <button
                  onClick={() => handleAction(name, 'stop')}
                  disabled={!!loadingAction}
                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                  title="Stop"
                >
                  {loadingAction === `${name}-stop` ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              )}
              <button
                onClick={() => handleAction(name, 'restart')}
                disabled={!!loadingAction}
                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
                title="Restart"
              >
                {loadingAction === `${name}-restart` ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
