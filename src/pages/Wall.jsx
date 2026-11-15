import { useCallback, useEffect, useState } from 'react';
import { Plus, Search, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import { useData } from '../context/DataContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Empty, Field, Modal } from '../components/ui.jsx';

const OUTCOMES = { selected: 'Selected', rejected: 'Rejected', waiting: 'Waiting to hear' };
const DIFFICULTY = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

function ShareForm({ onClose, onPosted }) {
  const { logActivity } = useData();
  const toast = useToast();
  const [form, setForm] = useState({
    company: '', role: '', round: '', difficulty: 'medium', outcome: 'waiting', questions: '', tips: '', is_anonymous: false,
  });
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from('experiences').insert({
      ...form,
      company: form.company.trim(),
      role: form.role.trim(),
      round: form.round.trim(),
      questions: form.questions.trim(),
      tips: form.tips.trim(),
    });
    setBusy(false);
    if (error) {
      toast(error.message, 'error');
      return;
    }
    await logActivity('experience_posted');
    toast('Experience shared');
    onPosted();
    onClose();
  };

  return (
    <Modal title="Share an interview experience" onClose={onClose} wide>
      <form onSubmit={onSubmit} className="form">
        <div className="form-row">
          <Field label="Company">
            <input value={form.company} onChange={set('company')} maxLength={80} required autoFocus />
          </Field>
          <Field label="Role">
            <input value={form.role} onChange={set('role')} placeholder="SDE Intern" maxLength={80} />
          </Field>
        </div>
        <div className="form-row">
          <Field label="Round">
            <input value={form.round} onChange={set('round')} placeholder="Technical round 1" maxLength={60} />
          </Field>
          <Field label="Difficulty">
            <select value={form.difficulty} onChange={set('difficulty')}>
              {Object.entries(DIFFICULTY).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </Field>
          <Field label="Result">
            <select value={form.outcome} onChange={set('outcome')}>
              {Object.entries(OUTCOMES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Questions you were asked">
          <textarea value={form.questions} onChange={set('questions')} rows={6} maxLength={6000} required placeholder={'1. Reverse a linked list in groups of k\n2. Difference between a process and a thread'} />
        </Field>
        <Field label="Tips for others (optional)">
          <textarea value={form.tips} onChange={set('tips')} rows={3} maxLength={3000} />
        </Field>
        <label className="pick-item">
          <input type="checkbox" checked={form.is_anonymous} onChange={(e) => setForm((f) => ({ ...f, is_anonymous: e.target.checked }))} />
          <span>Post anonymously</span>
          <span className="muted small">Your username is never shown or sent to other people.</span>
        </label>
        <button className="btn btn-primary" disabled={busy}>
          {busy ? 'Posting…' : 'Post experience'}
        </button>
      </form>
    </Modal>
  );
}

export default function Wall() {
  const toast = useToast();
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sharing, setSharing] = useState(false);

  // The wall is read through a database function (see supabase/schema.sql)
  // that hides who wrote anonymous posts.
  const load = useCallback(async () => {
    const { data, error: err } = await supabase.rpc('experience_feed').limit(300);
    if (err) setError(err.message);
    else setPosts(data);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const remove = async (post) => {
    if (!window.confirm('Delete this post?')) return;
    const { error: err } = await supabase.from('experiences').delete().eq('id', post.id);
    if (err) toast(err.message, 'error');
    else setPosts((list) => list.filter((p) => p.id !== post.id));
  };

  const q = search.trim().toLowerCase();
  const shown = (posts || []).filter((p) => !q || p.company.toLowerCase().includes(q) || p.role.toLowerCase().includes(q));

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Experience wall</h1>
          <p className="muted">Questions people on Placera were actually asked. Search a company before your interview.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setSharing(true)}>
          <Plus size={16} /> Share yours
        </button>
      </div>

      <div className="search">
        <Search size={16} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by company or role" aria-label="Search experiences" />
      </div>

      {error ? (
        <p className="notice notice-error">Couldn't load the wall. {error}</p>
      ) : posts === null ? (
        <p className="muted">Loading…</p>
      ) : shown.length === 0 ? (
        <Empty title={q ? `Nothing for "${search}" yet` : 'Be the first to share'}>
          <p className="muted">Had an interview or online assessment? Post the questions so the next person is ready.</p>
        </Empty>
      ) : (
        <ul className="posts">
          {shown.map((p) => (
            <li key={p.id} className="post">
              <header>
                <div>
                  <h2>{p.company}</h2>
                  <p className="muted small">{[p.role, p.round].filter(Boolean).join(', ')}</p>
                </div>
                <div className="row">
                  <span className={`tag tag-${p.difficulty}`}>{DIFFICULTY[p.difficulty]}</span>
                  <span className={`tag tag-${p.outcome}`}>{OUTCOMES[p.outcome]}</span>
                </div>
              </header>
              <p className="post-body">{p.questions}</p>
              {p.tips && (
                <p className="post-tips">
                  <b>Tips:</b> {p.tips}
                </p>
              )}
              <footer>
                <span className="muted small">
                  {p.author ? `@${p.author}` : 'Anonymous'}
                  {p.is_mine && ' (you)'}, {new Date(p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                {p.is_mine && (
                  <button type="button" className="icon-btn danger" aria-label="Delete post" onClick={() => remove(p)}>
                    <Trash2 size={16} />
                  </button>
                )}
              </footer>
            </li>
          ))}
        </ul>
      )}

      {sharing && <ShareForm onClose={() => setSharing(false)} onPosted={load} />}
    </>
  );
}
