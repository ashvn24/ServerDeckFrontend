import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, XCircle, Circle, Lock, ShieldCheck, ShieldOff } from 'lucide-react';

export default function CreateBackendSite({ serverId, onClose, onSuccess, sendCommand }) {
  const [form, setForm] = useState({
    domain: '',
    upstream_port: '3000',
    working_directory: '',
    start_command: '',
    env_file: '',
    user: 'root',
    ssl_option: 'none', // 'none' | 'existing' | 'new'
    ssl_cert_name: '',
  });

  const [availableCerts, setAvailableCerts] = useState([]);
  const [loadingCerts, setLoadingCerts] = useState(true);

  const [steps, setSteps] = useState([]);
  const [running, setRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);

  // Fetch available SSL certs on mount
  useEffect(() => {
    const fetchCerts = async () => {
      try {
        const result = await sendCommand(serverId, 'ssl.list_available', {});
        if (result?.certs) {
          setAvailableCerts(result.certs);
          // Auto-select first cert if available
          if (result.certs.length > 0) {
            setForm(prev => ({
              ...prev,
              ssl_option: 'existing',
              ssl_cert_name: result.certs[0].name,
            }));
          }
        }
      } catch (err) {
        console.warn('Could not fetch SSL certs:', err);
      } finally {
        setLoadingCerts(false);
      }
    };
    fetchCerts();
  }, [serverId, sendCommand]);

  const selectedCert = availableCerts.find(c => c.name === form.ssl_cert_name);

  const updateStep = (idx, status) => {
    setSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, status } : s)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setRunning(true);

    const serviceName = form.domain.replace(/\./g, '-');
    const useExistingSSL = form.ssl_option === 'existing' && selectedCert;
    const issueNewSSL = form.ssl_option === 'new';

    // Build steps list dynamically
    const stepsList = [
      { label: 'Creating systemd service...', status: 'pending' },
      { label: useExistingSSL
          ? `Configuring Nginx with SSL (${selectedCert.name})...`
          : 'Configuring Nginx reverse proxy...',
        status: 'pending'
      },
    ];
    if (issueNewSSL) {
      stepsList.push({ label: 'Issuing new SSL certificate via Certbot...', status: 'pending' });
    }
    setSteps(stepsList);

    // Step 1: Create systemd service
    setCurrentStep(0);
    updateStep(0, 'running');
    // Need to use the updated steps via the stepsList array
    setSteps(prev => prev.map((s, i) => i === 0 ? { ...s, status: 'running' } : s));
    try {
      await sendCommand(serverId, 'systemd.create', {
        name: serviceName,
        description: `ServerDeck: ${form.domain}`,
        user: form.user,
        working_directory: form.working_directory,
        exec_start: form.start_command,
        env_file: form.env_file || undefined,
      });
      setSteps(prev => prev.map((s, i) => i === 0 ? { ...s, status: 'success' } : s));
    } catch (err) {
      setSteps(prev => prev.map((s, i) => i === 0 ? { ...s, status: 'error' } : s));
      setRunning(false);
      return;
    }

    // Step 2: Create Nginx config (with or without SSL)
    setCurrentStep(1);
    setSteps(prev => prev.map((s, i) => i === 1 ? { ...s, status: 'running' } : s));
    try {
      const nginxParams = {
        domain: form.domain,
        type: 'backend',
        upstream_port: parseInt(form.upstream_port),
      };
      if (useExistingSSL) {
        nginxParams.ssl_cert_path = selectedCert.cert_path;
        nginxParams.ssl_key_path = selectedCert.key_path;
      }
      await sendCommand(serverId, 'nginx.create', nginxParams);
      setSteps(prev => prev.map((s, i) => i === 1 ? { ...s, status: 'success' } : s));
    } catch (err) {
      setSteps(prev => prev.map((s, i) => i === 1 ? { ...s, status: 'error' } : s));
      setRunning(false);
      return;
    }

    // Step 3: Issue new SSL (only if selected)
    if (issueNewSSL) {
      setCurrentStep(2);
      setSteps(prev => prev.map((s, i) => i === 2 ? { ...s, status: 'running' } : s));
      try {
        await sendCommand(serverId, 'ssl.issue', {
          domain: form.domain,
        });
        setSteps(prev => prev.map((s, i) => i === 2 ? { ...s, status: 'success' } : s));
      } catch (err) {
        setSteps(prev => prev.map((s, i) => i === 2 ? { ...s, status: 'error' } : s));
        // SSL failure is non-fatal
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

  // Progress view
  if (currentStep >= 0) {
    return (
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Creating Backend Site: {form.domain}</h4>
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

  // Input classes
  const inputClass = "w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelClass}>Domain</label>
        <input type="text" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} required placeholder="api.example.com" className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Upstream Port</label>
          <input type="number" value={form.upstream_port} onChange={(e) => setForm({ ...form, upstream_port: e.target.value })} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Run as User</label>
          <input type="text" value={form.user} onChange={(e) => setForm({ ...form, user: e.target.value })} className={inputClass} />
        </div>
      </div>
      <div>
        <label className={labelClass}>Working Directory</label>
        <input type="text" value={form.working_directory} onChange={(e) => setForm({ ...form, working_directory: e.target.value })} required placeholder="/var/www/api" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Start Command</label>
        <input type="text" value={form.start_command} onChange={(e) => setForm({ ...form, start_command: e.target.value })} required placeholder="node dist/index.js" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Env File <span className="text-gray-400 font-normal">(optional)</span></label>
        <input type="text" value={form.env_file} onChange={(e) => setForm({ ...form, env_file: e.target.value })} placeholder="/var/www/api/.env" className={inputClass} />
      </div>

      {/* SSL Certificate Section */}
      <div className="border-t border-gray-200 pt-4">
        <label className={labelClass}>
          <Lock className="w-4 h-4 inline mr-1.5 -mt-0.5" />
          SSL Certificate
        </label>

        {loadingCerts ? (
          <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading available certificates...
          </div>
        ) : (
          <div className="space-y-2.5 mt-1">
            {/* No SSL */}
            <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${form.ssl_option === 'none' ? 'border-gray-400 bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <input
                type="radio"
                name="ssl_option"
                value="none"
                checked={form.ssl_option === 'none'}
                onChange={() => setForm({ ...form, ssl_option: 'none', ssl_cert_name: '' })}
                className="text-primary-600"
              />
              <div className="flex items-center gap-2">
                <ShieldOff className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700">No SSL (HTTP only)</span>
              </div>
            </label>

            {/* Existing certs */}
            {availableCerts.length > 0 && (
              <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${form.ssl_option === 'existing' ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <input
                  type="radio"
                  name="ssl_option"
                  value="existing"
                  checked={form.ssl_option === 'existing'}
                  onChange={() => setForm({ ...form, ssl_option: 'existing', ssl_cert_name: availableCerts[0].name })}
                  className="text-primary-600 mt-0.5"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-medium text-gray-900">Use existing certificate</span>
                  </div>
                  {form.ssl_option === 'existing' && (
                    <select
                      value={form.ssl_cert_name}
                      onChange={(e) => setForm({ ...form, ssl_cert_name: e.target.value })}
                      className="mt-2 w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-emerald-400 outline-none"
                    >
                      {availableCerts.map((cert) => (
                        <option key={cert.name} value={cert.name}>
                          {cert.name} — {cert.cert_path}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </label>
            )}

            {/* Issue new */}
            <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${form.ssl_option === 'new' ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <input
                type="radio"
                name="ssl_option"
                value="new"
                checked={form.ssl_option === 'new'}
                onChange={() => setForm({ ...form, ssl_option: 'new', ssl_cert_name: '' })}
                className="text-primary-600"
              />
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-700">Issue new certificate <span className="text-gray-400">(Let's Encrypt / Certbot)</span></span>
              </div>
            </label>
          </div>
        )}
      </div>

      <button type="submit" className="w-full py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors shadow-sm">
        Create Backend Site
      </button>
    </form>
  );
}
