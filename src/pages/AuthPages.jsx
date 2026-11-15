import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';
import { Logo, ThemeToggle } from '../components/Layout.jsx';
import { Field } from '../components/ui.jsx';

// Supabase error messages are already readable; this only rewrites the few
// that would confuse a student.
const friendly = (err) => {
  const msg = err?.message || 'Something went wrong. Try again.';
  if (/invalid login credentials/i.test(msg)) return 'Wrong email or password.';
  if (/already registered|already been registered/i.test(msg)) return 'An account with this email already exists. Sign in instead.';
  if (/email not confirmed/i.test(msg)) return 'Confirm your email first. Check your inbox for the link.';
  if (/rate limit/i.test(msg)) return 'Too many emails sent. Wait a few minutes and try again.';
  return msg;
};

function AuthShell({ title, subtitle, theme, onToggleTheme, children, footer }) {
  return (
    <div className="auth-wrap">
      <div className="auth-theme">
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
      <div className="auth-card">
        <Logo />
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
        {children}
        {footer && <p className="auth-foot">{footer}</p>}
      </div>
    </div>
  );
}

// Shared submit handling: disables the button while waiting, shows errors.
function useSubmit(work) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await work();
    } catch (err) {
      setError(friendly(err));
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, setError, onSubmit };
}

export function Login(themeProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { busy, error, onSubmit } = useSubmit(() => signIn(email.trim(), password));

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to pick up where you left off."
      {...themeProps}
      footer={
        <>
          New here? <Link to="/signup">Create an account</Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="form">
        <Field label="Email">
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@vitstudent.ac.in" required />
        </Field>
        <Field label="Password">
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn-primary" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <Link to="/forgot-password" className="form-link">
          Forgot your password?
        </Link>
      </form>
    </AuthShell>
  );
}

export function Signup(themeProps) {
  const { signUp } = useAuth();
  const [form, setForm] = useState({ fullName: '', username: '', college: '', email: '', password: '' });
  const [sent, setSent] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const { busy, error, onSubmit } = useSubmit(async () => {
    const username = form.username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      throw new Error('Username must be 3 to 20 characters: letters, numbers or underscores.');
    }
    if (form.password.length < 8) throw new Error('Use a password with at least 8 characters.');
    const { needsEmailConfirmation } = await signUp({
      email: form.email.trim(),
      password: form.password,
      username,
      fullName: form.fullName.trim(),
      college: form.college.trim(),
    });
    if (needsEmailConfirmation) setSent(true);
  });

  if (sent) {
    return (
      <AuthShell title="Check your email" {...themeProps} footer={<Link to="/login">Back to sign in</Link>}>
        <p className="muted">
          We sent a confirmation link to {form.email}. Open it to finish creating your account.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Track what you've studied, what to revise and where you've applied."
      {...themeProps}
      footer={
        <>
          Already have an account? <Link to="/login">Sign in</Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="form">
        <Field label="Full name">
          <input value={form.fullName} onChange={set('fullName')} autoComplete="name" maxLength={80} required />
        </Field>
        <Field label="Username" hint="Shown on experiences you post without the anonymous option.">
          <input value={form.username} onChange={set('username')} autoComplete="username" autoCapitalize="none" maxLength={20} required />
        </Field>
        <Field label="College (optional)">
          <input value={form.college} onChange={set('college')} maxLength={120} />
        </Field>
        <Field label="Email">
          <input type="email" value={form.email} onChange={set('email')} autoComplete="email" required />
        </Field>
        <Field label="Password" hint="At least 8 characters.">
          <input type="password" value={form.password} onChange={set('password')} autoComplete="new-password" required />
        </Field>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn-primary" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  );
}

export function ForgotPassword(themeProps) {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const { busy, error, onSubmit } = useSubmit(async () => {
    await sendPasswordReset(email.trim());
    setSent(true);
  });

  return (
    <AuthShell title="Reset your password" {...themeProps} footer={<Link to="/login">Back to sign in</Link>}>
      {sent ? (
        <p className="muted">If an account exists for {email}, a reset link is on its way.</p>
      ) : (
        <form onSubmit={onSubmit} className="form">
          <Field label="Email">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </Field>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="btn btn-primary" disabled={busy}>
            {busy ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}

export function ResetPassword(themeProps) {
  const { user, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const { busy, error, onSubmit } = useSubmit(async () => {
    if (password.length < 8) throw new Error('Use a password with at least 8 characters.');
    await updatePassword(password);
    navigate('/', { replace: true });
  });

  if (!user) {
    return (
      <AuthShell title="This link has expired" {...themeProps} footer={<Link to="/forgot-password">Send a new link</Link>}>
        <p className="muted">Reset links work once and only for a short time.</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password" {...themeProps}>
      <form onSubmit={onSubmit} className="form">
        <Field label="New password" hint="At least 8 characters.">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
        </Field>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn-primary" disabled={busy}>
          {busy ? 'Saving…' : 'Save password'}
        </button>
      </form>
    </AuthShell>
  );
}
