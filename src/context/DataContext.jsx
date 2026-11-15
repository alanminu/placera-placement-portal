import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { addDays, todayStr } from '../lib/dates.js';
import { completePatch, reviewPatch, uncompletePatch } from '../lib/revision.js';
import { buildPlan } from '../lib/planner.js';
import { useAuth } from './AuthContext.jsx';
import { useToast } from './ToastContext.jsx';

const DataContext = createContext(null);
// eslint-disable-next-line react-refresh/only-export-components
export const useData = () => useContext(DataContext);

const EMPTY = { subjects: [], topics: [], interviews: [], activity: [], plan: null, planTasks: [] };

// Throws if Supabase returned an error, otherwise returns the rows.
const unwrap = ({ data, error }) => {
  if (error) throw error;
  return data;
};

// Loads everything that belongs to the signed-in user once, keeps it in
// React state, and exposes functions that write to the database and then
// update that state. No user ids are sent from here: the database fills in
// user_id itself and Row Level Security enforces who owns what.
export function DataProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const userId = user?.id;

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const since = addDays(todayStr(), -370);
      const [subjects, topics, interviews, activity, plans] = await Promise.all([
        supabase.from('subjects').select('*').order('created_at').then(unwrap),
        supabase.from('topics').select('*').order('position').order('id').then(unwrap),
        supabase.from('interviews').select('*').order('created_at').then(unwrap),
        supabase.from('activity_log').select('day, kind').gte('day', since).then(unwrap),
        supabase.from('study_plans').select('*').order('created_at', { ascending: false }).limit(1).then(unwrap),
      ]);
      const plan = plans[0] || null;
      const planTasks = plan
        ? await supabase.from('plan_tasks').select('*').eq('plan_id', plan.id).order('due_on').order('id').then(unwrap)
        : [];
      setData({ subjects, topics, interviews, activity, plan, planTasks });
    } catch (err) {
      setLoadError(err.message || 'Could not load your data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    load();
  }, [userId, load]);

  const patch = (fn) => setData((prev) => ({ ...prev, ...fn(prev) }));

  // Runs a write and shows a message instead of crashing if it fails.
  const run = useCallback(
    async (work) => {
      try {
        return await work();
      } catch (err) {
        toast(err.message || 'Something went wrong. Try again.', 'error');
        return null;
      }
    },
    [toast],
  );

  const logActivity = useCallback(async (kind) => {
    const row = { kind, day: todayStr() };
    const { error } = await supabase.from('activity_log').insert(row);
    if (!error) patch((p) => ({ activity: [...p.activity, row] }));
  }, []);

  const actions = useMemo(() => {
    const saveTopic = async (id, fields) => {
      const row = unwrap(await supabase.from('topics').update(fields).eq('id', id).select().single());
      patch((p) => ({ topics: p.topics.map((t) => (t.id === id ? row : t)) }));
      return row;
    };

    return {
      reload: load,

      addSubject: (name, topicNames = []) =>
        run(async () => {
          const subject = unwrap(await supabase.from('subjects').insert({ name }).select().single());
          let topics = [];
          if (topicNames.length) {
            topics = unwrap(
              await supabase
                .from('topics')
                .insert(topicNames.map((n, i) => ({ subject_id: subject.id, name: n, position: i })))
                .select(),
            );
          }
          patch((p) => ({ subjects: [...p.subjects, subject], topics: [...p.topics, ...topics] }));
          return subject;
        }),

      renameSubject: (id, name) =>
        run(async () => {
          const row = unwrap(await supabase.from('subjects').update({ name }).eq('id', id).select().single());
          patch((p) => ({ subjects: p.subjects.map((s) => (s.id === id ? row : s)) }));
        }),

      // Topics and plan tasks under it are removed by the database (on delete cascade).
      deleteSubject: (id) =>
        run(async () => {
          unwrap(await supabase.from('subjects').delete().eq('id', id));
          patch((p) => {
            const gone = new Set(p.topics.filter((t) => t.subject_id === id).map((t) => t.id));
            return {
              subjects: p.subjects.filter((s) => s.id !== id),
              topics: p.topics.filter((t) => t.subject_id !== id),
              planTasks: p.planTasks.filter((t) => !gone.has(t.topic_id)),
            };
          });
          return true;
        }),

      addTopic: (subjectId, name, position) =>
        run(async () => {
          const row = unwrap(
            await supabase.from('topics').insert({ subject_id: subjectId, name, position }).select().single(),
          );
          patch((p) => ({ topics: [...p.topics, row] }));
        }),

      updateTopic: (id, fields) => run(() => saveTopic(id, fields)),

      deleteTopic: (id) =>
        run(async () => {
          unwrap(await supabase.from('topics').delete().eq('id', id));
          patch((p) => ({
            topics: p.topics.filter((t) => t.id !== id),
            planTasks: p.planTasks.filter((t) => t.topic_id !== id),
          }));
        }),

      toggleTopic: (topic) =>
        run(async () => {
          if (topic.completed) {
            await saveTopic(topic.id, uncompletePatch());
          } else {
            await saveTopic(topic.id, completePatch(todayStr()));
            await logActivity('topic_completed');
          }
        }),

      reviewTopic: (topic, result) =>
        run(async () => {
          await saveTopic(topic.id, reviewPatch(topic, result, todayStr()));
          await logActivity('revision');
        }),

      addInterview: (fields) =>
        run(async () => {
          const row = unwrap(await supabase.from('interviews').insert(fields).select().single());
          patch((p) => ({ interviews: [...p.interviews, row] }));
          await logActivity('interview_added');
          return row;
        }),

      updateInterview: (id, fields) =>
        run(async () => {
          const row = unwrap(await supabase.from('interviews').update(fields).eq('id', id).select().single());
          patch((p) => ({ interviews: p.interviews.map((i) => (i.id === id ? row : i)) }));
          return row;
        }),

      deleteInterview: (id) =>
        run(async () => {
          unwrap(await supabase.from('interviews').delete().eq('id', id));
          patch((p) => ({ interviews: p.interviews.filter((i) => i.id !== id) }));
        }),

      // One plan at a time: making a new one replaces the old one.
      createPlan: ({ title, targetDate, topics }) =>
        run(async () => {
          const startOn = todayStr();
          const built = buildPlan(topics, startOn, targetDate);
          unwrap(await supabase.from('study_plans').delete().gte('id', 0));
          const plan = unwrap(
            await supabase
              .from('study_plans')
              .insert({ title, start_on: startOn, target_date: targetDate })
              .select()
              .single(),
          );
          const planTasks = unwrap(
            await supabase
              .from('plan_tasks')
              .insert(built.tasks.map((t) => ({ ...t, plan_id: plan.id })))
              .select(),
          );
          patch(() => ({ plan, planTasks }));
          return plan;
        }),

      deletePlan: (id) =>
        run(async () => {
          unwrap(await supabase.from('study_plans').delete().eq('id', id));
          patch(() => ({ plan: null, planTasks: [] }));
        }),

      logActivity,
    };
  }, [load, run, logActivity]);

  const value = useMemo(
    () => ({ ...(userId ? data : EMPTY), loading, loadError, ...actions }),
    [userId, data, loading, loadError, actions],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
