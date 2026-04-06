// src/components/NavBar.jsx
export default function NavBar({ dark = false }) {
  const isHome = window.location.pathname === '/'

  if (isHome) return null

  return (
    <div className={`navbar ${dark ? 'navbar-dark' : 'navbar-light'}`}>
      <a href="#/" className="navbar-home-btn">
        ← Ana Menü
      </a>
    </div>
  )
}
