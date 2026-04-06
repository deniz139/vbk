// src/pages/AdminPanel.jsx
import { useState, useEffect } from 'react'
import { supabase, getStations, getAnswerStats, addQuestion } from '../lib/supabase'
import QRCode from '../components/QRCode'

export default function AdminPanel() {
  const [stations, setStations] = useState([])
  const [questions, setQuestions] = useState([])
  const [stats, setStats] = useState([])
  const [players, setPlayers] = useState([])
  const [qrStation, setQrStation] = useState(null)
  const [form, setForm] = useState({
    stationId: '', text: '', optA: '', optB: '', optC: '', optD: '',
    correctIndex: 0, points: 20
  })
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    const [s, q, a, p] = await Promise.all([
      getStations(),
      supabase.from('questions').select('*').order('created_at', { ascending: false }),
      getAnswerStats(),
      supabase.from('players').select('*'),
    ])
    setStations(s)
    setQuestions(q.data || [])
    setStats(a || [])
    setPlayers(p.data || [])
    if (s.length > 0 && !form.stationId) setForm(f => ({ ...f, stationId: s[0].id }))
  }

  const totalAnswers = stats.length
  const correctAnswers = stats.filter(a => a.is_correct).length
  const totalPoints = players.reduce((sum, p) => sum + (p.total_points || 0), 0)

  async function handleAddQuestion() {
    if (!form.text || !form.optA || !form.optB) return
    setSaving(true)
    try {
      await addQuestion({
        stationId: form.stationId,
        text: form.text,
        options: [form.optA, form.optB, form.optC, form.optD].filter(Boolean),
        correctIndex: parseInt(form.correctIndex),
        points: parseInt(form.points),
      })
      setSaveMsg('Kaydedildi!')
      setForm(f => ({ ...f, text: '', optA: '', optB: '', optC: '', optD: '' }))
      loadAll()
    } catch (e) {
      setSaveMsg('Hata: ' + e.message)
    }
    setSaving(false)
    setTimeout(() => setSaveMsg(''), 3000)
  }

  const baseUrl = window.location.origin

  return (
    <div className="admin-root">
      <div className="admin-header">
        <h1 className="admin-title">Admin Panel</h1>
        <a href="#/leaderboard" className="admin-link-btn">Leaderboard →</a>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card"><div className="stat-label">Katılımcı</div><div className="stat-num">{players.length}</div></div>
        <div className="stat-card"><div className="stat-label">Toplam cevap</div><div className="stat-num">{totalAnswers}</div></div>
        <div className="stat-card"><div className="stat-label">Doğru oran</div><div className="stat-num">{totalAnswers ? Math.round(correctAnswers / totalAnswers * 100) : 0}%</div></div>
        <div className="stat-card"><div className="stat-label">Dağıtılan puan</div><div className="stat-num">{totalPoints}</div></div>
      </div>

      {/* Stations + QR */}
      <div className="section-title">Standlar</div>
      <div className="station-list">
        {stations.map(s => (
          <div key={s.id} className="station-row">
            <div className="station-dot-wrap">
              <div className={`station-dot ${s.active ? 'active' : ''}`} />
              <div>
                <div className="station-name">{s.name}</div>
                <div className="station-sub">
                  {questions.filter(q => q.station_id === s.id).length} soru •{' '}
                  {stats.filter(a => a.station_id === s.id).length} cevap
                </div>
              </div>
            </div>
            <button className="qr-btn" onClick={() => setQrStation(s)}>
              QR Üret
            </button>
          </div>
        ))}
      </div>

      {/* QR Modal */}
      {qrStation && (
        <div className="modal-overlay" onClick={() => setQrStation(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <p className="modal-sub">{qrStation.name}</p>
            <p className="modal-title">QR Kod</p>
            <QRCode value={`${baseUrl}/#/q/${qrStation.id}`} size={180} />
            <p className="modal-url">{baseUrl}/#/q/{qrStation.id}</p>
            <button className="modal-close" onClick={() => setQrStation(null)}>Kapat</button>
          </div>
        </div>
      )}

      {/* Add Question */}
      <div className="section-title" style={{ marginTop: 24 }}>Yeni soru ekle</div>
      <div className="form-card">
        <div className="form-row">
          <label>Stand</label>
          <select value={form.stationId} onChange={e => setForm(f => ({ ...f, stationId: e.target.value }))}>
            {stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="form-row">
          <label>Soru metni</label>
          <textarea
            placeholder="Zirve ile ilgili bir soru yaz..."
            value={form.text}
            onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
            rows={3}
          />
        </div>
        <div className="form-row">
          <label>Seçenekler</label>
          <div className="options-2col">
            {['optA', 'optB', 'optC', 'optD'].map((key, i) => (
              <div key={key} className="option-input-wrap">
                <span className={`option-letter-badge ${parseInt(form.correctIndex) === i ? 'correct' : ''}`}
                  onClick={() => setForm(f => ({ ...f, correctIndex: i }))}>
                  {String.fromCharCode(65 + i)}
                </span>
                <input
                  placeholder={i < 2 ? 'Gerekli' : 'Opsiyonel'}
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <p className="form-hint">Doğru cevap harfine tıkla</p>
        </div>
        <div className="form-row form-row-inline">
          <label>Puan</label>
          <select value={form.points} onChange={e => setForm(f => ({ ...f, points: e.target.value }))}>
            <option value="10">10 puan</option>
            <option value="20">20 puan</option>
            <option value="50">50 puan</option>
          </select>
        </div>
        <div className="form-actions">
          <button className="save-btn" onClick={handleAddQuestion} disabled={saving}>
            {saving ? 'Kaydediliyor...' : 'Soruyu Kaydet'}
          </button>
          {saveMsg && <span className={`save-msg ${saveMsg.startsWith('Hata') ? 'error' : ''}`}>{saveMsg}</span>}
        </div>
      </div>

      {/* Questions list */}
      <div className="section-title" style={{ marginTop: 24 }}>Mevcut sorular ({questions.length})</div>
      <div className="q-list">
        {questions.map(q => (
          <div key={q.id} className="q-row">
            <div className="q-row-station">{stations.find(s => s.id === q.station_id)?.name || q.station_id}</div>
            <div className="q-row-text">{q.text}</div>
            <div className="q-row-pts">{q.points}p</div>
          </div>
        ))}
      </div>
    </div>
  )
}
