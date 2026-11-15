import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { Check, ChevronLeft, NotebookPen, Pencil, Trash2 } from 'lucide-react';
import { useData } from '../context/DataContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { formatDate } from '../lib/dates.js';
import { progressOf } from '../lib/stats.js';
import { Confidence, Empty, ProgressBar } from '../components/ui.jsx';

function TopicRow({ topic }) {
  const { toggleTopic, updateTopic, deleteTopic } = useData();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(topic.name);
  const [notes, setNotes] = useState(topic.notes);

  const saveName = async (e) => {
    e.preventDefault();
    const next = name.trim();
    if (next && next !== topic.name) await updateTopic(topic.id, { name: next });
    else setName(topic.name);
    setEditing(false);
  };

  return (
    <li className={`topic${topic.completed ? ' done' : ''}`}>
      <div className="topic-main">
        <button
          type="button"
          className="check"
          role="checkbox"
          aria-checked={topic.completed}
          aria-label={`Mark ${topic.name} as ${topic.completed ? 'not finished' : 'finished'}`}
          onClick={() => toggleTopic(topic)}
        >
          {topic.completed && <Check size={14} strokeWidth={3} />}
        </button>

        {editing ? (
          <form onSubmit={saveName} className="topic-edit">
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onBlur={saveName} maxLength={120} aria-label="Topic name" />
          </form>
        ) : (
          <div className="topic-text">
            <span className="topic-name">{topic.name}</span>
            {topic.completed && topic.next_review_on && (
              <span className="muted small">Revise on {formatDate(topic.next_review_on)}</span>
            )}
          </div>
        )}

        <Confidence value={topic.confidence} onChange={(v) => updateTopic(topic.id, { confidence: v })} />

        <div className="topic-actions">
          <button type="button" className={`icon-btn${topic.notes ? ' has-notes' : ''}`} aria-label="Notes" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            <NotebookPen size={16} />
          </button>
          <button type="button" className="icon-btn" aria-label="Rename topic" onClick={() => setEditing(true)}>
            <Pencil size={16} />
          </button>
          <button
            type="button"
            className="icon-btn danger"
            aria-label="Delete topic"
            onClick={() => window.confirm(`Delete "${topic.name}"?`) && deleteTopic(topic.id)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {open && (
        <textarea
          className="topic-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => notes !== topic.notes && updateTopic(topic.id, { notes })}
          placeholder="Key points, links, the question you got stuck on. Saved when you click away."
          maxLength={5000}
          rows={4}
        />
      )}
    </li>
  );
}

export default function SubjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { subjects, topics, addTopic, renameSubject, deleteSubject } = useData();
  const [newTopic, setNewTopic] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState('');

  const subject = subjects.find((s) => String(s.id) === id);
  if (!subject) return <Navigate to="/" replace />;

  const own = topics.filter((t) => t.subject_id === subject.id);
  const p = progressOf(own);

  const onAdd = async (e) => {
    e.preventDefault();
    const value = newTopic.trim();
    if (!value) return;
    setNewTopic('');
    const lastPosition = own.reduce((max, t) => Math.max(max, t.position), -1);
    await addTopic(subject.id, value, lastPosition + 1);
  };

  const onRename = async (e) => {
    e.preventDefault();
    if (name.trim() && name.trim() !== subject.name) await renameSubject(subject.id, name.trim());
    setRenaming(false);
  };

  const onDelete = async () => {
    if (!window.confirm(`Delete "${subject.name}" and its ${own.length} topics? This can't be undone.`)) return;
    if (await deleteSubject(subject.id)) {
      toast('Subject deleted');
      navigate('/', { replace: true });
    }
  };

  return (
    <>
      <Link to="/" className="back">
        <ChevronLeft size={16} /> Dashboard
      </Link>

      <div className="page-head">
        {renaming ? (
          <form onSubmit={onRename} className="inline-form">
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={80} aria-label="Subject name" />
            <button className="btn btn-primary">Save</button>
            <button type="button" className="btn" onClick={() => setRenaming(false)}>
              Cancel
            </button>
          </form>
        ) : (
          <>
            <h1>{subject.name}</h1>
            <div className="row">
              <button type="button" className="btn" onClick={() => { setName(subject.name); setRenaming(true); }}>
                <Pencil size={15} /> Rename
              </button>
              <button type="button" className="btn btn-danger" onClick={onDelete}>
                <Trash2 size={15} /> Delete
              </button>
            </div>
          </>
        )}
      </div>

      <div className="subject-progress">
        <ProgressBar pct={p.pct} label="Subject progress" />
        <span>
          {p.done} of {p.total} finished
        </span>
      </div>

      <form onSubmit={onAdd} className="inline-form">
        <input value={newTopic} onChange={(e) => setNewTopic(e.target.value)} placeholder="Add a topic" aria-label="New topic" maxLength={120} />
        <button className="btn btn-primary">Add topic</button>
      </form>

      {own.length === 0 ? (
        <Empty title="No topics yet">
          <p className="muted">Break the subject into topics you can finish in one sitting.</p>
        </Empty>
      ) : (
        <>
          <p className="muted small legend">
            Tick a topic when you finish it. The dots are how confident you feel, from 1 to 5.
          </p>
          <ul className="topics">
            {own.map((t) => (
              <TopicRow key={t.id} topic={t} />
            ))}
          </ul>
        </>
      )}
    </>
  );
}
