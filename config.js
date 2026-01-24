window.SUPABASE_URL = 'https://cjpvblsyqbasygeovzqm.supabase.co';
window.SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqcHZibHN5cWJhc3lnZW92enFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NTMxNTcsImV4cCI6MjA4NDAyOTE1N30.1lBHrliLlcq-xY2AmiSIzgnjdOWQaPQsl5_zfWFni1s';
const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
window.SUPABASE_REDIRECT = isLocalhost
  ? `${window.location.origin}/auth/callback`
  : 'https://idealist35.eu.pythonanywhere.com/auth/callback';
