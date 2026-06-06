import { useState, useEffect } from 'react';

/**
 * True when the app is running as an installed PWA (iOS "standalone" home-screen
 * app or any display-mode: standalone context). Used to scope the native
 * iOS-style Server module redesign to the PWA without affecting the web view.
 */
function detect() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    window.matchMedia?.('(display-mode: fullscreen)').matches === true ||
    window.navigator.standalone === true // iOS Safari legacy flag
  );
}

export function useIsPWA() {
  const [isPWA, setIsPWA] = useState(detect);

  useEffect(() => {
    const mq = window.matchMedia('(display-mode: standalone)');
    const handler = () => setIsPWA(detect());
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  return isPWA;
}

export default useIsPWA;
