// src/lib/network.js
import { supabase } from './supabase'

export const INTEREST_TAGS = [
  'Yapay Zeka', 'Makine Öğrenmesi', 'Fintech', 'Startup', 'Yatırım',
  'Ürün Yönetimi', 'Yazılım Geliştirme', 'Tasarım', 'Pazarlama',
  'Sürdürülebilirlik', 'Sağlık Teknolojisi', 'Eğitim Teknolojisi',
  'Siber Güvenlik', 'Blockchain', 'AR/VR', 'Veri Bilimi',
  'Bulut Teknolojileri', 'E-Ticaret', 'İnsan Kaynakları', 'Hukuk & Regülasyon'
]

export async function createProfile({ name, linkedinUrl, interests, playerId = null }) {
  // Aynı isimde profil varsa güncelle
  const { data: existing } = await supabase
    .from('network_profiles')
    .select('id')
    .eq('name', name)
    .single()

  if (existing) {
    const { data, error } = await supabase
      .from('network_profiles')
      .update({ linkedin_url: linkedinUrl, interests })
      .eq('id', existing.id)
      .select().single()
    if (error) throw error
    return data
  }

  const { data, error } = await supabase
    .from('network_profiles')
    .insert({ name, linkedin_url: linkedinUrl, interests, player_id: playerId })
    .select().single()
  if (error) throw error
  return data
}

export async function getProfile(profileId) {
  const { data, error } = await supabase
    .from('network_profiles')
    .select('*')
    .eq('id', profileId)
    .single()
  if (error) throw error
  return data
}

export async function getAllProfiles() {
  const { data, error } = await supabase
    .from('network_profiles')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getMatchesForProfile(profileId) {
  const { data, error } = await supabase
    .from('network_matches')
    .select(`
      *,
      profile_a:profile_a_id(*),
      profile_b:profile_b_id(*)
    `)
    .or(`profile_a_id.eq.${profileId},profile_b_id.eq.${profileId}`)
    .order('score', { ascending: false })
  if (error) throw error
  return (data || []).map(m => ({
    ...m,
    other: m.profile_a_id === profileId ? m.profile_b : m.profile_a
  }))
}

// Tüm profiller arasında eşleştirme yap
export async function runMatchmaking() {
  const profiles = await getAllProfiles()

  // Önce eski eşleşmeleri sil
  await supabase.from('network_matches').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  const matches = []
  for (let i = 0; i < profiles.length; i++) {
    for (let j = i + 1; j < profiles.length; j++) {
      const a = profiles[i]
      const b = profiles[j]
      const common = a.interests.filter(t => b.interests.includes(t))
      if (common.length > 0) {
        matches.push({
          profile_a_id: a.id,
          profile_b_id: b.id,
          common_tags: common,
          score: common.length,
        })
      }
    }
  }

  if (matches.length === 0) return []

  // En yüksek skorlu eşleşmeleri kaydet (kişi başı max 3)
  const perPerson = {}
  const sorted = matches.sort((a, b) => b.score - a.score)
  const toInsert = sorted.filter(m => {
    const ca = (perPerson[m.profile_a_id] || 0)
    const cb = (perPerson[m.profile_b_id] || 0)
    if (ca >= 3 || cb >= 3) return false
    perPerson[m.profile_a_id] = ca + 1
    perPerson[m.profile_b_id] = cb + 1
    return true
  })

  const { data, error } = await supabase
    .from('network_matches')
    .insert(toInsert)
    .select()
  if (error) throw error
  return data || []
}
