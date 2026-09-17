// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY .env dosyasında tanımlı olmalı')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
