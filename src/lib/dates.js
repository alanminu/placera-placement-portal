// Dates are handled as 'YYYY-MM-DD' strings in the user's local time zone,
// which is also how the database stores them (type: date).

const pad = (n) => String(n).padStart(2, '0');

export const toDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const todayStr = () => toDateStr(new Date());

// Noon avoids daylight-saving edge cases when adding days.
export const parseDate = (str) => {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
};

export const addDays = (str, n) => {
  const d = parseDate(str);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
};

// Whole days from a to b (positive when b is later).
export const diffDays = (a, b) => Math.round((parseDate(b) - parseDate(a)) / 86400000);

export const formatDate = (str, opts = { day: 'numeric', month: 'short' }) =>
  parseDate(str).toLocaleDateString('en-IN', opts);

export const formatLong = (str) =>
  formatDate(str, { weekday: 'short', day: 'numeric', month: 'short' });

export const countdown = (str, today = todayStr()) => {
  const n = diffDays(today, str);
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  if (n < 0) return n === -1 ? 'Yesterday' : `${-n} days ago`;
  return `In ${n} days`;
};
