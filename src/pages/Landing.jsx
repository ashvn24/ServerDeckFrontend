import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Server, 
  Shield, 
  Terminal, 
  Globe, 
  Activity, 
  Lock, 
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  Cpu,
  Zap,
  BarChart3,
  Users,
  Database,
  Cloud,
  Check,
  MousePointer2,
  LayoutDashboard,
  Layers,
  Search,
  Command,
  Settings,
  AlertTriangle,
  Monitor,
  Fingerprint
} from 'lucide-react';
import './Landing.css';

const ProductPreview = () => (
  <div className="preview-card">
    <div className="preview-glow"></div>
    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff5f56' }}></div>
      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffbd2e' }}></div>
      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#27c93f' }}></div>
    </div>
    <div className="space-y-4">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ width: '40px', height: '40px', background: 'var(--accent-mint)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LayoutDashboard size={20} color="#000" />
        </div>
        <div style={{ height: '10px', width: '120px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px' }}></div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ height: '100px', background: 'rgba(212, 242, 212, 0.03)', border: '1px solid rgba(212, 242, 212, 0.1)', borderRadius: '20px', padding: '1rem' }}>
           <div style={{ width: '100%', height: '4px', background: 'var(--accent-mint)', borderRadius: '2px', opacity: 0.3, marginBottom: '1rem' }}></div>
           <div style={{ width: '60%', height: '4px', background: 'var(--accent-mint)', borderRadius: '2px', opacity: 0.3 }}></div>
        </div>
        <div style={{ height: '100px', background: 'rgba(139, 92, 246, 0.03)', border: '1px solid rgba(139, 92, 246, 0.1)', borderRadius: '20px', padding: '1rem' }}>
           <div style={{ width: '100%', height: '4px', background: 'var(--accent-violet)', borderRadius: '2px', opacity: 0.3, marginBottom: '1rem' }}></div>
           <div style={{ width: '80%', height: '4px', background: 'var(--accent-violet)', borderRadius: '2px', opacity: 0.3 }}></div>
        </div>
      </div>
      
      <div style={{ height: '120px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '1.5rem' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ height: '8px', width: '40px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}></div>
            <div style={{ height: '8px', width: '20px', background: 'var(--accent-mint)', borderRadius: '4px' }}></div>
         </div>
         <div style={{ height: '4px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginBottom: '0.8rem' }}></div>
         <div style={{ height: '4px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginBottom: '0.8rem' }}></div>
         <div style={{ height: '4px', width: '70%', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}></div>
      </div>
    </div>
  </div>
);

const AnalyticsPreview = () => (
  <div className="analytics-visual">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <h4 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Global Node Health</h4>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Telemetry aggregation active</p>
      </div>
      <div style={{ padding: '0.5rem 1rem', background: 'rgba(212, 242, 212, 0.1)', borderRadius: '12px', color: 'var(--accent-mint)', fontSize: '0.8rem', fontWeight: 800 }}>
        SYNCED
      </div>
    </div>
    <div className="chart-bar-container">
      {[40, 65, 85, 30, 95, 75, 55, 90, 60, 80, 45, 70].map((h, i) => (
        <div key={i} className="chart-bar">
          <div className="chart-bar-fill" style={{ height: `${h}%`, background: h > 80 ? 'var(--accent-violet)' : 'var(--accent-mint)' }}></div>
        </div>
      ))}
    </div>
    <div style={{ marginTop: '2.5rem', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
      <div className="glass-card" style={{ padding: '1rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
        <p style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>CPU</p>
        <p style={{ fontWeight: 800 }}>31%</p>
      </div>
      <div className="glass-card" style={{ padding: '1rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
        <p style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>RAM</p>
        <p style={{ fontWeight: 800 }}>54%</p>
      </div>
      <div className="glass-card" style={{ padding: '1rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
        <p style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>DISK</p>
        <p style={{ fontWeight: 800 }}>12%</p>
      </div>
      <div className="glass-card" style={{ padding: '1rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
        <p style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>PING</p>
        <p style={{ fontWeight: 800 }}>1ms</p>
      </div>
    </div>
  </div>
);

const Landing = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
    }
  };

  const steps = [
    {
      number: "01",
      title: "Connect Your Node",
      description: "Deploy our lightweight agent on any Ubuntu/Debian server with a single command. Secure handshake completes in seconds."
    },
    {
      number: "02",
      title: "Centralize Control",
      description: "Manage Nginx, Systemd, SSL, and files from a unified dashboard. No more SSH context switching or manual configs."
    },
    {
      number: "03",
      title: "Scale Automations",
      description: "Deploy sites, automate security patches, and monitor health across your entire cluster with enterprise-grade reliability."
    }
  ];

  const features = [
    {
      icon: <Terminal size={28} />,
      title: "Web-Native SSH",
      description: "Zero-latency terminal access directly in your browser. Encrypted, persistent, and session-aware for fast debugging."
    },
    {
      icon: <Shield size={28} />,
      title: "Security Hardening",
      description: "Automated UFW firewall management and one-click Let's Encrypt SSL provisioning to keep your edge secure."
    },
    {
      icon: <Layers size={28} />,
      title: "App Orchestration",
      description: "Full lifecycle management for Node.js (PM2), Python, and static sites. Deploy, restart, and monitor apps with ease."
    },
    {
      icon: <Activity size={28} />,
      title: "Unified Telemetry",
      description: "Real-time resource tracking and historical usage logs. Understand bottleneck patterns before they impact users."
    },
    {
      icon: <Fingerprint size={28} />,
      title: "Audit & Compliance",
      description: "Every action is logged. Track who did what and when across your entire infrastructure for complete accountability."
    },
    {
      icon: <Database size={28} />,
      title: "Data Integrity",
      description: "Automated backups and simplified database connectivity. Manage your data layer without the complexity."
    }
  ];

  return (
    <div className="landing-container">
      <nav className="landing-nav">
        <div className="logo-section">
          <div className="cube-container" style={{ transform: 'scale(0.7)' }}>
            <div className="cube">
              <div className="cube-face face-front"></div>
              <div className="cube-face face-back"></div>
              <div className="cube-face face-right"></div>
              <div className="cube-face face-left"></div>
              <div className="cube-face face-top"></div>
              <div className="cube-face face-bottom"></div>
            </div>
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.03em' }}>SERVER DECK</span>
        </div>
        
        <div className="nav-links">
          <a href="#process" className="nav-link">How it Works</a>
          <a href="#features" className="nav-link">Capabilities</a>
          <a href="#analytics" className="nav-link">Intelligence</a>
          <Link to="/login" className="nav-link">Login</Link>
          <a href="#request" className="btn-primary">Request Access</a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-bg-glow"></div>
        <div className="hero-content">
          <span className="section-label">Infrastructure Without Compromise</span>
          <h1 className="hero-title">Simplify Cloud. <br/>Scale Faster.</h1>
          <p className="hero-subtitle">
            Server Deck is the modern control panel for decentralized infrastructure. 
            Stop fighting with SSH and manual configs—start managing your fleet 
            with precision and automated security from a single window.
          </p>
          
          <div className="hero-ctas">
            <a href="#request" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Provision Early Access <ArrowRight size={18} />
            </a>
            <a href="#process" className="btn-secondary">Watch How it Works</a>
          </div>
        </div>
        <div className="hero-visual">
          <ProductPreview />
        </div>
      </section>

      {/* Trust Bar */}
      <section className="stats-section">
        <div className="stat-item">
          <span className="stat-value">99.99%</span>
          <span className="stat-label">Verified Uptime</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">12k+</span>
          <span className="stat-label">Nodes Indexed</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">5ms</span>
          <span className="stat-label">Global Latency</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">RSA</span>
          <span className="stat-label">Secured Access</span>
        </div>
      </section>

      {/* Problem/Why Section */}
      <section className="why-section" style={{ padding: '8rem 2rem', textAlign: 'center', maxWidth: '1200px', margin: '0 auto' }}>
        <span className="section-label">The Challenge</span>
        <h2 className="section-title">Infrastructure shouldn't be a bottleneck</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-16">
          <div className="p-8">
            <h4 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '1rem' }}>Fragile Configs</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manually editing Nginx and SSL configs leads to downtime and human error. Server Deck automates the complexity.</p>
          </div>
          <div className="p-8">
            <h4 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '1rem' }}>Hidden Security Gaps</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Open ports and expired certs are a massive risk. We enforce hardened security policies across your nodes by default.</p>
          </div>
          <div className="p-8">
            <h4 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '1rem' }}>Management Fatigue</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Context-switching between 10 different terminals is exhausting. Manage your entire stack in one unified UI.</p>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className="process-section" style={{ padding: '8rem 2rem', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <span className="section-label">Simplicity by Design</span>
          <h2 className="section-title">From zero to scaled in 3 steps</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            {steps.map(step => (
              <div key={step.number} className="p-10 glass-card relative overflow-hidden group hover:bg-white/5 transition-all">
                <span style={{ fontSize: '4rem', fontWeight: 900, opacity: 0.05, position: 'absolute', top: '-1rem', right: '1rem' }}>{step.number}</span>
                <h4 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>{step.title}</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>{step.description}</p>
                <div className="mt-8 flex items-center gap-2 text-[var(--accent-mint)] text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                  Learn More <ChevronRight size={14} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Intelligence Section */}
      <section id="analytics" className="analytics-section">
        <div className="analytics-grid">
          <AnalyticsPreview />
          <div className="analytics-text">
            <div className="feature-tag">Infrastructure Intelligence</div>
            <h2 className="section-title" style={{ marginBottom: '2rem' }}>Predictive Monitoring & Global Analytics</h2>
            <p className="feature-description" style={{ marginBottom: '2rem', fontSize: '1.1rem' }}>
              Get deep insights into your infrastructure health with our integrated telemetry engine. 
              Monitor CPU, RAM, and Network usage across your entire cluster with sub-second resolution.
            </p>
            <div className="space-y-6">
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div style={{ padding: '0.8rem', background: 'rgba(212, 242, 212, 0.1)', borderRadius: '16px' }}>
                  <Monitor size={24} color="var(--accent-mint)" />
                </div>
                <div>
                  <h4 style={{ fontWeight: 800, marginBottom: '0.4rem', fontSize: '1.1rem' }}>Real-time Visualization</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>Interactive charts and resource gauges give you a pulse on your system's vital signs instantly.</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                <div style={{ padding: '0.8rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '16px' }}>
                  <AlertTriangle size={24} color="var(--accent-violet)" />
                </div>
                <div>
                  <h4 style={{ fontWeight: 800, marginBottom: '0.4rem', fontSize: '1.1rem' }}>Anomaly Detection</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>Our agent detects unusual load patterns and provides early warnings before they escalate into outages.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="tech-section">
        <span className="section-label">Enterprise Interoperability</span>
        <div className="tech-grid">
          <div className="tech-item"><Database size={32} /> PostgreSQL</div>
          <div className="tech-item"><Cloud size={32} /> AWS</div>
          <div className="tech-item"><Cpu size={32} /> NVIDIA</div>
          <div className="tech-item"><Zap size={32} /> Redis</div>
          <div className="tech-item"><Server size={32} /> Nginx</div>
          <div className="tech-item"><Shield size={32} /> Cloudflare</div>
          <div className="tech-item"><Command size={32} /> CLI API</div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="features-section">
        <span className="section-label">Core Capabilities</span>
        <h2 className="section-title">Everything you need to ship safely</h2>
        
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon-wrapper">
                {feature.icon}
              </div>
              <h3 className="feature-name">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section id="request" className="request-access-section">
        <div className="request-card">
          {!submitted ? (
            <>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', fontWeight: 900 }}>Ready to take control?</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto 3rem' }}>
                Join the exclusive waitlist for Server Deck and transform your infrastructure from a liability into a competitive edge.
              </p>
              <form onSubmit={handleSubmit} style={{ maxWidth: '400px', margin: '0 auto' }}>
                <div className="form-group">
                  <label className="form-label">Professional Email Address</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1.2rem', marginTop: '1rem' }}>
                  Initialize My Invitation
                </button>
              </form>
            </>
          ) : (
            <div style={{ padding: '3rem 0' }}>
              <div className="w-20 h-20 bg-[var(--accent-mint)]/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
                 <CheckCircle2 size={40} color="var(--accent-mint)" />
              </div>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', fontWeight: 900 }}>Profile Queued</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                We've established a placeholder for <strong>{email}</strong>. 
                Our team will reach out once your provisioning window is ready.
              </p>
              <button 
                className="btn-secondary" 
                style={{ marginTop: '3rem' }}
                onClick={() => setSubmitted(false)}
              >
                Return to Overview
              </button>
            </div>
          )}
        </div>
      </section>

      <footer className="footer" style={{ padding: '6rem 2rem' }}>
        <div className="footer-brand">
          <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.03em' }}>SERVER DECK</span>
          <p className="copyright" style={{ marginTop: '1rem', opacity: 0.5 }}>© 2026 Server Deck Infrastructure. <br/>Global Scale. Local Control.</p>
        </div>
        <div style={{ display: 'flex', gap: '3rem' }}>
          <div className="flex flex-col gap-3">
             <span className="text-[10px] font-black uppercase tracking-[0.2em] mb-2">Platform</span>
             <a href="#" className="nav-link">Documentation</a>
             <a href="#" className="nav-link">Status Page</a>
             <a href="#" className="nav-link">API Reference</a>
          </div>
          <div className="flex flex-col gap-3">
             <span className="text-[10px] font-black uppercase tracking-[0.2em] mb-2">Company</span>
             <a href="#" className="nav-link">About Us</a>
             <a href="#" className="nav-link">Security</a>
             <a href="#" className="nav-link">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
