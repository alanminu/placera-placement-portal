import { useState } from 'react';
import { Link } from 'react-router';
import { Flame, Plus, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useData } from '../context/DataContext.jsx';
import { SYLLABI } from '../data/syllabi.js';
import { countdown, todayStr } from '../lib/dates.js';
import { dueTopics } from '../lib/revision.js';
import { groupTasks } from '../lib/planner.js';
import { progressOf, streaks } from '../lib/stats.js';
import Heatmap from '../components/Heatmap.jsx';
import { Empty, Field, Modal, ProgressBar, ProgressRing } from '../components/ui.jsx';

function AddSubjectModal({ onClose }) {
  const { subjects, addSubject } = useData();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState('');
  const existing = new Set(subjects.map((s) => s.name.toLowerCase()));

  const add = async (key, subjectName, topics) => {
    setBusy(key);
    const created = await addSubject(subjectName, topics);
    setBusy('');
    if (created) onClose();
  };

  return (
    <Modal title="Add a subject" onClose={onClose} wide>
      <p className="muted">Start from a ready-made syllabus. You can edit the topics afterwards.</p>
      <ul className="syllabi">
        {SYLLABI.map((s) => {
          const added = existing.has(s.name.toLowerCase());
          return (
            <li key={s.key}>
              <div>
                <strong>{s.name}</strong>
                <span className="muted small">
                  {s.topics.length} topics, {s.blurb.toLowerCase()}
                </span>
              </div>
              <button type="button" className="btn" disabled={added || Boolean(busy)} onClick={() => add(s.key, s.name, s.topics)}>
                {added ? 'Added' : busy === s.key ? 'Adding…' : 'Add'}
              </button>
            </li>
          );
        })}
      </ul>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) add('custom', name.trim(), []);
        }}
      >
        <Field label="Or create your own">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Java, Machine Learning, HR questions" maxLength={80} />
        </Field>
        <button className="btn btn-primary" disabled={!name.trim() || Boolean(busy)}>
          Create subject
        </button>
      </form>
    </Modal>
  );
}

export default function Dashboard() {
  const { profile } = useAuth();
  const { subjects, topics, interviews, activity, plan, planTasks } = useData();
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState('');
  const today = todayStr();

  const overall = progressOf(topics);
  const streak = streaks(activity, today);
  const due = dueTopics(topics, today);

  const topicsById = new Map(topics.map((t) => [t.id, t]));
  const todaysPlan = plan
    ? (groupTasks(planTasks, topicsById, today).find((d) => d.day === today)?.items || []).filter((i) => !i.topic.completed)
    : [];

  const nextInterview = interviews
    .filter((i) => i.interview_date && i.interview_date >= today && !['offer', 'rejected'].includes(i.status))
    .sort((a, b) => a.interview_date.localeCompare(b.interview_date))[0];

  const shown = subjects.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));
  const firstName = (profile?.full_name || profile?.username || '').split(' ')[0];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{firstName ? `Hi, ${firstName}` : 'Dashboard'}</h1>
          <p className="muted">Here's where your preparation stands today.</p>
        </div>
        <span className={`streak${streak.current ? ' live' : ''}`} title={`Longest streak: ${streak.longest} days`}>
          <Flame size={18} />
          {streak.current} day streak
        </span>
      </div>

      <section className="hero">
        <ProgressRing pct={overall.pct}>
          <strong>{overall.pct}%</strong>
          <span>ready</span>
        </ProgressRing>
        <div className="hero-body">
          <h2>Today</h2>
          <ul className="agenda">
            <li>
              <Link to="/revise">
                <b>{due.length}</b> {due.length === 1 ? 'topic' : 'topics'} to revise
              </Link>
            </li>
            <li>
              <Link to="/planner">
                {plan ? (
                  <>
                    <b>{todaysPlan.length}</b> planned {todaysPlan.length === 1 ? 'topic' : 'topics'} left
                  </>
                ) : (
                  'No study plan yet. Make one from a deadline'
                )}
              </Link>
            </li>
            <li>
              <Link to="/interviews">
                {nextInterview ? (
                  <>
                    <b>{nextInterview.company}</b> {countdown(nextInterview.interview_date, today).toLowerCase()}
                  </>
                ) : (
                  'No upcoming interviews tracked'
                )}
              </Link>
            </li>
          </ul>
          <p className="muted small">
            {overall.done} of {overall.total} topics finished across {subjects.length}{' '}
            {subjects.length === 1 ? 'subject' : 'subjects'}
          </p>
        </div>
      </section>

      <section className="block">
        <h2>Activity</h2>
        <Heatmap activity={activity} today={today} />
      </section>

      <section className="block">
        <div className="block-head">
          <h2>Subjects</h2>
          <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>
            <Plus size={16} /> Add subject
          </button>
        </div>

        {subjects.length === 0 ? (
          <Empty title="Add your first subject">
            <p className="muted">Pick a ready-made syllabus like DSA or DBMS, or create your own.</p>
          </Empty>
        ) : (
          <>
            {subjects.length > 4 && (
              <div className="search">
                <Search size={16} />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search subjects" aria-label="Search subjects" />
              </div>
            )}
            <div className="subject-grid">
              {shown.map((s) => {
                const p = progressOf(topics.filter((t) => t.subject_id === s.id));
                return (
                  <Link key={s.id} to={`/subjects/${s.id}`} className="subject">
                    <h3>{s.name}</h3>
                    <ProgressBar pct={p.pct} label={`${s.name} progress`} />
                    <p className="muted small">
                      {p.total === 0 ? 'No topics yet' : `${p.done} of ${p.total} topics, ${p.pct}%`}
                    </p>
                  </Link>
                );
              })}
            </div>
            {shown.length === 0 && <p className="muted">No subject matches "{search}".</p>}
          </>
        )}
      </section>

      {adding && <AddSubjectModal onClose={() => setAdding(false)} />}
    </>
  );
}
