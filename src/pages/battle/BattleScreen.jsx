// src/pages/battle/BattleScreen.jsx
// Büyük ekrana (projektör/TV) açılacak sayfa
import { useState, useEffect, useRef } from 'react'
import {
  getActiveRound, getPromptsForRound, getVotesForRound,
  subscribeBattle, finishRound
} from '../../lib/battle'

export default function BattleScreen() {
  const [round, setRound] = useState(null)
  const [prompts, setPrompts] = useState([])
  const [votes, setVotes] = useState([])
  const [promptA, setPromptA] = useState(null)
  const [promptB, setPromptB] = useState(null)
  const [status, setStatus] = useState('waiting')
  const [winner, setWinner] = useState(null)
  const [totalSubmissions, setTotalSubmissions] = useState(0)
  const finishingRef = useRef(false)

  async function load() {
    const r = await getActiveRound()
    setRound(r)
    if (!r) { setStatus('waiting'); return }
    setStatus(r.status)

    const allPrompts = await getPromptsForRound(r.id)
    setPrompts(allPrompts)
    setTotalSubmissions(allPrompts.length)

    if (r.status === 'voting' || r.status === 'finished') {
      const a = allPrompts.find(p => p.id === r.prompt_a_id)
      const b = allPrompts.find(p => p.id === r.prompt_b_id)
      setPromptA(a || null)
      setPromptB(b || null)
      const v = await getVotesForRound(r.id)
      setVotes(v)
    }

    if (r.status === 'finished') {
      const win = allPrompts.find(p => p.id === r.winner_id)
      setWinner(win || null)
    }
  }

  useEffect(() => {
    load()
    const ch = subscribeBattle(() => load())
    return () => ch.unsubscribe()
  }, [])

  const votesA = votes.filter(v => v.prompt_id === promptA?.id).length
  const votesB = votes.filter(v => v.prompt_id === promptB?.id).length
  const totalVotes = votesA + votesB

  return (
    <div className="bs-root">

      {/* Header */}
      <div className="bs-header">
        <div className="bs-logo">⚡ Prompt Battle</div>
        {status === 'collecting' && (
          <div className="bs-pill collecting">
            {totalSubmissions} prompt gönderildi
          </div>
        )}
        {status === 'voting' && (
          <div className="bs-pill voting">
            {totalVotes} oy kullanıldı
          </div>
        )}
        {status === 'finished' && (
          <div className="bs-pill finished">Tur tamamlandı</div>
        )}
      </div>

      {/* WAITING */}
      {status === 'waiting' && (
        <div className="bs-center">
          <div className="bs-waiting-icon">⚡</div>
          <h1 className="bs-big-title">Prompt Battle</h1>
          <p className="bs-sub">Moderatör turu başlatmayı bekliyor...</p>
        </div>
      )}

      {/* COLLECTING */}
      {status === 'collecting' && round && (
        <div className="bs-center">
          <div className="bs-task-display">
            <div className="bs-task-label">Görev</div>
            <div className="bs-task-big">{round.task}</div>
          </div>
          <p className="bs-sub" style={{marginTop:32}}>Katılımcılar promptlarını gönderiyor...</p>
          <div className="bs-submissions-live">
            {prompts.slice(-6).map(p => (
              <div key={p.id} className="bs-submission-chip">
                <span className="bs-chip-name">{p.player_name}</span>
                <span className="bs-chip-text">{p.prompt_text.slice(0, 40)}…</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VOTING */}
      {status === 'voting' && promptA && promptB && (
        <div className="bs-battle-area">
          <div className="bs-task-strip">
            <span className="bs-task-label-small">Görev:</span>
            <span className="bs-task-inline">{round?.task}</span>
          </div>
          <div className="bs-vs-grid">
            {/* A */}
            <div className={`bs-prompt-card ${votesA > votesB ? 'leading' : ''}`}>
              <div className="bs-card-header">
                <div className="bs-card-letter a">A</div>
                <div className="bs-card-author">{promptA.player_name}</div>
              </div>
              <div className="bs-card-section">
                <div className="bs-card-label">Prompt</div>
                <div className="bs-card-prompt">{promptA.prompt_text}</div>
              </div>
              <div className="bs-card-divider" />
              <div className="bs-card-section">
                <div className="bs-card-label">Claude'un cevabı</div>
                <div className="bs-card-output">{promptA.output_text || '...'}</div>
              </div>
              <div className="bs-vote-bar-wrap">
                <div
                  className="bs-vote-bar a"
                  style={{ width: totalVotes ? `${Math.round(votesA / totalVotes * 100)}%` : '0%' }}
                />
                <span className="bs-vote-count">{votesA} oy ({totalVotes ? Math.round(votesA / totalVotes * 100) : 0}%)</span>
              </div>
            </div>

            <div className="bs-vs-badge">VS</div>

            {/* B */}
            <div className={`bs-prompt-card ${votesB > votesA ? 'leading' : ''}`}>
              <div className="bs-card-header">
                <div className="bs-card-letter b">B</div>
                <div className="bs-card-author">{promptB.player_name}</div>
              </div>
              <div className="bs-card-section">
                <div className="bs-card-label">Prompt</div>
                <div className="bs-card-prompt">{promptB.prompt_text}</div>
              </div>
              <div className="bs-card-divider" />
              <div className="bs-card-section">
                <div className="bs-card-label">Claude'un cevabı</div>
                <div className="bs-card-output">{promptB.output_text || '...'}</div>
              </div>
              <div className="bs-vote-bar-wrap">
                <div
                  className="bs-vote-bar b"
                  style={{ width: totalVotes ? `${Math.round(votesB / totalVotes * 100)}%` : '0%' }}
                />
                <span className="bs-vote-count">{votesB} oy ({totalVotes ? Math.round(votesB / totalVotes * 100) : 0}%)</span>
              </div>
            </div>
          </div>
          <p className="bs-vote-instruction">Telefonundan oy kullanın → <strong>{window.location.origin}/battle/join</strong></p>
        </div>
      )}

      {/* FINISHED */}
      {status === 'finished' && winner && (
        <div className="bs-center">
          <div className="bs-winner-badge">🏆</div>
          <h1 className="bs-big-title">Kazanan</h1>
          <div className="bs-winner-name">{winner.player_name}</div>
          <div className="bs-winner-prompt">"{winner.prompt_text}"</div>
          {winner.output_text && (
            <div className="bs-winner-output">{winner.output_text}</div>
          )}
          <div className="bs-winner-votes">
            {Math.max(votesA, votesB)} / {totalVotes} oy
          </div>
        </div>
      )}
    </div>
  )
}
