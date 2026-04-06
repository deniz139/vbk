// src/pages/attendance/AttendanceAdmin.jsx
import { useState, useEffect } from 'react'
import {
  getSessions, createSession,
  getAttendanceForSession, getAllAttendance,
  subscribeAttendance
} from '../../lib/attendance'
import QRCode from '../../components/QRCode'

export default function AttendanceAdmin() {
  const [sessions, setSessions] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const [attendance, setAttendance] = useState([])
  const [allAttendance, setAllAttendance] = useState([])
  const [qrSession, setQrSession] = useState(null)
  const [newName, setNewName] = useState('')
  const [newTime, setNewTime] = useState('')
  const [adding, setAdding] = useState(false)
  const [tab, setTab] = useState('sessions')  // sessions | all

  async function load() {
    const s = await getSessions()
    setSessions(s)
    if (!selectedSession && s.length > 0) setSelectedSession(s[0].id)
  }

  async function loadAttendance(sessionId) {
    if (!sessionId) return
    const a = await getAttendanceForSession(sessionId)
    setAttendance(a)
  }

  async function loadAll() {
    const a = await getAllAttendance()
    setAllAttendance(a)
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (selectedSession) loadAttendance(selectedSession)
  }, [selectedSession])

  useEffect(() => {
    if (tab === 'all') loadAll()
  }, [tab])

  useEffect(() => {
    if (!selectedSession) return
    const ch = subscribeAttendance(selectedSession, () => loadAttendance(selectedSession))
    return () => ch.unsubscribe()
  }, [selectedSession])

  async function handleAddSession() {
    if (!newName.trim()) return
    setAdding(true)
    const s = await createSession(newName.trim(), newTime || null)
    setSessions(prev => [...prev, s])
    setSelectedSession(s.id)
    setNewName('')
    setNewTime('')
    setAdding(false)
  }

  function exportCSV() {
    const rows = allAttendance.map(a =>
      `"${a.name}","${a.sessions?.name || ''}","${new Date(a.checked_in_at).toLocaleString('tr-TR')}"`
    )
    const csv = 'Ad,Oturum,Saat\n' + rows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'katilimci-listesi.csv'; a.click()
  }

  const baseUrl = window.location.origin
  const currentSession = sessions.find(s => s.id === selectedSession)

  // Oturuma göre unique katılımcı sayısı
  const sessionStats = sessions.map(s => ({
    ...s,
    count: allAttendance.filter(a => a.session_id === s.id).length
  }))

  return (
    <div className="admin-root">
      <div className="admin-header">
        <h1 className="admin-title">📋 Yoklama Admin</h1>
        <button className="admin-link-btn" onClick={exportCSV}>CSV İndir ↓</button>
      </div>

      {/* Tab bar */}
      <div className="att-tabs">
        <button className={`att-tab ${tab === 'sessions' ? 'active' : ''}`} onClick={() => setTab('sessions')}>
          Oturumlar
        </button>
        <button className={`att-tab ${tab === 'all' ? 'active' : ''}`} onClick={() => { setTab('all'); loadAll() }}>
          Tüm Katılımcılar
        </button>
        <button className={`att-tab ${tab === 'new' ? 'active' : ''}`} onClick={() => setTab('new')}>
          + Oturum Ekle
        </button>
      </div>

      {/* SESSIONS TAB */}
      {tab === 'sessions' && (
        <div>
          {/* Session seçici */}
          <div className="session-selector">
            {sessions.map(s => (
              <button
                key={s.id}
                className={`session-chip ${selectedSession === s.id ? 'active' : ''}`}
                onClick={() => setSelectedSession(s.id)}
              >
                {s.name}
                <span className="session-chip-count">
                  {allAttendance.filter(a => a.session_id === s.id).length}
                </span>
              </button>
            ))}
          </div>

          {currentSession && (
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <div>
                <span style={{fontSize:16,fontWeight:600}}>{currentSession.name}</span>
                {currentSession.starts_at && (
                  <span style={{fontSize:13,color:'var(--text-muted)',marginLeft:8}}>{currentSession.starts_at}</span>
                )}
              </div>
              <button className="qr-btn" onClick={() => setQrSession(currentSession)}>
                QR Göster
              </button>
            </div>
          )}

          {/* Katılımcı listesi */}
          <div className="att-list">
            {attendance.length === 0 && (
              <p style={{color:'var(--text-muted)',fontSize:14,padding:'16px 0'}}>
                Henüz katılımcı yok. QR kodu paylaş.
              </p>
            )}
            {attendance.map((a, i) => (
              <div key={a.id} className="att-row">
                <div className="att-rank">{attendance.length - i}</div>
                <div className="att-name">{a.name}</div>
                {a.players?.total_points > 0 && (
                  <div className="att-points">{a.players.total_points}p</div>
                )}
                <div className="att-time">
                  {new Date(a.checked_in_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>

          <div style={{marginTop:12,fontSize:13,color:'var(--text-muted)'}}>
            Toplam: <strong>{attendance.length}</strong> katılımcı
          </div>
        </div>
      )}

      {/* ALL TAB */}
      {tab === 'all' && (
        <div>
          <div className="stat-grid" style={{marginBottom:16}}>
            {sessionStats.map(s => (
              <div key={s.id} className="stat-card">
                <div className="stat-label">{s.name}</div>
                <div className="stat-num">{s.count}</div>
              </div>
            ))}
          </div>
          <div className="att-list">
            {allAttendance.map(a => (
              <div key={a.id} className="att-row">
                <div className="att-name">{a.name}</div>
                <div className="att-session-tag">{a.sessions?.name}</div>
                <div className="att-time">
                  {new Date(a.checked_in_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NEW SESSION TAB */}
      {tab === 'new' && (
        <div className="form-card">
          <div className="section-title" style={{marginBottom:12}}>Yeni oturum oluştur</div>
          <div className="form-row">
            <label>Oturum adı</label>
            <input
              placeholder="Örn: Akşam Oturumu"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
          </div>
          <div className="form-row">
            <label>Başlangıç saati (opsiyonel)</label>
            <input
              type="time"
              value={newTime}
              onChange={e => setNewTime(e.target.value)}
            />
          </div>
          <button className="save-btn" onClick={handleAddSession} disabled={adding || !newName.trim()}>
            {adding ? 'Oluşturuluyor...' : 'Oturum Oluştur'}
          </button>
        </div>
      )}

      {/* QR Modal */}
      {qrSession && (
        <div className="modal-overlay" onClick={() => setQrSession(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <p className="modal-sub">Katılım QR Kodu</p>
            <p className="modal-title">{qrSession.name}</p>
            <QRCode value={`${baseUrl}/#/checkin/${qrSession.id}`} size={180} />
            <p className="modal-url">{baseUrl}/#/checkin/{qrSession.id}</p>
            <button className="modal-close" onClick={() => setQrSession(null)}>Kapat</button>
          </div>
        </div>
      )}
    </div>
  )
}
