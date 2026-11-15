import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { isConfigured } from './lib/supabase.js';
import { useTheme } from './lib/theme.js';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { DataProvider } from './context/DataContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import Layout from './components/Layout.jsx';
import { ForgotPassword, Login, ResetPassword, Signup } from './pages/AuthPages.jsx';
import Dashboard from './pages/Dashboard.jsx';
import SubjectDetail from './pages/SubjectDetail.jsx';
import Revise from './pages/Revise.jsx';
import Planner from './pages/Planner.jsx';
import Interviews from './pages/Interviews.jsx';
import Wall from './pages/Wall.jsx';
import Badges from './pages/Badges.jsx';
import Profile from './pages/Profile.jsx';
import About from './pages/About.jsx';

function SetupNeeded() {
  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>Placera isn't connected to a database yet</h1>
        <p className="muted">
          Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> to a{' '}
          <code>.env.local</code> file (or to your Vercel project settings), then restart. The README has the
          steps.
        </p>
      </div>
    </div>
  );
}

function AppRoutes({ theme, onToggleTheme }) {
  const { ready, user, recovering } = useAuth();
  if (!ready) return <p className="boot">Loading…</p>;

  const themeProps = { theme, onToggleTheme };

  // Opening a password-reset link signs the user in just long enough to set
  // a new password, so that page takes priority over everything else.
  if (recovering) return <ResetPassword {...themeProps} />;

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login {...themeProps} />} />
        <Route path="/signup" element={<Signup {...themeProps} />} />
        <Route path="/forgot-password" element={<ForgotPassword {...themeProps} />} />
        <Route path="/reset-password" element={<ResetPassword {...themeProps} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    // key: a different user gets a completely fresh copy of the data store
    <DataProvider key={user.id}>
      <Routes>
        <Route element={<Layout {...themeProps} />}>
          <Route index element={<Dashboard />} />
          <Route path="subjects/:id" element={<SubjectDetail />} />
          <Route path="revise" element={<Revise />} />
          <Route path="planner" element={<Planner />} />
          <Route path="interviews" element={<Interviews />} />
          <Route path="wall" element={<Wall />} />
          <Route path="badges" element={<Badges />} />
          <Route path="profile" element={<Profile {...themeProps} />} />
          <Route path="about" element={<About />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </DataProvider>
  );
}

export default function App() {
  const [theme, toggleTheme] = useTheme();
  if (!isConfigured) return <SetupNeeded />;
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes theme={theme} onToggleTheme={toggleTheme} />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
