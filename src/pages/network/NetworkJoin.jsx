// src/pages/network/NetworkJoin.jsx
import { useState, useEffect } from 'react'
import { createProfile, INTEREST_TAGS } from '../../lib/network'

export default function NetworkJoin() {
  const [step, setStep] = useState('form')   // form | done
  const [name, setName] = useState(() => localStorage.getItem('player_name') || '')
  const [linkedin, setLinkedin] = useState('')
  const [selected, setSelected] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [profileId, setProfileId] = useState(null)

  function toggleTag(tag) {
    setSelected(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  async function handleSubmit() {
    if (!name.trim() || selected.length === 0) {
      setError('Ad ve en az 1 ilgi alanı zorunlu.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const profile = await createProfile({
        name: name.trim(),
        linkedinUrl: linkedin.trim() || null,
        interests: selected,
      })
      localStorage.setItem('player_name', name.trim())
      localStorage.setItem('network_profile_id', profile.id)
      setProfileId(profile.id)
      setStep('done')
    } catch (e) {
      setError('Hata: ' + e.message)
    }
    setSaving(false)
  }

  return (
    <div className="q-root">
      <div className="q-card">

        {step === 'form' && (
          <div className="q-section">
            <div style={{textAlign:'center',marginBottom:20}}>
              <div style={{fontSize:40,marginBottom:8}}>🤝</div>
              <h2 className="q-title">Networking</h2>
              <p className="q-sub">Profilini oluştur, benzer insanlarla eşleş.</p>
            </div>

            <label className="q-label">Adın *</label>
            <input
              className="q-input"
              placeholder="Adını yaz..."
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />

            <label className="q-label">LinkedIn (opsiyonel)</label>
            <input
              className="q-input"
              placeholder="linkedin.com/in/kullanici-adi"
              value={linkedin}
              onChange={e => setLinkedin(e.target.value)}
            />

            <label className="q-label" style={{marginBottom:10}}>
              İlgi alanları * <span style={{color:'var(--text-muted)',fontWeight:400}}>({selected.length} seçildi)</span>
            </label>
            <div className="tag-cloud">
              {INTEREST_TAGS.map(tag => (
                <button
                  key={tag}
                  className={`tag-cloud-btn ${selected.includes(tag) ? 'selected' : ''}`}
                  onClick={() => toggleTag(tag)}
                  type="button"
                >
                  {tag}
                </button>
              ))}
            </div>

            {error && <p className="q-error" style={{marginTop:12}}>{error}</p>}

            <button
              className="q-btn-primary"
              style={{marginTop:20}}
              onClick={handleSubmit}
              disabled={saving || !name.trim() || selected.length === 0}
            >
              {saving ? 'Kaydediliyor...' : 'Profili Oluştur →'}
            </button>
          </div>
        )}

        {step === 'done' && (
          <div className="q-section q-center">
            <div style={{fontSize:48,marginBottom:12}}>✅</div>
            <h2 className="q-title">Profil oluşturuldu!</h2>
            <p className="q-sub">
              Networking oturumu başlayınca eşleşmelerin burada görünecek.
            </p>
            <div style={{
              background:'var(--purple-light)',borderRadius:'var(--radius-sm)',
              padding:'12px 16px',marginTop:16,width:'100%'
            }}>
              <div style={{fontSize:12,color:'var(--purple)',fontWeight:600,marginBottom:4}}>Seçtiğin ilgi alanları</div>
              <div className="tag-cloud" style={{gap:6}}>
                {selected.map(t => (
                  <span key={t} className="tag-cloud-btn selected" style={{cursor:'default',fontSize:12}}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <button
              className="q-btn-primary"
              style={{marginTop:20}}
              onClick={() => window.location.href = `/network/matches?id=${profileId}`}
            >
              Eşleşmelerimi Gör →
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
