// src/App.jsx
import { useState, useEffect } from 'react'
import QuestionScreen from './pages/QuestionScreen'
import AdminPanel from './pages/AdminPanel'
import Leaderboard from './pages/Leaderboard'
import BattleJoin from './pages/battle/BattleJoin'
import BattleScreen from './pages/battle/BattleScreen'
import BattleAdmin from './pages/battle/BattleAdmin'
import AttendanceCheckin from './pages/attendance/AttendanceCheckin'
import AttendanceAdmin from './pages/attendance/AttendanceAdmin'
import NetworkJoin from './pages/network/NetworkJoin'
import NetworkMatches from './pages/network/NetworkMatches'
import NetworkAdmin from './pages/network/NetworkAdmin'
import './index.css'

function getStationFromURL() {
  const path = window.location.pathname
  const match = path.match(/^\/q\/([^/?]+)/)
  return match ? match[1] : null
}

function getSessionFromURL() {
  const path = window.location.pathname
  const match = path.match(/^\/checkin\/([^/?]+)/)
  return match ? match[1] : null
}

function getPage() {
  const path = window.location.pathname
  if (path.startsWith('/q/')) return 'question'
  if (path.startsWith('/checkin/')) return 'checkin'
  if (path === '/admin') return 'admin'
  if (path === '/leaderboard') return 'leaderboard'
  if (path === '/battle/join') return 'battle-join'
  if (path === '/battle/admin') return 'battle-admin'
  if (path === '/battle') return 'battle-screen'
  if (path === '/attendance/admin') return 'attendance-admin'
  if (path === '/network/join') return 'network-join'
  if (path === '/network/matches') return 'network-matches'
  if (path === '/network/admin') return 'network-admin'
  return 'home'
}

export default function App() {
  const [page, setPage] = useState(getPage())
  const stationId = getStationFromURL()
  const sessionId = getSessionFromURL()

  useEffect(() => {
    const handler = () => setPage(getPage())
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [])

  if (page === 'question' && stationId) return <QuestionScreen stationId={stationId} />
  if (page === 'checkin' && sessionId) return <AttendanceCheckin sessionId={sessionId} />
  if (page === 'admin') return <AdminPanel />
  if (page === 'leaderboard') return <Leaderboard />
  if (page === 'battle-join') return <BattleJoin />
  if (page === 'battle-screen') return <BattleScreen />
  if (page === 'battle-admin') return <BattleAdmin />
  if (page === 'attendance-admin') return <AttendanceAdmin />
  if (page === 'network-join') return <NetworkJoin />
  if (page === 'network-matches') return <NetworkMatches />
  if (page === 'network-admin') return <NetworkAdmin />

  return (
    <div className="home">
      <h1>Zirve Gamification</h1>
      <div className="home-links">
        <a href="/q/tost">🍞 Snack QR (demo)</a>
        <a href="/admin">⚙️ Snack Admin</a>
        <a href="/leaderboard">🏆 Leaderboard</a>
        <a href="/battle/join">⚡ Prompt Battle — Katılımcı</a>
        <a href="/battle">⚡ Prompt Battle — Büyük Ekran</a>
        <a href="/battle/admin">⚡ Prompt Battle — Admin</a>
        <a href="/attendance/admin">📋 Yoklama Admin</a>
        <a href="/network/join">🤝 Networking — Profil Oluştur</a>
        <a href="/network/matches">🤝 Networking — Eşleşmelerim</a>
        <a href="/network/admin">🤝 Networking — Admin</a>
      </div>
    </div>
  )
}
