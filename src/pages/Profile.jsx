import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Field } from '../components/ui.jsx';

export default function Profile({ theme, onToggleTheme }) {
  const { user, profile, updateProfile, updatePassword, signOut } = useAuth();
  const toast = useToast();
  const [draft, setDraft] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!profile) return <p className="muted">Loading…</p>;
  const form = draft || { full_name: profile.full_name, username: profile.username, college: profile.college };
  const set = (key) => (e) => setDraft({ ...form, [key]: e.target.value });

  const saveProfile = async (e) => {
    e.preventDefault();
    setError('');
    const username = form.username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      setError('Username must be 3 to 20 characters: letters, numbers or underscores.');
      return;
    }
    try {
      await updateProfile({ full_name: form.full_name.trim(), college: form.college.trim(), username });
      setDraft(null);
      toast('Profile saved');
    } catch (err) {
      setError(err.message);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      toast('Use a password with at least 8 characters.', 'error');
      return;
    }
    try {
      await updatePassword(password);
      setPassword('');
      toast('Password changed');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  return (
    <>
      <div className="page-head">
        <h1>Profile</h1>
      </div>

      <div className="narrow">
        <form onSubmit={saveProfile} className="form block">
          <Field label="Full name">
            <input value={form.full_name} onChange={set('full_name')} maxLength={80} />
          </Field>
          <Field label="Username" hint="Shown on experiences you post without the anonymous option.">
            <input value={form.username} onChange={set('username')} maxLength={20} autoCapitalize="none" />
          </Field>
          <Field label="College">
            <input value={form.college} onChange={set('college')} maxLength={120} />
          </Field>
          <Field label="Email">
            <input value={user.email} disabled />
          </Field>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="btn btn-primary" disabled={!draft}>
            Save profile
          </button>
        </form>

        <section className="block">
          <h2>Appearance</h2>
          <div className="row">
            <span>Theme: {theme === 'dark' ? 'Dark' : 'Light'}</span>
            <button type="button" className="btn" onClick={onToggleTheme}>
              Switch to {theme === 'dark' ? 'light' : 'dark'}
            </button>
          </div>
        </section>

        <form onSubmit={savePassword} className="form block">
          <h2>Change password</h2>
          <Field label="New password" hint="At least 8 characters.">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          </Field>
          <button className="btn" disabled={!password}>
            Change password
          </button>
        </form>

        <section className="block">
          <button type="button" className="btn btn-danger" onClick={signOut}>
            Sign out
          </button>
        </section>
      </div>
    </>
  );
}
