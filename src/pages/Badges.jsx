import React from 'react';

const Badges = ({ subjects, onBack }) => {
  const totalCompleted = subjects.reduce((acc, s) => 
    acc + (s.topics ? s.topics.filter(t => t.completed).length : 0), 0
  );

  const tiers = [
    { name: 'Bronze', goal: 1, color: '#cd7f32' },
    { name: 'Silver', goal: 5, color: '#95a5a6' },
    { name: 'Gold', goal: 10, color: '#f1c40f' },
    { name: 'Platinum', goal: 20, color: '#3498db' },
    { name: 'Diamond', goal: 40, color: '#9b59b6' }
  ];

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <button onClick={onBack} style={backBtn}>← Dashboard</button>
        <h1 style={{ margin: 0 }}>Progress Tiers</h1>
      </header>

      <div style={statusBanner}>
        <span style={{ fontSize: '18px' }}>Current Mastery Score: <strong>{totalCompleted}</strong></span>
      </div>

      <div style={tierGrid}>
        {tiers.map((tier) => {
          const isUnlocked = totalCompleted >= tier.goal;
          
          return (
            <div key={tier.name} style={{
              ...tierCard,
              borderTop: isUnlocked ? `6px solid ${tier.color}` : '6px solid #eee',
              opacity: isUnlocked ? 1 : 0.6
            }}>
              {/* Colored Indicator instead of Icon */}
              <div style={{
                ...statusCircle,
                backgroundColor: isUnlocked ? tier.color : '#eee'
              }} />

              <h3 style={{ margin: '10px 0 5px 0' }}>{tier.name}</h3>
              
              <p style={{ fontSize: '13px', color: '#888', margin: '0 0 15px 0' }}>
                {tier.goal} {tier.goal === 1 ? 'Topic' : 'Topics'} Required
              </p>

              {isUnlocked ? (
                <span style={{ ...statusLabel, color: tier.color }}>UNLOCKED</span>
              ) : (
                <span style={lockedLabel}>{tier.goal - totalCompleted} Remaining</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- Styles ---
const pageStyle = { padding: '30px', maxWidth: '900px', margin: '0 auto', fontFamily: 'sans-serif', minHeight: '100vh' };
const headerStyle = { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' };
const backBtn = { padding: '8px 16px', cursor: 'pointer', borderRadius: '6px', border: '1px solid #ddd', background: 'white' };

const statusBanner = { padding: '20px', background: '#fcfcfc', borderRadius: '12px', marginBottom: '30px', textAlign: 'center', border: '1px solid #eee' };

const tierGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '20px' };

const tierCard = { 
  display: 'flex', 
  flexDirection: 'column', 
  alignItems: 'center', 
  padding: '25px 15px', 
  background: 'white',
  borderRadius: '12px', 
  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  textAlign: 'center'
};

const statusCircle = { width: '20px', height: '20px', borderRadius: '50%', marginBottom: '10px' };
const statusLabel = { fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px' };
const lockedLabel = { fontSize: '11px', color: '#bbb', fontWeight: 'bold' };

export default Badges;