// src/pages/battle/BattleScreen.jsx
import { useState, useEffect } from 'react'
import { getActiveRound, getPromptsForRound, subscribeBattle } from '../../lib/battle'

export default function BattleScreen() {
  const [round, setRound] = useState(null)
  const [prompts, setPrompts] = useState([])
  const [status, setStatus] = useState('waiting')
  const [currentPrompt, setCurrentPrompt] = useState(null)
  const [winner, setWinner] = useState(null)
  const [totalSubmissions, setTotalSubmissions] = useState(0)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [total, setTotal] = useState(0)

  async function load() {
    const r = await getActiveRound()
    setRound(r)
    if (!r) { setStatus('waiting'); return }
    setStatus(r.status)

    const allPrompts = await getPromptsForRound(r.id)
    setPrompts(allPrompts)
    setTotalSubmissions(allPrompts.length)

    if (r.status === 'presenting' && r.selected_prompt_ids?.length > 0) {
      const idx = r.current_display_idx || 0
      setCurrentIdx(idx)
      setTotal(r.selected_prompt_ids.length)
      const p = allPrompts.find(p => p.id === r.selected_prompt_ids[idx])
      setCurrentPrompt(p || null)
    }

    if (r.status === 'finished' && r.winner_id) {
      const win = allPrompts.find(p => p.id === r.winner_id)
      setWinner(win || null)
    }
  }

  useEffect(() => {
    load()
    const ch = subscribeBattle(() => load())
    return () => ch.unsubscribe()
  }, [])

  return (
    <div className="bs-root">
      <div className="bs-header">
        <div className="bs-logo">⚡ Prompt Battle</div>
        {status === 'collecting' && <div className="bs-pill collecting">{totalSubmissions} prompt gönderildi</div>}
        {status === 'presenting' && <div className="bs-pill voting">{currentIdx+1} / {total}</div>}
        {status === 'finished' && <div className="bs-pill finished">Tur tamamlandı</div>}
      </div>

      {status === 'waiting' && (
        <div className="bs-center">
          <div className="bs-waiting-icon">⚡</div>
          <h1 className="bs-big-title">Prompt Battle</h1>
          <p className="bs-sub">Moderatör turu başlatmayı bekliyor...</p>
        </div>
      )}

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
                <span className="bs-chip-text">{p.prompt_text.slice(0,40)}…</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {status === 'presenting' && currentPrompt && (
        <div className="bs-center" style={{maxWidth:800,margin:'0 auto',width:'100%'}}>
          <div style={{fontSize:13,color:'var(--text-muted)',marginBottom:16,textTransform:'uppercase',letterSpacing:'0.08em',fontWeight:600}}>
            {currentIdx+1} / {total}
          </div>
          <div style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:20,padding:'40px 48px',width:'100%',textAlign:'left'}}>
            <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:28}}>
              <div style={{width:52,height:52,borderRadius:'50%',background:'var(--purple-dark)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:800,flexShrink:0}}>
                {currentIdx+1}
              </div>
              <div>
                <div style={{fontSize:20,fontWeight:700}}>{currentPrompt.player_name}</div>
              </div>
            </div>
            <div style={{fontSize:18,fontStyle:'italic',color:'rgba(255,255,255,0.7)',marginBottom:28,lineHeight:1.6,borderLeft:'3px solid var(--purple)',paddingLeft:16}}>
              "{currentPrompt.prompt_text}"
            </div>
            {currentPrompt.output_text && (
              <div>
                <div style={{fontSize:12,fontWeight:600,color:'var(--purple)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:12}}>Output</div>
                <div style={{fontSize:18,lineHeight:1.7,color:'rgba(255,255,255,0.9)'}}>{currentPrompt.output_text}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {status === 'finished' && winner && (
        <div className="bs-center">
          <div className="bs-winner-badge">🏆</div>
          <h1 className="bs-big-title">Kazanan</h1>
          <div className="bs-winner-name">{winner.player_name}</div>
          <div className="bs-winner-prompt">"{winner.prompt_text}"</div>
          {winner.output_text && (
            <div className="bs-winner-output">{winner.output_text}</div>
          )}
        </div>
      )}

      {status === 'finished' && !winner && (
        <div className="bs-center">
          <div className="bs-waiting-icon">⚡</div>
          <h1 className="bs-big-title">Prompt Battle</h1>
          <p className="bs-sub">Moderatör turu başlatmayı bekliyor...</p>
        </div>
      )}
    </div>
  )
}
