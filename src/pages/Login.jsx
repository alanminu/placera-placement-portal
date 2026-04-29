import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onLogin({ name, email });
    }
  };

  return (
    <div style={containerStyle}>
      <div style={loginCardStyle}>
        {/* Logo Section matching Navbar style */}
        <header style={{ marginBottom: '32px', textAlign: 'center' }}>
          <h1 style={logoStyle}>Placera</h1>
          <p style={subtitleStyle}>Track. Prepare. Succeed.</p>
        </header>

        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={inputGroup}>
            <label style={labelStyle}>Full Name</label>
            <input
              style={inputStyle}
              type="text"
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div style={inputGroup}>
            <label style={labelStyle}>Student Email</label>
            <input
              style={inputStyle}
              type="email"
              placeholder="name@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button type="submit" style={loginBtnStyle}>
            Get Started
          </button>
        </form>

        <footer style={footerStyle}>
          <p style={{ margin: 0 }}>Version 1.0.0</p>
        </footer>
      </div>
    </div>
  );
};

// --- Styles (Matched to Dashboard & App.jsx) ---

const containerStyle = {
  height: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#fdfdfd', // Matches App.jsx background
};

const loginCardStyle = {
  width: '100%',
  maxWidth: '400px',
  padding: '40px',
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  border: '1px solid #e2e8f0', // Matches Dashboard cards
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
};

const logoStyle = {
  margin: 0,
  fontSize: '32px',
  fontWeight: '800',
  color: '#4f46e5', // Matches Navbar logo
  letterSpacing: '-0.5px',
};

const subtitleStyle = {
  margin: '8px 0 0 0',
  fontSize: '14px',
  color: '#64748b', // Matches Dashboard subtext
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
};

const inputGroup = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const labelStyle = {
  fontSize: '13px',
  fontWeight: '600',
  color: '#1e293b',
};

const inputStyle = {
  padding: '12px',
  borderRadius: '8px',
  border: '1px solid #e2e8f0', // Matches search input in Dashboard
  fontSize: '14px',
  outline: 'none',
  backgroundColor: '#fff',
};

const loginBtnStyle = {
  marginTop: '10px',
  padding: '12px',
  backgroundColor: '#4f46e5', // Primary brand color
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  fontSize: '15px',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'opacity 0.2s',
};

const footerStyle = {
  marginTop: '30px',
  textAlign: 'center',
  fontSize: '12px',
  color: '#94a3b8',
};

export default Login;