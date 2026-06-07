import { useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useNotification } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

export default function AlertsListener() {
  const { on } = useWebSocket();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    // We only need to listen to 'alert_fired' globally since we want toasts.
    const unsubFired = on('alert_fired', (data) => {
      // Show toast
      showToast(`⚠ ${data.rule_name} on ${data.server_name}`, 'warning', 8000);
    });

    return () => {
      unsubFired();
    };
  }, [on, showToast]);

  return null;
}
