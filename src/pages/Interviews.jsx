import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useData } from '../context/DataContext.jsx';
import { countdown, formatDate, todayStr } from '../lib/dates.js';
import { Empty, Field, Modal } from '../components/ui.jsx';

const STATUSES = [
  { key: 'applied', label: 'Applied' },
  { key: 'oa', label: 'Online assessment' },
  { key: 'interview', label: 'Interview' },
  { key: 'offer', label: 'Offer' },
  { key: 'rejected', label: 'Rejected' },
];

function InterviewForm({ interview, onClose }) {
  const { addInterview, updateInterview } = useData();
  const [form, setForm] = useState({
    company: interview?.company || '',
    role: interview?.role || '',
    interview_date: interview?.interview_date || '',
    status: interview?.status || 'applied',
    notes: interview?.notes || '',
  });
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const fields = {
      ...form,
      company: form.company.trim(),
      role: form.role.trim() || 'Software Engineer',
      interview_date: form.interview_date || null,
    };
    const saved = interview ? await updateInterview(interview.id, fields) : await addInterview(fields);
    setBusy(false);
    if (saved) onClose();
  };

  return (
    <Modal title={interview ? 'Edit interview' : 'Track an interview'} onClose={onClose}>
      <form onSubmit={onSubmit} className="form">
        <Field label="Company">
          <input value={form.company} onChange={set('company')} maxLength={80} required autoFocus />
        </Field>
        <Field label="Role">
          <input value={form.role} onChange={set('role')} placeholder="Software Engineer Intern" maxLength={80} />
        </Field>
        <div className="form-row">
          <Field label="Next date (optional)">
            <input type="date" value={form.interview_date} onChange={set('interview_date')} />
          </Field>
          <Field label="Stage">
            <select value={form.status} onChange={set('status')}>
              {STATUSES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Notes">
          <textarea value={form.notes} onChange={set('notes')} rows={4} maxLength={5000} placeholder="Recruiter name, rounds, what to prepare" />
        </Field>
        <button className="btn btn-primary" disabled={busy}>
          {busy ? 'Saving…' : interview ? 'Save changes' : 'Add interview'}
        </button>
      </form>
    </Modal>
  );
}

export default function Interviews() {
  const { interviews, updateInterview, deleteInterview } = useData();
  const [editing, setEditing] = useState(null); // null, 'new', or an interview
  const today = todayStr();

  const byStatus = (key) =>
    interviews
      .filter((i) => i.status === key)
      .sort((a, b) => (a.interview_date || '9999').localeCompare(b.interview_date || '9999'));

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Interviews</h1>
          <p className="muted">Every application in one place, from applying to the result.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setEditing('new')}>
          <Plus size={16} /> Track interview
        </button>
      </div>

      {interviews.length === 0 ? (
        <Empty title="Track your first application">
          <p className="muted">Add a company when you apply, then move it along as you clear each round.</p>
        </Empty>
      ) : (
        <div className="board">
          {STATUSES.map((s) => {
            const items = byStatus(s.key);
            return (
              <section key={s.key} className={`column column-${s.key}`}>
                <h2>
                  {s.label} <span className="count">{items.length}</span>
                </h2>
                {items.map((i) => (
                  <article key={i.id} className="card">
                    <button type="button" className="card-open" onClick={() => setEditing(i)}>
                      <strong>{i.company}</strong>
                      <span className="muted small">{i.role}</span>
                    </button>
                    {i.interview_date && (
                      <p className="small">
                        {formatDate(i.interview_date)}
                        {!['offer', 'rejected'].includes(i.status) && (
                          <span className={`tag${i.interview_date < today ? '' : ' tag-accent'}`}>
                            {countdown(i.interview_date, today)}
                          </span>
                        )}
                      </p>
                    )}
                    {i.notes && <p className="card-notes">{i.notes}</p>}
                    <div className="card-foot">
                      <select
                        value={i.status}
                        aria-label={`Stage for ${i.company}`}
                        onChange={(e) => updateInterview(i.id, { status: e.target.value })}
                      >
                        {STATUSES.map((o) => (
                          <option key={o.key} value={o.key}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="icon-btn danger"
                        aria-label={`Delete ${i.company}`}
                        onClick={() => window.confirm(`Remove ${i.company}?`) && deleteInterview(i.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </article>
                ))}
                {items.length === 0 && <p className="muted small column-empty">None</p>}
              </section>
            );
          })}
        </div>
      )}

      {editing && <InterviewForm interview={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </>
  );
}
