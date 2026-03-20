// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY .env dosyasında tanımlı olmalı')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ── Players ──────────────────────────────────────────────────

export async function getOrCreatePlayer(name, email = null) {
  // Önce localStorage'dan bu cihazın player_id'sini kontrol et
  const savedId = localStorage.getItem('player_id')
  if (savedId) {
    const { data: saved } = await supabase
      .from('players').select('*').eq('id', savedId).single()
    if (saved) return saved
  }

  // Aynı isimde oyuncu var mı?
  const { data: existing } = await supabase
    .from('players').select('*').ilike('name', name.trim()).single()
  if (existing) {
    throw new Error('DUPLICATE_NAME')
  }

  const { data, error } = await supabase
    .from('players').insert({ name: name.trim(), email }).select().single()
  if (error) throw error

  localStorage.setItem('player_id', data.id)
  localStorage.setItem('player_name', data.name)
  return data
}

export async function getPlayerById(id) {
  const { data } = await supabase.from('players').select('*').eq('id', id).single()
  return data
}

export async function getLeaderboard(limit = 20) {
  const { data, error } = await supabase
    .from('players')
    .select('id, name, total_points, created_at')
    .order('total_points', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

// ── Stations ─────────────────────────────────────────────────

export async function getStations() {
  const { data, error } = await supabase
    .from('stations').select('*').order('name')
  if (error) throw error
  return data
}

// ── Questions ────────────────────────────────────────────────

export async function getQuestionForStation(stationId, playerId) {
  // Oyuncunun bu stanttaki cevaplanmamış sorularından rastgele birini getir
  const { data: answered } = await supabase
    .from('answers')
    .select('question_id')
    .eq('player_id', playerId)
    .eq('station_id', stationId)

  const answeredIds = (answered || []).map(a => a.question_id)

  let query = supabase
    .from('questions')
    .select('*')
    .eq('station_id', stationId)
    .eq('active', true)

  if (answeredIds.length > 0) {
    query = query.not('id', 'in', `(${answeredIds.join(',')})`)
  }

  const { data, error } = await query
  if (error) throw error
  if (!data || data.length === 0) return null

  // Rastgele soru seç
  return data[Math.floor(Math.random() * data.length)]
}

// ── Answers ──────────────────────────────────────────────────

export async function submitAnswer(playerId, question, chosenIndex) {
  const isCorrect = chosenIndex === question.correct_index
  const pointsEarned = isCorrect ? question.points : 0

  // Cevabı kaydet
  const { error: answerError } = await supabase.from('answers').insert({
    player_id: playerId,
    question_id: question.id,
    station_id: question.station_id,
    chosen_index: chosenIndex,
    is_correct: isCorrect,
    points_earned: pointsEarned,
  })
  if (answerError) throw answerError

  // Oyuncunun toplam puanını artır
  if (pointsEarned > 0) {
    const { error: updateError } = await supabase.rpc('increment_points', {
      player_id: playerId,
      amount: pointsEarned,
    })
    if (updateError) {
      // RPC yoksa manuel update
      const { data: player } = await supabase
        .from('players').select('total_points').eq('id', playerId).single()
      await supabase.from('players')
        .update({ total_points: (player?.total_points || 0) + pointsEarned })
        .eq('id', playerId)
    }
  }

  return { isCorrect, pointsEarned }
}

// ── Admin ────────────────────────────────────────────────────

export async function addQuestion({ stationId, text, options, correctIndex, points }) {
  const { data, error } = await supabase.from('questions').insert({
    station_id: stationId,
    text,
    options,
    correct_index: correctIndex,
    points,
  }).select().single()
  if (error) throw error
  return data
}

export async function getAnswerStats() {
  const { data, error } = await supabase
    .from('answers')
    .select('station_id, is_correct, points_earned')
  if (error) throw error
  return data
}

// ── Realtime leaderboard subscription ────────────────────────

export function subscribeLeaderboard(callback) {
  return supabase
    .channel('leaderboard-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, callback)
    .subscribe()
}
