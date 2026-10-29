import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Trash2, ExternalLink, Code2, AlertTriangle, CheckCircle2, UserX } from 'lucide-react';
import { Link } from 'react-router-dom';
import AppLayout from '../../components/dashboard/AppLayout';
import { FormBackground } from '../../components/background/Backgrounds';
import { supabase } from '../../lib/supabaseClient';

export default function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [modalStudent, setModalStudent] = useState(null);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    loadStudents();

    const channel = supabase
      .channel('manage-students-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, loadStudents)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadStudents() {
    setLoading(true);
    const { data } = await supabase.from('students').select('*').order('total_points', { ascending: false });
    setStudents(data ?? []);
    setLoading(false);
  }

  async function handleConfirmDelete() {
    if (!modalStudent) return;
    const target = modalStudent;
    setDeletingId(target.id);
    setStudents((prev) => prev.filter((s) => s.id !== target.id));
    setModalStudent(null);
    setFeedback({ type: 'success', message: `Student "${target.name}" was permanently removed.` });
    setTimeout(() => setFeedback(null), 3500);

    const { error } = await supabase.from('students').delete().eq('id', target.id);
    if (error) {
      setFeedback({ type: 'error', message: `Failed to remove student: ${error.message}` });
      loadStudents();
    }
    setDeletingId(null);
  }

  const filtered = students.filter((s) => {
    const q = query.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.roll_no?.toLowerCase().includes(q) ||
      s.branch?.toLowerCase().includes(q) ||
      s.leetcode_handle?.toLowerCase().includes(q)
    );
  });

  return (
    <AppLayout background={<FormBackground variant="registration" />}>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-mono font-bold">ADMINISTRATIVE DIRECTORY</span>
            <span className="text-white/20">—</span>
            <span className="text-[10px] text-slate-400">Total Records: {students.length}</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <span>Manage Students</span>
            <span className="text-slate-600 font-light">—</span>
            <span className="text-xs font-normal text-slate-400 font-mono">Ledger Control</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400 font-sans">
            Oversee, inspect credentials, and manage live student profiles & verifiable honors.
          </p>
        </div>

        <Link
          to="/add-student"
          data-cursor-hover
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover-lift"
        >
          <span>+ Enroll New Student</span>
          <span className="text-slate-300 font-mono">→</span>
        </Link>
      </div>

      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 flex items-center gap-2 rounded-xl border p-4 text-xs font-medium ${
            feedback.type === 'error'
              ? 'border-rose-500/30 bg-rose-950/20 text-rose-400'
              : 'border-emerald-500/30 bg-emerald-950/20 text-emerald-400'
          }`}
        >
          {feedback.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          <span>{feedback.message}</span>
        </motion.div>
      )}

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search students by name, roll number, branch, or LeetCode handle…"
          className="w-full rounded-xl border border-slate-800 bg-[#0B0F17] py-3 pl-10 pr-4 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Student List */}
      {loading ? (
        <p className="py-12 text-center text-sm text-slate-400">Loading students…</p>
      ) : filtered.length === 0 ? (
        <div className="matte-card rounded-xl border border-slate-800/80 bg-[#121622] p-12 text-center">
          <UserX size={32} className="mx-auto mb-3 text-slate-500" />
          <p className="text-sm font-medium text-slate-200">No students found</p>
          <p className="mt-1 text-xs text-slate-400">Try adjusting your search query.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => (
            <div
              key={s.id}
              className="matte-card border-l-[3.5px] border-l-slate-600 flex flex-col gap-4 rounded-xl border border-slate-800/80 bg-[#121622] p-4 transition-all hover-lift sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3.5">
                {s.avatar_url ? (
                  <img src={s.avatar_url} alt={s.name} className="h-10 w-10 rounded-xl border border-slate-700 object-cover shadow-sm" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-sm font-bold text-slate-200 shadow-inner">
                    {s.name?.[0] ?? '?'}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-100">{s.name}</p>
                    {s.leetcode_handle && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                        <Code2 size={10} className="text-slate-400" />
                        @{s.leetcode_handle}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    {s.roll_no} <span className="text-slate-600">—</span> {s.branch} <span className="text-slate-600">—</span> Year {s.year} {s.cgpa ? `— CGPA: ${s.cgpa}` : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <div className="text-right">
                  <p className="font-display text-base font-bold text-slate-100">{s.total_points ?? 0}</p>
                  <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">verified pts</p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/profile/${s.id}`}
                    data-cursor-hover
                    className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white"
                  >
                    <span>Inspect</span>
                    <ExternalLink size={11} className="text-slate-400" />
                  </Link>

                  <button
                    type="button"
                    data-cursor-hover
                    onClick={() => setModalStudent(s)}
                    className="flex items-center gap-1.5 rounded-lg border border-red-900/30 bg-red-950/20 px-3 py-1.5 text-xs font-semibold text-rose-400 transition hover:bg-red-900/30"
                    title={`Remove ${s.name}`}
                  >
                    <Trash2 size={11} />
                    <span>Purge</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {modalStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalStudent(null)}
              className="fixed inset-0 bg-[#0B0F17]/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="matte-card relative z-10 w-full max-w-md rounded-2xl border border-slate-700 bg-[#161B26] p-6 shadow-2xl"
            >
              <div className="mb-4 flex items-center gap-3 text-rose-400">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-950/30">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold text-slate-100">Confirm Student Removal</h3>
                  <p className="text-xs text-slate-400">This action is permanent and irreversible.</p>
                </div>
              </div>

              <p className="mb-6 text-xs text-slate-300 leading-relaxed">
                Are you sure you want to permanently remove <strong className="text-slate-100">{modalStudent.name}</strong> ({modalStudent.roll_no})?
                This will delete their student profile, all associated achievements, and their login account.
              </p>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  data-cursor-hover
                  disabled={deletingId !== null}
                  onClick={() => setModalStudent(null)}
                  className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  data-cursor-hover
                  disabled={deletingId !== null}
                  onClick={handleConfirmDelete}
                  className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-500 disabled:opacity-50"
                >
                  <Trash2 size={13} />
                  <span>{deletingId ? 'Removing…' : 'Yes, Remove Student'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
