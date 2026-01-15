const SUPABASE_URL = window.SUPABASE_URL;
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY;
const SUPABASE_REDIRECT =
  window.SUPABASE_REDIRECT || `${window.location.origin}/auth/callback`;

const authForm = document.getElementById('authForm');
const authEmailInput = document.getElementById('authEmail');
const authStatus = document.getElementById('authStatus');
const authIdentity = document.getElementById('authIdentity');

const setAuthStatus = (message) => {
  if (!authStatus) return;
  authStatus.textContent = message || '';
};

const setIdentity = (message) => {
  if (!authIdentity) return;
  authIdentity.textContent = message || '';
};

const hasSupabaseConfig = () => {
  return (
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes('YOUR_SUPABASE_URL') &&
    !SUPABASE_ANON_KEY.includes('YOUR_SUPABASE_ANON_KEY')
  );
};

const supabaseClient =
  window.supabase && hasSupabaseConfig()
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          detectSessionInUrl: true,
          persistSession: true,
          flowType: 'pkce',
        },
      })
    : null;

const syncServerSession = async (accessToken) => {
  if (!accessToken) return { ok: false };
  const response = await fetch('/api/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ access_token: accessToken }),
  });
  return { ok: response.ok };
};

const handleAuthRedirect = async () => {
  if (!supabaseClient) return;
  const currentUrl = window.location.href;
  const url = new URL(currentUrl);

  if (url.searchParams.get('code')) {
    const { data, error } = await supabaseClient.auth.exchangeCodeForSession(currentUrl);
    if (!error && data?.session?.access_token) {
      const result = await syncServerSession(data.session.access_token);
      if (!result.ok) {
        setAuthStatus('Server session failed. Check SUPABASE_URL in server env.');
        return;
      }
      window.location.href = '/';
    }
    return;
  }

  if (window.location.hash.includes('access_token=')) {
    if (supabaseClient.auth.getSessionFromUrl) {
      const { data } = await supabaseClient.auth.getSessionFromUrl();
      if (data?.session?.access_token) {
        const result = await syncServerSession(data.session.access_token);
        if (!result.ok) {
          setAuthStatus('Server session failed. Check SUPABASE_URL in server env.');
          return;
        }
        window.location.href = '/';
      }
    }
  }
};

const refreshAuthUI = async () => {
  if (!supabaseClient) {
    setAuthStatus('Supabase keys are missing.');
    return;
  }

  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  if (session?.user) {
    setIdentity(`Signed in as ${session.user.email || 'Account'}`);
    setAuthStatus('You are signed in.');
    const result = await syncServerSession(session.access_token);
    if (!result.ok) {
      setAuthStatus('Server session failed. Check SUPABASE_URL in server env.');
      return;
    }
    window.location.href = '/';
  } else {
    setIdentity('Not signed in');
  }
};

if (authForm) {
  authForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!supabaseClient) {
      setAuthStatus('Supabase keys are missing.');
      return;
    }

    const email = authEmailInput?.value.trim();
    if (!email) {
      setAuthStatus('Enter a valid email address.');
      return;
    }

    setAuthStatus('Sending magic link...');
    const { error } = await supabaseClient.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: SUPABASE_REDIRECT,
      },
    });

    if (error) {
      setAuthStatus(error.message);
      return;
    }

    setAuthStatus('Check your email for the magic link.');
  });
}

if (supabaseClient) {
  handleAuthRedirect().then(refreshAuthUI);
  supabaseClient.auth.onAuthStateChange(() => {
    refreshAuthUI();
  });
}
