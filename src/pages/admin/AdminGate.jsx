// src/pages/admin/AdminGate.jsx
// /a/xxxx URL'lerini PIN ile korur
import { useState, useEffect } from 'react'

const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN || '1234'
const SESSION_KEY = 'admin_unlocked'

export default function AdminGate({ children }) {
  const [unlocked, setUnlocked] = useState(false)
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === 'true') setUnlocked(true)
  }, [])

  function handlePin(digit) {
    const next = pin + digit
    setPin(next)
    setError(false)
    if (next.length === 4) {
      if (next === ADMIN_PIN) {
        sessionStorage.setItem(SESSION_KEY, 'true')
        setUnlocked(true)
      } else {
        setShake(true)
        setError(true)
        setTimeout(() => { setPin(''); setShake(false) }, 600)
      }
    }
  }

  function handleDelete() {
    setPin(p => p.slice(0, -1))
    setError(false)
  }

  if (unlocked) return children

  return (
    <div className="pin-root">
      <div className={`pin-box ${shake ? 'shake' : ''}`}>
        <div className="pin-icon">🔐</div>
        <h2 className="pin-title">Admin Girişi</h2>
        <p className="pin-sub">4 haneli PIN kodunu gir</p>

        <div className="pin-dots">
          {[0,1,2,3].map(i => (
            <div key={i} className={`pin-dot ${pin.length > i ? 'filled' : ''} ${error ? 'error' : ''}`} />
          ))}
        </div>

        <div className="pin-grid">
          {[1,2,3,4,5,6,7,8,9].map(n => (
            <button key={n} className="pin-btn" onClick={() => handlePin(String(n))}>
              {n}
            </button>
          ))}
          <button className="pin-btn pin-btn-del" onClick={handleDelete}>⌫</button>
          <button className="pin-btn" onClick={() => handlePin('0')}>0</button>
          <div />
        </div>

        {error && <p className="pin-error">Yanlış PIN, tekrar dene</p>}
      </div>
    </div>
  )
}
