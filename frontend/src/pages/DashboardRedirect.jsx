import { useEffect } from 'react'

export default function DashboardRedirect() {
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' })
        if (!res.ok) { window.location.href = '/login'; return }
        const data = await res.json()
        if (data?.role === 'admin') window.location.href = '/admin'
        else if (data?.role === 'faculty') window.location.href = '/faculty'
        else window.location.href = '/student'
      } catch {
        window.location.href = '/login'
      }
    })()
  }, [])
  return null
}


