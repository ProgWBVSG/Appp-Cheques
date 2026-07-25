import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Faltan credenciales de Supabase en el archivo .env');
}

// Use dummy values to prevent crash when env variables are not set yet
export const supabase = createClient(
  supabaseUrl || 'https://dummyproject.supabase.co', 
  supabaseKey || 'dummy-anon-key'
);
