import { Outlet } from 'react-router-dom';
import TopNav from './TopNav';
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
      
      {/* Main Content */}
      <main className="pt-24 pb-12 px-6 md:px-12">
        <Outlet />
      </main>
    </div>
  );
}
