import { addDays } from './dates.js';

// Spaced repetition: after finishing a topic it comes back for revision
// after 3 days, then 7, 21 and 45. Each gap is longer because every
// successful recall makes the memory last longer.
export const INTERVALS = [3, 7, 21, 45];

// Fields to save when a topic is ticked or unticked.
export const completePatch = (today) => ({
  completed: true,
  completed_at: new Date().toISOString(),
  revision_stage: 0,
  next_review_on: addDays(today, INTERVALS[0]),
});

export const uncompletePatch = () => ({
  completed: false,
  completed_at: null,
  revision_stage: 0,
  next_review_on: null,
  last_reviewed_on: null,
});

// result: 'good' moves to the next (longer) gap, 'shaky' starts over tomorrow.
export const reviewPatch = (topic, result, today) => {
  if (result === 'shaky') {
    return { revision_stage: 0, next_review_on: addDays(today, 1), last_reviewed_on: today };
  }
  const stage = Math.min(topic.revision_stage + 1, INTERVALS.length - 1);
  return {
    revision_stage: stage,
    next_review_on: addDays(today, INTERVALS[stage]),
    last_reviewed_on: today,
  };
};

export const dueTopics = (topics, today) =>
  topics
    .filter((t) => t.completed && t.next_review_on && t.next_review_on <= today)
    .sort((a, b) => a.next_review_on.localeCompare(b.next_review_on));

export const upcomingTopics = (topics, today) =>
  topics
    .filter((t) => t.completed && t.next_review_on && t.next_review_on > today)
    .sort((a, b) => a.next_review_on.localeCompare(b.next_review_on));

// Topics the user rated 1 or 2 out of 5, lowest first.
export const weakTopics = (topics, limit = 8) =>
  topics
    .filter((t) => t.confidence && t.confidence <= 2)
    .sort((a, b) => a.confidence - b.confidence)
    .slice(0, limit);
