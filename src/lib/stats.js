import { addDays, diffDays, parseDate } from './dates.js';

export const percent = (done, total) => (total === 0 ? 0 : Math.round((done / total) * 100));

export const progressOf = (topics) => {
  const done = topics.filter((t) => t.completed).length;
  return { done, total: topics.length, pct: percent(done, topics.length) };
};

// activity: rows of { day }. A streak stays alive if you studied today or
// yesterday (so it does not reset before you have had a chance to study today).
export function streaks(activity, today) {
  const days = [...new Set(activity.map((a) => a.day))].sort();
  if (days.length === 0) return { current: 0, longest: 0 };

  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    run = diffDays(days[i - 1], days[i]) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  const set = new Set(days);
  let cursor = set.has(today) ? today : addDays(today, -1);
  let current = 0;
  while (set.has(cursor)) {
    current += 1;
    cursor = addDays(cursor, -1);
  }
  return { current, longest };
}

// Columns of 7 days (Sunday to Saturday) ending in the current week.
export function heatmapWeeks(activity, today, weeks = 18) {
  const counts = new Map();
  for (const a of activity) counts.set(a.day, (counts.get(a.day) || 0) + 1);

  const endOfWeek = addDays(today, 6 - parseDate(today).getDay());
  const start = addDays(endOfWeek, -(weeks * 7 - 1));
  const out = [];
  for (let w = 0; w < weeks; w++) {
    const col = [];
    for (let d = 0; d < 7; d++) {
      const day = addDays(start, w * 7 + d);
      col.push({ day, count: counts.get(day) || 0, future: day > today });
    }
    out.push(col);
  }
  return out;
}

export const TIERS = [
  { key: 'bronze', name: 'Bronze', goal: 5 },
  { key: 'silver', name: 'Silver', goal: 20 },
  { key: 'gold', name: 'Gold', goal: 50 },
  { key: 'platinum', name: 'Platinum', goal: 100 },
  { key: 'diamond', name: 'Diamond', goal: 175 },
];

export function tierProgress(completedCount) {
  const next = TIERS.find((t) => completedCount < t.goal) || null;
  const current = [...TIERS].reverse().find((t) => completedCount >= t.goal) || null;
  const floor = current ? current.goal : 0;
  return {
    current,
    next,
    pctToNext: next ? percent(completedCount - floor, next.goal - floor) : 100,
  };
}

// Each achievement reports how far along the user is, so locked badges can
// show progress instead of just a padlock.
export function achievements({ subjects, topics, interviews, activity, today }) {
  const { longest } = streaks(activity, today);
  const count = (kind) => activity.filter((a) => a.kind === kind).length;
  const fullSubjects = subjects.filter((s) => {
    const own = topics.filter((t) => t.subject_id === s.id);
    return own.length > 0 && own.every((t) => t.completed);
  }).length;
  const rated = topics.filter((t) => t.confidence).length;

  const list = [
    { key: 'first-step', icon: 'check', name: 'First step', hint: 'Finish your first topic', have: topics.filter((t) => t.completed).length, need: 1 },
    { key: 'week-streak', icon: 'flame', name: 'On a roll', hint: 'Study 7 days in a row', have: longest, need: 7 },
    { key: 'month-streak', icon: 'flame', name: 'Unstoppable', hint: 'Study 30 days in a row', have: longest, need: 30 },
    { key: 'subject-done', icon: 'book', name: 'Closed the book', hint: 'Finish every topic in a subject', have: fullSubjects, need: 1 },
    { key: 'reviser', icon: 'repeat', name: 'It stuck', hint: 'Complete 10 revisions', have: count('revision'), need: 10 },
    { key: 'honest', icon: 'gauge', name: 'Know thyself', hint: 'Rate your confidence on 15 topics', have: rated, need: 15 },
    { key: 'applied', icon: 'briefcase', name: 'In the game', hint: 'Track your first interview', have: interviews.length, need: 1 },
    { key: 'offer', icon: 'trophy', name: 'Placed', hint: 'Mark an interview as an offer', have: interviews.filter((i) => i.status === 'offer').length, need: 1 },
    { key: 'giver', icon: 'megaphone', name: 'Paid it forward', hint: 'Share an interview experience', have: count('experience_posted'), need: 1 },
  ];
  return list.map((a) => ({ ...a, have: Math.min(a.have, a.need), unlocked: a.have >= a.need }));
}
