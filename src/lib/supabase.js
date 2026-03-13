import { createClient } from '@supabase/supabase-js'


const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Adicione este "if" para saber se as chaves foram lidas
if (!supabaseUrl || !supabaseAnonKey) {
    console.error("ERRO: Variáveis do Supabase não encontradas! Verifique o painel da Vercel.");
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder'
)
