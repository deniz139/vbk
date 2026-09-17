import { useState, useEffect } from 'react'
import HomePage from './pages/HomePage'
import BattleJoin from './pages/battle/BattleJoin'
import BattleScreen from './pages/battle/BattleScreen'
import BattleAdmin from './pages/battle/BattleAdmin'
import AdminGate from './pages/admin/AdminGate'
import AdminHub from './pages/admin/AdminHub'
import NavBar from './components/NavBar'
import './index.css'
import logo from './assets/vbk_logo.png'

function getHashPath() {
  return window.location.hash.replace(/^#/, '') || '/'
}

function getPage() {
  const path = getHashPath()

  if (path === '/battle/join')       return 'battle-join'
  if (path === '/battle')            return 'battle-screen'
  if (path === '/a/battle')          return 'a-battle'
  if (path === '/a/battle-screen')   return 'a-battle-screen'
  if (path === '/panel')             return 'panel'
  if (path === '/a')                 return 'panel'
  return 'home'
}

const DARK_PAGES = [
  'home',
  'battle-screen',
  'battle-join',
  'panel',
]

export default function App() {
  const [page, setPage] = useState(getPage())

  useEffect(() => {
    if (!window.location.hash) {
      window.location.hash = '/'
    }

    const handler = () => setPage(getPage())
    window.addEventListener('hashchange', handler)

    return () => window.removeEventListener('hashchange', handler)
  }, [])

  useEffect(() => {
    if (DARK_PAGES.includes(page)) {
      document.body.classList.add('dark-theme')
    } else {
      document.body.classList.remove('dark-theme')
    }
  }, [page])

  const isDark = DARK_PAGES.includes(page)
  const showNav = page !== 'home' && page !== 'battle-screen' && page !== 'a-battle-screen'

  function renderPage() {
    if (page === 'battle-join') return <BattleJoin />
    if (page === 'battle-screen') return <BattleScreen />
    if (page === 'a-battle') return <AdminGate><BattleAdmin /></AdminGate>
    if (page === 'a-battle-screen') return <AdminGate><BattleScreen /></AdminGate>
    if (page === 'panel') return <AdminGate><AdminHub /></AdminGate>
    return <HomePage />
  }

  return (
  <>
    <img
      src={logo}
      className="app-logo"
      onClick={() => { window.location.hash = '/' }}
    />

    {showNav && <NavBar dark={isDark} />}
    {renderPage()}
  </>
)
}
