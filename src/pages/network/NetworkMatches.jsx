// src/pages/network/NetworkMatches.jsx
import { useState, useEffect } from 'react'
import { getMatchesForProfile, getProfile } from '../../lib/network'
import { supabase } from '../../lib/supabase'

export default function NetworkMatches() {
  const [matches, setMatches] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [noMatches, setNoMatches] = useState(false)

  // URL'den id al: /network/matches?id=xxx
  const profileId = new URLSearchParams(window.location.search).get('id')
    || localStorage.getItem('network_profile_id')

  async function load() {
    if (!profileId) { setLoading(false); return }
    try {
      const [p, m] = await Promise.all([
        getProfile(profileId),
        getMatchesForProfile(profileId),
      ])
      setProfile(p)
      setMatches(m)
      setNoMatches(m.length === 0)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    // Realtime: yeni eşleşme gelince güncelle
    const ch = supabase
      .channel('matches-' + profileId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'network_matches' }, load)
      .subscribe()
    return () => ch.unsubscribe()
  }, [profileId])

  if (!profileId) return (
    <div className="q-root">
      <div className="q-card">
        <div className="q-section q-center">
          <p className="q-sub">Profil bulunamadı. <a href="/network/join" style={{color:'var(--purple)'}}>Profil oluştur →</a></p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="q-root" style={{alignItems:'flex-start',paddingTop:20}}>
      <div style={{width:'100%',maxWidth:480,margin:'0 auto'}}>

        {/* Header */}
        <div style={{padding:'0 4px 16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <h2 style={{fontSize:20,fontWeight:700}}>Eşleşmelerin 🤝</h2>
            {profile && <p style={{fontSize:13,color:'var(--text-muted)',marginTop:2}}>{profile.name}</p>}
          </div>
          <a href="/network/join" style={{fontSize:13,color:'var(--purple)',textDecoration:'none'}}>Profili güncelle</a>
        </div>

        {loading && (
          <div style={{textAlign:'center',padding:40}}>
            <div className="q-spinner" style={{margin:'0 auto'}} />
          </div>
        )}

        {!loading && noMatches && (
          <div className="q-card">
            <div className="q-section q-center">
              <div style={{fontSize:40,marginBottom:12}}>⏳</div>
              <h3 style={{fontSize:16,fontWeight:600,marginBottom:8}}>Henüz eşleşme yok</h3>
              <p className="q-sub">
                Admin eşleştirmeyi başlattığında eşleşmelerin burada görünecek.
                Bu sayfa otomatik güncellenir.
              </p>
            </div>
          </div>
        )}

        <div style={{display:'grid',gap:12}}>
          {matches.map(m => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>

      </div>
    </div>
  )
}

function MatchCard({ match }) {
  const other = match.other
  if (!other) return null

  const initials = other.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const colors = ['#534AB7','#D85A30','#1D9E75','#BA7517','#993556']
  const color = colors[other.name.charCodeAt(0) % colors.length]

  function formatLinkedIn(url) {
    if (!url) return null
    try {
      const u = url.startsWith('http') ? url : 'https://' + url
      return u
    } catch { return null }
  }

  return (
    <div className="match-card">
      <div className="match-card-header">
        <div className="match-avatar" style={{background: color + '22', color}}>
          {initials}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div className="match-name">{other.name}</div>
          {other.company && <div className="match-company">{other.company}</div>}
        </div>
        <div className="match-score-badge">
          {match.score} ortak
        </div>
      </div>

      {/* Ortak taglar */}
      <div style={{marginBottom:12}}>
        <div style={{fontSize:11,fontWeight:600,color:'var(--purple)',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.05em'}}>
          Ortak ilgi alanları
        </div>
        <div className="tag-cloud" style={{gap:5}}>
          {match.common_tags.map(t => (
            <span key={t} className="tag-cloud-btn selected" style={{cursor:'default',fontSize:12}}>
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Diğer taglar */}
      {other.interests?.filter(t => !match.common_tags.includes(t)).length > 0 && (
        <div style={{marginBottom:12}}>
          <div style={{fontSize:11,fontWeight:600,color:'var(--text-muted)',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.05em'}}>
            Diğer ilgi alanları
          </div>
          <div className="tag-cloud" style={{gap:5}}>
            {other.interests.filter(t => !match.common_tags.includes(t)).map(t => (
              <span key={t} className="tag-cloud-btn" style={{cursor:'default',fontSize:12}}>
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* LinkedIn */}
      {other.linkedin_url && (
        <a
          href={formatLinkedIn(other.linkedin_url)}
          target="_blank"
          rel="noopener noreferrer"
          className="linkedin-btn"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          LinkedIn'de bağlan
        </a>
      )}
    </div>
  )
}
