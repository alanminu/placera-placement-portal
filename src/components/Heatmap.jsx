import { heatmapWeeks } from '../lib/stats.js';
import { formatDate } from '../lib/dates.js';

const level = (n) => (n === 0 ? 0 : n <= 1 ? 1 : n <= 3 ? 2 : n <= 6 ? 3 : 4);

// GitHub-style grid: one square per day, darker means more study actions.
export default function Heatmap({ activity, today }) {
  const weeks = heatmapWeeks(activity, today, 18);
  return (
    <div className="heat-wrap">
      <div className="heat" role="img" aria-label="Study activity over the last 18 weeks">
        {weeks.map((col) => (
          <div className="heat-col" key={col[0].day}>
            {col.map((cell) => (
              <span
                key={cell.day}
                className={`heat-cell l${cell.future ? 'x' : level(cell.count)}`}
                title={cell.future ? '' : `${formatDate(cell.day)}: ${cell.count} ${cell.count === 1 ? 'action' : 'actions'}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="heat-legend">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <span key={l} className={`heat-cell l${l}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
