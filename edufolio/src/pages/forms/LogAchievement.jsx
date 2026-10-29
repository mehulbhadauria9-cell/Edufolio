import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Search, UserCheck, ChevronDown, Award, Calendar, Hash, ArrowLeft } from 'lucide-react';
import AppLayout from '../../components/dashboard/AppLayout';
import { FormBackground } from '../../components/background/Backgrounds';
import { FormField } from '../../components/auth/FormField';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

const DOMAINS = [
  { value: 'competitive_programming', label: 'Competitive Programming' },
  { value: 'sports', label: 'Sports' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'academics', label: 'Academics' },
  { value: 'technical', label: 'Technical' }
];

export default function LogAchievement() {
  const { user, role } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paramStudentId = searchParams.get('studentId') || searchParams.get('id');

  const [allStudents, setAllStudents] = useState([]);
  const [query, setQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [loadingStudents, setLoadingStudents] = useState(true);

  const [form, setForm] = useState({
    domain: DOMAINS[0].value,
    title: '',
    description: '',
    points: '',
    date_awarded: new Date().toISOString().slice(0, 10)
  });
  const [status, setStatus] = useState('idle');
  const [successInfo, setSuccessInfo] = useState(null);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      if (successInfo?.studentId) {
        navigate(`/profile/${successInfo.studentId}`);
      }
      return;
    }
    const timer = setTimeout(() => {
      setCountdown((c) => (c !== null ? c - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown, successInfo, navigate]);

  // Pre-load all students on mount and auto-select if query param or current user is student
  useEffect(() => {
    async function fetchStudents() {
      setLoadingStudents(true);
      const { data } = await supabase.from('students').select('*').order('name', { ascending: true });
      const studentsList = data ?? [];
      setAllStudents(studentsList);
      setLoadingStudents(false);

      if (paramStudentId) {
        const found = studentsList.find((s) => s.id === paramStudentId || s.userId === paramStudentId);
        if (found) {
          setSelected(found);
          return;
        }
      }

      if (user && role === 'student') {
        const matching = studentsList.find(
          (s) =>
            s.id === user.id ||
            s.userId === user.id ||
            (s.email && user.email && s.email.toLowerCase() === user.email.toLowerCase()) ||
            (s.roll_no && user.email && s.roll_no.toLowerCase() === user.email.toLowerCase())
        );
        if (matching) {
          setSelected(matching);
        }
      }
    }
    fetchStudents();
  }, [user, role, paramStudentId]);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Filter students based on query
  const filteredStudents = allStudents.filter((s) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.roll_no?.toLowerCase().includes(q) ||
      s.branch?.toLowerCase().includes(q)
    );
  });

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selected) {
      setError('Please select a student from the list first before submitting.');
      setDropdownOpen(true);
      return;
    }

    if (!form.title.trim()) {
      setError('Achievement title is required.');
      return;
    }

    if (!form.points || Number(form.points) <= 0) {
      setError('Please enter a valid positive number of points.');
      return;
    }

    setStatus('loading');
    setError('');

    const pointsNum = Number(form.points);
    const dateVal = form.date_awarded || new Date().toISOString().slice(0, 10);
    const createdBy = user?.id || selected?.userId || selected?.id;

    const { error: insertError } = await supabase.from('achievements').insert({
      student_id: selected.id,
      domain: form.domain,
      title: form.title.trim(),
      description: form.description.trim(),
      points: pointsNum,
      date_awarded: dateVal,
      created_by: createdBy
    });

    if (insertError) {
      setError(insertError.message || 'Could not log achievement.');
      setStatus('error');
      return;
    }

    setSuccessInfo({
      title: form.title.trim(),
      studentName: selected.name,
      points: pointsNum,
      studentId: selected.id
    });

    setStatus('success');
    setCountdown(2);
    setForm({
      domain: DOMAINS[0].value,
      title: '',
      description: '',
      points: '',
      date_awarded: new Date().toISOString().slice(0, 10)
    });
    if (role !== 'student' && !paramStudentId) {
      setSelected(null);
      setQuery('');
    }
  }

  const isStudentRole = role === 'student';

  return (
    <AppLayout background={<FormBackground variant="achievement" />}>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-mono font-bold">VERIFIED RECOGNITION</span>
          <span className="text-white/20">—</span>
          <span className="text-[10px] text-slate-400">Institutional Accolades</span>
        </div>
        <h1 className="font-display text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <span>Log Student Achievement</span>
          <span className="text-slate-600 font-light">—</span>
          <span className="text-xs font-normal text-slate-400 font-mono">Merit Registry</span>
        </h1>
        <p className="mt-1 text-xs text-slate-400 font-sans">
          Award verified points for academic, competitive programming, sports, and technical excellence.
        </p>
      </div>

      <div className="matte-card border-l-[3.5px] border-l-indigo-500 w-full max-w-3xl xl:max-w-4xl rounded-2xl border border-slate-800/80 bg-[#121622] p-8 shadow-sm">
        {/* Step 1: Student Selection */}
        <div className="mb-6">
          <label className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
            <span>1. Student Profile</span>
            <span className="text-[11px] normal-case text-indigo-400 font-normal font-mono">
              {isStudentRole && selected ? 'Auto-Linked Student' : `${allStudents.length} enrolled`}
            </span>
          </label>

          {selected ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-between rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                  <UserCheck size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-100">{selected.name}</p>
                  <p className="text-xs text-slate-400 font-mono">
                    {selected.roll_no} · {selected.branch} · Year {selected.year}
                  </p>
                </div>
              </div>

              {!isStudentRole && (
                <button
                  type="button"
                  data-cursor-hover
                  onClick={() => {
                    setSelected(null);
                    setDropdownOpen(true);
                  }}
                  className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white"
                >
                  Change Student
                </button>
              )}
            </motion.div>
          ) : (
            <div className="relative">
              <div
                className={`flex items-center rounded-xl border bg-[#0B0F17] px-3.5 py-3 transition-colors ${
                  error && !selected ? 'border-rose-500/80 ring-2 ring-rose-500/20' : 'border-slate-800 focus-within:border-indigo-500'
                }`}
              >
                <Search size={16} className="text-slate-500 mr-2 flex-shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setDropdownOpen(true);
                  }}
                  onFocus={() => setDropdownOpen(true)}
                  placeholder="Click to select or search student by name or roll number…"
                  className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="text-slate-400 hover:text-slate-200 ml-1"
                >
                  <ChevronDown size={18} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Student Picker Dropdown */}
              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="matte-card absolute left-0 right-0 z-30 mt-2 max-h-64 overflow-y-auto rounded-xl border border-slate-700/80 bg-[#161B26] shadow-xl p-1.5">
                    {loadingStudents ? (
                      <p className="p-4 text-center text-xs text-slate-400">Loading registered students…</p>
                    ) : filteredStudents.length === 0 ? (
                      <p className="p-4 text-center text-xs text-slate-400">No students matching &quot;{query}&quot;.</p>
                    ) : (
                      filteredStudents.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          data-cursor-hover
                          onClick={() => {
                            setSelected(s);
                            setDropdownOpen(false);
                            setError('');
                          }}
                          className="flex w-full items-center justify-between rounded-lg px-3.5 py-2.5 text-left transition hover:bg-slate-800/80 hover:text-white"
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-200">{s.name}</p>
                            <p className="text-xs text-slate-400 font-mono">
                              {s.roll_no} · {s.branch} · {s.total_points ?? 0} pts
                            </p>
                          </div>
                          {s.leetcode_handle && (
                            <span className="text-[11px] font-mono text-sky-400">@{s.leetcode_handle}</span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Achievement Details Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
              2. Domain
            </label>
            <select
              value={form.domain}
              onChange={(e) => update('domain', e.target.value)}
              data-cursor-hover
              className="w-full rounded-xl border border-slate-800 bg-[#0B0F17] px-4 py-3 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors"
            >
              {DOMAINS.map((d) => (
                <option key={d.value} value={d.value} className="bg-[#121622] text-slate-200">
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <FormField
            label="Achievement Title"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="e.g. 1st Place in Intra-College Hackathon 2026"
          />

          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={3}
              placeholder="Describe the context, problem solved, competition details, or technical scope…"
              className="w-full rounded-xl border border-slate-800 bg-[#0B0F17] px-4 py-3 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
            />
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4">
            <FormField
              label="Points Awarded"
              type="number"
              value={form.points}
              onChange={(e) => update('points', e.target.value)}
              placeholder="e.g. 150"
            />
            <FormField
              label="Date Awarded"
              type="date"
              value={form.date_awarded}
              onChange={(e) => update('date_awarded', e.target.value)}
              required={false}
            />
          </div>

          <AnimatePresence>
            {status === 'success' && successInfo && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                role="status"
                className="mb-5 flex flex-col gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-xs text-emerald-400"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 size={16} />
                    <span>Achievement Logged Successfully!</span>
                  </div>
                  {countdown !== null && (
                    <span className="text-[11px] font-mono font-medium text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Redirecting in {countdown}s…
                    </span>
                  )}
                </div>

                <p className="text-slate-300">
                  Awarded <strong className="text-emerald-300 font-bold">+{successInfo.points} pts</strong> to{' '}
                  <strong className="text-white">{successInfo.studentName}</strong> for &quot;
                  {successInfo.title}&quot;.
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-500/20">
                  {successInfo.studentId && (
                    <button
                      type="button"
                      data-cursor-hover
                      onClick={() => navigate(`/profile/${successInfo.studentId}`)}
                      className="rounded-lg bg-emerald-600/40 hover:bg-emerald-600/60 text-white font-semibold border border-emerald-500/50 px-3.5 py-1.5 text-xs transition flex items-center gap-1.5 shadow-sm"
                    >
                      <span>View {successInfo.studentName}&apos;s Profile Now</span>
                      <span>&rarr;</span>
                    </button>
                  )}
                  <button
                    type="button"
                    data-cursor-hover
                    onClick={() => navigate('/dashboard')}
                    className="rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 text-xs font-medium transition flex items-center gap-1.5"
                  >
                    <span>View Leaderboard</span>
                    <span>&rarr;</span>
                  </button>
                  {countdown !== null && (
                    <button
                      type="button"
                      data-cursor-hover
                      onClick={() => setCountdown(null)}
                      className="text-[11px] text-slate-400 hover:text-slate-200 underline ml-auto py-1"
                    >
                      Stay on this page
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <p role="alert" className="mb-5 rounded-xl border border-rose-500/30 bg-rose-950/20 px-4 py-3 text-xs text-rose-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            data-cursor-hover
            disabled={status === 'loading'}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3 text-xs font-semibold text-white shadow-sm hover-lift transition-all disabled:opacity-60"
          >
            <Award size={15} className="text-amber-300" />
            <span>{status === 'loading' ? 'Recording Achievement…' : 'Log Achievement & Award Points'}</span>
            <span className="text-slate-300 font-mono transition-transform duration-200 group-hover:translate-x-1">→</span>
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
