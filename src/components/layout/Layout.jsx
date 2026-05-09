import { Outlet } from 'react-router-dom';
import TopNav from './TopNav';

export default function Layout() {
  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)]">
      {/* Fixed Top Navigation */}
      <TopNav />
      
      {/* Main Content */}
      <main className="pt-24 pb-12 px-6 md:px-12 max-w-[1400px] mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
