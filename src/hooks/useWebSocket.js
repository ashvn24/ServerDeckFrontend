import { useRef, useEffect, useCallback, useState } from 'react';
import { WS_URL } from '../utils/constants';

export function useWebSocket() {
  const wsRef = useRef(null);
  const listenersRef = useRef(new Map());
  const pendingRef = useRef(new Map());
  const [connected, setConnected] = useState(false);
  const reconnectTimerRef = useRef(null);

  const queueRef = useRef([]);

  const flushQueue = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && queueRef.current.length > 0) {
      console.log(`[WS] Flushing ${queueRef.current.length} queued messages`);
      queueRef.current.forEach(msg => wsRef.current.send(JSON.stringify(msg)));
      queueRef.current = [];
    }
  }, []);

  const connect = useCallback(() => {
    const token = localStorage.getItem('serverdeck_token');
    if (!token) return;

    try {
      const ws = new WebSocket(`${WS_URL}?token=${token}`);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        console.log('[WS] Connected');
        flushQueue();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Check if it's a command response
          if (data.id && pendingRef.current.has(data.id)) {
            const { resolve, reject, timer } = pendingRef.current.get(data.id);
            clearTimeout(timer);
            pendingRef.current.delete(data.id);
            if (data.status === 'error') {
              reject(new Error(data.error || 'Command failed'));
            } else {
              resolve(data);
            }
            return;
          }

          // Dispatch to event listeners
          const type = data.type;
          if (type && listenersRef.current.has(type)) {
            listenersRef.current.get(type).forEach((cb) => cb(data));
          }
        } catch (err) {
          console.error('[WS] Parse error:', err);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        wsRef.current = null;
        // Auto-reconnect after 3s
        reconnectTimerRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error('[WS] Error:', err);
      };
    } catch (err) {
      console.error('[WS] Connection error:', err);
      reconnectTimerRef.current = setTimeout(connect, 3000);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      console.log('[WS] Socket not open, queuing message');
      queueRef.current.push(data);
    }
  }, []);

  const watchServer = useCallback((serverId) => {
    send({ type: 'watch', server_id: serverId });
  }, [send]);

  const unwatchServer = useCallback((serverId) => {
    send({ type: 'unwatch', server_id: serverId });
  }, [send]);

  const sendCommand = useCallback((serverId, action, params = {}) => {
    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID();
      const timer = setTimeout(() => {
        pendingRef.current.delete(id);
        reject(new Error('Command timed out (30s)'));
      }, 30000);

      pendingRef.current.set(id, { resolve, reject, timer });
      send({ type: 'command', id, server_id: serverId, action, params });
    });
  }, [send]);

  const on = useCallback((eventType, callback) => {
    if (!listenersRef.current.has(eventType)) {
      listenersRef.current.set(eventType, new Set());
    }
    listenersRef.current.get(eventType).add(callback);
    return () => {
      listenersRef.current.get(eventType)?.delete(callback);
    };
  }, []);

  return { connected, watchServer, unwatchServer, sendCommand, on, send };
}
