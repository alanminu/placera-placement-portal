export default function About() {
  return (
    <div className="narrow prose">
      <div className="page-head">
        <h1>About Placera</h1>
      </div>
      <p>
        Placement season means several subjects, dozens of companies and no single place to see how ready you are.
        Placera keeps all of it together.
      </p>
      <h2>How it works</h2>
      <ul>
        <li><strong>Subjects:</strong> add a ready-made syllabus or your own, then tick topics off as you finish them.</li>
        <li><strong>Revise:</strong> finished topics come back after 3, 7, 21 and 45 days so they stay in memory.</li>
        <li><strong>Planner:</strong> give it a deadline and it spreads what's left across the days you have.</li>
        <li><strong>Interviews:</strong> follow each application from applying to the result.</li>
        <li><strong>Experience wall:</strong> read and share the questions companies actually asked.</li>
      </ul>
      <h2>Your data</h2>
      <p>
        Your subjects, notes, interviews and plans are private to your account. The only thing other people can
        see is what you post on the experience wall, and you can post there anonymously.
      </p>
      <p className="muted small">Built by a student, for students. Version 2.0</p>
    </div>
  );
}
