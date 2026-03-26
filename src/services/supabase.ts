import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Same Supabase instance as the web dashboard (public anon keys, safe to hardcode)
const SUPABASE_URL = 'https://mpxkugfqzmxydxnlxqoj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1weGt1Z2Zxem14eWR4bmx4cW9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0NzY5MDEsImV4cCI6MjA4MjA1MjkwMX0.17YXD9I9fZulQGoGZFFFzQ-f-LW4E1lsT3SSpDC_GA0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
