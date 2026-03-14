// src/pages/attendance/AttendanceCheckin.jsx
// URL: /checkin/:sessionId
import { useState, useEffect } from 'react'
import { getSession, findPlayerByName, checkIn } from '../../lib/attendance'

export default function AttendanceCheckin({ sessionId }) {
  const [session, setSession] = useState(null)
  const [step, setStep] = useState('loading')   // loading | name | suggest | done | already
  const [name, setName] = useState(() => localStorage.getItem('player_name') || '')
  const [suggestions, setSuggestions] = useState([])
  const [searching, setSearching] = useState(false)
  const [checkinTime, setCheckinTime] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getSession(sessionId)
      .then(s => { setSession(s); setStep('name') })
      .catch(() => setStep('error'))
  }, [sessionId])

  async function handleNameSubmit() {
    const n = name.trim()
    if (!n) return
    localStorage.setItem('player_name', n)
    setSearching(true)

    // Snack QR'dan tanınan oyuncu var mı?
    const matches = await findPlayerByName(n)
    setSearching(false)

    if (matches.length === 1 && matches[0].name.toLowerCase() === n.toLowerCase()) {
      // Tam eşleşme — direkt check-in
      await doCheckIn(n, matches[0].id)
    } else if (matches.length > 0) {
      // Birkaç öneri göster
      setSuggestions(matches)
      setStep('suggest')
    } else {
      // Yeni kayıt
      await doCheckIn(n, null)
    }
  }

  async function doCheckIn(n, playerId) {
    setError('')
    try {
      const result = await checkIn(sessionId, n, playerId)
      if (result.alreadyCheckedIn) {
        setStep('already')
      } else {
        setCheckinTime(new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }))
        setStep('done')
      }
    } catch (e) {
      setError('Hata oluştu: ' + e.message)
    }
  }

  return (
    <div className="q-root">
      <div className="q-card">

        {step === 'loading' && (
          <div className="q-section q-center"><div className="q-spinner" /></div>
        )}

        {step === 'error' && (
          <div className="q-section q-center">
            <p className="q-sub">Oturum bulunamadı. QR kodu tekrar okutun.</p>
          </div>
        )}

        {step === 'name' && session && (
          <div className="q-section">
            <div className="checkin-icon">📋</div>
            <div className="station-pill" style={{margin:'12px auto 4px',display:'block',textAlign:'center',width:'fit-content'}}>
              {session.name}
            </div>
            {session.starts_at && (
              <p style={{textAlign:'center',fontSize:13,color:'var(--text-muted)',marginBottom:20}}>
                {session.starts_at}
              </p>
            )}
            <label className="q-label">Adın</label>
            <input
              className="q-input"
              placeholder="Adını yaz..."
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleNameSubmit()}
              autoFocus
            />
            {error && <p className="q-error">{error}</p>}
            <button
              className="q-btn-primary"
              onClick={handleNameSubmit}
              disabled={searching || !name.trim()}
            >
              {searching ? 'Aranıyor...' : 'Katılımı Onayla ✓'}
            </button>
          </div>
        )}

        {step === 'suggest' && (
          <div className="q-section">
            <p style={{fontSize:15,fontWeight:500,marginBottom:6}}>Bu sen misin?</p>
            <p className="q-sub" style={{marginBottom:16}}>Snack QR'dan tanınan hesaplar:</p>
            <div className="q-options" style={{marginBottom:12}}>
              {suggestions.map(p => (
                <button key={p.id} className="q-option" onClick={() => doCheckIn(p.name, p.id)}>
                  <span className="q-option-letter">✓</span>
                  <span>
                    <span style={{fontWeight:500}}>{p.name}</span>
                    <span style={{fontSize:12,color:'var(--text-muted)',marginLeft:8}}>{p.total_points} puan</span>
                  </span>
                </button>
              ))}
            </div>
            <button className="q-option" style={{width:'100%'}} onClick={() => doCheckIn(name.trim(), null)}>
              <span className="q-option-letter">+</span>
              Hayır, "{name}" olarak devam et
            </button>
          </div>
        )}

        {step === 'done' && session && (
          <div className="q-section q-center">
            <div className="checkin-success-ring">
              <span style={{fontSize:32}}>✓</span>
            </div>
            <h2 className="q-title" style={{marginTop:16}}>Katılım onaylandı!</h2>
            <p style={{fontSize:16,fontWeight:500,color:'var(--purple)',marginTop:4}}>{name}</p>
            <div className="checkin-detail-box">
              <div className="checkin-detail-row">
                <span>Oturum</span>
                <span>{session.name}</span>
              </div>
              <div className="checkin-detail-row">
                <span>Saat</span>
                <span>{checkinTime}</span>
              </div>
            </div>
            <p className="q-sub" style={{marginTop:16}}>Sertifikan etkinlik sonunda admin tarafından oluşturulacak.</p>
          </div>
        )}

        {step === 'already' && session && (
          <div className="q-section q-center">
            <div style={{fontSize:48,marginBottom:16}}>👋</div>
            <h2 className="q-title">Zaten kayıtlısın!</h2>
            <p className="q-sub">{session.name} için katılımın daha önce alındı.</p>
          </div>
        )}

      </div>
    </div>
  )
}
