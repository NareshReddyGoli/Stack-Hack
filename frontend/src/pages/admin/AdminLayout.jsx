import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import './admin.css'
import LogoIcon from '../../components/LogoIcon'
import { CpuIcon, GearIcon, ClipboardIcon, PencilIcon, ChalkboardIcon, CalendarIcon, BanIcon, BuildingIcon, UsersIcon, GraduationCapIcon, LayersIcon, RefreshIcon, UserIcon } from '../../components/icons'

const navItems = [
  { to: '/admin/python-scheduler', label: 'Scheduler', Icon: CpuIcon },
  { to: '/admin/generate', label: 'Generate Timetable', Icon: GearIcon },
  { to: '/admin/timetables', label: 'Timetable List', Icon: ClipboardIcon },
  { to: '/admin/editor', label: 'Timetable Editor', Icon: PencilIcon },
  { to: '/admin/faculty', label: 'Faculty', Icon: ChalkboardIcon },
  { to: '/admin/faculty-timetables', label: 'Faculty Timetables', Icon: CalendarIcon },
  { to: '/admin/faculty-unavailability', label: 'Faculty Unavailability', Icon: BanIcon },
  { to: '/admin/available-rooms', label: 'Available Rooms', Icon: BuildingIcon },
  { to: '/admin/available-faculty', label: 'Available Faculty', Icon: UsersIcon },
  { to: '/admin/students', label: 'Students', Icon: GraduationCapIcon },
  { to: '/admin/templates', label: 'Timing Templates', Icon: LayersIcon },
  { to: '/admin/updates', label: 'Updates', Icon: RefreshIcon },
]

export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)

  async function ensureAdmin() {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' })
      if (!res.ok) throw new Error('auth')
      const data = await res.json()
      setUser(data)
      if (data?.role !== 'admin') navigate('/login')
    } catch {
      navigate('/login')
    }
  }
  useEffect(() => { ensureAdmin() }, [])

  async function logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } catch {}
    navigate('/login')
  }

  const crumbs = location.pathname.split('/').filter(Boolean)
  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="admin-box">
          <div className="admin-id">
            <span className="dot">●</span>
            <div className="admin-info">
              <div className="admin-title">Admin</div>
              <div className="admin-user"><span className="avatar-lite"><UserIcon size={14} /></span>{user?.email || user?.sub || ''}</div>
            </div>
          </div>
          <div className="admin-actions">
            <button className="btn btn-ghost small" onClick={logout}>Logout</button>
          </div>
        </div>
        <nav className="side-nav" aria-label="Admin">
          {navItems.map(i => (
            <NavLink key={i.to} to={i.to} end={i.end}>
              <span className="ico" aria-hidden>{i.Icon ? <i.Icon size={14} /> : null}</span> {i.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="main">
        <header className="topbar">
          <div className="breadcrumbs" aria-label="Breadcrumbs">
            {crumbs.map((c, idx) => (
              <span key={idx} className="crumb">{c}</span>
            ))}
          </div>
        </header>
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}


