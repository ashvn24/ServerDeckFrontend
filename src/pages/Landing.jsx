import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Server, Shield, Terminal, Activity, Lock, ArrowRight,
  ChevronDown, CheckCircle2, Cpu, Zap, BarChart3, Database,
  Cloud, Globe, AlertTriangle, Settings, Monitor, Bell,
  Check, Layers, GitBranch, HardDrive, RefreshCw, Eye,
  Wifi, Key, Package, Volume2, VolumeX, Loader2
} from 'lucide-react';
import { authAPI } from '../api/endpoints';
import './Landing.css';

/* ── Small helpers ── */
const Star = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const Stars = ({ n = 5 }) => (
  <div className="ld-stars">
    {Array.from({ length: n }).map((_, i) => <Star key={i} />)}
  </div>
);

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   RADIAL HERO VISUAL
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const RadialVisual = () => (
  <div className="ld-radial-wrap">
    <div className="ld-radial-ring" />
    <div className="ld-radial-ring" />
    <div className="ld-radial-ring" />

    <div className="ld-orbit-track">
      <div className="ld-orbit-dot" />
    </div>

    <div className="ld-radial-core">
      <div className="ld-radial-core-icon">
        <Server size={28} />
      </div>
    </div>

    {/* Floating stat cards */}
    <div className="ld-stat-card" style={{ top: '8%', right: '0%' }}>
      <div className="ld-stat-num">99.99%</div>
      <div className="ld-stat-lbl">Uptime SLA</div>
      <div className="ld-stat-badge">
        <CheckCircle2 size={10} /> Verified
      </div>
    </div>

    <div className="ld-stat-card" style={{ top: '52%', right: '-4%' }}>
      <div className="ld-stat-num">1.2k+</div>
      <div className="ld-stat-lbl">Nodes Managed</div>
      <div className="ld-stat-badge">
        <Activity size={10} /> Live
      </div>
    </div>

    <div className="ld-stat-card" style={{ bottom: '4%', left: '4%' }}>
      <div className="ld-stat-num">&lt;3ms</div>
      <div className="ld-stat-lbl">Avg Latency</div>
      <div className="ld-stat-badge">
        <Zap size={10} /> Optimised
      </div>
    </div>
  </div>
);

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MINI CHART
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const MiniChart = ({ bars }) => (
  <div className="ld-chart">
    {bars.map((h, i) => (
      <div
        key={i}
        className={`ld-chart-bar${h > 70 ? ' ld-high' : ''}`}
        style={{ '--ld-bar-h': `${h}%`, height: `${h}%`, animationDelay: `${i * 0.06}s` }}
      />
    ))}
  </div>
);

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ORBIT VISUAL
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const ORBIT_NODES = [
  { icon: <Globe size={18} />,    label: 'Nginx',    angle: 270, r: 110 },
  { icon: <Database size={18} />, label: 'DB',       angle: 45,  r: 110 },
  { icon: <Package size={18} />,  label: 'PM2',      angle: 135, r: 110 },
  { icon: <Key size={18} />,      label: 'SSL',      angle: 225, r: 110 },
];

const OrbitVisual = () => (
  <div className="ld-orbit-visual">
    <div className="ld-orbit-ring-1" />
    <div className="ld-orbit-ring-2" />
    <div className="ld-orbit-center">
      <Server size={36} color="#22c55e" />
    </div>
    {ORBIT_NODES.map(({ icon, label, angle, r }) => {
      const rad = (angle * Math.PI) / 180;
      const x = Math.cos(rad) * r;
      const y = Math.sin(rad) * r;
      return (
        <div
          key={label}
          className="ld-orbit-node"
          style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
          title={label}
        >
          {icon}
        </div>
      );
    })}
  </div>
);

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   FAQ ITEM
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const FaqItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={`ld-faq-item${open ? ' ld-open' : ''}`}>
      <button className="ld-faq-q" onClick={() => setOpen(o => !o)}>
        {q}
        <span className="ld-faq-chevron"><ChevronDown size={14} /></span>
      </button>
      <div className="ld-faq-a">{a}</div>
    </div>
  );
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MAIN COMPONENT
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const Landing = () => {
  const [scrolled, setScrolled] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const laptopVideoRef = useRef(null);
  const mobileVideoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);

  const toggleMute = () => {
    if (laptopVideoRef.current) {
      laptopVideoRef.current.muted = !laptopVideoRef.current.muted;
      setIsMuted(laptopVideoRef.current.muted);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.play().catch(e => console.log('Autoplay prevented:', e));
        } else {
          entry.target.pause();
        }
      });
    }, { threshold: 0.3 });

    if (laptopVideoRef.current) observer.observe(laptopVideoRef.current);
    if (mobileVideoRef.current) observer.observe(mobileVideoRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Smooth scroll to section anchors
  const scrollTo = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setIsSubmitting(true);
    setSubmitError('');
    try {
      await authAPI.joinWaitlist({ email });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.response?.data?.detail || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    {
      icon: <Terminal size={22} />,
      title: 'Web SSH Terminal',
      desc: 'Full-featured browser-based terminal. Zero client setup, end-to-end encrypted, with persistent session recovery.',
    },
    {
      icon: <Shield size={22} />,
      title: 'Firewall & SSL',
      desc: 'One-click UFW rule management and automated Let\'s Encrypt SSL provisioning across all your servers.',
    },
    {
      icon: <Activity size={22} />,
      title: 'Real-time Telemetry',
      desc: 'Sub-second CPU, RAM, disk, and network monitoring with historical usage analytics and anomaly alerts.',
    },
    {
      icon: <Layers size={22} />,
      title: 'App Lifecycle',
      desc: 'Full PM2, Systemd, and static site management. Deploy, restart, scale, and rollback with one click.',
    },
  ];

  const testimonials = [
    {
      logo: 'Infrastack',
      quote: '"Server Deck eliminated our tool sprawl overnight. We went from juggling 6 SSH windows to managing 40 nodes from a single dashboard. The SSL automation alone saved us hours weekly."',
      name: 'Rajan M.',
      role: 'Lead SRE, Infrastack',
      avatar: 'RM',
      color: '#16a34a',
    },
    {
      logo: 'DevCore',
      quote: '"The real-time monitoring caught a memory leak before our users noticed. The alert system is genuinely faster than anything else we\'ve tried. Highly recommended for any growing team."',
      name: 'Priya S.',
      role: 'CTO, DevCore Systems',
      avatar: 'PS',
      color: '#0d9488',
    },
    {
      logo: 'CloudNest',
      quote: '"Onboarding new servers takes 30 seconds now. The web terminal is indistinguishable from native SSH. Server Deck is the control panel we always wished existed."',
      name: 'Alex T.',
      role: 'DevOps Engineer, CloudNest',
      avatar: 'AT',
      color: '#0891b2',
    },
  ];

  const faqs = [
    { q: 'What is Server Deck?', a: 'Server Deck is a unified infrastructure control panel that lets you manage all your Linux servers — SSH, Nginx, SSL, PM2 apps, logs, and firewall rules — from a single, beautiful web interface.' },
    { q: 'How does Server Deck connect to my server?', a: 'You deploy a lightweight agent on any Ubuntu/Debian server with a single command. The agent communicates via a secure, encrypted WebSocket channel — no open ports, no extra firewall rules required.' },
    { q: 'Is it suitable for small teams or solo developers?', a: 'Absolutely. Server Deck scales from a single VPS to a fleet of hundreds. The interface is designed to be powerful for advanced users yet approachable for developers who just want things to work.' },
    { q: 'What does the monitoring dashboard show?', a: 'You get real-time CPU, RAM, disk usage, network I/O, running processes, Nginx site status, SSL certificate expiry, and application health — all in one view with configurable alerts.' },
    { q: 'Does Server Deck support team collaboration?', a: 'Yes. You can invite team members with granular role-based access control, and every action is logged in a full audit trail so you always know who changed what and when.' },
  ];

  const alerts = [
    { color: 'green',  title: 'Deployment Successful',    msg: 'api-server v2.4.1 deployed to prod-01 without errors.', time: 'just now' },
    { color: 'red',    title: 'High Memory Usage',        msg: 'prod-03 RAM at 91%. Consider scaling or restarting.', time: '2m ago' },
    { color: 'yellow', title: 'SSL Renewal Scheduled',    msg: 'cert for api.example.com renews in 14 days.', time: '8m ago' },
    { color: 'green',  title: 'Firewall Rule Applied',    msg: 'Port 3000 blocked on staging-01 via UFW policy.', time: '15m ago' },
  ];

  const tickerItems = ['Ubuntu 22.04', 'Nginx', 'PM2', 'Let\'s Encrypt', 'PostgreSQL', 'Node.js', 'Python', 'Redis', 'Docker', 'AWS EC2', 'DigitalOcean', 'Hetzner'];

  const chartBars = [35, 55, 48, 72, 60, 85, 42, 78, 65, 90, 55, 70, 38, 80];

  return (
    <div className="ld-root">

      {/* ── NAV ── */}
      <nav className={`ld-nav${scrolled ? ' ld-nav-scrolled' : ''}`}>
        <div className="ld-nav-inner">
          <div className="ld-logo">
            <div className="ld-logo-icon">
              <Server size={18} color="#000" />
            </div>
            <span className="ld-logo-text">Server Deck</span>
          </div>

          <div className="ld-nav-links">
            <a href="#features"     className="ld-nav-link" onClick={e => scrollTo(e, 'features')}>Features</a>
            <a href="#monitoring"   className="ld-nav-link" onClick={e => scrollTo(e, 'monitoring')}>Monitoring</a>
            <a href="#integrations" className="ld-nav-link" onClick={e => scrollTo(e, 'integrations')}>Integrations</a>
            <a href="#testimonials" className="ld-nav-link" onClick={e => scrollTo(e, 'testimonials')}>Reviews</a>
            <a href="#faq"          className="ld-nav-link" onClick={e => scrollTo(e, 'faq')}>FAQ</a>
          </div>

          <div className="ld-nav-actions">
            <Link to="/login" className="ld-btn-outline">Sign In</Link>
            <a href="#request" className="ld-btn-primary" onClick={e => scrollTo(e, 'request')}>
              Get Access <ArrowRight size={15} />
            </a>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: 'relative' }}>
        <div className="ld-hero-bg">
          <div className="ld-hero-bg-blob" />
        </div>

        <div className="ld-hero">
          <div className="ld-hero-text">
            <div className="ld-hero-tag">
              <span className="ld-hero-tag-dot" />
              Infrastructure Without Compromise
            </div>

            <h1 className="ld-hero-title">
              Your Servers.
              <br />
              <span className="ld-hero-title-accent">Total Control.</span>
              <br />
              One Window.
            </h1>

            <p className="ld-hero-sub">
              Server Deck is the modern control panel for Linux infrastructure.
              Manage SSH, Nginx, SSL, apps, and logs across your entire fleet —
              without ever opening a terminal again.
            </p>

            <div className="ld-hero-ctas">
              <a href="#request" className="ld-btn-primary">
                Request Early Access <ArrowRight size={16} />
              </a>
              <a href="#features" className="ld-btn-outline">See Features</a>
            </div>

            <div className="ld-hero-trust">
              <div className="ld-hero-avatars">
                {['AK','RS','PT','MN'].map((av, i) => (
                  <div className="ld-avatar" key={i} style={{ background: ['#16a34a','#0d9488','#0891b2','#7c3aed'][i] }}>
                    {av}
                  </div>
                ))}
              </div>
              <p className="ld-hero-trust-text">
                Trusted by <strong>500+ engineers</strong> managing production fleets
              </p>
            </div>
          </div>

          <div className="ld-hero-visual">
            <RadialVisual />
          </div>
        </div>
      </section>

      {/* ── SHOWCASE ── */}
      <section className="ld-showcase-section">
        <div className="ld-container">
          <div className="ld-showcase-wrapper">
            <div className="ld-mobile-frame ld-mobile-1">
              <div className="ld-mobile-notch" />
              <video 
                ref={mobileVideoRef}
                src="https://d3cw4jhsg5snrz.cloudfront.net/LandingPage/Serverdeck_Dashboard_User_Guidepwa.mp4" 
                className="ld-mobile-video ld-desktop-only" 
                loop muted playsInline 
              />
              <img
                src="/app-dark.png"
                alt="Server Deck dark theme"
                className="ld-mobile-video ld-mobile-only"
              />
            </div>

            <div className="ld-laptop-frame">
              <div className="ld-laptop-lid">
                <div className="ld-laptop-camera" />
                <div className="ld-laptop-screen">
                  <video 
                    ref={laptopVideoRef}
                    src="https://d3cw4jhsg5snrz.cloudfront.net/LandingPage/Node_Provisioning_and_Management_Guide.mp4" 
                    className="ld-laptop-video" 
                    loop muted playsInline autoPlay
                  />
                  <button className="ld-mute-btn" onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'}>
                    {isMuted ? <VolumeX size={11} /> : <Volume2 size={11} />}
                  </button>
                </div>
              </div>
              <div className="ld-laptop-base">
                <div className="ld-laptop-hinge" />
              </div>
            </div>

            <div className="ld-mobile-frame ld-mobile-2">
              <div className="ld-mobile-notch" />
              <video 
                src="https://d3cw4jhsg5snrz.cloudfront.net/LandingPage/Serverdeck_Dashboard_User_Guidepwa.mp4" 
                className="ld-mobile-video ld-desktop-only" 
                loop muted playsInline 
              />
              <img
                src="/app-light.png"
                alt="Server Deck light theme"
                className="ld-mobile-video ld-mobile-only"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── TICKER ── */}
      <div className="ld-ticker-wrap">
        <p className="ld-ticker-label">Compatible with your entire stack</p>
        <div className="ld-ticker-track">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span className="ld-ticker-item" key={i}>
              <span className="ld-ticker-icon"><Check size={12} /></span>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── STATS STRIP ── */}
      <div className="ld-container" style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
        <div className="ld-stats-strip">
          {[
            { n: '99.99%', d: 'Uptime SLA' },
            { n: '1,200+', d: 'Servers Indexed' },
            { n: '<3ms',   d: 'Avg Panel Latency' },
            { n: 'RSA-256',d: 'Encrypted Comms' },
          ].map(s => (
            <div className="ld-stats-item" key={s.n}>
              <div className="ld-stats-num">{s.n}</div>
              <div className="ld-stats-desc">{s.d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section id="features" className="ld-section">
        <div className="ld-container">
          <div className="ld-text-center" style={{ marginBottom: '3.5rem' }}>
            <span className="ld-label">Core Capabilities</span>
            <h2 className="ld-section-title">
              We Shield Your Stack<br />Before Problems Strike.
            </h2>
            <p className="ld-section-sub" style={{ margin: '1rem auto 0' }}>
              Every tool you need to keep your servers healthy, secure, and performing — built into one unified panel.
            </p>
          </div>

          <div className="ld-features-grid">
            {features.map((f, i) => (
              <div className="ld-feature-card" key={i}>
                <div className="ld-feature-icon">{f.icon}</div>
                <h3 className="ld-feature-title">{f.title}</h3>
                <p className="ld-feature-desc">{f.desc}</p>
                <button className="ld-btn-ghost">
                  Learn More <ArrowRight size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ALERTS SECTION ── */}
      <section id="monitoring" className="ld-section ld-alert-section">
        <div className="ld-container">
          <div className="ld-grid-2" style={{ gap: '5rem' }}>

            {/* Text side */}
            <div>
              <span className="ld-label">Live Intelligence</span>
              <h2 className="ld-section-title">
                Your Fleet's Health—<br />Live Alerts, Anytime.
              </h2>
              <p className="ld-section-sub">
                Stay ahead of incidents. Server Deck streams real-time events
                from every node so you can act before your users even notice.
              </p>
              <div style={{ marginTop: '2.5rem' }}>
                <a href="#request" className="ld-btn-primary">Start Monitoring</a>
              </div>
            </div>

            {/* Alerts stack */}
            <div className="ld-alerts-stack">
              {alerts.map((a, i) => (
                <div className="ld-alert-card" key={i}>
                  <span className={`ld-alert-dot ${a.color}`} />
                  <div style={{ flex: 1 }}>
                    <div className="ld-alert-title">{a.title}</div>
                    <div className="ld-alert-msg">{a.msg}</div>
                  </div>
                  <span className="ld-alert-time">{a.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Monitor card row */}
          <div className="ld-grid-2" style={{ marginTop: '5rem', gap: '3rem' }}>
            <div className="ld-monitor-card">
              <div className="ld-monitor-card-title">Cluster Resource Overview</div>
              <div className="ld-monitor-card-sub">Aggregated metrics across all connected nodes</div>

              {[
                { l: 'CPU', v: 34, cls: '' },
                { l: 'RAM', v: 61, cls: 'amber' },
                { l: 'NET', v: 22, cls: 'violet' },
                { l: 'DSK', v: 48, cls: '' },
              ].map(m => (
                <div className="ld-metric-row" key={m.l}>
                  <span className="ld-metric-lbl">{m.l}</span>
                  <div className="ld-metric-bar-track">
                    <div className={`ld-metric-bar-fill ${m.cls}`} style={{ width: `${m.v}%` }} />
                  </div>
                  <span className="ld-metric-val">{m.v}%</span>
                </div>
              ))}

              <MiniChart bars={chartBars} />

              <div className="ld-server-pills" style={{ marginTop: '1.5rem' }}>
                {['prod-01','prod-02','staging-01','worker-03'].map(s => (
                  <span className="ld-server-pill" key={s}>
                    <span className="ld-server-pill-dot" />
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="ld-label">Security & Automation</span>
              <h3 className="ld-section-title" style={{ fontSize: '2rem' }}>
                Protect What Matters with Industry-Grade Controls.
              </h3>
              <p className="ld-section-sub">
                From UFW firewall policies to automated SSL renewal — Server Deck
                enforces best-practice security across your entire fleet, hands-free.
              </p>

              <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
                {[
                  { icon: <Lock size={20} />, title: 'Automated SSL Renewal', desc: 'Never worry about expired certs. We handle Let\'s Encrypt renewal 30 days early, every time.' },
                  { icon: <Shield size={20} />, title: 'Firewall Rule Engine', desc: 'Manage UFW rules visually. Block, allow, and audit traffic with zero CLI required.' },
                ].map(item => (
                  <div key={item.title} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ padding: '0.7rem', background: 'rgba(34,197,94,0.1)', borderRadius: '12px', color: '#22c55e', flexShrink: 0 }}>
                      {item.icon}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.3rem' }}>{item.title}</div>
                      <div style={{ fontSize: '0.82rem', color: '#6b7280', lineHeight: 1.6 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <button className="ld-btn-primary" style={{ marginTop: '2rem' }}>
                Learn More <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── INTEGRATIONS / ORBIT ── */}
      <section id="integrations" className="ld-section">
        <div className="ld-container">
          <div className="ld-grid-2" style={{ gap: '5rem' }}>
            <div>
              <span className="ld-label">Integrations</span>
              <h2 className="ld-section-title">
                One Panel.<br />Every Stack.
              </h2>
              <p className="ld-section-sub">
                Server Deck works everywhere your infrastructure lives — from bare-metal
                to cloud VMs — with zero vendor lock-in.
              </p>

              <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
                {[
                  { icon: <Globe size={18} />,    title: 'Nginx Site Management', desc: 'Create, edit, and toggle Nginx server blocks with a visual editor. No more manual conf files.' },
                  { icon: <Cpu size={18} />,       title: 'PM2 Process Control',   desc: 'Full lifecycle control for Node.js apps — start, stop, restart, and view logs in realtime.' },
                  { icon: <GitBranch size={18} />, title: 'Multi-Server Fleet',    desc: 'Connect unlimited servers. Switch context instantly. Manage everything from one place.' },
                ].map(item => (
                  <div key={item.title} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ padding: '0.7rem', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '12px', color: '#22c55e', flexShrink: 0 }}>
                      {item.icon}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '0.25rem' }}>{item.title}</div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280', lineHeight: 1.6 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <button className="ld-btn-ghost" style={{ marginTop: '2rem', fontSize: '0.88rem' }}>
                View All Integrations <ArrowRight size={14} />
              </button>
            </div>

            <OrbitVisual />
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="ld-section" style={{ background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="ld-container">
          <div className="ld-text-center" style={{ marginBottom: '3.5rem' }}>
            <span className="ld-label">Testimonials</span>
            <h2 className="ld-section-title">
              Trusted by Engineers.<br />Proven in Production.
            </h2>
            <p className="ld-section-sub" style={{ margin: '1rem auto 0' }}>
              Teams running critical infrastructure rely on Server Deck every day.
            </p>
          </div>

          <div className="ld-grid-3">
            {testimonials.map((t, i) => (
              <div className="ld-testi-card" key={i}>
                <div className="ld-testi-logo">
                  <div className="ld-testi-logo-icon">
                    <Server size={14} />
                  </div>
                  {t.logo}
                </div>

                <Stars />

                <p className="ld-testi-quote">{t.quote}</p>

                <div className="ld-testi-author">
                  <div className="ld-testi-avatar" style={{ background: t.color }}>{t.avatar}</div>
                  <div>
                    <div className="ld-testi-name">{t.name}</div>
                    <div className="ld-testi-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="ld-section">
        <div className="ld-container">
          <div className="ld-text-center">
            <span className="ld-label">FAQs</span>
            <h2 className="ld-section-title">Frequently Asked<br />Questions</h2>
            <p className="ld-section-sub" style={{ margin: '1rem auto 0' }}>
              Can't find your answer? <a href="mailto:support@serverdeck.io" style={{ color: '#22c55e' }}>Contact our team</a>.
            </p>
          </div>

          <div className="ld-faq-list">
            {faqs.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section id="request" style={{ padding: '0 2rem 6rem' }}>
        <div className="ld-cta-banner">
          <div className="ld-cta-deco ld-cta-deco-tl"><Server size={18} /></div>
          <div className="ld-cta-deco ld-cta-deco-tr"><Shield size={18} /></div>
          <div className="ld-cta-deco ld-cta-deco-bl"><Activity size={18} /></div>
          <div className="ld-cta-deco ld-cta-deco-br"><Lock size={18} /></div>

          <div className="ld-cta-inner">
            <span className="ld-label">Early Access</span>
            <h2 className="ld-cta-title">
              Manage Your Servers<br />
              <span style={{ color: '#4ade80' }}>Before They Manage You.</span>
            </h2>
            <p className="ld-cta-sub">
              Join the early access waitlist and transform your infrastructure
              from a liability into a competitive advantage.
            </p>

            {!submitted ? (
              <div className="ld-cta-form-wrap">
                <form className="ld-cta-form" onSubmit={handleSubmit}>
                  <div className="ld-cta-input-wrap">
                    <span className="ld-cta-input-icon">@</span>
                    <input
                      type="email"
                      className="ld-cta-input"
                      placeholder="you@company.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="ld-cta-btn" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Loader2 size={16} className="animate-spin" /> Processing...</span>
                    ) : (
                      <>Get Early Access <ArrowRight size={16} /></>
                    )}
                  </button>
                </form>
                {submitError && (
                  <div className="ld-cta-error" style={{ color: '#ef4444', fontSize: '13px', marginTop: '12px', textAlign: 'center' }}>
                    {submitError}
                  </div>
                )}
                <p className="ld-cta-note">No credit card required · Free during beta</p>
              </div>
            ) : (
              <div className="ld-cta-success">
                <div className="ld-cta-success-icon">
                  <CheckCircle2 size={32} color="#22c55e" />
                </div>
                <div>
                  <p className="ld-cta-success-title">You're on the list!</p>
                  <p className="ld-cta-success-sub">
                    We'll notify <strong>{email}</strong> when your access window opens.
                  </p>
                </div>
                <button className="ld-btn-outline" onClick={() => setSubmitted(false)}>
                  Back
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="ld-footer">
        <div className="ld-footer-inner">
          <div>
            <div className="ld-logo">
              <div className="ld-logo-icon">
                <Server size={16} color="#000" />
              </div>
              <span className="ld-logo-text">Server Deck</span>
            </div>
            <p className="ld-footer-brand-desc">
              The modern control panel for Linux infrastructure. Manage your entire fleet from one elegant interface.
            </p>
          </div>

          <div>
            <div className="ld-footer-col-title">Platform</div>
            <a href="#features"     className="ld-footer-link" onClick={e => scrollTo(e, 'features')}>Features</a>
            <a href="#monitoring"   className="ld-footer-link" onClick={e => scrollTo(e, 'monitoring')}>Monitoring</a>
            <a href="#integrations" className="ld-footer-link" onClick={e => scrollTo(e, 'integrations')}>Integrations</a>
            <a href="#"             className="ld-footer-link">Changelog</a>
          </div>

          <div>
            <div className="ld-footer-col-title">Resources</div>
            <Link to="/documentation" className="ld-footer-link">Documentation</Link>
            <Link to="/api-reference" className="ld-footer-link">API Reference</Link>
            <a href="#" className="ld-footer-link">Status Page</a>
            <a href="#" className="ld-footer-link">Blog</a>
          </div>

          <div>
            <div className="ld-footer-col-title">Company</div>
            <Link to="/about" className="ld-footer-link">About</Link>
            <Link to="/security" className="ld-footer-link">Security</Link>
            <Link to="/privacy" className="ld-footer-link">Privacy Policy</Link>
            <Link to="/terms" className="ld-footer-link">Terms</Link>
          </div>
        </div>

        <div className="ld-footer-bottom">
          <span>© 2026 Server Deck. All rights reserved.</span>
          <span>Built for engineers who ship.</span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
