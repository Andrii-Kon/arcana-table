const SUPABASE_URL = window.SUPABASE_URL;
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY;
const SUPABASE_REDIRECT =
  window.SUPABASE_REDIRECT || `${window.location.origin}/auth/callback`;
const SUPABASE_RESET_REDIRECT =
  window.SUPABASE_RESET_REDIRECT || `${window.location.origin}/auth`;

const authForm = document.getElementById('authForm');
const authNameWrap = document.querySelector('[data-auth-name]');
const authNameInput = document.getElementById('authName');
const authEmailInput = document.getElementById('authEmail');
const authPasswordInput = document.getElementById('authPassword');
const authStatus = document.getElementById('authStatus');
const authDisplayName = document.getElementById('authDisplayName');
const authDisplayEmail = document.getElementById('authDisplayEmail');
const authHint = document.querySelector('[data-auth-hint]');
const authTitle = document.getElementById('authTitle');
const authVerify = document.getElementById('authVerify');
const authVerifyEmail = document.getElementById('authVerifyEmail');
const authResend = document.querySelector('[data-auth-resend]');
const authReset = document.getElementById('authReset');
const authResetTitle = document.getElementById('authResetTitle');
const authResetText = document.getElementById('authResetText');
const authResetEmail = document.getElementById('authResetEmail');
const authResetPassword = document.getElementById('authResetPassword');
const authResetConfirm = document.getElementById('authResetConfirm');
const authResetPanels = document.querySelectorAll('[data-auth-reset-panel]');
const authResetUpdate = document.querySelector('[data-auth-reset-update]');
const authForgot = document.querySelector('[data-auth-forgot]');
const authResetSend = document.querySelector('[data-auth-reset-send]');
const authResetBack = document.querySelector('[data-auth-reset-back]');

let cachedSession = null;
let authAction = 'signin';
let pendingEmail = '';
let setMode = null;
let isRecoveryFlow = false;
const RECOVERY_STORAGE_KEY = 'auth_recovery_pending';

const setRecoveryPending = (value) => {
  try {
    if (value) {
      sessionStorage.setItem(RECOVERY_STORAGE_KEY, '1');
    } else {
      sessionStorage.removeItem(RECOVERY_STORAGE_KEY);
    }
  } catch (error) {
    // Ignore storage errors.
  }
};

const isRecoveryPending = () => {
  try {
    return sessionStorage.getItem(RECOVERY_STORAGE_KEY) === '1';
  } catch (error) {
    return false;
  }
};

const setAuthStatus = (message) => {
  if (!authStatus) return;
  authStatus.textContent = message || '';
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

const getRecoveryType = () => {
  const url = new URL(window.location.href);
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
  return url.searchParams.get('type') || hashParams.get('type') || '';
};

const showResetPanel = (mode) => {
  if (authReset) authReset.hidden = false;
  if (authForm) authForm.hidden = true;
  if (authHint) authHint.hidden = true;
  if (authVerify) authVerify.hidden = true;
  document.querySelectorAll('.auth-switch').forEach((line) => {
    line.hidden = true;
  });
  if (authTitle) authTitle.textContent = 'Reset your password';
  if (authResetTitle) {
    authResetTitle.textContent =
      mode === 'update' ? 'Set a new password' : 'Reset your password';
  }
  if (authResetText) {
    authResetText.textContent =
      mode === 'update'
        ? 'Enter a new password to finish resetting your account.'
        : 'We will email you a link to reset your password.';
  }
  if (authResetPanels.length) {
    authResetPanels.forEach((panel) => {
      panel.hidden = panel.getAttribute('data-auth-reset-panel') !== mode;
    });
  }
};

const handleAuthRoute = async () => {
  const path = window.location.pathname;

  if (path.startsWith('/forget-password')) {
    showResetPanel('request');
    setAuthStatus('');
    return;
  }

  if (path.startsWith('/reset-password/')) {
    const tokenHash = path.split('/reset-password/')[1];
    if (!tokenHash) return;
    isRecoveryFlow = true;
    setRecoveryPending(true);
    showResetPanel('update');
    if (!supabaseClient) return;
    setAuthStatus('Validating reset link...');
    const { error } = await supabaseClient.auth.verifyOtp({
      type: 'recovery',
      token_hash: tokenHash,
    });
    if (error) {
      setAuthStatus(error.message);
      if (authResetUpdate) authResetUpdate.disabled = true;
      return;
    }
    if (authResetUpdate) authResetUpdate.disabled = false;
    setAuthStatus('');
  }
};

const handleAuthRedirect = async () => {
  if (!supabaseClient) return;
  const currentUrl = window.location.href;
  const url = new URL(currentUrl);
  const isAuthPage = window.location.pathname.startsWith('/auth');
  const hasAccessTokenHash = window.location.hash.includes('access_token=');
  const recoveryType = getRecoveryType();
  if (recoveryType === 'recovery' || (isAuthPage && hasAccessTokenHash && !recoveryType)) {
    isRecoveryFlow = true;
    setRecoveryPending(true);
  }

  if (url.searchParams.get('code')) {
    const { data, error } = await supabaseClient.auth.exchangeCodeForSession(currentUrl);
    if (!error && data?.session?.access_token) {
      if (isRecoveryFlow) {
        showResetPanel('update');
        return;
      }
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
        if (isRecoveryFlow) {
          showResetPanel('update');
          return;
        }
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
    if (isRecoveryFlow || isRecoveryPending() || getRecoveryType() === 'recovery') {
      isRecoveryFlow = true;
      setRecoveryPending(true);
      showResetPanel('update');
      return;
    }
    const fullName =
      session.user.user_metadata?.full_name ||
      session.user.user_metadata?.name ||
      'Account';
    if (authTitle) authTitle.textContent = 'Account';
    document.querySelectorAll('.auth-switch').forEach((line) => {
      line.hidden = true;
    });
    setAuthStatus('');
    if (authDisplayName) {
      authDisplayName.hidden = false;
      authDisplayName.textContent = fullName;
    }
    if (authDisplayEmail) {
      authDisplayEmail.hidden = false;
      authDisplayEmail.textContent = session.user.email || '';
    }
    const result = await syncServerSession(session.access_token);
    if (!result.ok) {
      setAuthStatus('Server session failed. Check SUPABASE_URL in server env.');
      return;
    }
    window.location.href = '/';
  } else {
    if (authTitle) authTitle.textContent = 'Login your account';
    document.querySelectorAll('.auth-switch').forEach((line) => {
      if (line.classList.contains('auth-switch--signup')) {
        line.hidden = true;
      }
      if (line.classList.contains('auth-switch--signin')) {
        line.hidden = false;
      }
    });
    if (authDisplayName) authDisplayName.hidden = true;
    if (authDisplayEmail) authDisplayEmail.hidden = true;
  }
};

if (authForm) {
  setMode = (mode) => {
    authAction = mode;
    const showName = mode === 'signup';
    if (authNameWrap) authNameWrap.hidden = !showName;
    if (authHint) authHint.hidden = !showName;
    if (authVerify) authVerify.hidden = true;
    if (authReset) authReset.hidden = true;
    if (authForm) authForm.hidden = false;
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

      pendingEmail = email;
      if (authVerifyEmail) authVerifyEmail.textContent = maskEmail(email);
      if (authVerify) authVerify.hidden = false;
      authForm.hidden = true;
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

if (authForgot) {
  authForgot.addEventListener('click', () => {
    showResetPanel('request');
  });
}

if (supabaseClient) {
  handleAuthRedirect()
    .then(handleAuthRoute)
    .then(refreshAuthUI);
  supabaseClient.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') {
      isRecoveryFlow = true;
      setRecoveryPending(true);
      showResetPanel('update');
      return;
    }
    refreshAuthUI();
  });
} else {
  handleAuthRoute();
}

document.querySelectorAll('[data-auth-toggle]').forEach((toggle) => {
  toggle.addEventListener('click', () => {
    if (!authPasswordInput) return;
    const isHidden = authPasswordInput.type === 'password';
    authPasswordInput.type = isHidden ? 'text' : 'password';
  });
});

document.querySelectorAll('[data-auth-toggle-reset]').forEach((toggle) => {
  toggle.addEventListener('click', () => {
    if (!authResetPassword) return;
    const isHidden = authResetPassword.type === 'password';
    authResetPassword.type = isHidden ? 'text' : 'password';
  });
});

const maskEmail = (email) => {
  if (!email || !email.includes('@')) return email || '';
  const [name, domain] = email.split('@');
  if (name.length <= 2) return `${name[0]}***@${domain}`;
  return `${name.slice(0, 2)}${'*'.repeat(Math.max(3, name.length - 2))}@${domain}`;
};

if (authResend) {
  authResend.addEventListener('click', async () => {
    const email = pendingEmail || authEmailInput?.value.trim();
    if (!email || !supabaseClient) return;
    setAuthStatus('Resending verification link...');
    const { error } = await supabaseClient.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: SUPABASE_REDIRECT },
    });
    if (error) {
      setAuthStatus(error.message);
      return;
    }
    setAuthStatus('Verification link resent.');
  });
}

if (authResetSend) {
  authResetSend.addEventListener('click', async () => {
    const email = authResetEmail?.value.trim() || authEmailInput?.value.trim();
    if (!email || !supabaseClient) {
      setAuthStatus('Enter your email to reset the password.');
      return;
    }
    setAuthStatus('Sending reset link...');
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: SUPABASE_RESET_REDIRECT,
    });
    if (error) {
      setAuthStatus(error.message);
      return;
    }
    setAuthStatus('Password reset link sent. Check your email.');
  });
}

if (authResetUpdate) {
  authResetUpdate.addEventListener('click', async () => {
    if (!supabaseClient) return;
    const password = authResetPassword?.value || '';
    const confirm = authResetConfirm?.value || '';
    if (password.length < 8) {
      setAuthStatus('Use at least 8 characters for your new password.');
      return;
    }
    if (password !== confirm) {
      setAuthStatus('Passwords do not match.');
      return;
    }
    setAuthStatus('Updating your password...');
    const { error } = await supabaseClient.auth.updateUser({ password });
    if (error) {
      setAuthStatus(error.message);
      return;
    }
    setAuthStatus('Password updated. Please sign in.');
    if (authResetPassword) authResetPassword.value = '';
    if (authResetConfirm) authResetConfirm.value = '';
    isRecoveryFlow = false;
    setRecoveryPending(false);
    await supabaseClient.auth.signOut();
    if (setMode) setMode('signin');
    window.location.href = '/auth';
  });
}

if (authResetBack) {
  authResetBack.addEventListener('click', async () => {
    isRecoveryFlow = false;
    setRecoveryPending(false);
    if (supabaseClient) {
      try {
        await supabaseClient.auth.signOut();
      } catch (error) {
        // Ignore sign-out errors.
      }
    }
    if (setMode) setMode('signin');
    window.location.href = '/auth';
  });
}
