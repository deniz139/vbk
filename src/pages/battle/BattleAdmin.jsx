// src/pages/battle/BattleAdmin.jsx
import { useState, useEffect } from 'react'
import {
  getActiveRound, createRound, getPromptsForRound,
  selectBattlePair, finishRound, updateRoundStatus,
  runPromptWithClaude, saveClaudeOutput, subscribeBattle
} from '../../lib/battle'

export default function BattleAdmin() {
  const [round, setRound] = useState(null)
  const [prompts, setPrompts] = useState([])
  const [task, setTask] = useState('')
  const [creating, setCreating] = useState(false)
  const [selectedA, setSelectedA] = useState(null)
  const [selectedB, setSelectedB] = useState(null)
  const [running, setRunning] = useState(false)
  const [runStatus, setRunStatus] = useState('')
  const [status, setStatus] = useState('idle')

  async function load() {
    const r = await getActiveRound()
    setRound(r)
    if (r) {
      setStatus(r.status)
      const p = await getPromptsForRound(r.id)
      setPrompts(p)
    }
  }

  useEffect(() => {
    load()
    const ch = subscribeBattle(() => load())
    return () => ch.unsubscribe()
  }, [])

  async function handleCreate() {
    if (!task.trim()) return
    setCreating(true)
    const r = await createRound(task.trim())
    setRound(r)
    setStatus('collecting')
    setTask('')
    setCreating(false)
  }

  async function handleSelectAndRun() {
    if (!selectedA || !selectedB || !round) return
    setRunning(true)
    setRunStatus('Claude çalıştırılıyor...')

    try {
      // Her iki prompt için Claude'u çalıştır
      const pA = prompts.find(p => p.id === selectedA)
      const pB = prompts.find(p => p.id === selectedB)

      setRunStatus('A promptu işleniyor...')
      const outputA = await runClaudeLocal(round.task, pA.prompt_text)
      await saveClaudeOutput(selectedA, outputA)

      setRunStatus('B promptu işleniyor...')
      const outputB = await runClaudeLocal(round.task, pB.prompt_text)
      await saveClaudeOutput(selectedB, outputB)

      setRunStatus('Oylama başlatılıyor...')
      await selectBattlePair(round.id, selectedA, selectedB)
      setRunStatus('Oylama başladı!')
      setStatus('voting')
      load()
    } catch (e) {
      setRunStatus('Hata: ' + e.message)
    }
    setRunning(false)
  }

  async function runClaudeLocal(task, promptText) {
    const { runPromptWithClaude } = await import('../../lib/battle')
    return runPromptWithClaude(task, promptText)
  }

  async function handleFinish() {
    if (!round) return
    const pA = prompts.find(p => p.id === round.prompt_a_id)
    const pB = prompts.find(p => p.id === round.prompt_b_id)
    const winnerId = (pA?.votes || 0) >= (pB?.votes || 0) ? pA?.id : pB?.id
    await finishRound(round.id, winnerId)
    setStatus('finished')
    load()
  }

  async function handleReset() {
    if (round) await updateRoundStatus(round.id, 'finished')
    setRound(null)
    setPrompts([])
    setSelectedA(null)
    setSelectedB(null)
    setStatus('idle')
    setRunStatus('')
  }

  const canSelectPair = status === 'collecting' && prompts.length >= 2

  return (
    <div className="admin-root">
      <div className="admin-header">
        <h1 className="admin-title">⚡ Battle Admin</h1>
        <div style={{display:'flex',gap:8}}>
          <a href="/battle" target="_blank" className="admin-link-btn">Büyük Ekran ↗</a>
          <a href="/battle/join" target="_blank" className="admin-link-btn">Katılımcı Ekranı ↗</a>
        </div>
      </div>

      {/* Status indicator */}
      <div className="battle-status-bar">
        {['idle','collecting','voting','finished'].map(s => (
          <div key={s} className={`battle-status-step ${status === s ? 'active' : ''} ${
            ['idle','collecting','voting','finished'].indexOf(s) < ['idle','collecting','voting','finished'].indexOf(status) ? 'done' : ''
          }`}>
            {s === 'idle' && 'Bekliyor'}
            {s === 'collecting' && 'Prompt Toplama'}
            {s === 'voting' && 'Oylama'}
            {s === 'finished' && 'Bitti'}
          </div>
        ))}
      </div>

      {/* STEP 1: Create round */}
      {status === 'idle' && (
        <div className="form-card" style={{marginBottom:20}}>
          <div className="section-title" style={{marginBottom:12}}>Yeni tur başlat</div>
          <div className="form-row">
            <label>Görev / Task</label>
            <textarea
              placeholder="Örn: Bu yapay zeka zirvesi için etkileyici bir slogan yaz."
              value={task}
              onChange={e => setTask(e.target.value)}
              rows={3}
            />
          </div>
          <div className="form-row">
            <label style={{marginBottom:4}}>Hazır görev önerileri</label>
            <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
              {[
                'Bu zirve için 3 kelimelik bir slogan yaz.',
                'Yapay zekanın geleceğini bir metaforla açıkla.',
                'Bu etkinliği katılmamış birine 2 cümlede anlat.',
                'Bugünkü en önemli çıkarımı tek cümleyle özetle.',
              ].map(t => (
                <button key={t} className="tag-btn" onClick={() => setTask(t)}>{t}</button>
              ))}
            </div>
          </div>
          <button className="save-btn" onClick={handleCreate} disabled={creating || !task.trim()}>
            {creating ? 'Başlatılıyor...' : '⚡ Turu Başlat'}
          </button>
        </div>
      )}

      {/* STEP 2: Collecting prompts */}
      {status === 'collecting' && round && (
        <div>
          <div className="form-card" style={{marginBottom:16}}>
            <div className="battle-task-display">
              <span className="battle-task-label">Görev:</span>
              <span style={{fontWeight:500}}>{round.task}</span>
            </div>
            <p style={{fontSize:13,color:'var(--text-muted)',marginTop:8}}>
              Katılımcılar <strong>/battle/join</strong> adresinden prompt gönderiyor.
            </p>
          </div>

          {/* Prompt listesi */}
          <div className="section-title">Gelen promptlar ({prompts.length})</div>
          <div style={{display:'grid',gap:8,marginBottom:16}}>
            {prompts.map(p => (
              <div
                key={p.id}
                className={`prompt-select-card ${selectedA === p.id ? 'sel-a' : selectedB === p.id ? 'sel-b' : ''}`}
                onClick={() => {
                  if (selectedA === p.id) setSelectedA(null)
                  else if (selectedB === p.id) setSelectedB(null)
                  else if (!selectedA) setSelectedA(p.id)
                  else if (!selectedB) setSelectedB(p.id)
                  else { setSelectedA(p.id); setSelectedB(null) }
                }}
              >
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span className="ps-name">{p.player_name}</span>
                  {selectedA === p.id && <span className="sel-badge a">A</span>}
                  {selectedB === p.id && <span className="sel-badge b">B</span>}
                </div>
                <div className="ps-text">{p.prompt_text}</div>
              </div>
            ))}
            {prompts.length === 0 && (
              <p style={{color:'var(--text-muted)',fontSize:14,padding:'12px 0'}}>Henüz prompt gelmedi...</p>
            )}
          </div>

          {canSelectPair && (
            <div>
              {selectedA && selectedB ? (
                <div>
                  {runStatus && <p style={{fontSize:13,color:'var(--purple)',marginBottom:8}}>{runStatus}</p>}
                  <button className="save-btn" onClick={handleSelectAndRun} disabled={running}>
                    {running ? runStatus || 'İşleniyor...' : '⚡ Claude Çalıştır & Oylamayı Başlat'}
                  </button>
                </div>
              ) : (
                <p style={{fontSize:13,color:'var(--text-muted)'}}>
                  A ve B için birer prompt seç ({selectedA ? '✓ A seçildi' : 'A seçilmedi'}, {selectedB ? '✓ B seçildi' : 'B seçilmedi'})
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* STEP 3: Voting */}
      {status === 'voting' && round && (
        <div>
          <div className="form-card" style={{marginBottom:16}}>
            <p style={{fontSize:14,fontWeight:500,marginBottom:4}}>Oylama devam ediyor</p>
            <p style={{fontSize:13,color:'var(--text-muted)'}}>
              Katılımcılar oy kullanıyor. Yeterince oy toplandığında turu bitir.
            </p>
          </div>
          {/* Canlı oy sayısı */}
          <div className="stat-grid" style={{marginBottom:16}}>
            {[prompts.find(p=>p.id===round.prompt_a_id), prompts.find(p=>p.id===round.prompt_b_id)].map((p,i) => p && (
              <div key={p.id} className="stat-card">
                <div className="stat-label">{i===0?'A':'B'} — {p.player_name}</div>
                <div className="stat-num">{p.votes || 0} oy</div>
              </div>
            ))}
          </div>
          <button className="save-btn" onClick={handleFinish}>🏆 Turu Bitir & Kazananı İlan Et</button>
        </div>
      )}

      {/* STEP 4: Finished */}
      {status === 'finished' && (
        <div className="form-card">
          <p style={{fontSize:16,fontWeight:600,marginBottom:8}}>✅ Tur tamamlandı!</p>
          <p style={{fontSize:14,color:'var(--text-muted)',marginBottom:16}}>Yeni bir tur başlatmak için sıfırla.</p>
          <button className="save-btn" onClick={handleReset}>Yeni Tur Başlat</button>
        </div>
      )}

      {status !== 'idle' && (
        <button
          onClick={handleReset}
          style={{marginTop:16,background:'none',border:'none',color:'var(--text-muted)',fontSize:13,cursor:'pointer',textDecoration:'underline'}}
        >
          Turu sıfırla
        </button>
      )}
    </div>
  )
}
