// src/pages/network/NetworkAdmin.jsx
import { useState, useEffect } from 'react'
import { getAllProfiles, runMatchmaking, INTEREST_TAGS } from '../../lib/network'

export default function NetworkAdmin() {
  const [profiles, setProfiles] = useState([])
  const [running, setRunning] = useState(false)
  const [matchCount, setMatchCount] = useState(null)
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    const p = await getAllProfiles()
    setProfiles(p)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleMatchmaking() {
    setRunning(true)
    setMatchCount(null)
    try {
      const matches = await runMatchmaking()
      setMatchCount(matches.length)
      load()
    } catch (e) {
      alert('Hata: ' + e.message)
    }
    setRunning(false)
  }

  // Tag istatistikleri
  const tagStats = INTEREST_TAGS.map(tag => ({
    tag,
    count: profiles.filter(p => p.interests?.includes(tag)).length
  })).filter(t => t.count > 0).sort((a, b) => b.count - a.count)

  const filtered = filter
    ? profiles.filter(p =>
        p.name.toLowerCase().includes(filter.toLowerCase()) ||
        p.interests?.some(t => t.toLowerCase().includes(filter.toLowerCase()))
      )
    : profiles

  return (
    <div className="admin-root">
      <div className="admin-header">
        <h1 className="admin-title">🤝 Networking Admin</h1>
        <button
          className="save-btn"
          onClick={handleMatchmaking}
          disabled={running || profiles.length < 2}
        >
          {running ? 'Eşleştiriliyor...' : '⚡ Eşleştirmeyi Başlat'}
        </button>
      </div>

      {matchCount !== null && (
        <div style={{
          background:'var(--green-light)',borderRadius:'var(--radius-sm)',
          padding:'10px 16px',marginBottom:16,fontSize:14,color:'var(--green)'
        }}>
          ✓ {matchCount} eşleşme oluşturuldu! Katılımcılar telefonlarında görebilir.
        </div>
      )}

      {/* Stats */}
      <div className="stat-grid" style={{marginBottom:20}}>
        <div className="stat-card">
          <div className="stat-label">Profil sayısı</div>
          <div className="stat-num">{profiles.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">LinkedIn ekleyen</div>
          <div className="stat-num">{profiles.filter(p => p.linkedin_url).length}</div>
        </div>
      </div>

      {/* Top tags */}
      {tagStats.length > 0 && (
        <div style={{marginBottom:20}}>
          <div className="section-title" style={{marginBottom:10}}>Popüler ilgi alanları</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
            {tagStats.slice(0, 10).map(t => (
              <div key={t.tag} style={{
                background:'var(--purple-light)',color:'var(--purple-dark)',
                fontSize:12,padding:'4px 12px',borderRadius:20,fontWeight:500,
                display:'flex',gap:6,alignItems:'center'
              }}>
                {t.tag}
                <span style={{
                  background:'var(--purple)',color:'white',
                  borderRadius:10,padding:'1px 7px',fontSize:11
                }}>{t.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Profile list */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
        <div className="section-title">Profiller ({profiles.length})</div>
        <input
          style={{padding:'6px 12px',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',fontSize:13,width:180}}
          placeholder="İsim veya tag ara..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
      </div>

      {loading && <p style={{color:'var(--text-muted)',fontSize:14}}>Yükleniyor...</p>}

      <div style={{display:'grid',gap:8}}>
        {filtered.map(p => (
          <div key={p.id} style={{
            background:'var(--white)',border:'1px solid var(--border)',
            borderRadius:'var(--radius-sm)',padding:'12px 14px'
          }}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
              <div>
                <span style={{fontSize:14,fontWeight:600}}>{p.name}</span>
                {p.linkedin_url && (
                  <a
                    href={p.linkedin_url.startsWith('http') ? p.linkedin_url : 'https://' + p.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{marginLeft:8,fontSize:12,color:'var(--purple)',textDecoration:'none'}}
                  >
                    LinkedIn ↗
                  </a>
                )}
              </div>
              <span style={{fontSize:11,color:'var(--text-muted)'}}>
                {new Date(p.created_at).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'})}
              </span>
            </div>
            <div className="tag-cloud" style={{gap:5}}>
              {p.interests?.map(t => (
                <span key={t} className="tag-cloud-btn selected" style={{cursor:'default',fontSize:11}}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {profiles.length === 0 && !loading && (
        <p style={{color:'var(--text-muted)',fontSize:14,padding:'20px 0'}}>
          Henüz profil yok. Katılımcılar /network/join adresinden profil oluşturabilir.
        </p>
      )}
    </div>
  )
}
