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

      {/* Main Content. Extra bottom padding on mobile clears the fixed bottom nav. */}
      <main className="pt-20 md:pt-24 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-12 px-4 sm:px-6 md:px-12">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation (Instagram-style) */}
      <BottomNav />
    </div>
  );
}
