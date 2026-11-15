import { useData } from '../context/DataContext.jsx';
import { todayStr } from '../lib/dates.js';
import { TIERS, achievements, percent, tierProgress } from '../lib/stats.js';
import Medal from '../components/Medal.jsx';
import { ProgressBar } from '../components/ui.jsx';

export default function Badges() {
  const { subjects, topics, interviews, activity } = useData();
  const completed = topics.filter((t) => t.completed).length;
  const tier = tierProgress(completed);
  const list = achievements({ subjects, topics, interviews, activity, today: todayStr() });
  const unlocked = list.filter((a) => a.unlocked).length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Badges</h1>
          <p className="muted">Tiers come from topics you finish. Achievements come from how you prepare.</p>
        </div>
      </div>

      <section className="tier-now">
        <Medal tone={tier.current?.key || 'bronze'} icon="star" unlocked={Boolean(tier.current)} progress={tier.pctToNext} size={120} />
        <div>
          <h2>{tier.current ? `${tier.current.name} tier` : 'No tier yet'}</h2>
          <p className="muted">
            {completed} {completed === 1 ? 'topic' : 'topics'} finished.{' '}
            {tier.next ? `${tier.next.goal - completed} more to reach ${tier.next.name}.` : 'You have reached the top tier.'}
          </p>
          {tier.next && <ProgressBar pct={tier.pctToNext} label={`Progress to ${tier.next.name}`} />}
        </div>
      </section>

      <section className="block">
        <h2>Tiers</h2>
        <ul className="medals">
          {TIERS.map((t) => {
            const got = completed >= t.goal;
            return (
              <li key={t.key} className={got ? '' : 'is-locked'}>
                <Medal tone={t.key} icon="star" unlocked={got} progress={percent(Math.min(completed, t.goal), t.goal)} />
                <strong>{t.name}</strong>
                <span className="muted small">{got ? 'Unlocked' : `${completed} of ${t.goal} topics`}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="block">
        <h2>
          Achievements <span className="count">{unlocked} of {list.length}</span>
        </h2>
        <ul className="medals">
          {list.map((a) => (
            <li key={a.key} className={a.unlocked ? '' : 'is-locked'}>
              <Medal tone="emerald" icon={a.icon} unlocked={a.unlocked} progress={percent(a.have, a.need)} />
              <strong>{a.name}</strong>
              <span className="muted small">{a.hint}</span>
              {!a.unlocked && a.need > 1 && (
                <span className="muted small">
                  {a.have} of {a.need}
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
