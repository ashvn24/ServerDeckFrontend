import { Globe, Lock, ExternalLink } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function SiteCard({ site, onDelete }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${site.site_type === 'backend' ? 'bg-violet-50' : 'bg-teal-50'}`}>
            <Globe className={`w-4 h-4 ${site.site_type === 'backend' ? 'text-violet-600' : 'text-teal-600'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-gray-900">{site.domain}</h4>
              {site.ssl_enabled && (
                <Lock className="w-3.5 h-3.5 text-emerald-500" title="SSL Enabled" />
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                ${site.site_type === 'backend' ? 'bg-violet-100 text-violet-700' : 'bg-teal-100 text-teal-700'}`
              }>
                {site.site_type}
              </span>
              {site.upstream_port && (
                <span className="text-xs text-gray-500">:{site.upstream_port}</span>
              )}
              {site.is_ssr && (
                <span className="text-xs text-gray-500">SSR</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status={site.is_active ? 'online' : 'offline'} size="sm" />
          {onDelete && (
            <button
              onClick={() => onDelete(site.id)}
              className="text-xs text-red-500 hover:text-red-700 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
