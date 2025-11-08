import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import './Navbar.css'
import LogoIcon from './LogoIcon'
import { UserIcon } from './icons'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState(null)
  const navigate = useNavigate?.() || (()=>{})
  const location = useLocation?.() || { pathname: '' }
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' })
        if (!res.ok) return
        const data = await res.json()
        setUser(data)
      } catch {}
    })()
  }, [])

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', onScroll)
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function roleDashboardPath(role) {
    if (role === 'admin') return '/admin'
    if (role === 'faculty') return '/faculty'
    return '/student'
  }

  async function logout() {
    try { await fetch('/api/auth/logout', { method:'POST', credentials:'include' }) } catch {}
    setUser(null)
    navigate('/login')
  }
  const isHome = location.pathname === '/'
  const topClass = isHome && !scrolled ? 'top' : ''
  
  // Hide navbar on dashboard and auth pages
  const isDashboard = location.pathname.startsWith('/admin') || 
                      location.pathname.startsWith('/faculty') || 
                      location.pathname.startsWith('/student')
  
  const isAuthPage = location.pathname === '/login' || 
                     location.pathname === '/signup' ||
                     location.pathname === '/forgot-password' ||
                     location.pathname === '/verify-email'
  
  if (isDashboard || isAuthPage) return null
  
  return (
    <header className={`nav ${topClass}`}>
      <div className="nav-inner">
        <div className="nav-left">
          <Link to="/" className="logo" aria-label="Home">
            <div className="logo-icon">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="8" fill="url(#gradient)"/>
                <path d="M16 8L20 16H12L16 8Z" fill="white" opacity="0.9"/>
                <path d="M10 18H22L19 24H13L10 18Z" fill="white"/>
                <defs>
                  <linearGradient id="gradient" x1="0" y1="0" x2="32" y2="32">
                    <stop offset="0%" stopColor="#667eea"/>
                    <stop offset="100%" stopColor="#764ba2"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="logo-text">
              <span className="logo-main">CampusHub</span>
              <span className="logo-sub">AI Scheduler</span>
            </span>
          </Link>
        </div>
        <button
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="nav-menu"
          aria-label="Toggle navigation menu"
          onClick={() => setOpen(v => !v)}
        >
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
            <path d="M5 9h22M5 16h22M5 23h22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <nav id="nav-menu" className={`nav-center ${open ? 'open' : ''}`} aria-label="Primary">
          <a href="#features">Features</a>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/docs">Docs</NavLink>
        </nav>
        <div className={`nav-right ${open ? 'open' : ''}`}>
          {!user ? (
            <>
              <Link to="/login" className="btn btn-ghost">Login</Link>
              <Link to="/signup" className="btn btn-primary">Sign Up</Link>
            </>
          ) : (
            <>
              <Link to={roleDashboardPath(user.role)} className="btn btn-ghost">Dashboard</Link>
              <button className="btn user-chip" onClick={logout} title="Logout">
                <span className="avatar"><UserIcon size={18} /></span>{user?.user?.name || user?.user?.email || 'Account'}
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

