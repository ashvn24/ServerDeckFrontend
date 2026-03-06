import { useState } from 'react';
import { Loader2, CheckCircle, XCircle, Circle } from 'lucide-react';

export default function CreateFrontendSite({ serverId, onClose, onSuccess, sendCommand }) {
  const [form, setForm] = useState({
    domain: '',
    is_ssr: false,
    app_directory: '',
    pm2_script: 'npm',
    pm2_args: 'start',
    build_directory: '',
  });
  const [steps, setSteps] = useState([]);
  const [running, setRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);

  const updateStep = (idx, status) => {
    setSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, status } : s)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setRunning(true);

    if (form.is_ssr) {
      // SSR: pm2.create → nginx.create (backend proxy) → ssl.issue
      setSteps([
        { label: 'Creating PM2 application...', status: 'pending' },
        { label: 'Configuring Nginx reverse proxy...', status: 'pending' },
        { label: 'Issuing SSL certificate...', status: 'pending' },
      ]);
      setCurrentStep(0);

      // Step 1: PM2
      updateStep(0, 'running');
      try {
        await sendCommand(serverId, 'pm2.create', {
          name: form.domain.replace(/\./g, '-'),
          script: form.pm2_script,
          cwd: form.app_directory,
          args: form.pm2_args,
        });
        updateStep(0, 'success');
      } catch {
        updateStep(0, 'error');
        setRunning(false);
        return;
      }

      // Step 2: Nginx
      setCurrentStep(1);
      updateStep(1, 'running');
      try {
        await sendCommand(serverId, 'nginx.create', {
          domain: form.domain,
          type: 'backend',
          upstream_port: 3000,
        });
        updateStep(1, 'success');
      } catch {
        updateStep(1, 'error');
        setRunning(false);
        return;
      }

      // Step 3: SSL
      setCurrentStep(2);
      updateStep(2, 'running');
      try {
        await sendCommand(serverId, 'ssl.issue', { domain: form.domain });
        updateStep(2, 'success');
      } catch {
        updateStep(2, 'error');
      }
    } else {
      // Static: nginx.create (static) → ssl.issue
      setSteps([
        { label: 'Configuring Nginx for static files...', status: 'pending' },
        { label: 'Issuing SSL certificate...', status: 'pending' },
      ]);
      setCurrentStep(0);

      // Step 1: Nginx static
      updateStep(0, 'running');
      try {
        await sendCommand(serverId, 'nginx.create', {
          domain: form.domain,
          type: 'static',
          root_path: form.build_directory,
        });
        updateStep(0, 'success');
      } catch {
        updateStep(0, 'error');
        setRunning(false);
        return;
      }

      // Step 2: SSL
      setCurrentStep(1);
      updateStep(1, 'running');
      try {
        await sendCommand(serverId, 'ssl.issue', { domain: form.domain });
        updateStep(1, 'success');
      } catch {
        updateStep(1, 'error');
      }
    }

    setRunning(false);
    if (onSuccess) onSuccess();
  };

  const stepIcons = {
    pending: <Circle className="w-5 h-5 text-gray-300" />,
    running: <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />,
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
  };

  if (currentStep >= 0) {
    return (
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Creating Frontend Site: {form.domain}</h4>
        <div className="space-y-3">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-center gap-3">
              {stepIcons[step.status]}
              <span className={`text-sm ${step.status === 'running' ? 'text-blue-700 font-medium' : step.status === 'success' ? 'text-emerald-700' : step.status === 'error' ? 'text-red-600' : 'text-gray-500'}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
        {!running && (
          <button onClick={onClose} className="mt-4 w-full py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors">
            Close
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
        <input type="text" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} required placeholder="app.example.com" className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all" />
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="ssr-toggle" checked={form.is_ssr} onChange={(e) => setForm({ ...form, is_ssr: e.target.checked })} className="rounded border-gray-300" />
        <label htmlFor="ssr-toggle" className="text-sm text-gray-700">Server-Side Rendering (SSR)</label>
      </div>

      {form.is_ssr ? (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">App Directory</label>
            <input type="text" value={form.app_directory} onChange={(e) => setForm({ ...form, app_directory: e.target.value })} required placeholder="/var/www/app" className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PM2 Script</label>
              <input type="text" value={form.pm2_script} onChange={(e) => setForm({ ...form, pm2_script: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PM2 Args</label>
              <input type="text" value={form.pm2_args} onChange={(e) => setForm({ ...form, pm2_args: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all" />
            </div>
          </div>
        </>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Build Output Directory</label>
          <input type="text" value={form.build_directory} onChange={(e) => setForm({ ...form, build_directory: e.target.value })} required placeholder="/var/www/frontend/dist" className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all" />
        </div>
      )}

      <button type="submit" className="w-full py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors shadow-sm">
        Create Frontend Site
      </button>
    </form>
  );
}
