import { Outlet } from 'react-router-dom';
import TopNav from './TopNav';
import BottomNav from './BottomNav';
import { useTheme } from '../../context/ThemeContext';

export default function Layout() {
  const { theme } = useTheme();
  return (
    <div
      data-theme={theme === 'light' ? 'light' : undefined}
      className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)]"
    >
      {/* Fixed Top Navigation */}
      <TopNav />

      {/* Main Content. Top padding clears the fixed header + iOS safe area;
          extra bottom padding on mobile clears the fixed bottom nav. */}
      <main
        className="pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-12 px-3 sm:px-5 md:px-12"
        style={{ paddingTop: 'calc(var(--total-header) + 1rem)' }}
      >
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation (Instagram-style) */}
      <BottomNav />
    </div>
  );
}
