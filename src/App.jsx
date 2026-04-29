import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SubjectDetail from './pages/SubjectDetail';
import Badges from './pages/Badges';
import About from './pages/About';

function App() {
  const [user, setUser] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard'); 
  const [activeSubject, setActiveSubject] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('placera_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      const userSubs = localStorage.getItem(`placera_subjects_${parsedUser.name}`);
      if (userSubs) setSubjects(JSON.parse(userSubs));
      const userInts = localStorage.getItem(`placera_interviews_${parsedUser.name}`);
      if (userInts) setInterviews(JSON.parse(userInts));
    }
  }, []);

  const handleLogin = (userData) => {
    localStorage.setItem('placera_user', JSON.stringify(userData));
    setUser(userData);
    const subKey = `placera_subjects_${userData.name}`;
    const intKey = `placera_interviews_${userData.name}`;
    
    const savedSubs = localStorage.getItem(subKey);
    const savedInts = localStorage.getItem(intKey);

    if (savedSubs) setSubjects(JSON.parse(savedSubs));
    else {
      const defaults = [
        { id: 1, name: 'Operating Systems', topics: [{ name: 'Process Scheduling', completed: false }] },
        { id: 2, name: 'DBMS', topics: [{ name: 'SQL Queries', completed: false }] }
      ];
      setSubjects(defaults);
      localStorage.setItem(subKey, JSON.stringify(defaults));
    }
    if (savedInts) setInterviews(JSON.parse(savedInts));
  };

  const handleUpdateProgress = (subId, newTopics) => {
    const updated = subjects.map(s => s.id === subId ? { ...s, topics: newTopics } : s);
    setSubjects(updated);
    localStorage.setItem(`placera_subjects_${user.name}`, JSON.stringify(updated));
    if (activeSubject && activeSubject.id === subId) {
      setActiveSubject({ ...activeSubject, topics: newTopics });
    }
  };

  const handleAddSubject = (name) => {
    const newSub = { id: Date.now(), name, topics: [] };
    const updated = [...subjects, newSub];
    setSubjects(updated);
    localStorage.setItem(`placera_subjects_${user.name}`, JSON.stringify(updated));
  };

  const handleUpdateInterviews = (newInterviews) => {
    setInterviews(newInterviews);
    localStorage.setItem(`placera_interviews_${user.name}`, JSON.stringify(newInterviews));
  };

  const handleLogout = () => {
    localStorage.removeItem('placera_user');
    setUser(null);
    setSubjects([]);
    setInterviews([]);
    setCurrentView('dashboard');
  };

  const Navbar = () => (
    <nav style={navStyle}>
      <div style={navContent}>
        <h2 style={{ margin: 0, color: '#4f46e5', cursor: 'pointer' }} onClick={() => setCurrentView('dashboard')}>Placera</h2>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <span style={linkStyle(currentView === 'dashboard')} onClick={() => setCurrentView('dashboard')}>Dashboard</span>
          <span style={linkStyle(currentView === 'badges')} onClick={() => setCurrentView('badges')}>Tiers</span>
          <span style={linkStyle(currentView === 'about')} onClick={() => setCurrentView('about')}>About</span>
          <button onClick={handleLogout} style={logoutBtn}>Logout</button>
        </div>
      </div>
    </nav>
  );

  if (!user) return <Login onLogin={handleLogin} />;

  const renderContent = () => {
    switch (currentView) {
      case 'badges': return <Badges subjects={subjects} onBack={() => setCurrentView('dashboard')} />;
      case 'about': return <About />;
      case 'detail': 
        return activeSubject ? (
          <SubjectDetail 
            subject={activeSubject} 
            onBack={() => setCurrentView('dashboard')} 
            onUpdateProgress={handleUpdateProgress} 
          />
        ) : setCurrentView('dashboard');
      default: return (
        <Dashboard 
          user={user} 
          subjects={subjects} 
          interviews={interviews}
          onUpdateInterviews={handleUpdateInterviews}
          onSelectSubject={(sub) => { setActiveSubject(sub); setCurrentView('detail'); }}
          onAddSubject={handleAddSubject}
        />
      );
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fdfdfd' }}>
      <Navbar />
      <main style={{ paddingTop: '20px' }}>{renderContent()}</main>
    </div>
  );
}

const navStyle = { height: '70px', backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', position: 'sticky', top: 0, zIndex: 1000 };
const navContent = { width: '100%', maxWidth: '1000px', margin: '0 auto', padding: '0 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const linkStyle = (isActive) => ({ cursor: 'pointer', fontWeight: '600', fontSize: '14px', color: isActive ? '#4f46e5' : '#6b7280' });
const logoutBtn = { padding: '8px 15px', backgroundColor: '#fff', color: '#ff4d4d', border: '1px solid #ff4d4d', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' };

export default App;