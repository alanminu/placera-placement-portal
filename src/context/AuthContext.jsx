import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase.js';

const AuthContext = createContext(null);
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [ready, setReady] = useState(false);
  const [recovering, setRecovering] = useState(false);

  // Supabase keeps the session in the browser and tells us whenever it changes
  // (sign in, sign out, token refresh, password-reset link opened).
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === 'PASSWORD_RECOVERY') setRecovering(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const userId = session?.user?.id ?? null;

  useEffect(() => {
    let cancelled = false;
    if (!userId) return;
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (!cancelled) setProfile(data);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const signUp = useCallback(async ({ email, password, username, fullName, college }) => {
    const { data: free, error: checkError } = await supabase.rpc('username_available', {
      candidate: username,
    });
    if (checkError) throw checkError;
    if (!free) throw new Error('That username is taken. Try another.');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: username.toLowerCase(), full_name: fullName, college },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
    // With "Confirm email" switched on in Supabase there is no session yet.
    return { needsEmailConfirmation: !data.session };
  }, []);

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const sendPasswordReset = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (password) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    setRecovering(false);
  }, []);

  const updateProfile = useCallback(
    async (patch) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(patch)
        .eq('id', userId)
        .select()
        .single();
      if (error) {
        if (error.code === '23505') throw new Error('That username is taken. Try another.');
        throw error;
      }
      setProfile(data);
    },
    [userId],
  );

  const value = useMemo(
    () => ({
      ready,
      session,
      user: session?.user ?? null,
      profile: userId ? profile : null,
      recovering,
      signUp,
      signIn,
      signOut,
      sendPasswordReset,
      updatePassword,
      updateProfile,
    }),
    [ready, session, userId, profile, recovering, signUp, signIn, signOut, sendPasswordReset, updatePassword, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
