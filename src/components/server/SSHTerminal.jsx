import { useEffect, useRef, useCallback, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { Terminal as TerminalIcon, X, RefreshCw, AlertCircle, WifiOff, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import '@xterm/xterm/css/xterm.css';

const XTERM_THEME = {
  background: '#0d1117',
  foreground: '#c9d1d9',
  cursor: '#7c3aed',
  cursorAccent: '#0d1117',
  selectionBackground: 'rgba(124,58,237,0.3)',
  black: '#161b22', red: '#f85149', green: '#56d364', yellow: '#e3b341',
  blue: '#58a6ff', magenta: '#bc8cff', cyan: '#39c5cf', white: '#b1bac4',
  brightBlack: '#6e7681', brightRed: '#ffa198', brightGreen: '#7ee787',
  brightYellow: '#e3b341', brightBlue: '#79c0ff', brightMagenta: '#d2a8ff',
  brightCyan: '#56d3c5', brightWhite: '#f0f6fc',
};

export default function SSHTerminal({ serverId, isOnline, wsConnected, send, on, isActive }) {
  const containerRef  = useRef(null);
  const wrapperRef    = useRef(null); // fullscreen target
  const xtermRef      = useRef(null);
  const fitAddonRef   = useRef(null);
  const sessionIdRef  = useRef(null);
  const timerRef      = useRef(null);

  const [status,      setStatus]      = useState('idle');
  const [errorMsg,    setErrorMsg]    = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ── Init xterm once ────────────────────────────────────────────────────────
  useEffect(() => {
    const term = new Terminal({
      theme: XTERM_THEME,
      fontFamily: '"JetBrains Mono", "Fira Code", Menlo, Monaco, "Courier New", monospace',
      fontSize: 13,
      lineHeight: 1.5,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 3000,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    xtermRef.current    = term;
    fitAddonRef.current = fitAddon;

    if (containerRef.current) {
      term.open(containerRef.current);
      try { fitAddon.fit(); } catch (_) {}
    }

    term.onData((data) => {
      const sid = sessionIdRef.current;
      if (sid) send({ type: 'terminal_input', server_id: serverId, session_id: sid, data });
    });

    return () => { term.dispose(); xtermRef.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── ResizeObserver — refit + inform agent ─────────────────────────────────
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

  // ── Re-fit when the tab becomes visible after display:none ──────────────
  useEffect(() => {
    if (!isActive) return;
    // Small delay — let the browser unhide the element before measuring
    const t = setTimeout(() => {
      try {
        fitAddonRef.current?.fit();
        const term = xtermRef.current;
        const sid  = sessionIdRef.current;
        if (term && sid) {
          send({ type: 'terminal_resize', server_id: serverId,
                 session_id: sid, cols: term.cols, rows: term.rows });
        }
      } catch (_) {}
    }, 50);
    return () => clearTimeout(t);
  }, [isActive, serverId, send]);

  // ── Fullscreen API change listener ────────────────────────────────────────
  useEffect(() => {
    const onFsChange = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      // Give browser a tick to resize then refit
      setTimeout(() => {
        try { fitAddonRef.current?.fit(); } catch (_) {}
        const term = xtermRef.current;
        const sid  = sessionIdRef.current;
        if (term && sid) {
          send({ type: 'terminal_resize', server_id: serverId,
                 session_id: sid, cols: term.cols, rows: term.rows });
        }
      }, 100);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, [serverId, send]);

  // ── WS event listeners ────────────────────────────────────────────────────
  useEffect(() => {
    const unsubOpened = on('terminal_opened', (msg) => {
      if (msg.id !== sessionIdRef.current) return;
      clearTimeout(timerRef.current);
      setStatus('connected');
      try { fitAddonRef.current?.fit(); xtermRef.current?.focus(); } catch (_) {}
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
      xtermRef.current?.writeln(`\r\n\x1b[31m──── error: ${msg.error} ────\x1b[0m`);
    });

    return () => { unsubOpened(); unsubOutput(); unsubClosed(); unsubError(); };
  }, [on]);

  // ── Connect ───────────────────────────────────────────────────────────────
  const connect = useCallback(() => {
    if (!isOnline || !wsConnected) return;
    const sid = crypto.randomUUID();
    sessionIdRef.current = sid;
    setStatus('connecting');
    setErrorMsg('');
    xtermRef.current?.clear();
    xtermRef.current?.writeln('\x1b[36m──── connecting… ────\x1b[0m\r\n');
    const cols = xtermRef.current?.cols ?? 80;
    const rows = xtermRef.current?.rows ?? 24;
    send({ type: 'terminal_open', id: sid, server_id: serverId, cols, rows, shell: '/bin/bash' });
    timerRef.current = setTimeout(() => {
      if (sessionIdRef.current !== sid) return;
      sessionIdRef.current = null;
      setStatus('error');
      setErrorMsg('Connection timed out. Make sure the agent is running on the server.');
      xtermRef.current?.writeln('\r\n\x1b[31m──── timed out ────\x1b[0m');
    }, 15000);
  }, [isOnline, wsConnected, serverId, send]);

  // ── Disconnect ────────────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    clearTimeout(timerRef.current);
    const sid = sessionIdRef.current;
    if (sid) {
      send({ type: 'terminal_close', server_id: serverId, session_id: sid });
      sessionIdRef.current = null;
    }
    setStatus('idle');
    xtermRef.current?.writeln('\r\n\x1b[90m──── disconnected ────\x1b[0m');
  }, [serverId, send]);

  // ── Fullscreen toggle ─────────────────────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      wrapperRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  // ── UI ────────────────────────────────────────────────────────────────────
  const canConnect = isOnline && wsConnected;

  const dotClass = {
    idle: 'bg-gray-400', connecting: 'bg-amber-400 animate-pulse',
    connected: 'bg-emerald-400 animate-pulse-dot', error: 'bg-red-400', closed: 'bg-gray-400',
  }[status];

  const statusLabel = {
    idle: 'Not connected', connecting: 'Connecting…', connected: 'Connected',
    error: 'Connection error', closed: 'Session closed',
  }[status];

  // In fullscreen the wrapper fills the screen and the terminal canvas expands to fill it
  const wrapperClass = isFullscreen
    ? 'flex flex-col w-full h-full bg-[#0d1117]'
    : 'bg-white/60 backdrop-blur-xl border border-white/60 shadow-glass rounded-[2rem] overflow-hidden flex flex-col';

  const canvasHeight = isFullscreen ? 'calc(100vh - 57px)' : '500px';

  return (
    <div ref={wrapperRef} className={wrapperClass}>

      {/* ── Header ── */}
      <div className={`flex items-center justify-between px-6 py-3 border-b flex-shrink-0 ${
        isFullscreen
          ? 'bg-[#161b22] border-[#30363d]'
          : 'bg-white/30 border-white/40'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${isFullscreen ? 'bg-violet-900/40' : 'bg-violet-50 ring-1 ring-inset ring-white/60 shadow-sm'}`}>
            <TerminalIcon className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h3 className={`text-sm font-bold ${isFullscreen ? 'text-slate-200' : 'text-gray-900'}`}>SSH Terminal</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
              <p className={`text-xs ${isFullscreen ? 'text-slate-400' : 'text-gray-500'}`}>{statusLabel}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isOnline && (
            <span className="flex items-center gap-1.5 text-xs text-amber-500 font-medium bg-amber-900/30 px-3 py-1.5 rounded-lg border border-amber-800/40">
              <WifiOff className="w-3.5 h-3.5" /> Server offline
            </span>
          )}
          {isOnline && !wsConnected && (
            <span className="flex items-center gap-1.5 text-xs text-amber-500 font-medium bg-amber-900/30 px-3 py-1.5 rounded-lg border border-amber-800/40">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Portal connecting…
            </span>
          )}

          {/* Connect / Connecting / Disconnect */}
          {(status === 'idle' || status === 'closed' || status === 'error') ? (
            <button id="ssh-connect-btn" onClick={connect} disabled={!canConnect}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-violet-600 text-white text-sm font-semibold shadow-sm hover:bg-violet-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
              <RefreshCw className="w-3.5 h-3.5" />
              {status === 'error' ? 'Retry' : 'Connect'}
            </button>
          ) : status === 'connecting' ? (
            <button disabled className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-violet-900/50 text-violet-400 text-sm font-semibold cursor-not-allowed">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Connecting…
            </button>
          ) : (
            <button id="ssh-disconnect-btn" onClick={disconnect}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-red-900/30 text-red-400 border border-red-800/40 text-sm font-semibold hover:bg-red-900/50 active:scale-95 transition-all">
              <X className="w-3.5 h-3.5" /> Disconnect
            </button>
          )}

          {/* Fullscreen toggle */}
          <button
            id="ssh-fullscreen-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit fullscreen (Esc)' : 'Enter fullscreen'}
            className={`p-2 rounded-xl text-sm transition-all active:scale-95 ${
              isFullscreen
                ? 'bg-slate-700/60 text-slate-300 hover:bg-slate-600/60'
                : 'bg-white/60 border border-white/60 text-gray-600 hover:bg-white hover:shadow-sm'
            }`}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ── Terminal canvas ── */}
      <div className="relative bg-[#0d1117] flex-1" style={{ minHeight: canvasHeight }}>

        {/* Idle overlay */}
        {status === 'idle' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 pointer-events-none select-none">
            <div className="p-5 rounded-3xl bg-white/5 border border-white/10">
              <TerminalIcon className="w-10 h-10 text-slate-600" />
            </div>
            <p className="text-slate-500 text-sm">
              Click <span className="text-violet-400 font-semibold">Connect</span> to start an SSH session
            </p>
          </div>
        )}

        {/* Error overlay */}
        {status === 'error' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 pointer-events-none select-none">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <p className="text-red-300 text-sm text-center max-w-sm px-4">{errorMsg}</p>
          </div>
        )}

        {/* xterm mount — always in DOM */}
        <div
          ref={containerRef}
          className="terminal-scroll"
          style={{ padding: '12px', height: '100%', boxSizing: 'border-box' }}
        />
      </div>
    </div>
  );
}
