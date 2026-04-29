import React, { useState } from 'react';

const InterviewTracker = ({ interviews = [], onUpdate }) => {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [date, setDate] = useState('');

  // Helper to calculate days remaining
  const getCountdown = (interviewDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(interviewDate);
    target.setHours(0, 0, 0, 0);
    
    const diffInMs = target - today;
    const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Today! 🎯";
    if (diffInDays < 0) return "Passed";
    return `${diffInDays} days to go`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!company.trim() || !date) return;

    const newEntry = {
      id: Date.now(),
      company: company.trim(),
      role: role.trim() || 'Software Engineer',
      date: date
    };

    onUpdate([...interviews, newEntry]);
    setCompany('');
    setRole('');
    setDate('');
  };

  const deleteInterview = (id) => {
    if (window.confirm("Remove this interview?")) {
      const filtered = interviews.filter(item => item.id !== id);
      onUpdate(filtered);
    }
  };

  return (
    <div style={{ backgroundColor: '#fff', borderRadius: '12px' }}>
      <form onSubmit={handleSubmit} style={formStyle}>
        <input 
          style={inputStyle} 
          placeholder="Company" 
          value={company} 
          onChange={(e) => setCompany(e.target.value)} 
          required 
        />
        <input 
          style={inputStyle} 
          placeholder="Role" 
          value={role} 
          onChange={(e) => setRole(e.target.value)} 
        />
        <input 
          style={inputStyle} 
          type="date" 
          value={date} 
          onChange={(e) => setDate(e.target.value)} 
          required 
        />
        <button type="submit" style={addBtnStyle}>Add</button>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {interviews.length === 0 ? (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px', fontSize: '14px' }}>
            No upcoming interviews tracked.
          </p>
        ) : (
          interviews.map((item) => (
            <div key={item.id} style={interviewCard}>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#1e293b' }}>{item.company}</h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  {item.role} • {item.date}
                </p>
              </div>
              
              <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={countdownText}>
                  {getCountdown(item.date)}
                </span>
                <button 
                  onClick={() => deleteInterview(item.id)} 
                  style={deleteLink}
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// --- Styles to match your original clean look ---
const formStyle = { display: 'flex', gap: '10px', marginBottom: '25px' };
const inputStyle = { flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px' };
const addBtnStyle = { background: '#000', color: '#fff', border: 'none', padding: '0 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };

const interviewCard = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px 20px',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  backgroundColor: '#fff'
};

const countdownText = {
  fontSize: '13px',
  fontWeight: '700',
  color: '#4f46e5',
  backgroundColor: '#f5f3ff',
  padding: '4px 10px',
  borderRadius: '20px'
};

const deleteLink = {
  background: 'none',
  border: 'none',
  color: '#94a3b8',
  fontSize: '12px',
  cursor: 'pointer',
  padding: 0
};

export default InterviewTracker;