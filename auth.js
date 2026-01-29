const i18n = window.i18n || {};
const t = (key, vars) => (typeof i18n.t === 'function' ? i18n.t(key, vars) : key);

const SUPABASE_URL = window.SUPABASE_URL;
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY;
const stripLangPrefix = (path) => {
  const stripped = path.replace(/^\/(uk)(?=\/|$)/, '');
  return stripped || '/';
};
const getLangPrefix = () => (window.location.pathname.startsWith('/uk') ? '/uk' : '');
const withLangPrefix = (path) => {
  const base = getLangPrefix();
  const normalized = path === '/' ? '' : path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}` || '/';
};
const SUPABASE_REDIRECT =
  window.SUPABASE_REDIRECT || `${window.location.origin}${withLangPrefix('/auth/callback')}`;
const SUPABASE_RESET_REDIRECT =
  window.SUPABASE_RESET_REDIRECT || `${window.location.origin}${withLangPrefix('/auth')}`;

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

const getAccessTokenFromHash = () => {
  const hash = window.location.hash.replace(/^#/, '');
  if (!hash) return '';
  const params = new URLSearchParams(hash);
  return params.get('access_token') || '';
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
  if (authTitle) authTitle.textContent = t('auth.page.reset.title');
  if (authResetTitle) {
    authResetTitle.textContent =
      mode === 'update' ? t('auth.page.reset.set_title') : t('auth.page.reset.title');
  }
  if (authResetText) {
    authResetText.textContent =
      mode === 'update'
        ? t('auth.page.reset.update_text')
        : t('auth.page.reset.text');
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
    setAuthStatus(t('auth.status.validating_reset'));
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
  const currentUrl = window.location.href;
  const url = new URL(currentUrl);
  const isAuthPage = stripLangPrefix(window.location.pathname).startsWith('/auth');
  const hasAccessTokenHash = window.location.hash.includes('access_token=');
  const recoveryType = getRecoveryType();
  if (recoveryType === 'recovery' || (isAuthPage && hasAccessTokenHash && !recoveryType)) {
    isRecoveryFlow = true;
    setRecoveryPending(true);
  }

  const hashToken = getAccessTokenFromHash();
  if (hashToken) {
    const result = await syncServerSession(hashToken);
    if (result.ok) {
      window.history.replaceState({}, document.title, withLangPrefix('/auth/callback'));
      window.location.href = withLangPrefix('/');
      return;
    }
    setAuthStatus(t('auth.status.server_session_failed'));
  }

  if (!supabaseClient) return;

  if (url.searchParams.get('code')) {
    const { data, error } = await supabaseClient.auth.exchangeCodeForSession(currentUrl);
    if (!error && data?.session?.access_token) {
      if (isRecoveryFlow) {
        showResetPanel('update');
        return;
      }
      const result = await syncServerSession(data.session.access_token);
      if (!result.ok) {
        setAuthStatus(t('auth.status.server_session_failed'));
        return;
      }
      window.location.href = withLangPrefix('/');
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
          setAuthStatus(t('auth.status.server_session_failed'));
          return;
        }
        window.location.href = withLangPrefix('/');
      }
    }
  }
};

const refreshAuthUI = async () => {
  if (!supabaseClient) {
    setAuthStatus(t('auth.status.supabase_missing'));
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
      t('nav.auth.account');
    if (authTitle) authTitle.textContent = t('auth.page.title.account');
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
      setAuthStatus(t('auth.status.server_session_failed'));
      return;
    }
    window.location.href = withLangPrefix('/');
  } else {
    if (authTitle) authTitle.textContent = t('auth.page.title.signin');
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
    if (authTitle) {
      authTitle.textContent = showName ? t('auth.page.title.signup') : t('auth.page.title.signin');
    }
    const submitBtn = authForm.querySelector('.auth-submit');
    if (submitBtn) {
      submitBtn.textContent = showName ? t('auth.page.submit.signup') : t('auth.page.submit.signin');
    }
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
      setAuthStatus(t('auth.status.supabase_missing'));
      return;
    }

    const email = authEmailInput?.value.trim();
    const password = authPasswordInput?.value || '';
    const name = authNameInput?.value.trim() || '';
    if (!email || !password) {
      setAuthStatus(t('auth.status.enter_email_password'));
      return;
    }

    if (authAction === 'signup') {
      if (!name) {
        setAuthStatus(t('auth.status.enter_name'));
        return;
      }
      setAuthStatus(t('auth.status.creating_account'));
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
          setAuthStatus(t('auth.status.server_session_failed'));
          return;
        }
        window.location.href = withLangPrefix('/');
        return;
      }

      pendingEmail = email;
      if (authVerifyEmail) authVerifyEmail.textContent = maskEmail(email);
      if (authVerify) authVerify.hidden = false;
      authForm.hidden = true;
      setAuthStatus(t('auth.status.check_email'));
      return;
    }

    setAuthStatus(t('auth.status.signing_in'));
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
        setAuthStatus(t('auth.status.server_session_failed'));
        return;
      }
      window.location.href = withLangPrefix('/');
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
    setAuthStatus(t('auth.status.resend_link'));
    const { error } = await supabaseClient.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: SUPABASE_REDIRECT },
    });
    if (error) {
      setAuthStatus(error.message);
      return;
    }
    setAuthStatus(t('auth.status.link_resent'));
  });
}

if (authResetSend) {
  authResetSend.addEventListener('click', async () => {
    const email = authResetEmail?.value.trim() || authEmailInput?.value.trim();
    if (!email || !supabaseClient) {
      setAuthStatus(t('auth.status.enter_email_reset'));
      return;
    }
    setAuthStatus(t('auth.status.sending_reset'));
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: SUPABASE_RESET_REDIRECT,
    });
    if (error) {
      setAuthStatus(error.message);
      return;
    }
    setAuthStatus(t('auth.status.reset_sent'));
  });
}

if (authResetUpdate) {
  authResetUpdate.addEventListener('click', async () => {
    if (!supabaseClient) return;
    const password = authResetPassword?.value || '';
    const confirm = authResetConfirm?.value || '';
    if (password.length < 8) {
      setAuthStatus(t('auth.status.password_length'));
      return;
    }
    if (password !== confirm) {
      setAuthStatus(t('auth.status.passwords_mismatch'));
      return;
    }
    setAuthStatus(t('auth.status.updating_password'));
    const { error } = await supabaseClient.auth.updateUser({ password });
    if (error) {
      setAuthStatus(error.message);
      return;
    }
    setAuthStatus(t('auth.status.password_updated'));
    if (authResetPassword) authResetPassword.value = '';
    if (authResetConfirm) authResetConfirm.value = '';
    isRecoveryFlow = false;
    setRecoveryPending(false);
    await supabaseClient.auth.signOut();
    if (setMode) setMode('signin');
    window.location.href = withLangPrefix('/auth');
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
    window.location.href = withLangPrefix('/auth');
  });
}
