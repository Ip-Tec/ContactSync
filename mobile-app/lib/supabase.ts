import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

// Replace with your Supabase URL and anon key
const supabaseUrl = "https://cioecdbmiepzntcbzchb.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpb2VjZGJtaWVwem50Y2J6Y2hiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzOTkxNjEsImV4cCI6MjA1Njk3NTE2MX0.Rjw6GW-2ngbmHorwUeX3x6l8T6jFIhNNaruFexx5ZkA";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
