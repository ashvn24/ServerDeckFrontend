import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Server, Shield, Terminal, Activity, Lock, ArrowRight,
  ChevronDown, CheckCircle2, Cpu, Database, Globe, Check,
  GitBranch, Volume2, VolumeX, Loader2, Copy, Bell,
  Brain, Folder, FileText, Settings, Play, LifeBuoy, Box
} from 'lucide-react';
import { authAPI } from '../api/endpoints';
import './Landing.css';
import useSEO from '../hooks/useSEO';

/* ── Scroll-reveal wrapper ── */
const Reveal = ({ children, delay = 0, className = '' }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        obs.disconnect();
      }
    }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`ld-reveal${visible ? ' ld-in' : ''}${className ? ` ${className}` : ''}`}
      style={delay ? { '--ld-rd': `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
};

/* ── Parallax: translates an element against scroll at the given speed.
   Uses the CSS `translate` property so it never fights `transform`
   transitions (hover effects, reveals). ── */
const useParallax = (speed = 0.1) => {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    let currentY = 0;

    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      // subtract our own offset so the base position stays stable
      const baseCenter = rect.top - currentY + rect.height / 2;
      currentY = (baseCenter - window.innerHeight / 2) * speed;
      el.style.translate = `0 ${currentY.toFixed(1)}px`;
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
      el.style.translate = '';
    };
  }, [speed]);

  return ref;
};

/* ── Small helpers ── */
const Star = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const Stars = ({ n = 5 }) => (
  <div className="ld-stars">
    {Array.from({ length: n }).map((_, i) => <Star key={i} />)}
  </div>
);

/* ── Terminal mockup (bento) ── */
const TerminalMock = () => (
  <div className="ld-term">
    <div className="ld-term-bar">
      <span className="ld-term-dot ld-r" />
      <span className="ld-term-dot ld-y" />
      <span className="ld-term-dot ld-g" />
      <span className="ld-term-title">prod-01 — ssh</span>
      <span className="ld-term-live">● LIVE</span>
    </div>
    <div className="ld-term-body">
      <div className="ld-term-line"><span className="ld-term-prompt">root@prod-01:~$</span> systemctl status nginx</div>
      <div className="ld-term-line ld-ok">● nginx.service — active (running) since 41 days ago</div>
      <div className="ld-term-line"><span className="ld-term-prompt">root@prod-01:~$</span> pm2 restart api</div>
      <div className="ld-term-line ld-ok">[PM2] ✓ api restarted · mem 84.2mb · cpu 0.4%</div>
      <div className="ld-term-line"><span className="ld-term-prompt">root@prod-01:~$</span> certbot renew --dry-run</div>
      <div className="ld-term-line ld-dim">Congratulations, all simulated renewals succeeded</div>
      <div className="ld-term-line"><span className="ld-term-prompt">root@prod-01:~$</span> <span className="ld-term-caret" /></div>
    </div>
  </div>
);

/* ── Sparkline chart (bento) ── */
const MiniChart = ({ bars }) => (
  <div className="ld-chart">
    {bars.map((h, i) => (
      <div
        key={i}
        className={`ld-chart-bar${h > 70 ? ' ld-high' : ''}`}
        style={{ '--ld-bar-h': `${h}%`, height: `${h}%`, animationDelay: `${i * 0.05}s` }}
      />
    ))}
  </div>
);

/* ── SSL renewal ring (bento) ── */
const CertRing = () => (
  <div className="ld-ring-wrap">
    <svg viewBox="0 0 80 80" className="ld-ring">
      <circle cx="40" cy="40" r="34" className="ld-ring-track" />
      <circle cx="40" cy="40" r="34" className="ld-ring-fill" strokeDasharray="213.6" strokeDashoffset="30" />
    </svg>
    <div className="ld-ring-center">
      <span className="ld-ring-num">89</span>
      <span className="ld-ring-sub">days left</span>
    </div>
  </div>
);

/* ── Integrations orbit ── */
const ORBIT_NODES = [
  { icon: <Globe size={18} />,    label: 'Nginx', angle: 270, r: 110 },
  { icon: <Database size={18} />, label: 'DB',    angle: 45,  r: 110 },
  { icon: <Cpu size={18} />,      label: 'PM2',   angle: 135, r: 110 },
  { icon: <Lock size={18} />,     label: 'SSL',   angle: 225, r: 110 },
];

const OrbitVisual = () => (
  <div className="ld-orbit-visual">
    <div className="ld-orbit-ring-1" />
    <div className="ld-orbit-ring-2" />
    <div className="ld-orbit-sweep" />
    <div className="ld-orbit-center">
      <Box size={34} color="#22c55e" />
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

/* ── FAQ item ── */
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
const INSTALL_CMD = 'curl -fsSL https://get.serverdeck.io | bash';

const Landing = () => {
  useSEO({
    title: 'ServerDeck — Linux Server Control Panel',
    description: 'ServerDeck is a unified infrastructure control panel that lets you manage all your Linux servers — SSH, Nginx, SSL, PM2 apps, logs, and firewall rules — from a single, beautiful web interface.',
    keywords: ['linux server management', 'web ssh terminal', 'ssl automation', 'lets encrypt', 'pm2 manager', 'visual firewall', 'sql explorer', 'server monitoring'],
    ogImage: '/app-dark.png'
  });

  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [copied, setCopied] = useState(false);
  const laptopVideoRef = useRef(null);
  const mobileVideoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);

  const rootRef = useRef(null);
  const heroGlowRef = useParallax(-0.15);
  const phoneRef = useParallax(0.06);
  const laptopRef = useParallax(-0.04);
  const orbitRef = useParallax(-0.08);

  const toggleMute = () => {
    if (laptopVideoRef.current) {
      laptopVideoRef.current.muted = !laptopVideoRef.current.muted;
      setIsMuted(laptopVideoRef.current.muted);
    }
  };

  const copyCmd = async () => {
    try {
      await navigator.clipboard.writeText(INSTALL_CMD);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — ignore */
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

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 30);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? (window.scrollY / max) * 100 : 0);
      // drives the fixed background parallax (grid + auroras) via CSS calc()
      if (rootRef.current) rootRef.current.style.setProperty('--ld-scroll', window.scrollY);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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

  const steps = [
    {
      num: '01',
      title: 'Install the agent',
      desc: 'One command on any Ubuntu or Debian server. The agent dials out over an encrypted WebSocket — no open ports, no firewall changes.',
      code: INSTALL_CMD,
    },
    {
      num: '02',
      title: 'Node joins your deck',
      desc: 'Within seconds the server appears in your dashboard with live CPU, RAM, disk, and network telemetry streaming in.',
      code: null,
    },
    {
      num: '03',
      title: 'Control everything',
      desc: 'Open a terminal, edit Nginx sites, renew SSL, restart PM2 apps, tail logs, and manage firewall rules — all from one window.',
      code: null,
    },
  ];

  const alerts = [
    { color: 'green',  title: 'Deployment successful', msg: 'api-server v2.4.1 live on prod-01', time: 'now' },
    { color: 'red',    title: 'High memory usage',     msg: 'prod-03 RAM at 91% — action suggested', time: '2m' },
    { color: 'yellow', title: 'SSL renewal scheduled', msg: 'api.example.com renews in 14 days', time: '8m' },
  ];

  const fwRules = [
    { port: '443 / tcp',  rule: 'ALLOW', from: 'Anywhere' },
    { port: '22 / tcp',   rule: 'ALLOW', from: 'Office VPN' },
    { port: '3306 / tcp', rule: 'DENY',  from: 'Anywhere' },
  ];

  const fleet = [
    { name: 'prod-01',    region: 'fra1', ms: '2ms',  up: true },
    { name: 'prod-02',    region: 'fra1', ms: '3ms',  up: true },
    { name: 'staging-01', region: 'blr1', ms: '11ms', up: true },
    { name: 'worker-03',  region: 'nyc3', ms: '38ms', up: true },
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

  const tickerItems = ['Ubuntu 22.04', 'Nginx', 'PM2', 'Let\'s Encrypt', 'PostgreSQL', 'Node.js', 'Python', 'Redis', 'Docker', 'AWS EC2', 'DigitalOcean', 'Hetzner'];

  const chartBars = [35, 55, 48, 72, 60, 85, 42, 78, 65, 90, 55, 70, 38, 80];

  return (
    <div className="ld-root" ref={rootRef}>

      {/* ── BACKGROUND FX ── */}
      <div className="ld-bg-fx" aria-hidden="true">
        <div className="ld-bg-grid" />
        <div className="ld-bg-aurora" />
        <div className="ld-bg-aurora ld-bg-aurora-2" />
      </div>

      {/* ── NAV ── */}
      <nav className={`ld-nav${scrolled ? ' ld-nav-scrolled' : ''}`}>
        <div className="ld-nav-inner">
          <div className="ld-logo flex items-center gap-3">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-white rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition-all duration-500">
              <Box className="w-5 h-5 md:w-6 md:h-6 text-black" />
            </div>
            <span className="text-base md:text-xl font-black tracking-tighter uppercase font-display text-white">Server Deck</span>
          </div>

          <div className="ld-nav-links">
            <a href="#features"     className="ld-nav-link" onClick={e => scrollTo(e, 'features')}>Features</a>
            <a href="#how"          className="ld-nav-link" onClick={e => scrollTo(e, 'how')}>How it works</a>
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
        <div className="ld-nav-progress" style={{ width: `${progress}%` }} />
      </nav>

      {/* ── HERO ── */}
      <section className="ld-hero">
        <div className="ld-hero-glow" aria-hidden="true" ref={heroGlowRef} />

        <div className="ld-hero-inner">
          <div className="ld-hero-badge">
            <span className="ld-hero-badge-dot" />
            Early access open · agent v2.0
          </div>

          <h1 className="ld-hero-title">
            The command deck for
            <br />
            <span className="ld-hero-title-accent">your entire fleet.</span>
          </h1>

          <p className="ld-hero-sub">
            Server Deck unifies SSH, Nginx, SSL, firewalls, processes, and real-time
            monitoring into one fast control panel — so you never juggle six
            terminals again.
          </p>

          <div className="ld-hero-ctas">
            <a href="#request" className="ld-btn-primary ld-btn-lg" onClick={e => scrollTo(e, 'request')}>
              Request Early Access <ArrowRight size={16} />
            </a>
            <a href="#product" className="ld-btn-outline ld-btn-lg" onClick={e => scrollTo(e, 'product')}>
              See the deck
            </a>
          </div>

          <div className="ld-install">
            <span className="ld-install-prompt">$</span>
            <code className="ld-install-code">{INSTALL_CMD}</code>
            <button className="ld-install-copy" onClick={copyCmd} title="Copy install command">
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
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

        {/* ── PRODUCT SHOWCASE ── */}
        <div id="product" className="ld-showcase-wrapper">
          <div className="ld-mobile-frame ld-mobile-1" ref={phoneRef}>
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

          <div className="ld-laptop-frame" ref={laptopRef}>
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

        </div>
      </section>

      {/* ── TICKER ── */}
      <div className="ld-ticker-wrap">
        <p className="ld-ticker-label">Works with your entire stack</p>
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
      <div className="ld-container ld-stats-section">
        <Reveal>
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
        </Reveal>
      </div>

      {/* ── BENTO FEATURES ── */}
      <section id="features" className="ld-section">
        <div className="ld-container">
          <Reveal className="ld-text-center ld-section-head">
            <span className="ld-label">01 / The Deck</span>
            <h2 className="ld-section-title">
              Everything your servers need.<br />One surface.
            </h2>
            <p className="ld-section-sub ld-sub-center">
              Terminal, monitoring, alerts, SSL, firewall, and fleet management —
              live, in one bento of control.
            </p>
          </Reveal>

          <div className="ld-bento">
            <Reveal className="ld-bento-card ld-b-term">
              <div className="ld-bento-head">
                <div className="ld-bento-icon"><Terminal size={18} /></div>
                <div>
                  <h3 className="ld-bento-title">Web SSH Terminal</h3>
                  <p className="ld-bento-desc">A real terminal in your browser. Zero client setup, end-to-end encrypted, persistent session recovery.</p>
                </div>
              </div>
              <TerminalMock />
            </Reveal>

            <Reveal className="ld-bento-card ld-b-mon" delay={80}>
              <div className="ld-bento-head">
                <div className="ld-bento-icon"><Activity size={18} /></div>
                <div>
                  <h3 className="ld-bento-title">Real-time Telemetry</h3>
                  <p className="ld-bento-desc">Sub-second CPU, RAM, disk, and network streams with anomaly detection.</p>
                </div>
              </div>
              <div className="ld-metrics">
                {[
                  { l: 'CPU', v: 34, cls: '' },
                  { l: 'RAM', v: 61, cls: 'ld-amber' },
                  { l: 'DSK', v: 48, cls: 'ld-cyan-bar' },
                ].map(m => (
                  <div className="ld-metric-row" key={m.l}>
                    <span className="ld-metric-lbl">{m.l}</span>
                    <div className="ld-metric-bar-track">
                      <div className={`ld-metric-bar-fill ${m.cls}`} style={{ width: `${m.v}%` }} />
                    </div>
                    <span className="ld-metric-val">{m.v}%</span>
                  </div>
                ))}
              </div>
              <MiniChart bars={chartBars} />
            </Reveal>

            <Reveal className="ld-bento-card ld-b-alerts" delay={160}>
              <div className="ld-bento-head">
                <div className="ld-bento-icon"><Bell size={18} /></div>
                <div>
                  <h3 className="ld-bento-title">Instant Alerts</h3>
                  <p className="ld-bento-desc">Every node streams events the moment they happen.</p>
                </div>
              </div>
              <div className="ld-alert-list">
                {alerts.map((a, i) => (
                  <div className="ld-alert-row" key={i}>
                    <span className={`ld-alert-dot ld-${a.color}`} />
                    <div className="ld-alert-text">
                      <span className="ld-alert-title">{a.title}</span>
                      <span className="ld-alert-msg">{a.msg}</span>
                    </div>
                    <span className="ld-alert-time">{a.time}</span>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal className="ld-bento-card ld-b-ai" delay={100}>
              <div className="ld-bento-head">
                <div className="ld-bento-icon"><Brain size={18} /></div>
                <div>
                  <h3 className="ld-bento-title">AI Diagnostics Copilot</h3>
                  <p className="ld-bento-desc">Instant automated troubleshooting. When an alert fires, our integrated LLM analyzes logs and system status to diagnose and suggest a fix.</p>
                </div>
              </div>
              <div className="ld-ai-mock">
                <div className="ld-ai-mock-header">
                  <span className="ld-ai-mock-indicator">● AI Diagnosis</span>
                  <span className="ld-ai-mock-urgency ld-critical">CRITICAL</span>
                </div>
                <div className="ld-ai-mock-body">
                  <p className="ld-ai-mock-text"><strong>Likely Cause:</strong> Nginx connections exhausted due to keepalive settings and rapid traffic spike.</p>
                  <p className="ld-ai-mock-fix"><strong>Suggested Command:</strong></p>
                  <div className="ld-ai-mock-code">
                    <code>sudo sysctl -w net.ipv4.tcp_tw_reuse=1</code>
                  </div>
                  <div className="ld-ai-mock-btn">
                    <Play size={10} style={{ fill: 'currentColor', marginRight: '4px', verticalAlign: 'middle' }} /> Run Suggested Fix
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal className="ld-bento-card ld-b-files" delay={180}>
              <div className="ld-bento-head">
                <div className="ld-bento-icon"><Folder size={18} /></div>
                <div>
                  <h3 className="ld-bento-title">Visual File Manager</h3>
                  <p className="ld-bento-desc">Navigate directories, upload/download, and edit scripts or configuration files directly from the browser with a secure, built-in text editor.</p>
                </div>
              </div>
              <div className="ld-file-mock">
                <div className="ld-file-mock-path">
                  <span>/var/www/html</span>
                </div>
                <div className="ld-file-mock-list">
                  <div className="ld-file-mock-item">
                    <Folder size={12} color="#f59e0b" style={{ marginRight: '6px' }} />
                    <span className="ld-file-mock-name">public</span>
                    <span className="ld-file-mock-meta">drwxr-xr-x</span>
                  </div>
                  <div className="ld-file-mock-item">
                    <FileText size={12} color="#06b6d4" style={{ marginRight: '6px' }} />
                    <span className="ld-file-mock-name">index.html</span>
                    <span className="ld-file-mock-meta">644 · 5.2 KB</span>
                  </div>
                  <div className="ld-file-mock-item">
                    <FileText size={12} color="#a855f7" style={{ marginRight: '6px' }} />
                    <span className="ld-file-mock-name">nginx.conf</span>
                    <span className="ld-file-mock-meta">644 · 1.4 KB</span>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal className="ld-bento-card ld-b-sql" delay={260}>
              <div className="ld-bento-head">
                <div className="ld-bento-icon"><Database size={18} /></div>
                <div>
                  <h3 className="ld-bento-title">SQL Explorer & DB Client</h3>
                  <p className="ld-bento-desc">Connect to PostgreSQL, MySQL, and SQLite. Inspect schemas, browse tables, and execute raw SQL queries with full syntax highlighting.</p>
                </div>
              </div>
              <div className="ld-sql-mock">
                <div className="ld-sql-mock-query">
                  <span className="keyword">SELECT</span> name, email <span className="keyword">FROM</span> users <span className="keyword">WHERE</span> active = <span className="literal">true</span>;
                </div>
                <div className="ld-sql-mock-results">
                  <table>
                    <thead>
                      <tr>
                        <th>name</th>
                        <th>email</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>admin</td>
                        <td>admin@serverdeck.io</td>
                      </tr>
                      <tr>
                        <td>support_alex</td>
                        <td>alex@serverdeck.io</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </Reveal>

            <Reveal className="ld-bento-card ld-b-ssl" delay={120}>
              <div className="ld-bento-head">
                <div className="ld-bento-icon"><Lock size={18} /></div>
                <div>
                  <h3 className="ld-bento-title">Auto SSL</h3>
                  <p className="ld-bento-desc">Let's Encrypt renewed 30 days early, every time.</p>
                </div>
              </div>
              <CertRing />
            </Reveal>

            <Reveal className="ld-bento-card ld-b-fw" delay={200}>
              <div className="ld-bento-head">
                <div className="ld-bento-icon"><Shield size={18} /></div>
                <div>
                  <h3 className="ld-bento-title">Visual Firewall</h3>
                  <p className="ld-bento-desc">UFW rules without the CLI.</p>
                </div>
              </div>
              <div className="ld-fw-list">
                {fwRules.map(r => (
                  <div className="ld-fw-row" key={r.port}>
                    <span className="ld-fw-port">{r.port}</span>
                    <span className={`ld-fw-rule ${r.rule === 'ALLOW' ? 'ld-allow' : 'ld-deny'}`}>{r.rule}</span>
                    <span className="ld-fw-from">{r.from}</span>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal className="ld-bento-card ld-b-fleet" delay={280}>
              <div className="ld-bento-head">
                <div className="ld-bento-icon"><GitBranch size={18} /></div>
                <div>
                  <h3 className="ld-bento-title">Unlimited Fleet</h3>
                  <p className="ld-bento-desc">Switch context between nodes instantly.</p>
                </div>
              </div>
              <div className="ld-fleet-list">
                {fleet.map(s => (
                  <div className="ld-fleet-row" key={s.name}>
                    <span className="ld-fleet-dot" />
                    <span className="ld-fleet-name">{s.name}</span>
                    <span className="ld-fleet-region">{s.region}</span>
                    <span className="ld-fleet-ms">{s.ms}</span>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal className="ld-bento-card ld-b-services" delay={140}>
              <div className="ld-bento-head">
                <div className="ld-bento-icon"><Settings size={18} /></div>
                <div>
                  <h3 className="ld-bento-title">Services & Processes</h3>
                  <p className="ld-bento-desc">Full lifecycle management for systemd, PM2, and Docker containers. Monitor active memory usage and kill rogue processes directly.</p>
                </div>
              </div>
              <div className="ld-services-mock">
                <div className="ld-services-row">
                  <span className="ld-services-status ld-up">●</span>
                  <span className="ld-services-name">nginx.service</span>
                  <span className="ld-services-cpu">0.2% CPU</span>
                  <span className="ld-services-action">Restart</span>
                </div>
                <div className="ld-services-row">
                  <span className="ld-services-status ld-up">●</span>
                  <span className="ld-services-name">pm2: api-server</span>
                  <span className="ld-services-cpu">4.1% CPU</span>
                  <span className="ld-services-action">Restart</span>
                </div>
                <div className="ld-services-row">
                  <span className="ld-services-status ld-down">○</span>
                  <span className="ld-services-name">postgresql@14</span>
                  <span className="ld-services-cpu">OFFLINE</span>
                  <span className="ld-services-action ld-start">Start</span>
                </div>
              </div>
            </Reveal>

            <Reveal className="ld-bento-card ld-b-tickets" delay={220}>
              <div className="ld-bento-head">
                <div className="ld-bento-icon"><LifeBuoy size={18} /></div>
                <div>
                  <h3 className="ld-bento-title">Integrated Support Desk</h3>
                  <p className="ld-bento-desc">Create, reply, and track support tickets inside the panel with WebSocket updates. Escalate production alerts to tickets with context in one click.</p>
                </div>
              </div>
              <div className="ld-tickets-mock">
                <div className="ld-tickets-item">
                  <span className="ld-tickets-badge ld-urgent">URGENT</span>
                  <span className="ld-tickets-id">#1042</span>
                  <span className="ld-tickets-title">DB CPU Peak Alert</span>
                  <span className="ld-tickets-time">3m ago</span>
                </div>
                <div className="ld-tickets-item">
                  <span className="ld-tickets-badge ld-open">OPEN</span>
                  <span className="ld-tickets-id">#1041</span>
                  <span className="ld-tickets-title">SSL Renewal Issue</span>
                  <span className="ld-tickets-time">1h ago</span>
                </div>
              </div>
            </Reveal>

            <Reveal className="ld-bento-card ld-b-luxegenie" delay={300}>
              <div className="ld-bento-head">
                <div className="ld-bento-icon"><Cpu size={18} /></div>
                <div>
                  <h3 className="ld-bento-title">IoT Vitals</h3>
                  <p className="ld-bento-desc">Real-time UART telemetry and device diagnostics for Linux systems. Monitor battery charge, serial sync status, and firmware builds.</p>
                </div>
              </div>
              <div className="ld-luxegenie-mock">
                <div className="ld-luxegenie-vitals">
                  <div className="ld-luxe-vital">
                    <span className="ld-luxe-lbl">BATTERY</span>
                    <span className="ld-luxe-val">89%</span>
                  </div>
                  <div className="ld-luxe-vital">
                    <span className="ld-luxe-lbl">UART LINK</span>
                    <span className="ld-luxe-val ld-active">ONLINE</span>
                  </div>
                  <div className="ld-luxe-vital">
                    <span className="ld-luxe-lbl">FIRMWARE</span>
                    <span className="ld-luxe-val">v2.4.1</span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="ld-section ld-how-section">
        <div className="ld-container">
          <Reveal className="ld-text-center ld-section-head">
            <span className="ld-label">02 / Onboarding</span>
            <h2 className="ld-section-title">
              Zero to managed<br />in sixty seconds.
            </h2>
            <p className="ld-section-sub ld-sub-center">
              No SSH key wrangling, no VPNs, no open inbound ports. The agent does the work.
            </p>
          </Reveal>

          <div className="ld-steps">
            {steps.map((s, i) => (
              <Reveal className="ld-step" key={s.num} delay={i * 100}>
                <div className="ld-step-num">{s.num}</div>
                <h3 className="ld-step-title">{s.title}</h3>
                <p className="ld-step-desc">{s.desc}</p>
                {s.code && (
                  <div className="ld-step-code">
                    <code>{s.code}</code>
                  </div>
                )}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── INTEGRATIONS ── */}
      <section id="integrations" className="ld-section">
        <div className="ld-container">
          <div className="ld-grid-2">
            <Reveal>
              <span className="ld-label">03 / Integrations</span>
              <h2 className="ld-section-title">
                One panel.<br />Every stack.
              </h2>
              <p className="ld-section-sub">
                Server Deck works everywhere your infrastructure lives — from bare-metal
                to cloud VMs — with zero vendor lock-in.
              </p>

              <div className="ld-int-list">
                {[
                  { icon: <Globe size={18} />,     title: 'Nginx Site Management', desc: 'Create, edit, and toggle server blocks with a visual editor. No more manual conf files.' },
                  { icon: <Cpu size={18} />,       title: 'PM2 Process Control',   desc: 'Full lifecycle control for Node.js apps — start, stop, restart, and stream logs live.' },
                  { icon: <GitBranch size={18} />, title: 'Multi-Server Fleet',    desc: 'Connect unlimited servers. Switch context instantly. Manage everything from one place.' },
                ].map(item => (
                  <div key={item.title} className="ld-int-row">
                    <div className="ld-int-icon">{item.icon}</div>
                    <div>
                      <div className="ld-int-title">{item.title}</div>
                      <div className="ld-int-desc">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div ref={orbitRef}>
                <OrbitVisual />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="ld-section ld-testi-section">
        <div className="ld-container">
          <Reveal className="ld-text-center ld-section-head">
            <span className="ld-label">04 / Reviews</span>
            <h2 className="ld-section-title">
              Trusted by engineers.<br />Proven in production.
            </h2>
            <p className="ld-section-sub ld-sub-center">
              Teams running critical infrastructure rely on Server Deck every day.
            </p>
          </Reveal>

          <div className="ld-grid-3">
            {testimonials.map((t, i) => (
              <Reveal className="ld-testi-card" key={i} delay={i * 100}>
                <div className="ld-testi-logo">
                  <div className="ld-testi-logo-icon">
                    <Box size={14} />
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
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="ld-section">
        <div className="ld-container">
          <Reveal className="ld-text-center ld-section-head">
            <span className="ld-label">05 / FAQ</span>
            <h2 className="ld-section-title">Frequently asked<br />questions</h2>
            <p className="ld-section-sub ld-sub-center">
              Can't find your answer? <a href="mailto:support@serverdeck.io" className="ld-link">Contact our team</a>.
            </p>
          </Reveal>

          <div className="ld-faq-list">
            {faqs.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section id="request" className="ld-cta-section">
        <Reveal>
          <div className="ld-cta-banner">
            <div className="ld-cta-deco ld-cta-deco-tl"><Box size={18} /></div>
            <div className="ld-cta-deco ld-cta-deco-tr"><Shield size={18} /></div>
            <div className="ld-cta-deco ld-cta-deco-bl"><Activity size={18} /></div>
            <div className="ld-cta-deco ld-cta-deco-br"><Lock size={18} /></div>

            <div className="ld-cta-inner">
              <span className="ld-label">Early Access</span>
              <h2 className="ld-cta-title">
                Manage your servers<br />
                <span className="ld-cta-title-accent">before they manage you.</span>
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
                        <span className="ld-cta-btn-busy"><Loader2 size={16} className="animate-spin" /> Processing...</span>
                      ) : (
                        <>Get Early Access <ArrowRight size={16} /></>
                      )}
                    </button>
                  </form>
                  {submitError && (
                    <div className="ld-cta-error">{submitError}</div>
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
        </Reveal>
      </section>

      {/* ── FOOTER ── */}
      <footer className="ld-footer">
        <div className="ld-footer-inner">
          <div>
            <div className="ld-logo">
              <div className="w-7 h-7 md:w-7 md:h-7 bg-white rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition-all duration-500">
                <Box className="w-4 h-4 md:w-4 md:h-4 text-black" />
              </div>
              <span className="text-base md:text-lg font-black tracking-tighter uppercase font-display text-white">Server Deck</span>
            </div>
            <p className="ld-footer-brand-desc">
              The modern control panel for Linux infrastructure. Manage your entire fleet from one elegant interface.
            </p>
          </div>

          <div>
            <div className="ld-footer-col-title">Platform</div>
            <a href="#features"     className="ld-footer-link" onClick={e => scrollTo(e, 'features')}>Features</a>
            <a href="#how"          className="ld-footer-link" onClick={e => scrollTo(e, 'how')}>How it works</a>
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
