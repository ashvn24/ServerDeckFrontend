import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/* Resets the window scroll position to the top whenever the route's
   pathname changes. Hash changes (in-page anchors) are left alone so
   anchor links inside a page still work. */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
