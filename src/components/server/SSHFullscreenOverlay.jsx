import { useEffect } from 'react';
import { useSSHFullscreen } from '../../context/SSHFullscreenContext';
import { useWebSocket } from '../../hooks/useWebSocket';
import SSHTerminal from './SSHTerminal';
import { Minimize2 } from 'lucide-react';

export default function SSHFullscreenOverlay() {
  const { sshFullscreen, setSshFullscreen } = useSSHFullscreen();
  const { connected, send, on } = useWebSocket();

  useEffect(() => {
    if (sshFullscreen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [sshFullscreen]);

  if (!sshFullscreen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100dvh',
      zIndex: 99999, background: '#000',
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)'
    }}>
      <button
        onClick={() => setSshFullscreen(null)}
        style={{
          position: 'absolute', top: 'calc(12px + env(safe-area-inset-top))',
          right: '16px', zIndex: 100000
        }}
        className="w-11 h-11 flex items-center justify-center rounded-full bg-white/15 backdrop-blur text-white active:scale-95 transition-transform"
        aria-label="Exit fullscreen"
      >
        <Minimize2 className="w-5 h-5" />
      </button>
      <SSHTerminal
        serverId={sshFullscreen.serverId}
        isOnline={true}
        wsConnected={connected}
        send={send}
        on={on}
        isActive={true}
        forceOverlay={true}
      />
    </div>
  );
}
