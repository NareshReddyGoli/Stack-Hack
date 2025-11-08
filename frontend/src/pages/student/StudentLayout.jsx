import { useEffect } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { UserIcon } from '../../components/icons'
import LogoIcon from '../../components/LogoIcon'

export default function StudentLayout() {
  const navigate = useNavigate()
  useEffect(() => { (async ()=>{
    try { const r=await fetch('/api/auth/me',{credentials:'include'}); if(!r.ok) throw 0; const d=await r.json(); if(d?.role!=='student') navigate('/login') } catch { navigate('/login') }
  })() }, [])
  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <Link to="/student" className="brand"><span className="dot">●</span> Student</Link>
        <nav className="side-nav">
          <NavLink to="/student" end>My Timetable</NavLink>
          <NavLink to="/student/notifications">Notifications</NavLink>
          <NavLink to="/student/download">Download</NavLink>
        </nav>
      </aside>
      <div className="main">
        <header className="topbar">
          <div />
          <div className="user-menu">
            <span className="avatar" aria-hidden><UserIcon size={16} /></span>
            <button className="btn btn-ghost" onClick={async ()=>{ await fetch('/api/auth/logout',{method:'POST',credentials:'include'}); navigate('/login') }}>Logout</button>
          </div>
        </header>
        <div className="content"><Outlet /></div>
      </div>
    </div>
  )
}


