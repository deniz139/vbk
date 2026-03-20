// src/pages/battle/BattleJoin.jsx
import { useState, useEffect } from 'react'
import { getActiveRound, submitPrompt } from '../../lib/battle'
import { subscribeBattle } from '../../lib/battle'

export default function BattleJoin() {
  const [round, setRound] = useState(null)
  const [step, setStep] = useState('loading') // loading | waiting | write | submitted | voting | finished
  const [name, setName] = useState(() => localStorage.getItem('battle_name') || '')
  const [prompt, setPrompt] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const charLimit = 280

  async function load() {
    const r = await getActiveRound()
    setRound(r)
    if (!r) { setStep('waiting'); return }

    if (r.status === 'collecting') {
      // Aynı turda daha önce prompt gönderdik mi?
      const sentRoundId = localStorage.getItem('battle_sent_round')
      if (sentRoundId === r.id) { setStep('submitted'); return }
      setStep(name ? 'write' : 'name')
    }
    else if (r.status === 'voting') setStep('voting')
    else if (r.status === 'finished') setStep('finished')
    else setStep('waiting')
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
    setSubmitting(true)
    setError('')
    try {
      await submitPrompt(round.id, name, prompt.trim())
      localStorage.setItem('battle_sent_round', round.id)
      setStep('submitted')
    } catch (e) {
      setError('Gönderilemedi, tekrar dene.')
    }
    setSubmitting(false)
  }

  return (
    <div className="q-root">
      <div className="q-card">

        {step === 'loading' && (
          <div className="q-section q-center">
            <div className="q-spinner" />
          </div>
        )}

        {step === 'waiting' && (
          <div className="q-section q-center">
            <div className="battle-icon">⚡</div>
            <h2 className="q-title" style={{marginTop:12}}>Prompt Battle</h2>
            <p className="q-sub">Tur henüz başlamadı.<br/>Moderatör başlatınca burada görünecek.</p>
            <div className="waiting-pulse" />
          </div>
        )}

        {step === 'name' && (
          <div className="q-section">
            <div className="battle-icon">⚡</div>
            <h2 className="q-title" style={{marginTop:12}}>Prompt Battle</h2>
            <p className="q-sub">Adını gir, promptunu yaz, kazan!</p>
            <label className="q-label">Adın</label>
            <input
              className="q-input"
              placeholder="Adını yaz..."
              defaultValue={name}
              onKeyDown={e => e.key === 'Enter' && saveName(e.target.value)}
              autoFocus
              id="name-field"
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
            <p className="q-sub">Promptun alındı. Moderatör iki promptu seçip büyük ekranda yarıştıracak.</p>
            <p className="q-sub" style={{marginTop:8}}>Oylama başlayınca bu ekran otomatik güncellenecek.</p>
            <div className="waiting-pulse" style={{marginTop:20}} />
          </div>
        )}

        {step === 'voting' && round && (
          <VotingStep round={round} name={name} onVoted={() => setStep('voted')} />
        )}

        {step === 'voted' && (
          <div className="q-section q-center">
            <div className="q-result-icon win" style={{fontSize:28}}>👍</div>
            <h2 className="q-title" style={{marginTop:12}}>Oyun kaydedildi!</h2>
            <p className="q-sub">Büyük ekranda sonucu izle.</p>
          </div>
        )}

        {step === 'finished' && (
          <div className="q-section q-center">
            <div className="battle-icon">🏆</div>
            <h2 className="q-title" style={{marginTop:12}}>Tur bitti!</h2>
            <p className="q-sub">Sonuçları büyük ekranda gör.<br/>Yeni tur başlayınca burada görünecek.</p>
          </div>
        )}

      </div>
    </div>
  )
}

function VotingStep({ round, name, onVoted }) {
  const [voted, setVoted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [prompts, setPrompts] = useState({ a: null, b: null })

  useEffect(() => {
    async function load() {
      const { getPromptsForRound, hasVoted } = await import('../../lib/battle')
      const all = await getPromptsForRound(round.id)
      const a = all.find(p => p.id === round.prompt_a_id)
      const b = all.find(p => p.id === round.prompt_b_id)
      setPrompts({ a, b })
      const already = await hasVoted(round.id)
      if (already) setVoted(true)
    }
    load()
  }, [round])

  async function vote(promptId) {
    setLoading(true)
    const { castVote } = await import('../../lib/battle')
    await castVote(round.id, promptId, name)
    setVoted(true)
    onVoted()
    setLoading(false)
  }

  if (voted) return (
    <div className="q-section q-center">
      <p className="q-sub">Oyun kaydedildi! Büyük ekranı izle.</p>
    </div>
  )

  return (
    <div className="q-section">
      <div className="battle-topbar">
        <span className="battle-pill">⚡ Oylama</span>
      </div>
      <p className="q-sub" style={{marginBottom:16}}>Hangi output daha iyi?</p>
      <div className="q-options">
        {[{ label: 'A', p: prompts.a }, { label: 'B', p: prompts.b }].map(({ label, p }) => p && (
          <button key={p.id} className="vote-card" onClick={() => vote(p.id)} disabled={loading}>
            <div className="vote-label">{label}</div>
            <div className="vote-output">{p.output_text || p.prompt_text}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
