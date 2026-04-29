import React from 'react';

const About = () => {
  return (
    <div className="page-container">
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '600', margin: 0 }}>About Placera</h1>
        <p style={{ color: 'var(--text-sub)', marginTop: '8px' }}>Your ultimate placement preparation companion.</p>
      </header>

      <div className="flat-card" style={{ lineHeight: '1.6' }}>
        <h3 style={{ marginTop: 0 }}>Our Mission</h3>
        <p>
          Placera was built to simplify the chaotic process of college placements. 
          We believe that every student deserves a structured way to track their 
          learning, manage interview schedules, and stay organized during the most 
          critical phase of their academic journey.
        </p>

        <h3 style={{ marginTop: '30px' }}>How it Works</h3>
        <ul style={{ paddingLeft: '20px', color: 'var(--text-main)' }}>
          <li><strong>Track Subjects:</strong> Break down complex subjects into manageable topics and track your progress.</li>
          <li><strong>Interview Management:</strong> Never miss a deadline or an interview call with our built-in tracker.</li>
          <li><strong>Stay Focused:</strong> A clean, minimalist interface designed to keep distractions at bay.</li>
        </ul>

        <div style={footerStyle}>
          <p style={{ margin: 0 }}>Built for students, by students.</p>
          <small style={{ color: 'var(--text-sub)' }}>Version 1.0.0</small>
        </div>
      </div>
    </div>
  );
};

const footerStyle = {
  marginTop: '40px',
  paddingTop: '20px',
  borderTop: '1px solid var(--border)',
  textAlign: 'center'
};

export default About;