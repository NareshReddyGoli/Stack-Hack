import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import './Landing.css'
import { RocketIcon, RobotIcon, ChalkboardIcon, BuildingIcon, RefreshIcon, ClipboardIcon, ChartIcon, FolderIcon, GearIcon, TargetIcon, CheckCircleIcon, LightningIcon, UsersIcon, HeartIcon, CloudIcon, ShieldIcon } from '../components/icons'

export default function Landing() {
  const [user, setUser] = useState(null)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          setUser(data)
        }
      } catch {}
    })()

    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const ctaHref = user ? '/dashboard' : '/signup'

  return (
    <main className="landing-main">
      {/* Animated Background */}
      <div className="animated-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      {/* Hero Section */}
      <section className="hero" style={{ transform: `translateY(${scrollY * 0.3}px)` }}>
        <div className="hero-content">
          <div className="badge"><RocketIcon size={16} className="badge-logo" /> AI-Powered Scheduling System</div>
          <h1 className="hero-title">
            <span className="title-line">Transform Campus</span>
            <span className="title-line gradient-text">Scheduling Forever</span>
          </h1>
          <p className="hero-subtitle">
            Generate clash-free timetables in seconds using advanced constraint-based algorithms.
            Powered by Google OR-Tools and real-time optimization.
          </p>
          <div className="hero-buttons">
            <Link to={ctaHref} className="btn-hero btn-primary">
              <span>Get Started</span>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            {!user && (
              <Link to="/login" className="btn-hero btn-secondary">
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-header">
          <span className="section-badge">Features</span>
          <h2 className="section-title">Everything You Need For Perfect Scheduling</h2>
          <p className="section-description">
            Comprehensive tools designed for modern educational institutions
          </p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <div className="feature-icon"><RobotIcon size={24} /></div>
            </div>
            <h3>AI-Powered Algorithm</h3>
            <p>Advanced constraint-satisfaction solver using Google OR-Tools CP-SAT for optimal scheduling</p>
            <div className="feature-hover-gradient"></div>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <div className="feature-icon"><ChalkboardIcon size={24} /></div>
            </div>
            <h3>Faculty Management</h3>
            <p>Track workload distribution, availability, and assign courses with intelligent conflict detection</p>
            <div className="feature-hover-gradient"></div>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <div className="feature-icon"><BuildingIcon size={24} /></div>
            </div>
            <h3>Room Allocation</h3>
            <p>Automatic classroom assignment respecting capacity, lab requirements, and room stickiness</p>
            <div className="feature-hover-gradient"></div>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <div className="feature-icon"><RefreshIcon size={24} /></div>
            </div>
            <h3>Real-time Sync</h3>
            <p>Live updates via Socket.IO keep everyone informed instantly about schedule changes</p>
            <div className="feature-hover-gradient"></div>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <div className="feature-icon"><ClipboardIcon size={24} /></div>
            </div>
            <h3>CSV Import/Export</h3>
            <p>Bulk upload data with validation, download section-wise and faculty-wise timetables</p>
            <div className="feature-hover-gradient"></div>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <div className="feature-icon"><ChartIcon size={24} /></div>
            </div>
            <h3>Analytics Dashboard</h3>
            <p>Visualize faculty load, room utilization, and identify optimization opportunities</p>
            <div className="feature-hover-gradient"></div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="workflow-section">
        <div className="section-header">
          <span className="section-badge">Workflow</span>
          <h2 className="section-title">Generate Timetables in 4 Simple Steps</h2>
        </div>
        <div className="workflow-steps">
          <div className="workflow-step">
            <div className="step-number">01</div>
            <div className="step-content">
              <h3>Import Your Data</h3>
              <p>Upload CSV files for courses, sections, faculty, rooms, and constraints. Our system validates everything instantly.</p>
            </div>
            <div className="step-visual"><FolderIcon size={24} /></div>
          </div>
          <div className="workflow-connector"></div>
          <div className="workflow-step">
            <div className="step-number">02</div>
            <div className="step-content">
              <h3>Configure Templates</h3>
              <p>Set timing constraints: period lengths, break windows, lunch slots, and workload limits per faculty.</p>
            </div>
            <div className="step-visual"><GearIcon size={24} /></div>
          </div>
          <div className="workflow-connector"></div>
          <div className="workflow-step">
            <div className="step-number">03</div>
            <div className="step-content">
              <h3>Generate & Optimize</h3>
              <p>Click generate and watch the solver work in real-time. Lock critical slots and re-optimize as needed.</p>
            </div>
            <div className="step-visual"><TargetIcon size={24} /></div>
          </div>
          <div className="workflow-connector"></div>
          <div className="workflow-step">
            <div className="step-number">04</div>
            <div className="step-content">
              <h3>Publish & Notify</h3>
              <p>Review the final timetable, publish it system-wide, and notify all students and faculty instantly.</p>
            </div>
            <div className="step-visual"><CheckCircleIcon size={24} /></div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-box">
            <div className="stat-icon"><LightningIcon size={20} /></div>
            <div className="stat-value">30 sec</div>
            <div className="stat-text">Average Generation Time</div>
          </div>
          <div className="stat-box">
            <div className="stat-icon"><TargetIcon size={20} /></div>
            <div className="stat-value">100%</div>
            <div className="stat-text">Conflict-Free Schedules</div>
          </div>
          <div className="stat-box">
            <div className="stat-icon"><UsersIcon size={20} /></div>
            <div className="stat-value">500+</div>
            <div className="stat-text">Faculty Members Managed</div>
          </div>
          <div className="stat-box">
            <div className="stat-icon"><BuildingIcon size={20} /></div>
            <div className="stat-value">50+</div>
            <div className="stat-text">Institutions Using</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Transform Your Scheduling?</h2>
          <p className="cta-description">
            Join hundreds of institutions using our intelligent timetable generator.
            Start creating conflict-free schedules in minutes.
          </p>
          <div className="cta-buttons">
            <Link to="/signup" className="btn-cta btn-primary">
              Get Started Free
            </Link>
            <Link to="/login" className="btn-cta btn-outline">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-main">
            <div className="footer-col footer-brand">
              <div className="footer-logo">
                <div className="footer-logo-icon">
                  <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
                    <rect width="32" height="32" rx="8" fill="url(#footerGradient)"/>
                    <path d="M16 8L20 16H12L16 8Z" fill="white" opacity="0.9"/>
                    <path d="M10 18H22L19 24H13L10 18Z" fill="white"/>
                    <defs>
                      <linearGradient id="footerGradient" x1="0" y1="0" x2="32" y2="32">
                        <stop offset="0%" stopColor="#667eea"/>
                        <stop offset="100%" stopColor="#764ba2"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <div className="footer-logo-text">
                  <span className="footer-logo-main">CampusHub</span>
                  <span className="footer-logo-sub">AI Scheduler</span>
                </div>
              </div>
              <p className="footer-tagline">
                Advanced timetable generation system powered by constraint-based optimization and real-time scheduling.
              </p>
              <div className="social-links">
                <a href="#" className="social-link" aria-label="Twitter">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
                  </svg>
                </a>
                <a href="#" className="social-link" aria-label="GitHub">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
                <a href="#" className="social-link" aria-label="LinkedIn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a href="#" className="social-link" aria-label="Email">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </a>
              </div>
            </div>
            <div className="footer-col">
              <h4>Product</h4>
              <ul>
                <li><a href="#features">Features</a></li>
                <li><a href="#workflow">How It Works</a></li>
                <li><a href="/signup">Pricing</a></li>
                <li><a href="#">API Documentation</a></li>
                <li><a href="#">Changelog</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <ul>
                <li><a href="/about">About Us</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="/contact">Contact</a></li>
                <li><a href="#">Blog</a></li>
                <li><a href="#">Press Kit</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Resources</h4>
              <ul>
                <li><a href="/docs">Documentation</a></li>
                <li><a href="#">Tutorials</a></li>
                <li><a href="#">Community</a></li>
                <li><a href="#">Support</a></li>
                <li><a href="#">Status</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Legal</h4>
              <ul>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
                <li><a href="#">Cookie Policy</a></li>
                <li><a href="#">GDPR</a></li>
                <li><a href="#">Licenses</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p>&copy; 2024 CampusHub. All rights reserved. Built with <span className="inline-logo"><HeartIcon size={12} /></span> for educational institutions.</p>
            <div className="footer-badges">
              <span className="badge-item"><ShieldIcon size={14} /> Secure</span>
              <span className="badge-item"><LightningIcon size={14} /> Fast</span>
              <span className="badge-item"><CloudIcon size={14} /> Cloud-Ready</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}

