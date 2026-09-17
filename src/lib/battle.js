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
  if (data) return data
  // Yoksa en son finished olanı getir (kazanan ekranı için)
  const { data: last } = await supabase
    .from('battle_rounds')
    .select('*')
    .eq('status', 'finished')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  return last
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

export async function finishRound(roundId, winnerId) {
  await updateRoundStatus(roundId, 'finished', { winner_id: winnerId })
}

// Realtime subscriptions
export function subscribeBattle(callback) {
  return supabase
    .channel('battle-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'battle_rounds' }, callback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'battle_prompts' }, callback)
    .subscribe()
}
