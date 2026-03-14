// src/lib/battle.js
import { supabase } from './supabase'

// ── Rounds ───────────────────────────────────────────────────

export async function getActiveRound() {
  const { data } = await supabase
    .from('battle_rounds')
    .select('*')
    .neq('status', 'finished')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  return data
}

export async function createRound(task) {
  const { data, error } = await supabase
    .from('battle_rounds')
    .insert({ task, status: 'collecting' })
    .select().single()
  if (error) throw error
  return data
}

export async function updateRoundStatus(roundId, status, extra = {}) {
  const { error } = await supabase
    .from('battle_rounds')
    .update({ status, ...extra })
    .eq('id', roundId)
  if (error) throw error
}

// ── Prompts ──────────────────────────────────────────────────

export async function submitPrompt(roundId, playerName, promptText, playerId = null) {
  const { data, error } = await supabase
    .from('battle_prompts')
    .insert({ round_id: roundId, player_name: playerName, prompt_text: promptText, player_id: playerId })
    .select().single()
  if (error) throw error
  return data
}

export async function getPromptsForRound(roundId) {
  const { data, error } = await supabase
    .from('battle_prompts')
    .select('*')
    .eq('round_id', roundId)
    .order('submitted_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function saveClaudeOutput(promptId, outputText) {
  const { error } = await supabase
    .from('battle_prompts')
    .update({ output_text: outputText })
    .eq('id', promptId)
  if (error) throw error
}

export async function selectBattlePair(roundId, promptAId, promptBId) {
  await updateRoundStatus(roundId, 'voting', {
    prompt_a_id: promptAId,
    prompt_b_id: promptBId,
  })
}

// ── Voting ───────────────────────────────────────────────────

export async function castVote(roundId, promptId, voterName) {
  // IP yerine browser fingerprint benzeri bir şey kullanalım
  const voterId = localStorage.getItem('voter_id') || crypto.randomUUID()
  localStorage.setItem('voter_id', voterId)

  const { error } = await supabase
    .from('battle_votes')
    .insert({ round_id: roundId, prompt_id: promptId, voter_name: voterName, voter_ip: voterId })
  if (error) throw error

  // votes sayısını artır
  await supabase.rpc('increment_votes', { prompt_id: promptId }).catch(async () => {
    const { data } = await supabase.from('battle_prompts').select('votes').eq('id', promptId).single()
    await supabase.from('battle_prompts').update({ votes: (data?.votes || 0) + 1 }).eq('id', promptId)
  })
}

export async function getVotesForRound(roundId) {
  const { data } = await supabase
    .from('battle_votes')
    .select('prompt_id')
    .eq('round_id', roundId)
  return data || []
}

export async function hasVoted(roundId) {
  const voterId = localStorage.getItem('voter_id')
  if (!voterId) return false
  const { data } = await supabase
    .from('battle_votes')
    .select('id')
    .eq('round_id', roundId)
    .eq('voter_ip', voterId)
    .single()
  return !!data
}

export async function finishRound(roundId, winnerId) {
  await updateRoundStatus(roundId, 'finished', { winner_id: winnerId })
  // Kazanana puan ver
  const { data: prompt } = await supabase
    .from('battle_prompts')
    .select('player_id, player_name')
    .eq('id', winnerId).single()
  if (prompt?.player_id) {
    const { data: player } = await supabase
      .from('players').select('total_points').eq('id', prompt.player_id).single()
    await supabase.from('players')
      .update({ total_points: (player?.total_points || 0) + 50 })
      .eq('id', prompt.player_id)
  }
}

// ── Claude API ───────────────────────────────────────────────

export async function runPromptWithClaude(task, promptText) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `Görev: ${task}\n\nKullanıcının promptu: ${promptText}\n\nBu promptu takip ederek görevi tamamla.`
      }]
    })
  })
  const data = await response.json()
  return data.content?.[0]?.text || 'Cevap alınamadı.'
}

// Realtime subscriptions
export function subscribeBattle(callback) {
  return supabase
    .channel('battle-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'battle_rounds' }, callback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'battle_prompts' }, callback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'battle_votes' }, callback)
    .subscribe()
}
