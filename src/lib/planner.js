import { addDays, diffDays } from './dates.js';

// Spreads unfinished topics evenly over the days before a deadline.
//   topics:     unfinished topics, already in the order to study them
//   startOn:    first study day ('YYYY-MM-DD')
//   targetDate: the interview / deadline day
// The day before the deadline is kept free for revision whenever there are
// at least two days to work with.
export function buildPlan(topics, startOn, targetDate) {
  const daysLeft = diffDays(startOn, targetDate);
  if (daysLeft < 1) throw new Error('Pick a date after today.');
  if (topics.length === 0) throw new Error('There are no unfinished topics to plan.');

  const hasRevisionDay = daysLeft >= 2;
  const studyDays = hasRevisionDay ? daysLeft - 1 : daysLeft;

  const tasks = topics.map((topic, i) => ({
    topic_id: topic.id,
    due_on: addDays(startOn, Math.floor((i * studyDays) / topics.length)),
  }));

  return {
    tasks,
    studyDays,
    perDay: Math.ceil(topics.length / studyDays),
    revisionDay: hasRevisionDay ? addDays(targetDate, -1) : null,
  };
}

// Groups tasks by day for display. Unfinished tasks from past days are
// carried over to today so nothing silently disappears.
export function groupTasks(tasks, topicsById, today) {
  const byDay = new Map();
  for (const task of tasks) {
    const topic = topicsById.get(task.topic_id);
    if (!topic) continue;
    const overdue = task.due_on < today && !topic.completed;
    const day = overdue ? today : task.due_on;
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day).push({ ...task, topic, overdue });
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, items]) => ({ day, items }));
}
