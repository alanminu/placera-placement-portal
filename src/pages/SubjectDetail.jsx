import React, { useState } from 'react';

const SubjectDetail = ({ subject, onBack, onUpdateProgress }) => {
  const [topicName, setTopicName] = useState('');

  const handleAddTopic = (e) => {
    e.preventDefault();
    if (!topicName.trim()) return;
    const newTopics = [...subject.topics, { name: topicName, completed: false }];
    onUpdateProgress(subject.id, newTopics);
    setTopicName('');
  };

  const toggleTopic = (index) => {
    const newTopics = subject.topics.map((t, i) => i === index ? { ...t, completed: !t.completed } : t);
    onUpdateProgress(subject.id, newTopics);
  };

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '20px' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontWeight: 'bold', marginBottom: '20px' }}>← Back to Dashboard</button>

      <h2 style={{ marginBottom: '10px' }}>{subject.name}</h2>
      
      <form onSubmit={handleAddTopic} style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
        <input 
          style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} 
          placeholder="Add a new topic..." 
          value={topicName} 
          onChange={(e) => setTopicName(e.target.value)} 
        />
        <button type="submit" style={{ padding: '0 20px', background: '#000', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Add</button>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {subject.topics.map((topic, index) => (
          <div key={index} onClick={() => toggleTopic(index)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '15px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '4px', border: `2px solid ${topic.completed ? '#4f46e5' : '#cbd5e1'}`, backgroundColor: topic.completed ? '#4f46e5' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              {topic.completed && '✓'}
            </div>
            <span style={{ fontSize: '15px', color: topic.completed ? '#94a3b8' : '#1e293b' }}>{topic.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubjectDetail;