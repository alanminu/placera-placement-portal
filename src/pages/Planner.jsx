import { useState } from 'react';
import { Link } from 'react-router';
import { Check } from 'lucide-react';
import { useData } from '../context/DataContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { addDays, countdown, diffDays, formatLong, todayStr } from '../lib/dates.js';
import { buildPlan, groupTasks } from '../lib/planner.js';
import { percent } from '../lib/stats.js';
import { Empty, Field, ProgressBar } from '../components/ui.jsx';

function PlanForm() {
  const { subjects, topics, interviews, createPlan } = useData();
  const today = todayStr();

  const upcoming = interviews
    .filter((i) => i.interview_date && i.interview_date > today)
    .sort((a, b) => a.interview_date.localeCompare(b.interview_date));

  const withWork = subjects
    .map((s) => ({ ...s, left: topics.filter((t) => t.subject_id === s.id && !t.completed) }))
    .filter((s) => s.left.length > 0);

  const [title, setTitle] = useState(upcoming[0] ? `${upcoming[0].company} prep` : '');
  const [targetDate, setTargetDate] = useState(upcoming[0]?.interview_date || '');
  const [picked, setPicked] = useState(() => new Set(withWork.map((s) => s.id)));
  const [busy, setBusy] = useState(false);

  const chosenTopics = withWork.filter((s) => picked.has(s.id)).flatMap((s) => s.left);

  let preview = null;
  let problem = '';
  if (targetDate) {
    try {
      preview = buildPlan(chosenTopics, today, targetDate);
    } catch (err) {
      problem = err.message;
    }
  }

  const toggle = (id) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!preview) return;
    setBusy(true);
    await createPlan({ title: title.trim() || 'Study plan', targetDate, topics: chosenTopics });
    setBusy(false);
  };

  if (withWork.length === 0) {
    return (
      <Empty title="Nothing left to plan">
        <p className="muted">
          A plan is built from unfinished topics. <Link to="/">Add a subject</Link> to get started.
        </p>
      </Empty>
    );
  }

  return (
    <form onSubmit={onSubmit} className="form plan-form">
      {upcoming.length > 0 && (
        <Field label="Plan for an interview">
          <select
            value={upcoming.find((i) => i.interview_date === targetDate && `${i.company} prep` === title)?.id || ''}
            onChange={(e) => {
              const it = upcoming.find((i) => String(i.id) === e.target.value);
              if (it) {
                setTitle(`${it.company} prep`);
                setTargetDate(it.interview_date);
              }
            }}
          >
            <option value="">Choose my own date</option>
            {upcoming.map((i) => (
              <option key={i.id} value={i.id}>
                {i.company}, {formatLong(i.interview_date)}
              </option>
            ))}
          </select>
        </Field>
      )}
      <div className="form-row">
        <Field label="Plan name">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Placement season prep" maxLength={80} />
        </Field>
        <Field label="Deadline">
          <input type="date" value={targetDate} min={addDays(today, 1)} onChange={(e) => setTargetDate(e.target.value)} required />
        </Field>
      </div>

      <fieldset className="pick">
        <legend>Subjects to include</legend>
        {withWork.map((s) => (
          <label key={s.id} className="pick-item">
            <input type="checkbox" checked={picked.has(s.id)} onChange={() => toggle(s.id)} />
            <span>{s.name}</span>
            <span className="muted small">{s.left.length} left</span>
          </label>
        ))}
      </fieldset>

      {problem && <p className="form-error">{problem}</p>}
      {preview && (
        <p className="notice">
          {chosenTopics.length} topics over {preview.studyDays} {preview.studyDays === 1 ? 'day' : 'days'}: about{' '}
          <b>{preview.perDay} a day</b>
          {preview.revisionDay ? `, with ${formatLong(preview.revisionDay)} kept free for revision.` : '.'}
        </p>
      )}

      <button className="btn btn-primary" disabled={!preview || busy}>
        {busy ? 'Building plan…' : 'Build my plan'}
      </button>
    </form>
  );
}

export default function Planner() {
  const { plan, planTasks, topics, subjects, toggleTopic, deletePlan } = useData();
  const toast = useToast();
  const today = todayStr();

  if (!plan) {
    return (
      <>
        <div className="page-head">
          <div>
            <h1>Planner</h1>
            <p className="muted">Pick a deadline and Placera spreads your unfinished topics across the days before it.</p>
          </div>
        </div>
        <PlanForm />
      </>
    );
  }

  const topicsById = new Map(topics.map((t) => [t.id, t]));
  const days = groupTasks(planTasks, topicsById, today);
  const live = planTasks.filter((t) => topicsById.has(t.topic_id));
  const done = live.filter((t) => topicsById.get(t.topic_id).completed).length;
  const revisionDay = diffDays(plan.start_on, plan.target_date) >= 2 ? addDays(plan.target_date, -1) : null;
  const subjectName = (id) => subjects.find((s) => s.id === id)?.name || '';

  const onDelete = async () => {
    if (!window.confirm('Delete this plan? Your topics and progress stay as they are.')) return;
    await deletePlan(plan.id);
    toast('Plan deleted');
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{plan.title}</h1>
          <p className="muted">
            Deadline {formatLong(plan.target_date)} ({countdown(plan.target_date, today).toLowerCase()})
          </p>
        </div>
        <button type="button" className="btn" onClick={onDelete}>
          Delete plan
        </button>
      </div>

      <div className="subject-progress">
        <ProgressBar pct={percent(done, live.length)} label="Plan progress" />
        <span>
          {done} of {live.length} done
        </span>
      </div>

      {live.length === 0 && (
        <Empty title="This plan has no topics left">
          <p className="muted">The topics it covered were deleted. Delete the plan to build a new one.</p>
        </Empty>
      )}

      <ol className="days">
        {days.map(({ day, items }) => (
          <li key={day} className={`day${day === today ? ' today' : ''}${day < today ? ' past' : ''}`}>
            <h2>
              {day === today ? 'Today' : formatLong(day)}
              {day === today && <span className="muted small"> {formatLong(day)}</span>}
            </h2>
            <ul className="tasks">
              {items.map(({ id, topic, overdue }) => (
                <li key={id} className={topic.completed ? 'done' : ''}>
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
                  <span className="topic-name">{topic.name}</span>
                  <span className="muted small">{subjectName(topic.subject_id)}</span>
                  {overdue && <span className="tag tag-warn">Carried over</span>}
                </li>
              ))}
            </ul>
          </li>
        ))}
        {revisionDay && revisionDay >= today && (
          <li className="day">
            <h2>{formatLong(revisionDay)}</h2>
            <p className="muted">
              Revision day. Go through your <Link to="/revise">weak spots</Link> and anything carried over.
            </p>
          </li>
        )}
      </ol>
    </>
  );
}
