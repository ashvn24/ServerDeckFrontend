import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Server, Shield, Terminal, Activity, Lock, ArrowRight,
  ChevronDown, CheckCircle2, Cpu, Database, Globe, Check,
  GitBranch, Loader2, Copy, Bell, Brain, Play, LifeBuoy,
  Power, RefreshCw, AlertTriangle, User, ExternalLink, HardDrive, Box
} from 'lucide-react';
import { authAPI } from '../api/endpoints';
import './Landing.css';
import useSEO from '../hooks/useSEO';

/* ── ServerDeck Box Logo (Matches previous version) ── */
const ServerDeckLogo = ({ size = 'nav' }) => (
  <div className={size === 'nav'
    ? 'w-9 h-9 bg-white rounded-2xl flex items-center justify-center shadow-lg hover:rotate-6 transition-all duration-500'
    : 'w-7.5 h-7.5 bg-white rounded-xl flex items-center justify-center shadow-lg hover:rotate-6 transition-all duration-500'
  }>
    <Box className={size === 'nav' ? 'w-5 h-5 text-black' : 'w-4 h-4 text-black'} />
  </div>
);

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
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `all 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`
      }}
      className={className}
    >
      {children}
    </div>
  );
};

const INSTALL_CMD = 'curl -fsSL https://get.serverdeck.io | bash';

const Landing = () => {
  useSEO({
    title: 'ServerDeck — Linux Server Control Panel',
    description: 'ServerDeck is a unified infrastructure control panel that lets you manage all your Linux servers — SSH, Nginx, SSL, PM2 apps, logs, and firewall rules — from a single, beautiful web interface.',
    keywords: ['linux server management', 'web ssh terminal', 'ssl automation', 'lets encrypt', 'pm2 manager', 'visual firewall', 'sql explorer', 'server monitoring'],
    ogImage: '/app-dark.png'
  });

  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Interactive Node States
  const [hoveredNode, setHoveredNode] = useState(null);
  
  // Interactive Radar States
  const [radarStep, setRadarStep] = useState(1);
  const [radarLoading, setRadarLoading] = useState(false);

  // Map Active Spot
  const [activeSpot, setActiveSpot] = useState('NYC');

  // Video Modal state
  const [showVideoModal, setShowVideoModal] = useState(false);

  const copyCmd = async () => {
    try {
      await navigator.clipboard.writeText(INSTALL_CMD);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(totalScroll > 0 ? (window.scrollY / totalScroll) * 100 : 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const triggerRadarStep = () => {
    if (radarLoading) return;
    setRadarLoading(true);
    setTimeout(() => {
      setRadarStep(prev => (prev % 3) + 1);
      setRadarLoading(false);
    }, 1000);
  };

  // Node Points mapping (coordinates relative to viewBox 1200x700)
  const networkNodes = [
    { id: 'cortex', name: 'Cortex', x: 230, y: 180, val: '20,945', ip: '142.250.190.46', cpu: '24%', ram: '42%' },
    { id: 'quant', name: 'Quant', x: 970, y: 220, val: '2,345', ip: '172.217.16.14', cpu: '12%', ram: '19%' },
    { id: 'aelf', name: 'Aelf', x: 180, y: 480, val: '18,546', ip: '216.58.212.142', cpu: '88%', ram: '71%' },
    { id: 'meeton', name: 'Meeton', x: 990, y: 500, val: '440', ip: '104.244.42.1', cpu: '5%', ram: '8%' }
  ];

  const handleWaitlistSubmit = async (e) => {
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

  // Stats cylinders initial/mock heights
  const resources = [
    { label: 'CPU', val: '42%', color: 'var(--color-cyan)', h: 58.8 },
    { label: 'RAM', val: '64%', color: 'var(--color-teal)', h: 89.6 },
    { label: 'Disk', val: '31%', color: 'var(--color-blue)', h: 43.4 },
    { label: 'Load', val: '0.45', color: 'var(--color-emerald)', h: 63.0 },
    { label: 'Net', val: '24m', color: 'var(--color-violet)', h: 110.6 }
  ];

  const trafficBars = [40, 24, 76, 48, 90, 32, 60, 80, 52, 68, 44, 88];

  const testimonials = [
    {
      logo: 'Infrastack',
      quote: '"ServerDeck eliminated our tool sprawl overnight. We went from juggling 6 SSH windows to managing 40 nodes from a single dashboard. The SSL automation alone saved us hours weekly."',
      name: 'Rajan M.',
      role: 'Lead SRE, Infrastack',
      avatar: 'RM',
      color: '#14b8a6',
    },
    {
      logo: 'DevCore',
      quote: '"The real-time monitoring caught a memory leak before our users noticed. The alert system is genuinely faster than anything else we\'ve tried. Highly recommended for any growing team."',
      name: 'Priya S.',
      role: 'CTO, DevCore Systems',
      avatar: 'PS',
      color: '#3b82f6',
    },
    {
      logo: 'CloudNest',
      quote: '"Onboarding new servers takes 30 seconds now. The web terminal is indistinguishable from native SSH. ServerDeck is the control panel we always wished existed."',
      name: 'Alex T.',
      role: 'DevOps Engineer, CloudNest',
      avatar: 'AT',
      color: '#8b5cf6',
    }
  ];

  const faqs = [
    { q: 'What is ServerDeck?', a: 'ServerDeck is a unified infrastructure control panel that lets you manage all your Linux servers — SSH, Nginx, SSL, PM2 apps, logs, and firewall rules — from a single, beautiful web interface.' },
    { q: 'How does ServerDeck connect to my server?', a: 'You deploy a lightweight agent on any Ubuntu/Debian server with a single command. The agent communicates via a secure, outbound WebSocket channel — no open ports, no extra firewall rules required.' },
    { q: 'Is it suitable for small teams or solo developers?', a: 'Absolutely. ServerDeck scales from a single VPS to a fleet of hundreds. The interface is designed to be powerful for advanced users yet approachable for developers who just want things to work.' },
    { q: 'What does the monitoring dashboard show?', a: 'You get real-time CPU, RAM, disk usage, network I/O, running processes, Nginx site status, SSL certificate expiry, and application health — all in one view with configurable alerts.' },
    { q: 'Does ServerDeck support team collaboration?', a: 'Yes. You can invite team members with granular role-based access control, and every action is logged in a full audit trail so you always know who changed what and when.' }
  ];

  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const scrollToSection = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="ld-root">
      
      {/* ── Scroll Progress Bar ── */}
      <div className="ld-scroll-bar" style={{ width: `${scrollProgress}%` }} />

      {/* ── Background Glow Bubbles ── */}
      <div className="ld-bg-glows" aria-hidden="true">
        <div className="ld-glow-bubble ld-glow-1" />
        <div className="ld-glow-bubble ld-glow-2" />
        <div className="ld-glow-bubble ld-glow-3" />
      </div>

      {/* ── Floating Center Navbar ── */}
      <div className="ld-nav-container">
        <nav className={`ld-nav-pill ${scrolled ? 'ld-nav-pill-scrolled' : ''}`}>
          <div className="ld-nav-logo">
            <ServerDeckLogo size="nav" />
            <span>ServerDeck</span>
          </div>

          <div className="ld-nav-links">
            <a href="#features" className="ld-nav-link" onClick={e => scrollToSection(e, 'features')}>Features</a>
            <a href="#how" className="ld-nav-link" onClick={e => scrollToSection(e, 'how')}>How it works</a>
            <a href="#insights" className="ld-nav-link" onClick={e => scrollToSection(e, 'insights')}>Insights</a>
            <a href="#reviews" className="ld-nav-link" onClick={e => scrollToSection(e, 'reviews')}>Reviews</a>
            <a href="#faq" className="ld-nav-link" onClick={e => scrollToSection(e, 'faq')}>FAQ</a>
          </div>

          <div className="ld-nav-actions">
            <div className="ld-nav-badge hidden md:flex">
              <Shield size={13} />
              <span>Protection</span>
              <ChevronDown size={11} />
            </div>
            <Link to="/login" className="ld-btn-signin">
              <User size={13} />
              <span>Sign In</span>
            </Link>
          </div>
        </nav>
      </div>

      {/* ── Hero Section (Matches Panel 1 Aesthetic) ── */}
      <section className="ld-hero">
        <div className="ld-hero-inner">
          <Reveal delay={100}>
            <div className="ld-play-trigger" onClick={() => setShowVideoModal(true)} title="Watch Demo Video">
              <Play size={18} style={{ fill: 'currentColor', marginLeft: '3px' }} />
            </div>
          </Reveal>

          <Reveal delay={200}>
            <div className="ld-hero-badge">
              <span className="ld-hero-badge-dot" />
              <span>Unlock Infrastructure Power!</span>
              <ArrowRight size={12} />
            </div>
          </Reveal>

          <Reveal delay={300}>
            <h1 className="ld-hero-title">
              <span>One-click for Server Control</span>
            </h1>
          </Reveal>

          <Reveal delay={400}>
            <p className="ld-hero-sub">
              Secure, monitor, and configure your entire Linux fleet from a single elegant interface. No SSH key wrangling, no open inbound ports.
            </p>
          </Reveal>

          <Reveal delay={500}>
            <div className="ld-hero-ctas">
              <Link to="/login" className="ld-btn-primary">
                Open App
              </Link>
              <a href="#features" className="ld-btn-secondary" onClick={e => scrollToSection(e, 'features')}>
                Discover More
              </a>
            </div>
          </Reveal>

          {/* Interactive Install Command Tool */}
          <Reveal delay={600}>
            <div className="flex justify-center mb-10">
              <div className="inline-flex items-center gap-3 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-full px-5 py-2.5 backdrop-blur-md">
                <span className="text-[rgba(255,255,255,0.4)] font-mono text-sm">$</span>
                <code className="text-sm font-mono text-[rgba(255,255,255,0.85)]">{INSTALL_CMD}</code>
                <button
                  onClick={copyCmd}
                  className="text-[rgba(255,255,255,0.4)] hover:text-white transition-colors"
                  title="Copy installation command"
                >
                  {copied ? <Check size={14} className="text-teal-400" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </Reveal>
        </div>

        {/* ── Interactive SVG Node Network ── */}
        <div className="ld-node-network" aria-hidden="true">
          <svg className="ld-node-svg" viewBox="0 0 1200 700">
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--color-cyan)" stopOpacity="0.8" />
                <stop offset="50%" stopColor="var(--color-teal)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="var(--color-violet)" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            {/* Central Hub Core */}
            <g className="ld-network-node" transform="translate(600, 350)">
              <circle cx="0" cy="0" r="16" fill="rgba(255, 255, 255, 0.03)" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" />
              <circle cx="0" cy="0" r="6" fill="#ffffff" />
            </g>

            {/* Floating Nodes & Connecting Lines */}
            {networkNodes.map((n) => (
              <g key={n.id}>
                {/* Curved Connection Path */}
                <path
                  className="ld-network-path"
                  d={`M 600,350 Q ${(600 + n.x) / 2},${(350 + n.y) / 2 - 40} ${n.x},${n.y}`}
                />
                <path
                  className="ld-network-path-active"
                  d={`M 600,350 Q ${(600 + n.x) / 2},${(350 + n.y) / 2 - 40} ${n.x},${n.y}`}
                />
                
                {/* Outer Node Group */}
                <g
                  className="ld-network-node"
                  transform={`translate(${n.x}, ${n.y})`}
                  onMouseEnter={() => setHoveredNode(n)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  <circle cx="0" cy="0" r="18" fill="rgba(255, 255, 255, 0.02)" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" />
                  <circle cx="0" cy="0" r="5" fill={hoveredNode?.id === n.id ? '#ffffff' : 'rgba(255, 255, 255, 0.4)'} />
                  
                  {/* Labels */}
                  <text x="14" y="-2" textAnchor="start">{n.name}</text>
                  <text x="14" y="10" className="ld-network-node-val" textAnchor="start">{n.val}</text>

                  {/* Telemetry Tooltip on Hover */}
                  {hoveredNode?.id === n.id && (
                    <g transform="translate(0, -60)">
                      <rect x="-60" y="0" width="120" height="46" rx="6" fill="rgba(8, 8, 12, 0.9)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                      <text x="0" y="16" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle">{n.ip}</text>
                      <text x="0" y="32" fill="var(--color-cyan)" fontSize="9" textAnchor="middle">CPU {n.cpu} | RAM {n.ram}</text>
                    </g>
                  )}
                </g>
              </g>
            ))}

            {/* Scroll Down & Horizons Texts (Matches reference) */}
            <text x="80" y="600" className="ld-scroll-down-text">02.03 . SCROLL DOWN</text>
            <text x="1120" y="600" className="ld-horizons-text" textAnchor="end">SERVERDECK HORIZONS</text>
          </svg>
        </div>

        {/* ── Partner Tech Integration Logos ── */}
        <div className="ld-partners">
          <div className="ld-partners-title">Compatible Infrastructure Stack</div>
          <div className="ld-partners-grid">
            <span className="ld-partner-logo"><Globe size={15} /> Nginx</span>
            <span className="ld-partner-logo"><Shield size={15} /> Let's Encrypt</span>
            <span className="ld-partner-logo"><Cpu size={15} /> PM2</span>
            <span className="ld-partner-logo"><Database size={15} /> PostgreSQL</span>
            <span className="ld-partner-logo"><HardDrive size={15} /> Docker</span>
            <span className="ld-partner-logo"><Server size={15} /> AWS EC2</span>
            <span className="ld-partner-logo"><Terminal size={15} /> Ubuntu</span>
          </div>
        </div>
      </section>

      {/* ── Section 1: ServerDeck System (Matches Panel 3 - DeFi Wallet Style) ── */}
      <section id="features" className="ld-section">
        <div className="ld-container">
          <div className="ld-section-header">
            <h2 className="ld-section-title-large">Secure Terminal & Live Shell</h2>
            <p className="ld-section-desc">Manage SSH, run scripts, and tail logs in real-time without leaving your browser.</p>
          </div>

          <div className="ld-section-btn-wrap">
            <a href="#how" className="ld-section-btn" onClick={e => scrollToSection(e, 'how')}>
              How it works?
            </a>
          </div>

          <div className="ld-deck-system-grid">
            
            {/* Visual Left: ServerDeck System Oval + Logs list */}
            <Reveal delay={100}>
              <div className="ld-system-visual-left">
                <div className="ld-visual-title-row">
                  <div className="ld-visual-subtitle">ServerDeck System</div>
                  <div className="ld-visual-uptime-big">+99.9%</div>
                </div>

                <div className="ld-logs-overlay-stack">
                  <div className="ld-log-pill">
                    <span className="ld-log-pill-icon teal"><Lock size={14} /></span>
                    <span className="ld-log-pill-text">SSH Session Authorized</span>
                    <span className="ld-log-pill-meta">root@prod-01</span>
                  </div>
                  <div className="ld-log-pill">
                    <span className="ld-log-pill-icon blue"><RefreshCw size={14} /></span>
                    <span className="ld-log-pill-text">PM2 Application Restarted</span>
                    <span className="ld-log-pill-meta">api-server</span>
                  </div>
                  <div className="ld-log-pill">
                    <span className="ld-log-pill-icon coral"><Shield size={14} /></span>
                    <span className="ld-log-pill-text">Firewall Blocked Port 3306</span>
                    <span className="ld-log-pill-meta">UFW Reject</span>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Visual Right: Onboarding Dial Radar */}
            <Reveal delay={300}>
              <div className="ld-system-visual-right">
                <div className="ld-radar-container" onClick={triggerRadarStep} style={{ cursor: 'pointer' }}>
                  <div className="ld-radar-circle ld-radar-circle-1" />
                  <div className="ld-radar-circle ld-radar-circle-2" />
                  <div className="ld-radar-circle ld-radar-circle-3" />
                  
                  <div className="ld-radar-sweep" />

                  <div className="ld-radar-center">
                    {radarLoading ? (
                      <Loader2 size={24} className="animate-spin text-dark" />
                    ) : (
                      <Power size={24} />
                    )}
                  </div>

                  <div className="ld-radar-step-label">
                    Step 0{radarStep}: {radarStep === 1 ? 'Agent Sync' : radarStep === 2 ? 'Security Scan' : 'Connected'}
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Bottom Tags filter */}
            <div className="ld-system-visual-bottom-tags">
              <span className="ld-system-tag">Secure Shell</span>
              <span className="ld-system-tag">Nginx Config</span>
              <span className="ld-system-tag">Let's Encrypt SSL</span>
              <span className="ld-system-tag ld-system-tag-active">Real-time Telemetry</span>
              <span className="ld-system-tag">Firewall Rules</span>
              <span className="ld-system-tag">PM2 Process Manager</span>
              <span className="ld-system-tag">Zero Open Ports</span>
            </div>

          </div>
        </div>
      </section>

      {/* ── Section 2: Fleet Insights Bento Grid (Matches Panel 2 - Marvellous Insights Style) ── */}
      <section id="insights" className="ld-section">
        <div className="ld-container">
          <div className="ld-section-header">
            <h2 className="ld-section-title-large">Meet Fleet Insights</h2>
            <p className="ld-section-desc">Unified metrics replace the tedious checking of manual logs. Track your global status at a glance.</p>
          </div>

          <div className="ld-bento-grid">
            
            {/* Bento 1: World Map Cluster */}
            <div className="ld-bento-item ld-bento-globe">
              <div className="ld-map-container">
                <svg className="ld-map-svg" viewBox="0 0 1000 480" fill="none">
                  {/* Outline World Map (Simplified) */}
                  <path d="M150,150 L220,130 L250,160 L290,140 L300,100 L350,90 L390,130 L450,150 L480,180 L520,160 L540,110 L600,100 L680,140 L700,200 L760,220 L800,180 L880,150 L920,200 L950,280 L900,320 L820,300 L790,340 L740,320 L700,280 L650,300 L600,260 L570,300 L540,360 L480,380 L420,360 L380,300 L320,330 L280,310 L250,350 L200,320 L160,250 L120,220 Z" stroke="rgba(255,255,255,0.08)" strokeWidth="2" strokeDasharray="5 5" />
                  <path d="M400,250 L430,230 L450,260 L480,240 L500,280 L460,320 Z" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
                </svg>

                {/* Locator Dots with Pulsing animations */}
                <div
                  className="ld-map-dot"
                  style={{ top: '35%', left: '30%' }}
                  onClick={() => setActiveSpot('NYC')}
                >
                  <span className="ld-map-dot-label">NYC (Us-East)</span>
                </div>

                <div
                  className="ld-map-dot"
                  style={{ top: '32%', left: '52%' }}
                  onClick={() => setActiveSpot('FRA')}
                >
                  <span className="ld-map-dot-label">FRA (Eu-Central)</span>
                </div>

                <div
                  className="ld-map-dot"
                  style={{ top: '55%', left: '72%' }}
                  onClick={() => setActiveSpot('BLR')}
                >
                  <span className="ld-map-dot-label">BLR (As-South)</span>
                </div>

                <div
                  className="ld-map-dot"
                  style={{ top: '60%', left: '80%' }}
                  onClick={() => setActiveSpot('SGP')}
                >
                  <span className="ld-map-dot-label">SGP (As-East)</span>
                </div>
              </div>

              <div className="ld-bento-globe-content">
                <div className="ld-bento-title-small">98.2% Nodes Online</div>
                <p className="ld-bento-subtitle-small">
                  Currently viewing <strong>{activeSpot} Cluster</strong>. Active instances are routing requests with sub-millisecond response delay. Uptime validated across regional zones.
                </p>
                <div className="ld-map-actions">
                  <button className={`ld-map-action-btn ${activeSpot === 'NYC' ? 'ld-map-action-btn-active' : ''}`} onClick={() => setActiveSpot('NYC')}>NYC</button>
                  <button className={`ld-map-action-btn ${activeSpot === 'FRA' ? 'ld-map-action-btn-active' : ''}`} onClick={() => setActiveSpot('FRA')}>FRA</button>
                  <button className={`ld-map-action-btn ${activeSpot === 'BLR' ? 'ld-map-action-btn-active' : ''}`} onClick={() => setActiveSpot('BLR')}>BLR</button>
                  <button className={`ld-map-action-btn ${activeSpot === 'SGP' ? 'ld-map-action-btn-active' : ''}`} onClick={() => setActiveSpot('SGP')}>SGP</button>
                </div>
              </div>
            </div>

            {/* Bento 2: Cylinder Resource Utilization Graph */}
            <div className="ld-bento-item ld-bento-resource">
              <div>
                <div className="ld-bento-title-small">Resource Allocation</div>
                <p className="ld-bento-subtitle-small">Active usage patterns on target servers.</p>
              </div>

              <div className="ld-cylinders-container">
                {resources.map((r, i) => (
                  <div key={i} className="ld-cylinder-wrapper">
                    <span className="ld-cylinder-val">{r.val}</span>
                    <div className="ld-cylinder">
                      <div
                        className="ld-cylinder-fill"
                        style={{
                          height: `${r.h}px`,
                          '--fill-color': r.color
                        }}
                      />
                    </div>
                    <span className="ld-cylinder-label">{r.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bento 3: Fleet Telemetry statistics */}
            <div className="ld-bento-item ld-bento-stats">
              <div>
                <div className="ld-bento-title-small">Uptime & Fleet Traffic</div>
                <p className="ld-bento-subtitle-small">Consolidated load parameters across all environments.</p>
              </div>

              <div className="ld-stats-columns">
                <div className="ld-stats-col cyan">
                  <div className="ld-stats-col-lbl">Load Avg</div>
                  <div className="ld-stats-col-val">19.2%</div>
                  <div className="ld-stats-col-sub">System average</div>
                </div>
                <div className="ld-stats-col teal">
                  <div className="ld-stats-col-lbl">Active Conns</div>
                  <div className="ld-stats-col-val">24.5k</div>
                  <div className="ld-stats-col-sub">Requests / sec</div>
                </div>
              </div>
            </div>

            {/* Bento 4: Traffic bars graph */}
            <div className="ld-bento-item ld-bento-traffic">
              <div>
                <div className="ld-bento-title-small">Bandwidth Throughput</div>
                <p className="ld-bento-subtitle-small">Incoming and outgoing transfer volumes (hourly analytics).</p>
              </div>

              <div className="ld-traffic-graph">
                {trafficBars.map((h, i) => (
                  <div
                    key={i}
                    className="ld-traffic-bar"
                    style={{
                      height: `${h}%`,
                      '--bar-color': i % 2 === 0 ? 'var(--color-cyan)' : i % 3 === 0 ? 'var(--color-coral)' : 'var(--color-teal)'
                    }}
                  />
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Steps / Onboarding Grid ── */}
      <section id="how" className="ld-section">
        <div className="ld-container">
          <div className="ld-section-header">
            <h2 className="ld-section-title-large">Zero to Managed in 60s</h2>
            <p className="ld-section-desc">Integrate any Ubuntu or Debian node quickly. The daemon initializes outbound communication immediately.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Reveal delay={100} className="border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.01)] rounded-3xl p-8 backdrop-blur-md">
              <div className="text-4xl font-extrabold text-[rgba(255,255,255,0.1)] mb-4">01</div>
              <h3 className="text-xl font-bold mb-2">Deploy the Agent</h3>
              <p className="text-sm text-[rgba(255,255,255,0.6)] leading-relaxed">
                Run the quick curl string directly on your target server. Safe, isolated configuration.
              </p>
            </Reveal>
            <Reveal delay={200} className="border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.01)] rounded-3xl p-8 backdrop-blur-md">
              <div className="text-4xl font-extrabold text-[rgba(255,255,255,0.1)] mb-4">02</div>
              <h3 className="text-xl font-bold mb-2">WebSocket Sync</h3>
              <p className="text-sm text-[rgba(255,255,255,0.6)] leading-relaxed">
                The agent completes TLS handshakes over visual WebSockets, registering telemetry metrics instantly.
              </p>
            </Reveal>
            <Reveal delay={300} className="border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.01)] rounded-3xl p-8 backdrop-blur-md">
              <div className="text-4xl font-extrabold text-[rgba(255,255,255,0.1)] mb-4">03</div>
              <h3 className="text-xl font-bold mb-2">Instant Control</h3>
              <p className="text-sm text-[rgba(255,255,255,0.6)] leading-relaxed">
                Control active databases, inspect site configs, reset servers, or launch interactive SSH consoles.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Testimonials Section ── */}
      <section id="reviews" className="ld-section">
        <div className="ld-container">
          <div className="ld-section-header">
            <h2 className="ld-section-title-large">Trusted by Engineers</h2>
            <p className="ld-section-desc">Reliable deployment strategies used by high-volume teams globally.</p>
          </div>

          <div className="ld-reviews-grid">
            {testimonials.map((t, i) => (
              <div key={i} className="ld-review-card">
                <div>
                  <div className="ld-review-header">
                    <div className="ld-review-logo-icon">
                      <Server size={10} />
                    </div>
                    <span>{t.logo}</span>
                  </div>

                  <div className="ld-stars-wrap">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <span key={idx}>★</span>
                    ))}
                  </div>

                  <p className="ld-review-quote">{t.quote}</p>
                </div>

                <div className="ld-review-author">
                  <div className="ld-review-avatar" style={{ background: t.color }}>{t.avatar}</div>
                  <div>
                    <div className="ld-review-author-name">{t.name}</div>
                    <div className="ld-review-author-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ Section ── */}
      <section id="faq" className="ld-section">
        <div className="ld-container">
          <div className="ld-section-header">
            <h2 className="ld-section-title-large">Frequently Asked Questions</h2>
            <p className="ld-section-desc">Clear clarifications on configurations and features.</p>
          </div>

          <div className="ld-faq-container">
            {faqs.map((f, i) => (
              <div
                key={i}
                className={`ld-faq-item-custom ${activeFaq === i ? 'ld-faq-item-open' : ''}`}
              >
                <button className="ld-faq-q-btn" onClick={() => toggleFaq(i)}>
                  <span>{f.q}</span>
                  <ChevronDown size={16} className="ld-faq-chevron-icon" />
                </button>
                <div className="ld-faq-answer">
                  {f.a}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Waitlist Signup Section ── */}
      <section className="ld-section bg-[rgba(255,255,255,0.01)] border-t border-[rgba(255,255,255,0.03)]">
        <div className="ld-container text-center max-w-xl">
          <h2 className="text-3xl font-black tracking-tight mb-4 font-display">Transform Your Infrastructure</h2>
          <p className="text-[rgba(255,255,255,0.6)] mb-8 text-sm max-w-md mx-auto">
            Join the early access waitlist to deploy monitoring agents and handle visual server decks today.
          </p>

          {!submitted ? (
            <form onSubmit={handleWaitlistSubmit} className="flex flex-col md:flex-row gap-3 items-center justify-center">
              <input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full md:w-80 px-5 py-3 rounded-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[rgba(255,255,255,0.3)] focus:outline-none focus:border-[rgba(255,255,255,0.2)] text-sm"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full md:w-auto px-6 py-3 rounded-full bg-white text-black font-semibold text-sm hover:bg-[rgba(255,255,255,0.9)] transition-colors flex items-center justify-center gap-2 whitespace-nowrap ld-btn-waitlist"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Get Access</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.2)] rounded-3xl p-6 text-center max-w-sm mx-auto">
              <CheckCircle2 className="mx-auto mb-3 text-emerald-400" size={28} />
              <h3 className="text-lg font-bold text-emerald-400 mb-1">Added to waitlist!</h3>
              <p className="text-xs text-[rgba(255,255,255,0.6)]">
                We will email <strong>{email}</strong> when your workspace credentials are ready.
              </p>
            </div>
          )}
          {submitError && (
            <p className="text-rose-400 text-xs mt-3 font-medium">{submitError}</p>
          )}
        </div>
      </section>

      {/* ── Footer (Matches Panel 2 Footer Style) ── */}
      <footer className="ld-footer-section">
        <div className="ld-container">
          <div className="ld-footer-grid">
            <div>
              <div className="ld-footer-brand-logo">
                <ServerDeckLogo size="footer" />
                <span>ServerDeck</span>
              </div>
              <p className="ld-footer-brand-desc">
                The modern visual control panel for Linux infrastructure.
              </p>
            </div>

            <div>
              <div className="ld-footer-col-title-custom">Platform</div>
              <div className="ld-footer-links-list">
                <a href="#features" className="ld-footer-link-custom" onClick={e => scrollToSection(e, 'features')}>Features</a>
                <a href="#how" className="ld-footer-link-custom" onClick={e => scrollToSection(e, 'how')}>How it works</a>
                <a href="#insights" className="ld-footer-link-custom" onClick={e => scrollToSection(e, 'insights')}>Insights</a>
              </div>
            </div>

            <div>
              <div className="ld-footer-col-title-custom">Resources</div>
              <div className="ld-footer-links-list">
                <Link to="/documentation" className="ld-footer-link-custom">Docs</Link>
                <Link to="/api-reference" className="ld-footer-link-custom">API Ref</Link>
                <a href="#" className="ld-footer-link-custom">Status Page</a>
              </div>
            </div>

            <div>
              <div className="ld-footer-col-title-custom">Company</div>
              <div className="ld-footer-links-list">
                <Link to="/about" className="ld-footer-link-custom">About Us</Link>
                <Link to="/security" className="ld-footer-link-custom">Security</Link>
                <Link to="/privacy" className="ld-footer-link-custom">Privacy</Link>
              </div>
            </div>
          </div>

          <div className="ld-footer-bottom-bar">
            <span className="ld-footer-copyright">
              © 2026 Designed with love at ServerDeck. All rights reserved.
            </span>
            <div className="ld-footer-socials">
              <a href="#" className="ld-footer-social-icon" title="Twitter / X">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="#" className="ld-footer-social-icon" title="LinkedIn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Mock Video Demo Modal ── */}
      {showVideoModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-4xl bg-[var(--bg-dark)] border border-[rgba(255,255,255,0.1)] rounded-3xl overflow-hidden shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
              <span className="text-sm font-semibold tracking-wide uppercase font-display text-[rgba(255,255,255,0.6)]">ServerDeck Live Playback</span>
              <button
                className="text-[rgba(255,255,255,0.4)] hover:text-white transition-colors text-lg font-bold"
                onClick={() => setShowVideoModal(false)}
              >
                ✕
              </button>
            </div>
            {/* Modal video body */}
            <div className="aspect-video bg-black relative flex items-center justify-center">
              <video
                src="https://d3cw4jhsg5snrz.cloudfront.net/LandingPage/Node_Provisioning_and_Management_Guide.mp4"
                className="w-full h-full object-cover"
                controls
                autoPlay
                playsInline
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Landing;
