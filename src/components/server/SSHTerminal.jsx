import { useEffect, useRef, useCallback, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { Terminal as TerminalIcon, X, RefreshCw, AlertCircle, WifiOff, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import { useIsPWA } from '../../hooks/useIsPWA';
import { useMobile } from '../../hooks/useMobile';
import { useSSHFullscreen } from '../../context/SSHFullscreenContext';
import '@xterm/xterm/css/xterm.css';

const XTERM_THEME = {
  background: '#000000',
  foreground: '#ffffff',
  cursor: '#8b5cf6',
  cursorAccent: '#000000',
  selectionBackground: 'rgba(139, 92, 246, 0.3)',
  black: '#000000', red: '#ff5555', green: '#50fa7b', yellow: '#f1fa8c',
  blue: '#bd93f9', magenta: '#ff79c6', cyan: '#8be9fd', white: '#bfbfbf',
  brightBlack: '#4d4d4d', brightRed: '#ff6e67', brightGreen: '#5af78e',
  brightYellow: '#f4f99d', brightBlue: '#caa9fa', brightMagenta: '#ff92d0',
  brightCyan: '#9aedfe', brightWhite: '#e6e6e6',
};

const isIOS = typeof navigator !== 'undefined' && (
  /iPad|iPhone|iPod/.test(navigator.userAgent) || 
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
  window.navigator.standalone === true
);

export default function SSHTerminal({ serverId, isOnline, wsConnected, send, on, isActive, forceOverlay = false }) {
  const containerRef  = useRef(null);
  const wrapperRef    = useRef(null);
  const xtermRef      = useRef(null);
  const fitAddonRef   = useRef(null);
  const sessionIdRef  = useRef(null);
  const timerRef      = useRef(null);

  const [status,      setStatus]      = useState('idle');
  const [errorMsg,    setErrorMsg]    = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isPWA = useIsPWA();
  const isMobile = useMobile();
  const mobileLayout = isPWA || isMobile;
  const { setSshFullscreen } = useSSHFullscreen();

  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const term = new Terminal({
      theme: XTERM_THEME,
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      fontSize: 14,
      lineHeight: 1.4,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 5000,
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    xtermRef.current    = term;
    fitAddonRef.current = fitAddon;

    if (containerRef.current) {
      term.open(containerRef.current);
      requestAnimationFrame(() => {
         try { fitAddon.fit(); } catch (_) {}
      });
    }

    term.onData((data) => {
      const sid = sessionIdRef.current;
      if (sid) send({ type: 'terminal_input', server_id: serverId, session_id: sid, data });
    });

    // Support copy/paste
    term.onSelectionChange(() => {
      const selection = term.getSelection();
      if (selection) {
        navigator.clipboard.writeText(selection).catch(() => {});
      }
    });

    term.attachCustomKeyEventHandler((e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'C') return false;
      if (e.ctrlKey && e.key === 'c' && term.hasSelection()) {
        if (e.type === 'keydown') {
          navigator.clipboard.writeText(term.getSelection());
        }
        return false;
      }
      return true;
    });

    return () => { term.dispose(); xtermRef.current = null; };
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      try {
        fitAddonRef.current?.fit();
        const term = xtermRef.current;
        const sid  = sessionIdRef.current;
        if (term && sid) {
          send({ type: 'terminal_resize', server_id: serverId,
                 session_id: sid, cols: term.cols, rows: term.rows });
        }
      } catch (_) {}
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [serverId, send]);

  useEffect(() => {
    if (!isActive) return;
    const t = setTimeout(() => {
      try {
        fitAddonRef.current?.fit();
        const term = xtermRef.current;
        if (status === 'connected') term?.focus();
        const sid  = sessionIdRef.current;
        if (term && sid) {
          send({ type: 'terminal_resize', server_id: serverId,
                 session_id: sid, cols: term.cols, rows: term.rows });
        }
      } catch (_) {}
    }, 150);
    return () => clearTimeout(t);
  }, [isActive, serverId, send, status]);

  useEffect(() => {
    const unsubOpened = on('terminal_opened', (msg) => {
      if (msg.id !== sessionIdRef.current) return;
      clearTimeout(timerRef.current);
      setStatus('connected');
      setTimeout(() => {
        try {
          fitAddonRef.current?.fit();
          xtermRef.current?.focus();
        } catch (_) {}
      }, 100);
    });

    const unsubOutput = on('terminal_output', (msg) => {
      if (msg.id !== sessionIdRef.current) return;
      xtermRef.current?.write(msg.data ?? msg.chunk ?? '');
    });

    const unsubClosed = on('terminal_closed', (msg) => {
      if (msg.id !== sessionIdRef.current) return;
      clearTimeout(timerRef.current);
      sessionIdRef.current = null;
      setStatus('closed');
      xtermRef.current?.writeln('\r\n\x1b[90m──── session closed ────\x1b[0m');
    });

    const unsubError = on('terminal_error', (msg) => {
      if (msg.id !== sessionIdRef.current) return;
      clearTimeout(timerRef.current);
      sessionIdRef.current = null;
      setStatus('error');
      setErrorMsg(msg.error || 'Terminal error');
    });

    return () => { unsubOpened(); unsubOutput(); unsubClosed(); unsubError(); };
  }, [on]);

  const connect = useCallback(() => {
    if (!isOnline || !wsConnected) return;
    const sid = crypto.randomUUID();
    sessionIdRef.current = sid;
    setStatus('connecting');
    xtermRef.current?.clear();
    xtermRef.current?.writeln('\x1b[35m──── connecting to node… ────\x1b[0m\r\n');
    const cols = xtermRef.current?.cols ?? 80;
    const rows = xtermRef.current?.rows ?? 24;
    send({ type: 'terminal_open', id: sid, server_id: serverId, cols, rows, shell: '/bin/bash' });
    timerRef.current = setTimeout(() => {
      if (sessionIdRef.current !== sid) return;
      setStatus('error');
      setErrorMsg('Connection handshake timed out.');
    }, 15000);
  }, [isOnline, wsConnected, serverId, send]);

  const disconnect = useCallback(() => {
    clearTimeout(timerRef.current);
    const sid = sessionIdRef.current;
    if (sid) {
      send({ type: 'terminal_close', server_id: serverId, session_id: sid });
      sessionIdRef.current = null;
    }
    setStatus('idle');
  }, [serverId, send]);

  const toggleFullscreen = useCallback(() => {
    if (forceOverlay) {
      setSshFullscreen(null);
      return;
    }
    if (isIOS) {
      setSshFullscreen({ serverId });
      return;
    }
    if (!document.fullscreenElement) {
      wrapperRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, [forceOverlay, isIOS, setSshFullscreen, serverId]);

  // Refit xterm whenever fullscreen toggles (size changes).
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        fitAddonRef.current?.fit();
        const term = xtermRef.current;
        const sid = sessionIdRef.current;
        if (term && sid) {
          send({ type: 'terminal_resize', server_id: serverId,
                 session_id: sid, cols: term.cols, rows: term.rows });
        }
      } catch (_) {}
    }, 150);
    return () => clearTimeout(t);
  }, [isFullscreen, serverId, send]);

  const dotClass = {
    idle: 'bg-white/10', connecting: 'bg-amber-400 animate-pulse',
    connected: 'accent-bg-green animate-pulse-dot', error: 'bg-red-500', closed: 'bg-white/10',
  }[status];

  return (
    <div
      ref={wrapperRef}
      className={`flex flex-col overflow-hidden ${
        forceOverlay ? 'h-full w-full' : isFullscreen ? 'bg-black h-screen w-screen' : `glass-card ${mobileLayout ? 'h-[420px]' : 'h-[600px]'}`
      }`}
    >
      <div className={`flex items-center justify-between ${mobileLayout ? 'p-4' : 'p-6'} border-b border-[var(--border-color)] ${isFullscreen || forceOverlay ? 'bg-black' : 'bg-black/20'}`}>
        <div className="flex items-center gap-3">
           <div className={`${mobileLayout ? 'p-2' : 'p-3'} bg-black/40 rounded-2xl text-[var(--accent-violet)] border border-white/5`}>
              <TerminalIcon className={mobileLayout ? 'w-5 h-5' : 'w-6 h-6'} />
           </div>
           <div>
              <h3 className={`${mobileLayout ? 'text-sm' : 'text-sm'} font-black uppercase tracking-widest text-white`}>Cloud Console</h3>
              <div className="flex items-center gap-2 mt-1">
                 <div className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
                 <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">{status.toUpperCase()}</span>
              </div>
           </div>
        </div>

        <div className="flex items-center gap-2">
          {status === 'connected' ? (
            <button onClick={disconnect} className={`${mobileLayout ? 'px-4 py-2' : 'px-6 py-2'} rounded-xl bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all`}>
               {mobileLayout ? 'Close' : 'Close Session'}
            </button>
          ) : (
            <button onClick={connect} disabled={!isOnline || !wsConnected} className={`${mobileLayout ? 'px-4 py-2' : 'px-8 py-2'} rounded-xl bg-[var(--accent-violet)] text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-30`}>
               {mobileLayout ? 'Connect' : 'Establish Connection'}
            </button>
          )}
          <button onClick={toggleFullscreen} className="p-2 rounded-xl bg-white/5 text-[var(--text-secondary)] hover:text-white transition-all">
             {isFullscreen || forceOverlay ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="flex-1 relative bg-black p-4">
        {status === 'idle' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 pointer-events-none">
             <TerminalIcon className="w-12 h-12 text-white/5" />
             <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Standby mode. Initiate handshake to begin.</p>
          </div>
        )}
        <div ref={containerRef} className="h-full w-full" />
      </div>
    </div>
  );
}
