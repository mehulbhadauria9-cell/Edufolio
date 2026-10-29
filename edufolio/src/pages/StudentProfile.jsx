import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trash2, Award, Plus, X, CheckCircle2, Sparkles, Calendar, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '../components/dashboard/AppLayout';
import { ProfileBackground } from '../components/background/Backgrounds';
import TitleCard from '../components/profile/TitleCard';
import LeetCodeTracker from '../components/profile/LeetCodeTracker';
import AchievementTimeline from '../components/profile/AchievementTimeline';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

const DOMAINS = [
  { value: 'competitive_programming', label: 'Competitive Programming' },
  { value: 'sports', label: 'Sports & Athletics' },
  { value: 'cultural', label: 'Cultural & Arts' },
  { value: 'academics', label: 'Academic Excellence' },
  { value: 'technical', label: 'Technical & Hackathons' }
];

export default function StudentProfile() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const targetId = studentId ?? user?.id;
  const isOwner = targetId === user?.id;

  const [student, setStudent] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  // Award modal state
  const [awardModalOpen, setAwardModalOpen] = useState(false);
  const [awardForm, setAwardForm] = useState({
    domain: 'competitive_programming',
    title: '',
    description: '',
    points: '',
    date_awarded: new Date().toISOString().slice(0, 10)
  });
  const [awardLoading, setAwardLoading] = useState(false);
  const [awardSuccess, setAwardSuccess] = useState(null);
  const [awardError, setAwardError] = useState('');

  useEffect(() => {
    // If non-student visits /profile without studentId, redirect to top student or dashboard
    if (!studentId && user && user.role !== 'student') {
      supabase
        .from('students')
        .select('id')
        .order('total_points', { ascending: false })
        .limit(1)
        .then(({ data }) => {
          if (data && data[0]?.id) {
            navigate(`/profile/${data[0].id}`, { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
        });
      return;
    }

    if (!targetId) return;
    let mounted = true;

    async function load() {
      try {
        const { data: s } = await supabase.from('students').select('*').eq('id', targetId).single();
        let resolvedStudent = s;
        if (!resolvedStudent) {
          const { data: all } = await supabase.from('students').select('*');
          resolvedStudent = (all ?? []).find((st) => st.id === targetId || st.userId === targetId) || null;
        }

        const actualId = resolvedStudent?.id || targetId;
        const { data: a } = await supabase
          .from('achievements')
          .select('*')
          .eq('student_id', actualId)
          .order('date_awarded', { ascending: false });

        if (!mounted) return;

        const achievementList = a ?? [];
        if (resolvedStudent) {
          const computedSum = achievementList.reduce((sum, item) => sum + (Number(item.points) || 0), 0);
          resolvedStudent = {
            ...resolvedStudent,
            total_points: Math.max(Number(resolvedStudent.total_points) || 0, computedSum)
          };
        }

        setStudent(resolvedStudent);
        setAchievements(achievementList);
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    const channel = supabase
      .channel(`profile-${targetId}-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'achievements' }, () => {
        if (mounted) load();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => {
        if (mounted) load();
      })
      .subscribe();

    const onCustomEvent = () => {
      if (mounted) load();
    };
    window.addEventListener('edufolio-achievement-added', onCustomEvent);
    window.addEventListener('focus', onCustomEvent);

    return () => {
      mounted = false;
      window.removeEventListener('edufolio-achievement-added', onCustomEvent);
      window.removeEventListener('focus', onCustomEvent);
      supabase.removeChannel(channel);
    };
  }, [targetId, studentId, user, navigate]);

  async function handleAwardSubmit(e) {
    e.preventDefault();
    if (!awardForm.title.trim()) {
      setAwardError('Please enter an achievement title.');
      return;
    }
    const pointsNum = Number(awardForm.points);
    if (!pointsNum || pointsNum <= 0) {
      setAwardError('Please specify a positive points award.');
      return;
    }

    setAwardLoading(true);
    setAwardError('');

    const dateVal = awardForm.date_awarded || new Date().toISOString().slice(0, 10);
    const createdBy = user?.id || student.userId || student.id;

    const { data, error } = await supabase.from('achievements').insert({
      student_id: student.id,
      domain: awardForm.domain,
      title: awardForm.title.trim(),
      description: awardForm.description.trim(),
      points: pointsNum,
      date_awarded: dateVal,
      created_by: createdBy
    });

    if (error) {
      setAwardError(error.message || 'Failed to record achievement.');
      setAwardLoading(false);
      return;
    }

    const newRecord = data || {
      id: crypto.randomUUID(),
      student_id: student.id,
      domain: awardForm.domain,
      title: awardForm.title.trim(),
      description: awardForm.description.trim(),
      points: pointsNum,
      date_awarded: dateVal,
      created_at: new Date().toISOString()
    };

    // Update UI state immediately
    setAchievements((prev) => [newRecord, ...prev]);
    setStudent((prev) => ({
      ...prev,
      total_points: (Number(prev.total_points) || 0) + pointsNum
    }));

    setAwardSuccess({ points: pointsNum, title: newRecord.title });
    setAwardLoading(false);

    // Auto-close modal after 1.4s
    setTimeout(() => {
      setAwardModalOpen(false);
      setAwardSuccess(null);
      setAwardForm({
        domain: 'competitive_programming',
        title: '',
        description: '',
        points: '',
        date_awarded: new Date().toISOString().slice(0, 10)
      });
    }, 1400);
  }

  return (
    <AppLayout background={<ProfileBackground />}>
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="matte-card rounded-2xl border border-slate-800 bg-[#121622] p-8 flex flex-col items-center gap-3.5 shadow-sm max-w-sm w-full text-center">
            <div className="h-9 w-9 rounded-lg border-2 border-slate-700 border-t-indigo-500 animate-spin" />
            <div>
              <p className="font-display text-sm font-bold text-slate-100">Loading Student Portfolio</p>
              <p className="text-xs text-slate-400 mt-0.5">Fetching verified records & metrics…</p>
            </div>
          </div>
        </div>
      ) : !student ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="matte-card rounded-2xl border border-slate-800 bg-[#121622] p-8 max-w-md w-full shadow-lg">
            <p className="font-display text-lg font-bold text-white mb-2">Student Profile Not Found</p>
            <p className="text-xs text-slate-400 mb-6">Could not locate an active student portfolio matching this identifier.</p>
            <button
              type="button"
              data-cursor-hover
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition"
            >
              <ArrowLeft size={14} />
              <span>Return to Leaderboard</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[360px_1fr] xl:grid-cols-[400px_1fr]">
          <div className="space-y-6">
            <TitleCard
              student={student}
              editable={isOwner}
              onAvatarUploaded={(url) => setStudent((s) => ({ ...s, avatar_url: url }))}
            />
            <LeetCodeTracker
              username={student.leetcode_handle}
              student={student}
              editable={isOwner}
              onUpdated={(updated) => {
                if (updated) setStudent((prev) => ({ ...prev, ...updated }));
                supabase
                  .from('achievements')
                  .select('*')
                  .eq('student_id', student.id)
                  .order('date_awarded', { ascending: false })
                  .then(({ data }) => {
                    if (data) setAchievements(data);
                  });
              }}
            />

            {user?.role === 'admin' && (
              <div className="glass-surface rounded-2xl border border-status-error/30 bg-status-error/5 p-4 text-center">
                <p className="mb-2 text-xs font-medium text-status-error">Administrator Action</p>
                <button
                  type="button"
                  data-cursor-hover
                  disabled={deleting}
                  onClick={() => {
                    const confirmed = window.confirm(
                      `Are you sure you want to permanently remove ${student.name}? This will delete their student record, all achievements, and user account.`
                    );
                    if (!confirmed) return;
                    setDeleting(true);
                    navigate('/dashboard', { replace: true });
                    supabase.from('students').delete().eq('id', student.id);
                  }}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-status-error/40 bg-status-error/20 py-2.5 text-xs font-semibold text-status-error transition hover:bg-status-error/30 disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  <span>Remove Student Account</span>
                </button>
              </div>
            )}
          </div>

          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-xl font-semibold text-text-primary">Achievement Timeline</h2>
              {['faculty', 'admin'].includes(user?.role) && (
                <button
                  type="button"
                  data-cursor-hover
                  onClick={() => {
                    setAwardModalOpen(true);
                    setAwardError('');
                    setAwardSuccess(null);
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 hover:text-white transition shadow-sm hover-lift"
                >
                  <Award size={14} className="text-amber-400" />
                  <span>+ Award Achievement</span>
                </button>
              )}
            </div>

            <AchievementTimeline achievements={achievements} />
          </div>
        </div>
      )}

      {/* In-Page Award Achievement Modal */}
      <AnimatePresence>
        {awardModalOpen && student && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !awardLoading && setAwardModalOpen(false)}
              className="fixed inset-0 bg-[#0B0F17]/80 backdrop-blur-sm"
              aria-hidden="true"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              role="dialog"
              aria-labelledby="modal-award-title"
              className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-700/80 bg-[#121622] p-6 shadow-2xl border-l-[4px] border-l-indigo-500"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
                    <Award size={18} />
                  </div>
                  <div>
                    <h3 id="modal-award-title" className="font-display text-base font-bold text-white">
                      Award Achievement
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      Student: <span className="text-indigo-300 font-semibold">{student.name}</span> ({student.roll_no})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  data-cursor-hover
                  disabled={awardLoading}
                  onClick={() => setAwardModalOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                >
                  <X size={18} />
                </button>
              </div>

              {awardSuccess ? (
                <div className="py-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  >
                    <CheckCircle2 size={32} />
                  </motion.div>
                  <h4 className="font-display text-lg font-bold text-white">Points Awarded!</h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Successfully awarded <strong className="text-emerald-400">+{awardSuccess.points} pts</strong> for &quot;{awardSuccess.title}&quot;.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 font-mono">
                    {student.name}&apos;s new total: <span className="text-amber-300 font-bold">{student.total_points} pts</span>
                  </p>
                </div>
              ) : (
                <form onSubmit={handleAwardSubmit} className="mt-4 space-y-4">
                  {awardError && (
                    <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-400">
                      {awardError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono mb-1.5">
                      Domain
                    </label>
                    <select
                      value={awardForm.domain}
                      onChange={(e) => setAwardForm((f) => ({ ...f, domain: e.target.value }))}
                      className="w-full rounded-xl border border-slate-700 bg-[#0B0F17] px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                    >
                      {DOMAINS.map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono mb-1.5">
                      Achievement Title *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1st Place College Hackathon / DSA Champion"
                      value={awardForm.title}
                      onChange={(e) => setAwardForm((f) => ({ ...f, title: e.target.value }))}
                      required
                      className="w-full rounded-xl border border-slate-700 bg-[#0B0F17] px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500 placeholder:text-slate-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono mb-1.5">
                        Points Awarded *
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 100"
                        value={awardForm.points}
                        onChange={(e) => setAwardForm((f) => ({ ...f, points: e.target.value }))}
                        required
                        className="w-full rounded-xl border border-slate-700 bg-[#0B0F17] px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500 font-mono placeholder:text-slate-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono mb-1.5">
                        Date Awarded
                      </label>
                      <input
                        type="date"
                        value={awardForm.date_awarded}
                        onChange={(e) => setAwardForm((f) => ({ ...f, date_awarded: e.target.value }))}
                        className="w-full rounded-xl border border-slate-700 bg-[#0B0F17] px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono mb-1.5">
                      Description (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Brief details or verification note…"
                      value={awardForm.description}
                      onChange={(e) => setAwardForm((f) => ({ ...f, description: e.target.value }))}
                      className="w-full rounded-xl border border-slate-700 bg-[#0B0F17] px-3.5 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500 placeholder:text-slate-600 resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      data-cursor-hover
                      disabled={awardLoading}
                      onClick={() => setAwardModalOpen(false)}
                      className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      data-cursor-hover
                      disabled={awardLoading}
                      className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover-lift transition disabled:opacity-60"
                    >
                      <Sparkles size={13} className="text-amber-300" />
                      <span>{awardLoading ? 'Recording Points…' : 'Award Points & Update Rank'}</span>
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
