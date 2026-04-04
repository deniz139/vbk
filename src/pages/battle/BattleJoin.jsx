// src/pages/battle/BattleJoin.jsx
import { useState, useEffect } from 'react'
import { getActiveRound, submitPrompt, subscribeBattle, getPromptsForRound } from '../../lib/battle'

export default function BattleJoin() {
  const [round, setRound] = useState(null)
  const [step, setStep] = useState('loading')
  const [name, setName] = useState(() => localStorage.getItem('battle_name') || '')
  const [prompt, setPrompt] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [winner, setWinner] = useState(null)
  const charLimit = 280

  async function load() {
    const r = await getActiveRound()
    setRound(r)
    if (!r) { setStep('waiting'); return }

    if (r.status === 'collecting') {
      const sentRoundId = localStorage.getItem('battle_sent_round')
      if (sentRoundId === r.id) { setStep('submitted'); return }
      setStep(name ? 'write' : 'name')
    } else if (r.status === 'presenting') {
      setStep('presenting')
    } else if (r.status === 'finished') {
      // Kazananı bul
      if (r.winner_id) {
        const prompts = await getPromptsForRound(r.id)
        const w = prompts.find(p => p.id === r.winner_id)
        setWinner(w || null)
      }
      setStep('finished')
    } else {
      setStep('waiting')
    }
  }

  useEffect(() => {
    load()
    const ch = subscribeBattle(() => load())
    return () => ch.unsubscribe()
  }, [])

  function saveName(n) {
    localStorage.setItem('battle_name', n)
    setName(n)
    setStep('write')
  }

  async function handleSubmit() {
    if (!prompt.trim() || !round) return
    setSubmitting(true); setError('')
    try {
      await submitPrompt(round.id, name, prompt.trim())
      localStorage.setItem('battle_sent_round', round.id)
      setStep('submitted')
    } catch (e) { setError('Gönderilemedi, tekrar dene.') }
    setSubmitting(false)
  }

  return (
    <div className="q-root">
      <div className="q-card">

        {step === 'loading' && (
          <div className="q-section q-center"><div className="q-spinner" /></div>
        )}

        {step === 'waiting' && (
          <div className="q-section q-center">
            <div style={{fontSize:48,marginBottom:12}}>⚡</div>
            <h2 className="q-title">Prompt Battle</h2>
            <p className="q-sub">Tur henüz başlamadı. Moderatör başlatınca burada görünecek.</p>
            <div className="waiting-pulse" />
          </div>
        )}

        {step === 'name' && (
          <div className="q-section">
            <div style={{textAlign:'center',marginBottom:20}}>
              <div style={{fontSize:40,marginBottom:8}}>⚡</div>
              <h2 className="q-title">Prompt Battle</h2>
              <p className="q-sub">Adını gir, promptunu yaz, kazan!</p>
            </div>
            <label className="q-label">Adın</label>
            <input
              className="q-input"
              placeholder="Adını yaz..."
              defaultValue={name}
              id="name-field"
              onKeyDown={e => e.key === 'Enter' && saveName(e.target.value.trim())}
              autoFocus
            />
            <button className="q-btn-primary" onClick={() => {
              const v = document.getElementById('name-field').value.trim()
              if (v) saveName(v)
            }}>Devam →</button>
          </div>
        )}

        {step === 'write' && round && (
          <div className="q-section">
            <div className="battle-topbar">
              <span className="battle-pill">⚡ Prompt Battle</span>
              <span className="battle-player">{name}</span>
            </div>
            <div className="battle-task-box">
              <div className="battle-task-label">Görev</div>
              <div className="battle-task-text">{round.task}</div>
            </div>
            <label className="q-label" style={{marginTop:16}}>Promptunu yaz</label>
            <textarea
              className="battle-textarea"
              placeholder="En iyi promptu yaz..."
              value={prompt}
              onChange={e => setPrompt(e.target.value.slice(0, charLimit))}
              autoFocus
              rows={5}
            />
            <div className="char-count">{prompt.length}/{charLimit}</div>
            {error && <p className="q-error">{error}</p>}
            <button
              className="q-btn-primary"
              onClick={handleSubmit}
              disabled={submitting || !prompt.trim()}
            >
              {submitting ? 'Gönderiliyor...' : 'Promptu Gönder ⚡'}
            </button>
          </div>
        )}

        {step === 'submitted' && (
          <div className="q-section q-center">
            <div className="q-result-icon win" style={{fontSize:32}}>✓</div>
            <h2 className="q-title" style={{marginTop:12}}>Gönderildi!</h2>
            <p className="q-sub">Promptun alındı. Moderatör seçim yapıp ekranda gösterecek.</p>
            <div className="waiting-pulse" style={{marginTop:20}} />
          </div>
        )}

        {step === 'presenting' && (
          <div className="q-section q-center">
            <div style={{fontSize:48,marginBottom:12}}>🎬</div>
            <h2 className="q-title">Sunum başladı!</h2>
            <p className="q-sub">Promptlar büyük ekranda gösteriliyor. Etrafındaki ekranı izle!</p>
          </div>
        )}

        {step === 'finished' && (
          <div className="q-section q-center">
            <div style={{fontSize:56,marginBottom:8}}>🏆</div>
            <h2 className="q-title">Kazanan!</h2>
            {winner ? (
              <div style={{
                background:'rgba(239,159,39,0.1)',border:'1px solid rgba(239,159,39,0.3)',
                borderRadius:12,padding:'16px 20px',marginTop:12,width:'100%',textAlign:'left'
              }}>
                <div style={{fontSize:18,fontWeight:700,color:'var(--gold)',marginBottom:6}}>{winner.player_name}</div>
                <div style={{fontSize:14,fontStyle:'italic',color:'var(--text-muted)',marginBottom:winner.output_text?10:0}}>
                  "{winner.prompt_text}"
                </div>
                {winner.output_text && (
                  <div style={{fontSize:14,lineHeight:1.6,color:'var(--text)'}}>{winner.output_text}</div>
                )}
              </div>
            ) : (
              <p className="q-sub" style={{marginTop:8}}>Kazanan büyük ekranda duyurulacak.</p>
            )}
            <p className="q-sub" style={{marginTop:16,fontSize:13}}>Yeni tur başlayınca burada görünecek.</p>
          </div>
        )}

      </div>
    </div>
  )
}
