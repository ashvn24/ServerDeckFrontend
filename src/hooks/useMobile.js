import { useState, useEffect } from 'react';

/**
 * Returns true when the viewport is ≤ 767px (mobile breakpoint).
 * Used to gate mobile-specific JSX branches in pages.
 * Pure CSS media queries (Tailwind sm:/md:) are preferred; use this hook
 * only when conditional JSX rendering is needed.
 */
function detectMobile() {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 767;
}

export function useMobile() {
  const [isMobile, setIsMobile] = useState(detectMobile);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = () => setIsMobile(mq.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  return isMobile;
}

export default useMobile;
