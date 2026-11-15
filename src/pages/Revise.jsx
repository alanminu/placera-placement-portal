import { Link } from 'react-router';
import { useData } from '../context/DataContext.jsx';
import { diffDays, formatDate, todayStr } from '../lib/dates.js';
import { INTERVALS, dueTopics, upcomingTopics, weakTopics } from '../lib/revision.js';
import { Confidence, Empty } from '../components/ui.jsx';

export default function Revise() {
  const { subjects, topics, reviewTopic, updateTopic } = useData();
  const today = todayStr();
  const subjectName = (id) => subjects.find((s) => s.id === id)?.name || '';

  const due = dueTopics(topics, today);
  const upcoming = upcomingTopics(topics, today).slice(0, 8);
  const weak = weakTopics(topics);
  const anyCompleted = topics.some((t) => t.completed);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Revise</h1>
          <p className="muted">
            Finished topics come back after {INTERVALS.slice(0, -1).join(', ')} and {INTERVALS.at(-1)} days, so you
            see them again just before you'd forget.
          </p>
        </div>
      </div>

      <section className="block">
        <h2>Due today {due.length > 0 && <span className="count">{due.length}</span>}</h2>
        {due.length === 0 ? (
          <Empty title={anyCompleted ? "You're all caught up" : 'Nothing to revise yet'}>
            <p className="muted">
              {anyCompleted
                ? 'The next topics will show up here on their revision day.'
                : 'Finish a topic and it will come back here in 3 days.'}
            </p>
          </Empty>
        ) : (
          <ul className="review-list">
            {due.map((t) => {
              const late = diffDays(t.next_review_on, today);
              return (
                <li key={t.id} className="review">
                  <div className="review-text">
                    <strong>{t.name}</strong>
                    <span className="muted small">
                      <Link to={`/subjects/${t.subject_id}`}>{subjectName(t.subject_id)}</Link>
                      {late > 0 && `, ${late} ${late === 1 ? 'day' : 'days'} overdue`}
                    </span>
                    {t.notes && <p className="review-notes">{t.notes}</p>}
                  </div>
                  <div className="review-actions">
                    <Confidence value={t.confidence} onChange={(v) => updateTopic(t.id, { confidence: v })} />
                    <div className="row">
                      <button type="button" className="btn" onClick={() => reviewTopic(t, 'shaky')}>
                        Shaky
                      </button>
                      <button type="button" className="btn btn-primary" onClick={() => reviewTopic(t, 'good')}>
                        Got it
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {due.length > 0 && (
          <p className="muted small">
            "Got it" moves the topic to its next, longer gap. "Shaky" brings it back tomorrow.
          </p>
        )}
      </section>

      <div className="two-col">
        <section className="block">
          <h2>Weak spots</h2>
          {weak.length === 0 ? (
            <p className="muted">Topics you rate 1 or 2 out of 5 are listed here.</p>
          ) : (
            <ul className="plain-list">
              {weak.map((t) => (
                <li key={t.id}>
                  <Link to={`/subjects/${t.subject_id}`}>{t.name}</Link>
                  <span className="muted small">
                    {subjectName(t.subject_id)}, confidence {t.confidence} of 5
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="block">
          <h2>Coming up</h2>
          {upcoming.length === 0 ? (
            <p className="muted">Nothing scheduled.</p>
          ) : (
            <ul className="plain-list">
              {upcoming.map((t) => (
                <li key={t.id}>
                  <span>{t.name}</span>
                  <span className="muted small">
                    {formatDate(t.next_review_on)}, {subjectName(t.subject_id)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
