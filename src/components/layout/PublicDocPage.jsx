import { Link } from 'react-router-dom';
import { Box, ArrowLeft, Sun, Moon, Terminal } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

/* ─────────────────────────────────────────────────────────────────
   PublicDocPage — shared chrome for the public company / legal pages
   (About, Security, Privacy Policy, Terms). Single-column prose with
   the same header, theme toggle and footer as the docs pages.
   ───────────────────────────────────────────────────────────────── */
export default function PublicDocPage({ eyebrow, title, subtitle, updated, children }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div
      data-theme={theme === 'light' ? 'light' : undefined}
      className="min-h-screen"
      style={{ background: 'var(--bg-main)', color: 'var(--text-primary)' }}
    >
      {/* Top bar */}
      <header
        className="sticky top-0 z-50 border-b border-white/8 backdrop-blur-xl"
        style={{ background: 'color-mix(in srgb, var(--bg-main) 80%, transparent)' }}
      >
        <div className="max-w-[820px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <ArrowLeft className="w-4 h-4 text-gray-500 group-hover:text-[var(--text-primary)] transition-colors" />
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <Box className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-black uppercase tracking-tight">ServerDeck</span>
            {eyebrow && <span className="text-sm font-bold text-gray-500 hidden sm:inline">/ {eyebrow}</span>}
          </Link>
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/8 bg-white/5 text-gray-400 hover:text-[var(--text-primary)] hover:bg-white/10 transition-all"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[820px] mx-auto px-6 py-12">
        <div className="mb-12">
          {eyebrow && (
            <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary-400 bg-primary-500/10 border border-primary-500/20 rounded-full px-3 py-1 mb-5">
              {eyebrow}
            </div>
          )}
          <h1 className="text-4xl font-black tracking-tight">{title}</h1>
          {subtitle && <p className="text-base text-gray-400 leading-relaxed mt-4 max-w-2xl">{subtitle}</p>}
          {updated && <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mt-5">Last updated · {updated}</p>}
        </div>

        <article>{children}</article>

        <footer className="border-t border-white/8 mt-16 pt-8 pb-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500">
          <span>© 2026 ServerDeck</span>
          <Link to="/" className="hover:text-[var(--text-primary)] transition-colors flex items-center gap-1.5">
            <Terminal className="w-3 h-3" /> Back to site
          </Link>
        </footer>
      </main>
    </div>
  );
}

/* ── Prose helpers ───────────────────────────────────────────────── */
export function Section({ title, children }) {
  return (
    <section className="mb-10">
      {title && <h2 className="text-xl font-black tracking-tight mb-3 border-b border-white/8 pb-3">{title}</h2>}
      {children}
    </section>
  );
}

export function P({ children }) {
  return <p className="text-sm text-gray-400 leading-relaxed my-3">{children}</p>;
}

export function UL({ items }) {
  return (
    <ul className="space-y-2 my-3">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2.5 text-sm text-gray-400 leading-relaxed">
          <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary-400 flex-shrink-0" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}
