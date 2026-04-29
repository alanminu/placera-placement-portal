import React, { useState } from 'react';
import InterviewTracker from '../components/InterviewTracker';

const Dashboard = ({ user, subjects, interviews, onUpdateInterviews, onSelectSubject, onAddSubject }) => {
  const [showModal, setShowModal] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const calculateSubjectProgress = (sub) => {
    if (!sub.topics || sub.topics.length === 0) return 0;
    const completed = sub.topics.filter(t => t.completed).length;
    return Math.round((completed / sub.topics.length) * 100);
  };

  const calculateOverallProgress = () => {
    const allTopics = subjects.flatMap(sub => sub.topics || []);
    if (allTopics.length === 0) return 0;
    const totalCompleted = allTopics.filter(t => t.completed).length;
    return Math.round((totalCompleted / allTopics.length) * 100);
  };

  const overallProgress = calculateOverallProgress();
  const filteredSubjects = subjects.filter(sub => sub.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <header style={{ marginBottom: '30px' }}>
        <h2 style={{ margin: 0 }}>Welcome, {user.name}</h2>
        <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>Track. Prepare. Succeed.</p>
      </header>

      <div style={overallCardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <h3 style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>OVERALL READINESS</h3>
          <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#4f46e5' }}>{overallProgress}%</span>
        </div>
        <div style={railStyle}>
          <div style={{ ...trackStyle, width: `${overallProgress}%` }}></div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0 }}>Your Subjects</h3>
        <button className="btn-solid" onClick={() => setShowModal(true)}>+ Add Subject</button>
      </div>

      <input type="text" placeholder="Search subject..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={searchInputStyle} />

      <div style={gridStyle}>
        {filteredSubjects.map((sub) => {
          const subProgress = calculateSubjectProgress(sub);
          return (
            <div key={sub.id} style={subjectCardStyle} onClick={() => onSelectSubject(sub)}>
              <h4 style={{ margin: '0 0 10px 0' }}>{sub.name}</h4>
              <div style={{ ...railStyle, height: '4px' }}>
                <div style={{ ...trackStyle, width: `${subProgress}%` }}></div>
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>{subProgress}% Complete</p>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '40px', borderTop: '1px solid #eee', paddingTop: '30px' }}>
        <h3 style={{ marginBottom: '20px' }}>Interview Tracker</h3>
        <InterviewTracker interviews={interviews} onUpdate={onUpdateInterviews} />
      </div>

      {showModal && (
        <div style={modalOverlay}>
          <div style={modalCard}>
            <h3 style={{ marginTop: 0 }}>New Subject</h3>
            <input autoFocus style={modalInput} placeholder="e.g. Operating Systems" value={newSubName} onChange={(e) => setNewSubName(e.target.value)} />
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => { onAddSubject(newSubName); setShowModal(false); setNewSubName(''); }} className="btn-solid" style={{ flex: 1 }}>Create</button>
              <button onClick={() => setShowModal(false)} style={cancelBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const overallCardStyle = { padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '40px' };
const railStyle = { backgroundColor: '#e2e8f0', height: '10px', borderRadius: '5px', overflow: 'hidden' };
const trackStyle = { backgroundColor: '#4f46e5', height: '100%', transition: 'width 0.4s ease' };
const searchInputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px', outline: 'none', boxSizing: 'border-box' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' };
const subjectCardStyle = { cursor: 'pointer', padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px', backgroundColor: '#fff' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalCard = { background: '#fff', padding: '30px', borderRadius: '12px', width: '300px' };
const modalInput = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' };
const cancelBtn = { flex: 1, background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer' };

export default Dashboard;