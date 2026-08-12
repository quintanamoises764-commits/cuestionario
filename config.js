
const supabaseClient = supabase.createClient(
  "https://oxkzlknclczzvnqnnpdw.supabase.co",  // ← tu URL real
  "sb_publishable_20P3YBj2F_Zc74yaifKrXg_RrCak0oW",               // ← tu key real
  {
    auth: {
      storage: window.sessionStorage, // la sesión muere al cerrar la pestaña
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);
