import { useState, useEffect } from 'react';
import { Battery, BatteryCharging, BatteryWarning, Cpu, ShieldAlert, CheckCircle, Wifi, RefreshCw, Loader2, Network } from 'lucide-react';
import { useIsPWA } from '../../hooks/useIsPWA';
import { useMobile } from '../../hooks/useMobile';
import { useNotification } from '../../context/NotificationContext';

export default function LuxeGenieManager({ serverId, sendCommand, luxegenieHealth, isOnline }) {
  const isPWA = useIsPWA();
  const isMobile = useMobile();
  const mobileLayout = isPWA || isMobile;
  const { showToast } = useNotification();

  // Local state for health data
  const [healthData, setHealthData] = useState(luxegenieHealth || null);
  const [loadingAll, setLoadingAll] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    battery: false,
    serial: false,
    firmware: false,
    network: false,
  });

  // Sync with prop when telemetry updates it
  useEffect(() => {
    if (luxegenieHealth) {
      setHealthData(luxegenieHealth);
    }
  }, [luxegenieHealth]);

  const handleSyncAll = async () => {
    if (!isOnline) {
      showToast('Cannot sync vitals: Device is offline', 'error');
      return;
    }
    setLoadingAll(true);
    try {
      const res = await sendCommand(serverId, 'luxegenie.health');
      if (res.error) throw new Error(res.error);
      
      // The response payload should have data under `data`
      const data = res.data?.data || res.data || res;
      if (data && typeof data === 'object') {
        setHealthData(data);
        showToast('All LuxeGenie vitals synchronized successfully', 'success');
      } else {
        throw new Error('Invalid response payload');
      }
    } catch (err) {
      console.error('Failed to sync LuxeGenie health:', err);
      showToast(`Sync failed: ${err.message || 'Unknown error'}`, 'error');
    } finally {
      setLoadingAll(false);
    }
  };

  const handleQuerySingle = async (metric, actionName) => {
    if (!isOnline) {
      showToast('Cannot query metric: Device is offline', 'error');
      return;
    }
    setLoadingStates((prev) => ({ ...prev, [metric]: true }));
    try {
      const res = await sendCommand(serverId, actionName);
      if (res.error) throw new Error(res.error);

      const data = res.data?.data || res.data || res;
      if (data && typeof data === 'object') {
        setHealthData((prev) => ({
          ...prev,
          ...data,
          timestamp: data.timestamp || new Date().toISOString(),
        }));
        showToast(`${metric.charAt(0).toUpperCase() + metric.slice(1)} query completed`, 'success');
      } else {
        throw new Error('Invalid response payload');
      }
    } catch (err) {
      console.error(`Failed to query ${metric}:`, err);
      showToast(`Failed to query ${metric}: ${err.message || 'Unknown error'}`, 'error');
    } finally {
      setLoadingStates((prev) => ({ ...prev, [metric]: false }));
    }
  };

  // Determine battery color/icon classes based on level
  const getBatteryDetails = (percent) => {
    if (percent === null || percent === undefined) {
      return {
        icon: BatteryWarning,
        colorClass: 'text-gray-400',
        bgGradient: 'from-gray-700/50 to-gray-800/50',
        text: 'N/A (UART link offline)',
        colorTheme: '#7f8c8d'
      };
    }
    if (percent >= 70) {
      return {
        icon: BatteryCharging,
        colorClass: 'text-emerald-400',
        bgGradient: 'from-emerald-600/40 to-teal-600/30',
        text: `${percent}% (Optimal / High)`,
        colorTheme: 'hsl(142, 72%, 45%)'
      };
    }
    if (percent >= 30) {
      return {
        icon: Battery,
        colorClass: 'text-amber-400',
        bgGradient: 'from-amber-600/40 to-yellow-600/30',
        text: `${percent}% (Medium)`,
        colorTheme: 'hsl(38, 92%, 50%)'
      };
    }
    return {
      icon: BatteryWarning,
      colorClass: 'text-rose-500 animate-pulse',
      bgGradient: 'from-rose-600/40 to-red-600/30',
      text: `${percent}% (Low / Recharge Required)`,
      colorTheme: 'hsl(350, 89%, 50%)'
    };
  };

  const isLuxeGenieSupported = healthData && healthData.serial_number !== 'unavailable (not on Linux device)';

  const bat = getBatteryDetails(healthData?.battery_percentage);
  const BatIcon = bat.icon;

  return (
    <div className={`glass-card ${mobileLayout ? 'p-4' : 'p-10'} space-y-8`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-[var(--accent-mint)] rounded-2xl shadow-lg shadow-[var(--accent-mint)]/20 text-[#2c2c2e]">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight font-display text-white">LuxeGenie Hardware Health</h3>
            <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-1">
              Real-time UART telemetry and device diagnostics
            </p>
          </div>
        </div>

        <button
          onClick={handleSyncAll}
          disabled={loadingAll || !isOnline}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all active:scale-[0.97]
            ${loadingAll ? 'bg-white/10 text-white/50 cursor-not-allowed' :
              !isOnline ? 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5' :
              'bg-white text-[#2c2c2e] hover:bg-white/90 shadow-lg shadow-white/10'}`}
        >
          {loadingAll ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Synchronizing...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Sync All Vitals
            </>
          )}
        </button>
      </div>

      {/* Main warning if hardware not detected */}
      {!isLuxeGenieSupported && healthData && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex gap-3 items-center">
          <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" />
          <div className="text-xs text-[var(--text-secondary)]">
            <span className="font-bold text-rose-500">LuxeGenie Vitals Limited: </span> 
            This node does not appear to be run on a LuxeGenie Linux device. Certain hardware serial communication channels (e.g. UART interface/serial registers) are unavailable.
          </div>
        </div>
      )}

      {/* Grid of Diagnostics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Battery Status */}
        <div className={`p-6 rounded-2xl bg-gradient-to-br ${bat.bgGradient} border border-white/5 flex flex-col justify-between min-h-[220px]`}>
          <div className="flex justify-between items-start">
            <div className="p-3 bg-black/40 rounded-xl border border-white/10">
              <BatIcon className={`w-6 h-6 ${bat.colorClass}`} />
            </div>
            <button
              onClick={() => handleQuerySingle('battery', 'luxegenie.battery')}
              disabled={loadingStates.battery || !isOnline}
              className="p-2 bg-black/30 hover:bg-black/50 border border-white/5 rounded-lg transition-all text-white/70 hover:text-white disabled:opacity-40"
              aria-label="Refresh battery"
            >
              {loadingStates.battery ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            </button>
          </div>
          
          <div className="mt-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Battery Percentage</span>
            <div className="text-4xl font-black tracking-tight text-white mt-1">
              {healthData?.battery_percentage !== null && healthData?.battery_percentage !== undefined 
                ? `${healthData?.battery_percentage}%` 
                : 'N/A'}
            </div>
            <p className="text-xs font-semibold text-white/60 mt-1">{bat.text}</p>
          </div>

          <div className="mt-4 h-1.5 w-full bg-black/30 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500" 
              style={{ 
                width: `${healthData?.battery_percentage ?? 0}%`,
                backgroundColor: bat.colorTheme 
              }} 
            />
          </div>
        </div>

        {/* Device Identity */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between min-h-[220px]">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-black/40 rounded-xl border border-white/10">
              <Cpu className="w-6 h-6 text-[var(--accent-violet)]" />
            </div>
            <button
              onClick={() => handleQuerySingle('serial', 'luxegenie.serial')}
              disabled={loadingStates.serial || !isOnline}
              className="p-2 bg-black/30 hover:bg-black/50 border border-white/5 rounded-lg transition-all text-white/70 hover:text-white disabled:opacity-40"
              aria-label="Refresh serial"
            >
              {loadingStates.serial ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="space-y-3 mt-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Hardware Serial</span>
              <div className="font-mono text-sm font-bold text-white mt-0.5 select-all truncate">
                {healthData?.serial_number || 'Unknown / Not queried'}
              </div>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Configured Device Name</span>
              <div className="text-sm font-bold text-white mt-0.5">
                {healthData?.device_name || 'Unknown'}
              </div>
            </div>
          </div>
        </div>

        {/* Network Configurations */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between min-h-[220px]">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-black/40 rounded-xl border border-white/10">
              <Network className="w-6 h-6 text-sky-400" />
            </div>
            <button
              onClick={() => handleQuerySingle('network', 'luxegenie.network')}
              disabled={loadingStates.network || !isOnline}
              className="p-2 bg-black/30 hover:bg-black/50 border border-white/5 rounded-lg transition-all text-white/70 hover:text-white disabled:opacity-40"
              aria-label="Refresh network"
            >
              {loadingStates.network ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="space-y-3 mt-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Local LAN IP</span>
              <div className="text-sm font-bold text-white mt-0.5 select-all">
                {healthData?.local_ip || 'Unknown'}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <Wifi className="w-4 h-4" />
              <span>Link Sync Verified</span>
            </div>
          </div>
        </div>

        {/* Firmware Vitals */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between min-h-[220px]">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-black/40 rounded-xl border border-white/10">
              <CheckCircle className="w-6 h-6 text-[var(--accent-mint)]" />
            </div>
            <button
              onClick={() => handleQuerySingle('firmware', 'luxegenie.firmware')}
              disabled={loadingStates.firmware || !isOnline}
              className="p-2 bg-black/30 hover:bg-black/50 border border-white/5 rounded-lg transition-all text-white/70 hover:text-white disabled:opacity-40"
              aria-label="Refresh firmware"
            >
              {loadingStates.firmware ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="space-y-3 mt-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Firmware Build Version</span>
              <div className="text-sm font-bold text-white mt-0.5">
                {healthData?.firmware_version || 'Unknown'}
              </div>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Telemetry Last Updated</span>
              <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                {healthData?.timestamp ? new Date(healthData.timestamp).toLocaleString() : 'Never'}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
