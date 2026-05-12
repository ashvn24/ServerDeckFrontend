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
  Zap
} from 'lucide-react';
import './Landing.css';

const Landing = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      // Logic for request access would go here
    }
  };

  const features = [
    {
      icon: <Server size={28} />,
      title: "Multi-Server Orchestration",
      description: "Manage your entire fleet of servers from a single, intuitive interface. No more jumping between consoles."
    },
    {
      icon: <Shield size={28} />,
      title: "Advanced Security",
      description: "Dynamic firewall management, automated SSL certificates, and audit logging to keep your infrastructure bulletproof."
    },
    {
      icon: <Terminal size={28} />,
      title: "Cloud Terminal",
      description: "A high-performance SSH terminal directly in your browser. Blazing fast, secure, and always accessible."
    },
    {
      icon: <Globe size={28} />,
      title: "Site & App Manager",
      description: "Deploy and manage web applications, databases, and static sites with automated configuration and monitoring."
    },
    {
      icon: <Activity size={28} />,
      title: "Real-time Monitoring",
      description: "Live resource tracking, automated log aggregation, and instant alerts when something needs your attention."
    },
    {
      icon: <Lock size={28} />,
      title: "Access Control",
      description: "Granular permissions and invite-based access to ensure only the right people have control over your data."
    }
  ];

  return (
    <div className="landing-container">
      <nav className="landing-nav">
        <div className="logo-section">
          <div className="cube-container" style={{ transform: 'scale(0.8)' }}>
            <div className="cube">
              <div className="cube-face face-front"></div>
              <div className="cube-face face-back"></div>
              <div className="cube-face face-right"></div>
              <div className="cube-face face-left"></div>
              <div className="cube-face face-top"></div>
              <div className="cube-face face-bottom"></div>
            </div>
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.2rem', marginLeft: '1rem' }}>SERVER DECK</span>
        </div>
        
        <div className="nav-links">
          <a href="#features" className="nav-link">Features</a>
          <a href="#about" className="nav-link">About</a>
          <Link to="/login" className="nav-link">Login</Link>
          <a href="#request" className="btn-primary">Request Access</a>
        </div>
      </nav>

      <section className="hero-section">
        <div className="hero-bg-glow"></div>
        <span className="section-label">Next Gen Infrastructure Control</span>
        <h1 className="hero-title">Master Your Infrastructure with Server Deck</h1>
        <p className="hero-subtitle">
          The ultimate control panel for developers and sysadmins. Unified management, 
          unmatched security, and real-time control over all your servers in one place.
        </p>
        
        <div className="hero-ctas">
          <a href="#request" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Get Started <ArrowRight size={18} />
          </a>
          <a href="#features" className="btn-secondary">Explore Features</a>
        </div>
      </section>

      <section id="features" className="features-section">
        <span className="section-label">Capabilities</span>
        <h2 className="section-title">Built for Performance & Security</h2>
        
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

      <section id="request" className="request-access-section">
        <div className="request-card">
          {!submitted ? (
            <>
              <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Request Early Access</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Join the waitlist for Server Deck and be the first to experience the future of server management.
              </p>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem' }}>
                  Request Invitation
                </button>
              </form>
            </>
          ) : (
            <div style={{ padding: '2rem 0' }}>
              <CheckCircle2 size={64} color="var(--accent-mint)" style={{ marginBottom: '1.5rem' }} />
              <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Request Received!</h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                We've added <strong>{email}</strong> to our priority waitlist. 
                We'll reach out as soon as a spot opens up.
              </p>
              <button 
                className="btn-secondary" 
                style={{ marginTop: '2rem' }}
                onClick={() => setSubmitted(false)}
              >
                Back
              </button>
            </div>
          )}
        </div>
      </section>

      <footer className="footer">
        <div className="footer-brand">
          <span style={{ fontWeight: 800, fontSize: '1rem' }}>SERVER DECK</span>
          <p className="copyright" style={{ marginTop: '0.5rem' }}>© 2026 Server Deck. All rights reserved.</p>
        </div>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <a href="#" className="nav-link">Privacy Policy</a>
          <a href="#" className="nav-link">Terms of Service</a>
          <a href="#" className="nav-link">Twitter</a>
          <a href="#" className="nav-link">GitHub</a>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
