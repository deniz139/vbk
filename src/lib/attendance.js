// src/lib/attendance.js
import { supabase } from './supabase'

export async function getSessions() {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .order('starts_at')
  if (error) throw error
  return data || []
}

export async function getSession(sessionId) {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single()
  if (error) throw error
  return data
}

export async function createSession(name, startsAt) {
  const { data, error } = await supabase
    .from('sessions')
    .insert({ name, starts_at: startsAt })
    .select().single()
  if (error) throw error
  return data
}

// Snack QR'dan tanınan oyuncu — isim ile ara
export async function findPlayerByName(name) {
  const { data } = await supabase
    .from('players')
    .select('*')
    .ilike('name', `%${name}%`)
    .limit(5)
  return data || []
}

export async function checkIn(sessionId, name, playerId = null, email = null) {
  // Daha önce check-in yapıldı mı?
  let existing = null
  if (playerId) {
    const { data } = await supabase
      .from('attendance')
      .select('id')
      .eq('session_id', sessionId)
      .eq('player_id', playerId)
      .single()
    existing = data
  } else if (email) {
    const { data } = await supabase
      .from('attendance')
      .select('id')
      .eq('session_id', sessionId)
      .eq('email', email)
      .single()
    existing = data
  }

  if (existing) return { alreadyCheckedIn: true }

  const { data, error } = await supabase
    .from('attendance')
    .insert({ session_id: sessionId, player_id: playerId, name, email })
    .select().single()

  if (error) {
    if (error.code === '23505') return { alreadyCheckedIn: true }
    throw error
  }
  return { success: true, record: data }
}

export async function getAttendanceForSession(sessionId) {
  const { data, error } = await supabase
    .from('attendance')
    .select('*, players(total_points)')
    .eq('session_id', sessionId)
    .order('checked_in_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getAllAttendance() {
  const { data, error } = await supabase
    .from('attendance')
    .select('*, sessions(name)')
    .order('checked_in_at', { ascending: false })
  if (error) throw error
  return data || []
}

export function subscribeAttendance(sessionId, callback) {
  return supabase
    .channel('attendance-' + sessionId)
    .on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'attendance',
      filter: `session_id=eq.${sessionId}`
    }, callback)
    .subscribe()
}
