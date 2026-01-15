const SUPABASE_URL = window.SUPABASE_URL;
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY;
const SUPABASE_REDIRECT =
  window.SUPABASE_REDIRECT || `${window.location.origin}/auth/callback`;

const authForm = document.getElementById('authForm');
const authNameWrap = document.querySelector('[data-auth-name]');
const authNameInput = document.getElementById('authName');
const authEmailInput = document.getElementById('authEmail');
const authPasswordInput = document.getElementById('authPassword');
const authStatus = document.getElementById('authStatus');
const authIdentity = document.getElementById('authIdentity');
const authHint = document.querySelector('[data-auth-hint]');
const authTitle = document.getElementById('authTitle');

let cachedSession = null;
let authAction = 'signin';

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
  cachedSession = session || null;

  if (session?.user) {
    setIdentity(`Signed in as ${session.user.email || 'Account'}`);
    setAuthStatus('You are signed in on this device.');
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
  const setMode = (mode) => {
    authAction = mode;
    const showName = mode === 'signup';
    if (authNameWrap) authNameWrap.hidden = !showName;
    if (authHint) authHint.hidden = !showName;
    if (!showName && authNameInput) authNameInput.value = '';
    if (authTitle) authTitle.textContent = showName ? 'Create an account' : 'Login your account';
    const submitBtn = authForm.querySelector('.auth-submit');
    if (submitBtn) submitBtn.textContent = showName ? 'Sign up' : 'Login';
    document.querySelectorAll('.auth-switch').forEach((line) => {
      if (line.classList.contains('auth-switch--signup')) {
        line.hidden = !showName;
      }
      if (line.classList.contains('auth-switch--signin')) {
        line.hidden = showName;
      }
    });
  };

  setMode('signin');

  document.addEventListener('click', (event) => {
    const modeTarget = event.target.closest('[data-auth-mode]');
    if (!modeTarget) return;
    const mode = modeTarget.getAttribute('data-auth-mode');
    if (mode) setMode(mode);
  });

  authForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!supabaseClient) {
      setAuthStatus('Supabase keys are missing.');
      return;
    }

    const email = authEmailInput?.value.trim();
    const password = authPasswordInput?.value || '';
    const name = authNameInput?.value.trim() || '';
    if (!email || !password) {
      setAuthStatus('Enter a valid email and password.');
      return;
    }

    if (authAction === 'signup') {
      if (!name) {
        setAuthStatus('Enter your name to create an account.');
        return;
      }
      setAuthStatus('Creating your account...');
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: SUPABASE_REDIRECT,
        },
      });

      if (error) {
        setAuthStatus(error.message);
        return;
      }

      if (data?.session?.access_token) {
        const result = await syncServerSession(data.session.access_token);
        if (!result.ok) {
          setAuthStatus('Server session failed. Check SUPABASE_URL in server env.');
          return;
        }
        window.location.href = '/';
        return;
      }

      setAuthStatus('Check your email to confirm your account.');
      return;
    }

    setAuthStatus('Signing you in...');
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthStatus(error.message);
      return;
    }

    if (data?.session?.access_token) {
      const result = await syncServerSession(data.session.access_token);
      if (!result.ok) {
        setAuthStatus('Server session failed. Check SUPABASE_URL in server env.');
        return;
      }
      window.location.href = '/';
    }
  });
}

if (supabaseClient) {
  handleAuthRedirect().then(refreshAuthUI);
  supabaseClient.auth.onAuthStateChange(() => {
    refreshAuthUI();
  });
}

document.querySelectorAll('[data-auth-toggle]').forEach((toggle) => {
  toggle.addEventListener('click', () => {
    if (!authPasswordInput) return;
    const isHidden = authPasswordInput.type === 'password';
    authPasswordInput.type = isHidden ? 'text' : 'password';
  });
});
