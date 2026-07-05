import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Server, ArrowLeft, Sun, Moon, Rocket, Building2, HardDrive,
  Globe, ShieldCheck, FileText, LifeBuoy, Users, ScrollText,
  Radio, Lock, Palette, HelpCircle, BookOpen, Copy, Check,
  Info, AlertTriangle, Lightbulb, ChevronRight, Terminal
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import useSEO from '../hooks/useSEO';

/* ─────────────────────────────────────────────────────────────────
   DOCUMENTATION
   A guide-style manual for using ServerDeck. For the endpoint-level
   contract, see the API Reference page (/api-reference).
   ───────────────────────────────────────────────────────────────── */

/* ── Reusable bits ───────────────────────────────────────────────── */
function CodeBlock({ code, label = 'shell' }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard unavailable */ }
  };
  return (
    <div className="rounded-xl border border-white/8 overflow-hidden my-3" style={{ background: 'var(--bg-card-hover)' }}>
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</span>
        <button onClick={copy} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:text-[var(--text-primary)] transition-colors">
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="px-4 py-3 overflow-x-auto custom-scrollbar text-[12px] leading-relaxed font-mono text-gray-300 whitespace-pre">{code}</pre>
    </div>
  );
}

const CALLOUT_STYLES = {
  note:    { icon: Info,          cls: 'border-sky-500/25 bg-sky-500/5',     ic: 'text-sky-400',    label: 'Note' },
  tip:     { icon: Lightbulb,     cls: 'border-emerald-500/25 bg-emerald-500/5', ic: 'text-emerald-400', label: 'Tip' },
  warning: { icon: AlertTriangle, cls: 'border-amber-500/25 bg-amber-500/5',  ic: 'text-amber-400',  label: 'Important' },
};

function Callout({ type = 'note', title, children }) {
  const s = CALLOUT_STYLES[type] ?? CALLOUT_STYLES.note;
  const Icon = s.icon;
  return (
    <div className={`rounded-2xl border p-4 my-4 flex gap-3 ${s.cls}`}>
      <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${s.ic}`} />
      <div className="text-sm text-gray-400 leading-relaxed">
        <span className={`font-bold ${s.ic}`}>{title ?? s.label}. </span>
        {children}
      </div>
    </div>
  );
}

function Steps({ items }) {
  return (
    <ol className="space-y-3 my-4">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-black flex items-center justify-center mt-0.5">
            {i + 1}
          </span>
          <div className="text-sm text-gray-400 leading-relaxed pt-0.5">{item}</div>
        </li>
      ))}
    </ol>
  );
}

function P({ children }) {
  return <p className="text-sm text-gray-400 leading-relaxed my-3">{children}</p>;
}
function H3({ children }) {
  return <h3 className="text-base font-black text-[var(--text-primary)] tracking-tight mt-6 mb-1">{children}</h3>;
}
function Term({ children }) {
  return <code className="font-mono text-[12px] text-[var(--text-primary)] bg-white/5 border border-white/8 rounded px-1.5 py-0.5">{children}</code>;
}

/* ── Roles table ─────────────────────────────────────────────────── */
const ROLES = [
  { role: 'Platform Owner', scope: 'Platform', can: 'Create and delete organizations (tenants) and bootstrap the platform. Has no tenant data of their own.' },
  { role: 'Owner', scope: 'Workspace', can: 'Full control of a workspace: servers, sites, billing, team, and the support desk. Can create accounts directly.' },
  { role: 'Admin', scope: 'Workspace', can: 'Manage servers, sites and team members, triage and resolve tickets. Cannot remove the owner.' },
  { role: 'Support', scope: 'Workspace', can: 'Access the Support Desk only. Sees and replies to tickets, can post internal notes; no access to servers.' },
  { role: 'Member', scope: 'Workspace', can: 'Day-to-day operator. Views the fleet and raises support tickets.' },
];

/* ── Section content ─────────────────────────────────────────────── */
const SECTIONS = [
  {
    id: 'introduction', title: 'Introduction', icon: BookOpen,
    body: (
      <>
        <P>
          <span className="font-bold text-[var(--text-primary)]">ServerDeck</span> is a modern control
          panel for Linux infrastructure. It lets a team register servers, host websites and
          backend services on them, issue SSL certificates, tail logs, and run a built-in support
          desk — all from one interface, with live updates over a realtime connection.
        </P>
        <P>This guide explains the concepts and day-to-day workflows. If you are looking for the exact
          request and response shapes of the underlying HTTP and WebSocket API, head to the{' '}
          <Link to="/api-reference" className="text-primary-400 font-semibold hover:underline">API Reference</Link>.
        </P>
        <Callout type="note" title="Who this is for">
          Operators managing a fleet of servers, support agents handling customer issues, and
          platform owners running ServerDeck for multiple organizations.
        </Callout>
      </>
    ),
  },
  {
    id: 'getting-started', title: 'Getting Started', icon: Rocket,
    body: (
      <>
        <P>Getting up and running takes a few minutes.</P>
        <Steps items={[
          <>Create your account, or accept an email invitation from a teammate. New sign-ups become the <Term>owner</Term> of a fresh workspace.</>,
          <>Sign in. Your session token is stored locally and refreshed automatically; you stay signed in until you log out or the token expires.</>,
          <>Add your first server and run its install command on the target host to enrol it (see <span className="font-semibold text-[var(--text-primary)]">Servers</span>).</>,
          <>Create a site on that server — a static frontend or a reverse-proxied backend (see <span className="font-semibold text-[var(--text-primary)]">Sites</span>).</>,
          <>Invite your team and assign roles from <span className="font-semibold text-[var(--text-primary)]">Settings → Team</span>.</>,
        ]} />
        <Callout type="tip">
          The left sidebar adapts to your role. Support agents see only the Support Desk; owners and
          admins see the full console.
        </Callout>
      </>
    ),
  },
  {
    id: 'organizations', title: 'Organizations & Tenancy', icon: Building2,
    body: (
      <>
        <P>
          ServerDeck is multi-tenant. Each <span className="font-bold text-[var(--text-primary)]">organization</span> is
          an isolated workspace with its own servers, sites, team and tickets. A
          <span className="font-bold text-[var(--text-primary)]"> platform owner</span> administers the
          ServerDeck deployment itself and provisions organizations.
        </P>
        <H3>Creating an organization</H3>
        <P>From the Organizations screen, a platform owner provides the organization name, a unique
          short key (slug), a primary domain, and the credentials for the organization's first owner
          account. That owner can then invite the rest of their team.</P>
        <Callout type="note">
          Platform owners do not have servers or tickets of their own — they only manage the list of
          organizations on the platform.
        </Callout>
      </>
    ),
  },
  {
    id: 'servers', title: 'Servers', icon: HardDrive,
    body: (
      <>
        <P>A <span className="font-bold text-[var(--text-primary)]">server</span> represents a Linux host
          under management. Servers can be grouped into nested <span className="font-bold text-[var(--text-primary)]">folders</span> for
          organization, and each shows a live online/offline indicator.</P>
        <H3>Enrolling a host</H3>
        <Steps items={[
          <>Click <span className="font-semibold text-[var(--text-primary)]">+ Add Server</span>, give it a name, and choose a folder (optional).</>,
          <>ServerDeck generates a one-time install command. Copy it.</>,
          <>SSH into your host and run the command as root — it installs the agent and enrols the machine.</>,
          <>Within moments the server's status flips to <span className="text-emerald-400 font-semibold">online</span> and live metrics begin streaming.</>,
        ]} />
        <CodeBlock label="run on the target host" code={`curl -sSL https://serverdeck.dynamiqqr.com/install.sh | bash -s <enrol-token>`} />
        <Callout type="warning">
          Treat the install command as a secret — it contains a one-time enrolment token tied to your
          workspace. Regenerate the server if a token is exposed.
        </Callout>
        <H3>Organizing with folders</H3>
        <P>Folders can be nested arbitrarily. Drag-free moves are available: re-parent a folder or move
          a server into a folder at any time. Deleting a folder does not delete the servers inside —
          they fall back to the root.</P>
      </>
    ),
  },
  {
    id: 'sites', title: 'Sites', icon: Globe,
    body: (
      <>
        <P>A <span className="font-bold text-[var(--text-primary)]">site</span> is a web app hosted on one
          of your servers. ServerDeck configures the web server (virtual host, routing) for you.
          There are two kinds:</P>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="flex items-center gap-2 mb-2"><Globe className="w-4 h-4 text-emerald-400" /><span className="text-sm font-black text-[var(--text-primary)]">Frontend</span></div>
            <p className="text-xs text-gray-400 leading-relaxed">Static sites and single-page apps served from a build/root directory. Ideal for React, Vue, or plain HTML.</p>
          </div>
          <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4">
            <div className="flex items-center gap-2 mb-2"><Server className="w-4 h-4 text-violet-400" /><span className="text-sm font-black text-[var(--text-primary)]">Backend</span></div>
            <p className="text-xs text-gray-400 leading-relaxed">Reverse-proxied services. ServerDeck routes the domain to your app's local <Term>upstream_port</Term> from its <Term>working_directory</Term>.</p>
          </div>
        </div>
        <H3>Creating a site</H3>
        <P>Pick a server, enter the domain, choose the type, and — for backends — the upstream port and
          working directory. Provisioning runs live over the realtime command channel, so you'll see
          each step (DNS check, vhost write, reload) complete in real time.</P>
        <Callout type="tip">
          Point your domain's DNS A record at the server's IP before provisioning so the certificate
          step can validate the domain.
        </Callout>
      </>
    ),
  },
  {
    id: 'ssl', title: 'SSL & HTTPS', icon: ShieldCheck,
    body: (
      <>
        <P>Every site can be secured with a TLS certificate. ServerDeck requests and installs
          certificates and keeps the HTTPS configuration in sync with your site settings.</P>
        <Steps items={[
          <>Ensure the site's domain resolves to the server (valid DNS A/AAAA record).</>,
          <>Enable SSL for the site from the SSL Manager.</>,
          <>ServerDeck validates the domain, issues the certificate, and reloads the web server.</>,
        ]} />
        <Callout type="warning">
          Certificate issuance fails if the domain does not yet point to the host. Fix DNS and retry —
          there is no penalty for re-running issuance.
        </Callout>
      </>
    ),
  },
  {
    id: 'logs', title: 'Logs & Monitoring', icon: FileText,
    body: (
      <>
        <P>The Log Viewer tails files directly from a server. Choose a <Term>source</Term> (such as
          nginx, system, or your app), the specific log, and how many trailing lines to load.</P>
        <P>Server cards and the Dashboard surface live status and aggregate metrics — total servers,
          how many are online, site counts and open tickets — refreshed over the realtime connection.</P>
        <Callout type="note">
          Live metrics for a server stream only while you are watching it. Opening a server's detail
          view subscribes automatically and unsubscribes when you leave.
        </Callout>
      </>
    ),
  },
  {
    id: 'support-desk', title: 'Support Desk (Tickets)', icon: LifeBuoy,
    body: (
      <>
        <P>The built-in Support Desk is a full ticketing system. Anyone in the workspace can raise a
          ticket; support staff triage and resolve them in a chat-style thread with live updates.</P>
        <H3>Statuses & priorities</H3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Statuses</p>
            <ul className="space-y-1.5 text-sm text-gray-400">
              <li><span className="text-emerald-400 font-semibold">Open</span> — newly raised, awaiting triage</li>
              <li><span className="text-sky-400 font-semibold">In Progress</span> — being worked on</li>
              <li><span className="text-orange-400 font-semibold">Waiting on Customer</span> — needs a reply</li>
              <li><span className="text-teal-300 font-semibold">Resolved</span> — fix delivered</li>
              <li><span className="text-gray-500 font-semibold">Closed</span> — archived (can be re-opened)</li>
            </ul>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Priorities</p>
            <ul className="space-y-1.5 text-sm text-gray-400">
              <li><span className="text-slate-400 font-semibold">Low</span></li>
              <li><span className="text-indigo-400 font-semibold">Medium</span> — the default</li>
              <li><span className="text-amber-400 font-semibold">High</span></li>
              <li><span className="text-rose-400 font-semibold">Urgent</span></li>
            </ul>
          </div>
        </div>
        <H3>Replies, internal notes & assignment</H3>
        <P>Replies are visible to the customer. Support staff can instead post an
          <span className="font-semibold text-amber-400"> internal note</span> — only the team sees it.
          Tickets can be assigned to a specific agent, and escalated to an owner or admin, which also
          bumps the priority. Closed tickets lock the thread until re-opened.</P>
        <Callout type="tip">
          New messages and status changes arrive instantly for everyone viewing the ticket — no refresh
          needed, thanks to the realtime channel.
        </Callout>
      </>
    ),
  },
  {
    id: 'team-roles', title: 'Team & Roles', icon: Users,
    body: (
      <>
        <P>Manage your team from <span className="font-semibold text-[var(--text-primary)]">Settings → Team</span>.
          Owners and admins can invite teammates by email or, for owners, create accounts directly with
          a temporary password.</P>
        <div className="rounded-2xl border border-white/8 overflow-hidden my-4">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/8" style={{ background: 'var(--bg-card-hover)' }}>
                <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Role</th>
                <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Scope</th>
                <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">What they can do</th>
              </tr>
            </thead>
            <tbody>
              {ROLES.map((r) => (
                <tr key={r.role} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 font-bold text-[var(--text-primary)] whitespace-nowrap">{r.role}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{r.scope}</td>
                  <td className="px-4 py-3 text-gray-400 leading-relaxed">{r.can}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Callout type="warning">
          Removing an operator revokes their access immediately and cannot be undone. They lose all
          sessions instantly.
        </Callout>
      </>
    ),
  },
  {
    id: 'activity', title: 'Activity & Audit', icon: ScrollText,
    body: (
      <>
        <P>Every significant action — creating or deleting servers, changing sites, team changes — is
          recorded in the audit log. View a workspace-wide stream from the Activity page, or scope it to
          a single server from that server's detail view.</P>
        <Callout type="note">
          Audit entries capture who did what and when, giving you an accountable trail for compliance
          and debugging.
        </Callout>
      </>
    ),
  },
  {
    id: 'realtime', title: 'Realtime Updates', icon: Radio,
    body: (
      <>
        <P>ServerDeck keeps a single WebSocket connection open while you use the app. It powers live
          server metrics, instant ticket messages, and streaming progress for long-running operations
          like site provisioning.</P>
        <P>The connection authenticates with your session token, auto-reconnects if dropped, and queues
          any actions made while briefly offline so nothing is lost.</P>
        <Callout type="tip">
          Building your own integration? The realtime message formats are documented in the{' '}
          <Link to="/api-reference#realtime" className="text-primary-400 font-semibold hover:underline">API Reference → Realtime</Link> section.
        </Callout>
      </>
    ),
  },
  {
    id: 'security', title: 'Security', icon: Lock,
    body: (
      <>
        <P>Sessions are authenticated with signed JWTs. The token is attached to every request and
          validated on the realtime connection. An expired or invalid token signs you out automatically
          and returns you to the login screen.</P>
        <ul className="space-y-2 my-4 text-sm text-gray-400">
          <li className="flex gap-2"><ChevronRight className="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" /> Role-based access controls what each operator can see and do.</li>
          <li className="flex gap-2"><ChevronRight className="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" /> Server enrolment uses one-time tokens; rotate by re-creating a server.</li>
          <li className="flex gap-2"><ChevronRight className="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" /> All traffic is served over HTTPS / WSS.</li>
          <li className="flex gap-2"><ChevronRight className="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" /> The audit log provides an accountable record of changes.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'appearance', title: 'Appearance', icon: Palette,
    body: (
      <>
        <P>The application ships in a dark theme by default and includes an iOS-inspired light theme.
          Toggle between them with the sun/moon button in the top-right of the app (and on this page).
          Your choice is remembered across sessions.</P>
        <Callout type="note">
          The theme applies to the application and these docs. Sign-in and marketing pages always use
          the dark theme.
        </Callout>
      </>
    ),
  },
  {
    id: 'faq', title: 'FAQ & Troubleshooting', icon: HelpCircle,
    body: (
      <>
        <H3>My server stays offline after running the install command</H3>
        <P>Confirm the command ran without errors and that the host can reach the ServerDeck endpoint
          over HTTPS/WSS (outbound 443). Firewalls blocking outbound traffic are the most common cause.</P>
        <H3>SSL issuance failed</H3>
        <P>The domain must resolve to the server before a certificate can be issued. Verify the DNS A
          record, wait for propagation, and retry.</P>
        <H3>A teammate can't see servers</H3>
        <P>Check their role. <Term>support</Term> accounts are intentionally limited to the Support Desk
          and cannot view servers.</P>
        <H3>I was logged out unexpectedly</H3>
        <P>Your session token expired or was invalidated. Simply sign in again.</P>
        <Callout type="tip" title="Still stuck?">
          Raise a ticket in the Support Desk — our team gets it in real time.
        </Callout>
      </>
    ),
  },
];

/* ── Page ────────────────────────────────────────────────────────── */
export default function Documentation() {
  useSEO({
    title: 'Documentation & User Guides',
    description: 'Get started with ServerDeck. Read guides on installing the agent, managing Nginx sites, SSL certificates, firewalls, and PM2 processes.',
    keywords: ['serverdeck documentation', 'server installation guide', 'nginx configuration guide', 'ssl setup']
  });

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
        <div className="max-w-[1100px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <ArrowLeft className="w-4 h-4 text-gray-500 group-hover:text-[var(--text-primary)] transition-colors" />
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <Server className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-black uppercase tracking-tight">ServerDeck</span>
            <span className="text-sm font-bold text-gray-500 hidden sm:inline">/ Docs</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/api-reference" className="hidden sm:inline text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[var(--text-primary)] transition-colors">
              API Reference
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
        </div>
      </header>

      <div className="max-w-[1100px] mx-auto px-6 flex gap-10">
        {/* TOC */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <nav className="sticky top-24 py-10 space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 px-3">Contents</p>
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              return (
                <a key={s.id} href={`#${s.id}`} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-gray-400 hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors">
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  {s.title}
                </a>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 py-10">
          {/* Hero */}
          <section className="space-y-5 mb-14">
            <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary-400 bg-primary-500/10 border border-primary-500/20 rounded-full px-3 py-1">
              <BookOpen className="w-3 h-3" /> Documentation
            </div>
            <h1 className="text-4xl font-black tracking-tight">ServerDeck Documentation</h1>
            <p className="text-base text-gray-400 leading-relaxed max-w-2xl">
              Everything you need to manage your fleet — from enrolling your first server and deploying
              sites to running the support desk and securing your workspace.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <a href="#getting-started" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold uppercase tracking-widest transition-colors shadow-lg shadow-primary-500/20">
                <Rocket className="w-3.5 h-3.5" /> Get started
              </a>
              <Link to="/api-reference" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/8 hover:border-white/15 text-gray-300 text-xs font-bold uppercase tracking-widest transition-colors">
                <Terminal className="w-3.5 h-3.5" /> API Reference
              </Link>
            </div>
          </section>

          {/* Sections */}
          <div className="space-y-14">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              return (
                <section key={s.id} id={s.id} className="scroll-mt-24">
                  <div className="flex items-center gap-3 border-b border-white/8 pb-4 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-primary-400" />
                    </div>
                    <h2 className="text-2xl font-black tracking-tight">{s.title}</h2>
                  </div>
                  {s.body}
                </section>
              );
            })}
          </div>

          <footer className="border-t border-white/8 mt-16 pt-8 pb-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500">
            <span>© 2026 ServerDeck</span>
            <Link to="/" className="hover:text-[var(--text-primary)] transition-colors flex items-center gap-1.5">
              <Terminal className="w-3 h-3" /> Back to site
            </Link>
          </footer>
        </main>
      </div>
    </div>
  );
}
