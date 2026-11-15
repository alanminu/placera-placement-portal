import { BookOpen, Briefcase, Check, Flame, Gauge, Lock, Megaphone, Repeat, Star, Trophy } from 'lucide-react';

const ICONS = {
  check: Check,
  flame: Flame,
  book: BookOpen,
  repeat: Repeat,
  gauge: Gauge,
  briefcase: Briefcase,
  trophy: Trophy,
  megaphone: Megaphone,
  star: Star,
};

// Scalloped edge: a circle whose radius wobbles in and out 14 times.
const scallop = (() => {
  const pts = [];
  const bumps = 14;
  for (let i = 0; i < 360; i += 3) {
    const a = (i * Math.PI) / 180;
    const r = 44 + 3 * Math.cos(bumps * a);
    pts.push(`${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
})();

// A medal with two ribbon tails. `tone` picks the metal colour (see .medal-*
// in index.css); `progress` (0-100) draws a ring showing how close a locked
// medal is to unlocking.
export default function Medal({ tone = 'emerald', icon = 'star', unlocked, progress = 0, size = 96 }) {
  const Icon = unlocked ? ICONS[icon] || Star : Lock;
  const r = 30;
  const c = 2 * Math.PI * r;
  return (
    <div className={`medal medal-${tone}${unlocked ? '' : ' locked'}`} style={{ width: size, height: size * 1.18 }}>
      <svg viewBox="0 0 100 118" width={size} height={size * 1.18} aria-hidden="true">
        <path className="medal-ribbon-a" d="M30 70 L22 114 L37 104 L46 116 L50 78 Z" />
        <path className="medal-ribbon-b" d="M70 70 L78 114 L63 104 L54 116 L50 78 Z" />
        <polygon className="medal-edge" points={scallop} />
        <circle className="medal-face" cx="50" cy="50" r="36" />
        {unlocked ? (
          <circle className="medal-shine" cx="50" cy="50" r={r} fill="none" strokeWidth="1.5" strokeDasharray="2 5" />
        ) : (
          <circle
            className="medal-progress"
            cx="50"
            cy="50"
            r={r}
            fill="none"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - progress / 100)}
            transform="rotate(-90 50 50)"
          />
        )}
      </svg>
      <span className="medal-icon">
        <Icon size={size * 0.28} strokeWidth={2.2} />
      </span>
    </div>
  );
}
