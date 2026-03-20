// src/App.jsx
import { useState, useEffect } from 'react'
import HomePage from './pages/HomePage'
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
import AdminGate from './pages/admin/AdminGate'
import AdminHub from './pages/admin/AdminHub'
import NavBar from './components/NavBar'
import './index.css'

function getStationFromURL() {
  const match = window.location.pathname.match(/^\/q\/([^/?]+)/)
  return match ? match[1] : null
}

function getSessionFromURL() {
  const match = window.location.pathname.match(/^\/checkin\/([^/?]+)/)
  return match ? match[1] : null
}

function getPage() {
  const path = window.location.pathname
  if (path.startsWith('/q/'))        return 'question'
  if (path.startsWith('/checkin/'))  return 'checkin'
  if (path === '/leaderboard')       return 'leaderboard'
  if (path === '/battle/join')       return 'battle-join'
  if (path === '/battle')            return 'battle-screen'
  if (path === '/network/join')      return 'network-join'
  if (path === '/network/matches')   return 'network-matches'
  if (path === '/a/snack')           return 'a-snack'
  if (path === '/a/battle')          return 'a-battle'
  if (path === '/a/attendance')      return 'a-attendance'
  if (path === '/a/network')         return 'a-network'
  if (path === '/a/battle-screen')   return 'a-battle-screen'
  if (path === '/panel')             return 'panel'
  if (path === '/a')                 return 'panel'
  return 'home'
}

// Hangi sayfalar dark tema kullanacak
const DARK_PAGES = ['home', 'leaderboard', 'battle-screen', 'a-battle-screen', 'question', 'checkin', 'battle-join', 'network-join', 'network-matches', 'a-snack', 'a-battle', 'a-attendance', 'a-network', 'panel']
// Hangi sayfalar admin (navbar gösterme ya da farklı)
const ADMIN_PAGES = ['a-snack', 'a-battle', 'a-attendance', 'a-network', 'panel']

export default function App() {
  const [page, setPage] = useState(getPage())
  const stationId = getStationFromURL()
  const sessionId = getSessionFromURL()

  useEffect(() => {
    const handler = () => setPage(getPage())
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [])

  // Dark tema body class
  useEffect(() => {
    if (DARK_PAGES.includes(page)) {
      document.body.classList.add('dark-theme')
    } else {
      document.body.classList.remove('dark-theme')
    }
  }, [page])

  const isDark = DARK_PAGES.includes(page)
  const isAdmin = ADMIN_PAGES.includes(page)
  const showNav = page !== 'home' && page !== 'battle-screen' && page !== 'a-battle-screen'

  function renderPage() {
    if (page === 'home')            return <HomePage />
    if (page === 'question' && stationId) return <QuestionScreen stationId={stationId} />
    if (page === 'checkin' && sessionId)  return <AttendanceCheckin sessionId={sessionId} />
    if (page === 'leaderboard')     return <Leaderboard />
    if (page === 'battle-join')     return <BattleJoin />
    if (page === 'battle-screen')   return <BattleScreen />
    if (page === 'network-join')    return <NetworkJoin />
    if (page === 'network-matches') return <NetworkMatches />
    if (page === 'a-snack')         return <AdminGate><AdminPanel /></AdminGate>
    if (page === 'a-battle')        return <AdminGate><BattleAdmin /></AdminGate>
    if (page === 'a-battle-screen') return <AdminGate><BattleScreen /></AdminGate>
    if (page === 'a-attendance')    return <AdminGate><AttendanceAdmin /></AdminGate>
    if (page === 'a-network')       return <AdminGate><NetworkAdmin /></AdminGate>
    if (page === 'panel')           return <AdminGate><AdminHub /></AdminGate>
    return <HomePage />
  }

  return (
    <>
      {showNav && <NavBar dark={isDark} />}
      {renderPage()}
    </>
  )
}
