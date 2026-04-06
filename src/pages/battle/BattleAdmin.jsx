// src/pages/battle/BattleAdmin.jsx
import { useState, useEffect, useRef } from 'react'
import {
  getActiveRound, createRound, getPromptsForRound,
  submitPrompt, updateRoundStatus, subscribeBattle, finishRound
} from '../../lib/battle'
import { supabase } from '../../lib/supabase'

export default function BattleAdmin() {
  const [round, setRound] = useState(null)
  const [prompts, setPrompts] = useState([])
  const [task, setTask] = useState('')
  const [creating, setCreating] = useState(false)
  const [status, setStatus] = useState('idle')
  const [selectedIds, setSelectedIds] = useState([])
  const [outputs, setOutputs] = useState({})
  const [saving, setSaving] = useState({})
  const [saveMsg, setSaveMsg] = useState('')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [fakeForm, setFakeForm] = useState({ name: '', prompt: '' })
  const [addingFake, setAddingFake] = useState(false)
  const deletedIdsRef = useRef(new Set()) // Silinen ID'leri tut

  async function loadPrompts(roundId, keepSelections = false) {
    const p = await getPromptsForRound(roundId)
    // Silinmiş olanları filtrele
    const filtered = p.filter(pr => !deletedIdsRef.current.has(pr.id))
    setPrompts(filtered)
    const outs = {}
    filtered.forEach(pr => { if (pr.output_text) outs[pr.id] = pr.output_text })
    setOutputs(prev => ({...prev, ...outs}))
    if (!keepSelections) {
      if (filtered.length > 0) setSelectedIds([])
    } else {
      // Silinmiş olanları seçimden çıkar
      setSelectedIds(prev => prev.filter(id => !deletedIdsRef.current.has(id)))
    }
  }

  async function load(keepSelections = false) {
    const r = await getActiveRound()
    setRound(r)
    if (r && r.status !== 'finished') {
      setStatus(r.status)
      await loadPrompts(r.id, keepSelections)
      if (r.current_display_idx !== undefined) setCurrentIdx(r.current_display_idx || 0)
    } else {
      setStatus('idle'); setRound(null); setPrompts([])
    }
  }

  useEffect(() => {
    load()
    const ch = subscribeBattle(() => load(true))
    return () => ch.unsubscribe()
  }, [])

  async function handleCreate() {
    if (!task.trim()) return
    setCreating(true)
    deletedIdsRef.current = new Set()
    await supabase.from('battle_rounds').update({ status: 'finished' }).neq('status', 'finished')
    const r = await createRound(task.trim())
    setRound(r); setStatus('collecting')
    setTask(''); setSelectedIds([]); setOutputs({})
    setPrompts([])
    setCreating(false)
  }

  async function handleDeletePrompt(promptId) {
  if (!window.confirm('Bu promptu silmek istediğine emin misin?')) return
  
  // 1. Local'den kaldır
  deletedIdsRef.current.add(promptId)
  setPrompts(p => p.filter(x => x.id !== promptId))
  setSelectedIds(s => s.filter(x => x !== promptId))
  
  // 2. Supabase'den sil
  const { error } = await supabase.from('battle_prompts').delete().eq('id', promptId)
  if (error) console.error('Silme hatası:', error)
  
  // 3. Eğer round'un selected_prompt_ids'inde varsa oradan da çıkar
  if (round) {
    const { data: r } = await supabase
      .from('battle_rounds').select('selected_prompt_ids').eq('id', round.id).single()
    if (r?.selected_prompt_ids?.includes(promptId)) {
      await supabase.from('battle_rounds')
        .update({ selected_prompt_ids: r.selected_prompt_ids.filter(id => id !== promptId) })
        .eq('id', round.id)
    }
  }
}

  async function handleAddFake() {
    if (!fakeForm.name.trim() || !fakeForm.prompt.trim() || !round) return
    setAddingFake(true)
    try {
      await submitPrompt(round.id, fakeForm.name.trim(), fakeForm.prompt.trim())
      setFakeForm({ name: '', prompt: '' })
      await loadPrompts(round.id, true)
    } catch(e) { console.error(e) }
    setAddingFake(false)
  }

  async function saveOutput(promptId) {
    setSaving(s => ({...s, [promptId]: true}))
    await supabase.from('battle_prompts').update({ output_text: outputs[promptId] || '' }).eq('id', promptId)
    setSaving(s => ({...s, [promptId]: false}))
    setSaveMsg('Kaydedildi!'); setTimeout(() => setSaveMsg(''), 2000)
  }

  function toggleSelect(id) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function moveUp(id) {
    const idx = selectedIds.indexOf(id); if (idx <= 0) return
    const next = [...selectedIds];[next[idx-1], next[idx]] = [next[idx], next[idx-1]]; setSelectedIds(next)
  }

  function moveDown(id) {
    const idx = selectedIds.indexOf(id); if (idx >= selectedIds.length-1) return
    const next = [...selectedIds];[next[idx], next[idx+1]] = [next[idx+1], next[idx]]; setSelectedIds(next)
  }

  async function startPresentation() {
    if (selectedIds.length === 0) return
    await supabase.from('battle_rounds').update({
      status: 'presenting', selected_prompt_ids: selectedIds,
      current_display_idx: 0, winner_id: null
    }).eq('id', round.id)
    setStatus('presenting'); setCurrentIdx(0)
  }

  async function goNext() {
    const next = currentIdx + 1
    await supabase.from('battle_rounds').update({ current_display_idx: next }).eq('id', round.id)
    setCurrentIdx(next)
  }

  async function goPrev() {
    const prev = Math.max(0, currentIdx - 1)
    await supabase.from('battle_rounds').update({ current_display_idx: prev }).eq('id', round.id)
    setCurrentIdx(prev)
  }

  async function handleWinner(promptId) {
    await finishRound(round.id, promptId)
    deletedIdsRef.current = new Set()
    setStatus('idle'); setRound(null); setPrompts([])
    setSelectedIds([]); setOutputs({}); setCurrentIdx(0)
  }

  async function handleReset() {
    await supabase.from('battle_rounds').update({ status: 'finished' }).neq('status', 'finished')
    deletedIdsRef.current = new Set()
    setRound(null); setPrompts([]); setSelectedIds([])
    setOutputs({}); setStatus('idle'); setCurrentIdx(0)
  }

  const selectedPrompts = selectedIds.map(id => prompts.find(p => p.id === id)).filter(Boolean)
  const currentPrompt = selectedPrompts[currentIdx]
  const unselectedPrompts = prompts.filter(p => !selectedIds.includes(p.id))

  const TASKS = [
    'Bu zirve için 3 kelimelik bir slogan yaz.',
    'Yapay zekanın geleceğini bir metaforla açıkla.',
    'Bu etkinliği 2 cümlede anlat.',
    'Bugünkü en önemli çıkarımı özetle.',
  ]

  return (
    <div className="admin-root">
      <div className="admin-header">
        <h1 className="admin-title">⚡ Battle Admin</h1>
        <div style={{display:'flex',gap:8}}>
          <a href="#/battle" target="_blank" className="admin-link-btn">Büyük Ekran ↗</a>
          <a href="#/battle/join" target="_blank" className="admin-link-btn">Katılımcı ↗</a>
        </div>
      </div>

      <div className="battle-status-bar">
        {['idle','collecting','presenting'].map(s => (
          <div key={s} className={`battle-status-step ${status===s?'active':''} ${
            ['idle','collecting','presenting'].indexOf(s) <
            ['idle','collecting','presenting'].indexOf(status) ? 'done' : ''
          }`}>
            {s==='idle'&&'Bekliyor'}{s==='collecting'&&'Toplama'}{s==='presenting'&&'Sunum'}
          </div>
        ))}
      </div>

      {/* STEP 1 */}
      {status === 'idle' && (
        <div className="form-card">
          <div className="section-title" style={{marginBottom:12}}>Yeni tur başlat</div>
          <div className="form-row">
            <label>Görev / Task</label>
            <textarea placeholder="Örn: Bu zirve için etkileyici bir slogan yaz." value={task} onChange={e => setTask(e.target.value)} rows={3} />
          </div>
          <div className="form-row">
            <label style={{marginBottom:6}}>Hazır öneriler</label>
            <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
              {TASKS.map(t => <button key={t} className="tag-btn" onClick={() => setTask(t)}>{t}</button>)}
            </div>
          </div>
          <button className="save-btn" onClick={handleCreate} disabled={creating||!task.trim()}>
            {creating ? 'Başlatılıyor...' : '⚡ Turu Başlat'}
          </button>
        </div>
      )}

      {/* STEP 2: Toplama - Sol/Sağ layout */}
      {status === 'collecting' && round && (
        <div>
          {/* Görev + Fake form */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
            <div className="form-card">
              <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:3,textTransform:'uppercase',letterSpacing:'0.05em'}}>Görev</div>
              <div style={{fontSize:14,fontWeight:500,color:'var(--text)',marginBottom:6}}>{round.task}</div>
              <p style={{fontSize:11,color:'var(--text-muted)'}}>Katılımcılar <strong>/battle/join</strong> adresinden gönderiyor.</p>
            </div>
            <div className="form-card">
              <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:8,textTransform:'uppercase',letterSpacing:'0.05em'}}>➕ Prompt Ekle</div>
              <input placeholder="İsim" value={fakeForm.name} onChange={e => setFakeForm(f=>({...f,name:e.target.value}))}
                style={{width:'100%',padding:'7px 10px',background:'var(--bg3)',border:'1px solid var(--border2)',borderRadius:'var(--radius-sm)',fontSize:12,fontFamily:'inherit',color:'var(--text)',outline:'none',marginBottom:6}} />
              <input placeholder="Prompt metni" value={fakeForm.prompt} onChange={e => setFakeForm(f=>({...f,prompt:e.target.value}))}
                style={{width:'100%',padding:'7px 10px',background:'var(--bg3)',border:'1px solid var(--border2)',borderRadius:'var(--radius-sm)',fontSize:12,fontFamily:'inherit',color:'var(--text)',outline:'none',marginBottom:8}} />
              <button onClick={handleAddFake} disabled={addingFake||!fakeForm.name.trim()||!fakeForm.prompt.trim()}
                style={{padding:'6px 14px',background:'var(--purple-dark)',color:'white',border:'none',borderRadius:'var(--radius-sm)',fontSize:12,cursor:'pointer',fontFamily:'inherit',fontWeight:600}}>
                {addingFake?'Ekleniyor...':'Ekle'}
              </button>
            </div>
          </div>

          {/* Sol/Sağ grid */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,alignItems:'start'}}>

            {/* SOL: Gelen promptlar */}
            <div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                <div className="section-title">Gelen ({prompts.length})</div>
                {saveMsg && <span style={{fontSize:11,color:'var(--green)'}}>{saveMsg}</span>}
              </div>
              <div style={{display:'grid',gap:6}}>
                {prompts.length === 0 && <p style={{color:'var(--text-muted)',fontSize:13}}>Henüz prompt yok...</p>}
                {prompts.map((p, i) => (
                  <div key={p.id} style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:'10px 12px'}}>
                    {/* Üst satır: isim + butonlar */}
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                      <span style={{fontSize:11,fontWeight:700,color:'var(--purple)'}}>{p.player_name}</span>
                      <div style={{display:'flex',gap:4}}>
                        <button onClick={() => toggleSelect(p.id)}
                          style={{padding:'3px 10px',borderRadius:6,border:'none',background:selectedIds.includes(p.id)?'var(--purple-dark)':'var(--bg3)',color:selectedIds.includes(p.id)?'white':'var(--text-muted)',cursor:'pointer',fontSize:11,fontWeight:600,fontFamily:'inherit'}}>
                          {selectedIds.includes(p.id)?`✓${selectedIds.indexOf(p.id)+1}`:'Seç'}
                        </button>
                        <button onClick={() => handleDeletePrompt(p.id)}
                          title="Sil"
                          style={{padding:'3px 7px',borderRadius:6,border:'1px solid rgba(248,113,113,0.3)',background:'rgba(248,113,113,0.08)',color:'var(--red)',cursor:'pointer',fontSize:12}}>
                          🗑
                        </button>
                      </div>
                    </div>
                    {/* Prompt metni */}
                    <div style={{fontSize:12,color:'var(--text)',fontStyle:'italic',marginBottom:6}}>"{p.prompt_text}"</div>
                    {/* Output */}
                    <div style={{display:'flex',gap:5}}>
                      <textarea placeholder="Output..." value={outputs[p.id]||''} onChange={e => setOutputs(o=>({...o,[p.id]:e.target.value}))} rows={2}
                        style={{flex:1,padding:'5px 8px',background:'var(--bg3)',border:'1px solid var(--border2)',borderRadius:6,fontSize:11,fontFamily:'inherit',color:'var(--text)',resize:'vertical',outline:'none'}} />
                      <button onClick={() => saveOutput(p.id)} disabled={saving[p.id]}
                        style={{padding:'4px 8px',background:'var(--bg3)',border:'1px solid var(--border2)',borderRadius:6,cursor:'pointer',fontSize:11,color:'var(--text-muted)',fontFamily:'inherit',alignSelf:'flex-start'}}>
                        {saving[p.id]?'...':'💾'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SAĞ: Seçilenler + Sunum */}
            <div>
              <div className="section-title" style={{marginBottom:8}}>Seçilenler ({selectedIds.length})</div>
              {selectedIds.length === 0 ? (
                <p style={{color:'var(--text-muted)',fontSize:13}}>Soldan prompt seç...</p>
              ) : (
                <>
                  <div style={{display:'grid',gap:6,marginBottom:12}}>
                    {selectedPrompts.map((p, i) => (
                      <div key={p.id} style={{background:'rgba(124,117,232,0.08)',border:'1px solid rgba(124,117,232,0.3)',borderRadius:'var(--radius-sm)',padding:'10px 12px',display:'flex',alignItems:'center',gap:8}}>
                        <span style={{fontSize:13,fontWeight:700,color:'var(--purple)',minWidth:20}}>{i+1}.</span>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:12,fontWeight:600,color:'var(--text)'}}>{p.player_name}</div>
                          <div style={{fontSize:11,color:'var(--text-muted)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.prompt_text}</div>
                        </div>
                        <div style={{display:'flex',gap:2,flexShrink:0}}>
                          <button onClick={() => moveUp(p.id)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:14,padding:'2px 4px'}}>↑</button>
                          <button onClick={() => moveDown(p.id)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:14,padding:'2px 4px'}}>↓</button>
                          <button onClick={() => toggleSelect(p.id)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--red)',fontSize:12,padding:'2px 4px'}}>✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="save-btn" onClick={startPresentation} style={{width:'100%'}}>
                    🎬 Sunumu Başlat ({selectedIds.length})
                  </button>
                </>
              )}
            </div>
          </div>

          <button onClick={handleReset} style={{marginTop:16,background:'none',border:'none',color:'var(--text-muted)',fontSize:12,cursor:'pointer',textDecoration:'underline',display:'block'}}>
            Turu sıfırla
          </button>
        </div>
      )}

      {/* STEP 3: Sunum */}
      {status === 'presenting' && round && (
        <div>
          <div className="form-card" style={{marginBottom:16}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
              <div style={{fontSize:16,fontWeight:600,color:'var(--text)'}}>{currentIdx+1} / {selectedPrompts.length}</div>
              <div style={{display:'flex',gap:8}}>
                <button className="admin-link-btn" onClick={goPrev} disabled={currentIdx===0}>← Önceki</button>
                <button className="save-btn" onClick={goNext} disabled={currentIdx>=selectedPrompts.length-1}>Sonraki →</button>
              </div>
            </div>
            {currentPrompt && (
              <div style={{background:'var(--bg3)',borderRadius:'var(--radius-sm)',padding:'12px 14px'}}>
                <div style={{fontSize:12,color:'var(--purple)',fontWeight:600,marginBottom:4}}>{currentPrompt.player_name}</div>
                <div style={{fontSize:14,fontStyle:'italic',color:'var(--text)',marginBottom:8}}>"{currentPrompt.prompt_text}"</div>
                <div style={{fontSize:13,color:'var(--text-muted)',lineHeight:1.5}}>{currentPrompt.output_text||'— output yok'}</div>
              </div>
            )}
          </div>

          <div className="section-title" style={{marginBottom:10}}>🏆 Kazananı seç</div>
          <div style={{display:'grid',gap:6,marginBottom:16}}>
            {selectedPrompts.map(p => (
              <button key={p.id} onClick={() => handleWinner(p.id)}
                style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',cursor:'pointer',fontFamily:'inherit',color:'var(--text)',textAlign:'left',transition:'all 0.15s'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--gold)';e.currentTarget.style.background='rgba(239,159,39,0.08)'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.background='var(--bg2)'}}>
                <span style={{fontSize:18}}>🏆</span>
                <div>
                  <div style={{fontSize:14,fontWeight:600}}>{p.player_name}</div>
                  <div style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>{p.prompt_text.slice(0,60)}...</div>
                </div>
              </button>
            ))}
          </div>
          <button onClick={handleReset} style={{background:'none',border:'none',color:'var(--text-muted)',fontSize:13,cursor:'pointer',textDecoration:'underline'}}>Turu sıfırla</button>
        </div>
      )}
    </div>
  )
}
