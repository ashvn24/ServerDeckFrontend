import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, RefreshCw, Shield, AlertTriangle, Loader2 } from 'lucide-react';
import { serversAPI } from '../api/endpoints';
import { useWebSocket } from '../hooks/useWebSocket';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function SSLManager() {
  const { id: serverId } = useParams();
  const navigate = useNavigate();
  const { sendCommand } = useWebSocket();
  const [server, setServer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueDomain, setIssueDomain] = useState('');
  const [issueEmail, setIssueEmail] = useState('');
  const [issuing, setIssuing] = useState(false);
  const [renewingCert, setRenewingCert] = useState(null);

  const fetchServer = useCallback(async () => {
    try {
      const res = await serversAPI.get(serverId);
      setServer(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [serverId]);

  useEffect(() => { fetchServer(); }, [fetchServer]);

  const handleIssue = async (e) => {
    e.preventDefault();
    setIssuing(true);
    try {
      await sendCommand(serverId, 'ssl.issue', {
        domain: issueDomain,
        email: issueEmail || undefined,
      });
      setShowIssueModal(false);
      setIssueDomain('');
      setIssueEmail('');
      setTimeout(fetchServer, 2000);
    } catch (err) {
      alert('Failed to issue certificate: ' + err.message);
    } finally {
      setIssuing(false);
    }
  };

  const handleRenew = async (certName) => {
    setRenewingCert(certName);
    try {
      await sendCommand(serverId, 'ssl.renew', { domain: certName });
      setTimeout(fetchServer, 2000);
    } catch (err) {
      alert('Renewal failed: ' + err.message);
    } finally {
      setRenewingCert(null);
    }
  };

  const isExpiringSoon = (expiryStr) => {
    if (!expiryStr) return false;
    const expiry = new Date(expiryStr);
    const now = new Date();
    const daysLeft = (expiry - now) / (1000 * 60 * 60 * 24);
    return daysLeft < 14;
  };

  if (loading) return <LoadingSpinner size="lg" text="Loading SSL certificates..." />;

  const certs = server?.ssl_certs || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/servers/${serverId}`)} className="p-2 rounded-xl hover:bg-gray-200 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SSL Certificates</h1>
            <p className="text-sm text-gray-500 mt-0.5">{server?.name}</p>
          </div>
        </div>
        <button onClick={() => setShowIssueModal(true)} className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors">
          <Plus className="w-4 h-4" /> Issue New Cert
        </button>
      </div>

      {certs.length === 0 ? (
        <div className="text-center py-20">
          <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">No SSL certificates found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {certs.map((cert, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:shadow-sm transition-all">
              <div className="flex items-center gap-3">
                <Shield className={`w-5 h-5 ${isExpiringSoon(cert.expiry) ? 'text-amber-500' : 'text-emerald-500'}`} />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{cert.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {(cert.domains || []).join(', ')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className={`text-xs font-medium ${isExpiringSoon(cert.expiry) ? 'text-amber-600' : 'text-gray-500'}`}>
                    {isExpiringSoon(cert.expiry) && <AlertTriangle className="inline w-3.5 h-3.5 mr-1" />}
                    Expires: {cert.expiry || 'Unknown'}
                  </p>
                </div>
                <button
                  onClick={() => handleRenew(cert.name)}
                  disabled={renewingCert === cert.name}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {renewingCert === cert.name ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  Renew
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showIssueModal} onClose={() => setShowIssueModal(false)} title="Issue SSL Certificate">
        <form onSubmit={handleIssue} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
            <input type="text" value={issueDomain} onChange={(e) => setIssueDomain(e.target.value)} required placeholder="example.com" className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-gray-400 font-normal">(optional)</span></label>
            <input type="email" value={issueEmail} onChange={(e) => setIssueEmail(e.target.value)} placeholder="admin@example.com" className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" />
          </div>
          <button type="submit" disabled={issuing} className="w-full py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors">
            {issuing ? 'Issuing...' : 'Issue Certificate'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
