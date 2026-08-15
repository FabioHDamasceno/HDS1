import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get configuration from env or localStorage
export function getSupabaseCredentials(): { url: string; key: string } {
  const metaEnv = (import.meta as any).env || {};
  const DEFAULT_URL = 'https://rwgcyscpgxhkjyeilarw.supabase.co';
  const DEFAULT_KEY = 'sb_publishable_7-kXWn-7D21Zu417pa6Tlg_VkDL8IPg';

  const envUrl = metaEnv.VITE_SUPABASE_URL || DEFAULT_URL;
  const envKey = metaEnv.VITE_SUPABASE_ANON_KEY || DEFAULT_KEY;

  const localUrl = typeof window !== 'undefined' ? localStorage.getItem('supabase_url') || '' : '';
  const localKey = typeof window !== 'undefined' ? localStorage.getItem('supabase_anon_key') || '' : '';

  return {
    url: localUrl || envUrl,
    key: localKey || envKey,
  };
}

export function saveSupabaseCredentials(url: string, key: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('supabase_url', url.trim());
    localStorage.setItem('supabase_anon_key', key.trim());
  }
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabaseCredentials();
  return Boolean(url && key && url.startsWith('http'));
}

let cachedClient: SupabaseClient | null = null;
let cachedUrl = '';
let cachedKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key } = getSupabaseCredentials();

  if (!url || !key || !url.startsWith('http')) {
    return null;
  }

  if (cachedClient && cachedUrl === url && cachedKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key);
    cachedUrl = url;
    cachedKey = key;
    return cachedClient;
  } catch (error) {
    console.error('Erro ao inicializar cliente Supabase:', error);
    return null;
  }
}
