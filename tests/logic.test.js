import test from 'node:test';
import assert from 'node:assert/strict';
import { addDays, diffDays, countdown } from '../src/lib/dates.js';
import { completePatch, reviewPatch, dueTopics, weakTopics, INTERVALS } from '../src/lib/revision.js';
import { buildPlan, groupTasks } from '../src/lib/planner.js';
import { streaks, heatmapWeeks, tierProgress, achievements } from '../src/lib/stats.js';

test('dates: adding days crosses months and years', () => {
  assert.equal(addDays('2026-01-30', 3), '2026-02-02');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2024-02-28', 1), '2024-02-29');
  assert.equal(diffDays('2026-11-15', '2026-11-22'), 7);
  assert.equal(countdown('2026-11-16', '2026-11-15'), 'Tomorrow');
  assert.equal(countdown('2026-11-10', '2026-11-15'), '5 days ago');
});

test('revision: gaps grow 3 -> 7 -> 21 -> 45 and then stay at 45', () => {
  let topic = { ...completePatch('2026-11-01') };
  assert.equal(topic.next_review_on, '2026-11-04');
  const seen = [];
  let today = topic.next_review_on;
  for (let i = 0; i < 5; i++) {
    topic = { ...topic, ...reviewPatch(topic, 'good', today) };
    seen.push(diffDays(today, topic.next_review_on));
    today = topic.next_review_on;
  }
  assert.deepEqual(seen, [7, 21, 45, 45, 45]);
  assert.equal(INTERVALS.length, 4);
});

test('revision: "shaky" brings the topic back tomorrow and restarts the gaps', () => {
  const topic = { revision_stage: 2 };
  const patch = reviewPatch(topic, 'shaky', '2026-11-15');
  assert.deepEqual(patch, { revision_stage: 0, next_review_on: '2026-11-16', last_reviewed_on: '2026-11-15' });
});

test('revision: due list only has finished topics whose date has arrived', () => {
  const topics = [
    { id: 1, completed: true, next_review_on: '2026-11-15' },
    { id: 2, completed: true, next_review_on: '2026-11-16' },
    { id: 3, completed: false, next_review_on: null },
    { id: 4, completed: true, next_review_on: '2026-11-10' },
  ];
  assert.deepEqual(dueTopics(topics, '2026-11-15').map((t) => t.id), [4, 1]);
  assert.deepEqual(weakTopics([{ id: 1, confidence: 2 }, { id: 2, confidence: 5 }, { id: 3, confidence: 1 }, { id: 4, confidence: null }]).map((t) => t.id), [3, 1]);
});

test('planner: spreads topics evenly and keeps the last day for revision', () => {
  const topics = Array.from({ length: 10 }, (_, i) => ({ id: i + 1 }));
  const plan = buildPlan(topics, '2026-11-15', '2026-11-21'); // 6 days left
  assert.equal(plan.studyDays, 5);
  assert.equal(plan.revisionDay, '2026-11-20');
  assert.equal(plan.perDay, 2);
  const perDay = {};
  for (const t of plan.tasks) perDay[t.due_on] = (perDay[t.due_on] || 0) + 1;
  assert.deepEqual(Object.values(perDay), [2, 2, 2, 2, 2]);
  assert.ok(plan.tasks.every((t) => t.due_on < plan.revisionDay));
  assert.deepEqual(plan.tasks.map((t) => t.topic_id), topics.map((t) => t.id));
});

test('planner: more days than topics, one day left, and bad input', () => {
  const plan = buildPlan([{ id: 1 }, { id: 2 }], '2026-11-15', '2026-11-25');
  assert.deepEqual(plan.tasks.map((t) => t.due_on), ['2026-11-15', '2026-11-19']);
  const tight = buildPlan([{ id: 1 }, { id: 2 }, { id: 3 }], '2026-11-15', '2026-11-16');
  assert.equal(tight.revisionDay, null);
  assert.ok(tight.tasks.every((t) => t.due_on === '2026-11-15'));
  assert.throws(() => buildPlan([{ id: 1 }], '2026-11-15', '2026-11-15'));
  assert.throws(() => buildPlan([], '2026-11-15', '2026-11-20'));
});

test('planner: unfinished tasks from earlier days carry over to today', () => {
  const topics = new Map([
    [1, { id: 1, completed: false }],
    [2, { id: 2, completed: true }],
    [3, { id: 3, completed: false }],
  ]);
  const tasks = [
    { topic_id: 1, due_on: '2026-11-13' },
    { topic_id: 2, due_on: '2026-11-13' },
    { topic_id: 3, due_on: '2026-11-15' },
    { topic_id: 99, due_on: '2026-11-15' },
  ];
  const days = groupTasks(tasks, topics, '2026-11-15');
  assert.deepEqual(days.map((d) => d.day), ['2026-11-13', '2026-11-15']);
  assert.deepEqual(days[1].items.map((i) => [i.topic.id, i.overdue]), [[1, true], [3, false]]);
});

test('streaks: counts consecutive days and survives until the end of today', () => {
  const act = (days) => days.map((day) => ({ day, kind: 'topic_completed' }));
  assert.deepEqual(streaks([], '2026-11-15'), { current: 0, longest: 0 });
  assert.deepEqual(streaks(act(['2026-11-13', '2026-11-14', '2026-11-15', '2026-11-15']), '2026-11-15'), { current: 3, longest: 3 });
  assert.deepEqual(streaks(act(['2026-11-13', '2026-11-14']), '2026-11-15'), { current: 2, longest: 2 });
  assert.deepEqual(streaks(act(['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-12']), '2026-11-15'), { current: 0, longest: 3 });
  assert.deepEqual(streaks(act(['2026-10-31', '2026-11-01']), '2026-11-01'), { current: 2, longest: 2 });
});

test('heatmap: ends in the current week and marks future days', () => {
  const weeks = heatmapWeeks([{ day: '2026-11-15' }, { day: '2026-11-15' }], '2026-11-15', 4);
  assert.equal(weeks.length, 4);
  const last = weeks[3];
  assert.equal(last[0].day, '2026-11-15'); // a Sunday
  assert.equal(last[0].count, 2);
  assert.equal(last[1].future, true);
  assert.equal(weeks[0][0].day, '2026-10-25');
});

test('tiers and achievements', () => {
  assert.equal(tierProgress(0).current, null);
  assert.equal(tierProgress(0).next.key, 'bronze');
  const mid = tierProgress(35);
  assert.equal(mid.current.key, 'silver');
  assert.equal(mid.next.key, 'gold');
  assert.equal(mid.pctToNext, 50);
  assert.equal(tierProgress(500).next, null);

  const list = achievements({
    subjects: [{ id: 1 }, { id: 2 }],
    topics: [
      { subject_id: 1, completed: true, confidence: 3 },
      { subject_id: 1, completed: true, confidence: null },
      { subject_id: 2, completed: false, confidence: null },
    ],
    interviews: [{ status: 'offer' }],
    activity: [{ day: '2026-11-15', kind: 'experience_posted' }],
    today: '2026-11-15',
  });
  const by = Object.fromEntries(list.map((a) => [a.key, a]));
  assert.equal(by['first-step'].unlocked, true);
  assert.equal(by['subject-done'].unlocked, true);
  assert.equal(by['offer'].unlocked, true);
  assert.equal(by['giver'].unlocked, true);
  assert.equal(by['week-streak'].unlocked, false);
  assert.equal(by['week-streak'].have, 1);
});
