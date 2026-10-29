import { useEffect, useMemo, useState } from 'react';
import { Search, Code2, Trophy as TrophyIcon, Palette, BookOpen, Cpu, LayoutGrid } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import LeaderboardRow from './LeaderboardRow';
import GlassBranchSelect from '../common/GlassBranchSelect';

const DOMAINS = [
  { key: 'all', label: 'All', Icon: LayoutGrid },
  { key: 'competitive_programming', label: 'Competitive Programming', Icon: Code2 },
  { key: 'sports', label: 'Sports', Icon: TrophyIcon },
  { key: 'cultural', label: 'Cultural', Icon: Palette },
  { key: 'academics', label: 'Academics', Icon: BookOpen },
  { key: 'technical', label: 'Technical', Icon: Cpu }
];

const BRANCHES = ['All', 'CSE', 'ECE', 'ME', 'CE', 'IT'];

export default function Leaderboard() {
  const [students, setStudents] = useState([]);
  const [query, setQuery] = useState('');
  const [domain, setDomain] = useState('all');
  const [branch, setBranch] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        let rows = [];
        if (domain === 'all') {
          const [{ data: studentData }, { data: achData }] = await Promise.all([
            supabase.from('students').select('*').order('total_points', { ascending: false }),
            supabase.from('achievements').select('*')
          ]);

          const studentList = studentData ?? [];
          const allAchs = achData ?? [];

          const achPointsMap = new Map();
          allAchs.forEach((a) => {
            const p = Number(a.points) || 0;
            achPointsMap.set(a.student_id, (achPointsMap.get(a.student_id) || 0) + p);
          });

          rows = studentList.map((s) => {
            const sum = (achPointsMap.get(s.id) || 0) + (s.userId && s.userId !== s.id ? (achPointsMap.get(s.userId) || 0) : 0);
            const total_points = Math.max(Number(s.total_points) || 0, sum);
            return { ...s, total_points };
          });

          rows.sort((a, b) => (Number(b.total_points) || 0) - (Number(a.total_points) || 0));
        } else {
          const { data: achievements } = await supabase
            .from('achievements')
            .select('*')
            .eq('domain', domain);

          const { data: allStudents } = await supabase.from('students').select('*');
          const studentMap = new Map();
          (allStudents ?? []).forEach((s) => {
            studentMap.set(s.id, s);
            if (s.userId) studentMap.set(s.userId, s);
          });

          const byStudent = new Map();
          (achievements ?? []).forEach((row) => {
            const s = row.students || studentMap.get(row.student_id);
            if (!s) return;
            const current = byStudent.get(s.id) ?? { ...s, total_points: 0 };
            current.total_points += (Number(row.points) || 0);
            byStudent.set(s.id, current);
          });

          rows = [...byStudent.values()].sort((a, b) => (Number(b.total_points) || 0) - (Number(a.total_points) || 0));
        }

        if (mounted) {
          setStudents(rows);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading leaderboard:', err);
        if (mounted) setLoading(false);
      }
    }

    load();

    const channel = supabase
      .channel(`leaderboard-${domain}-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => {
        if (mounted) load();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'achievements' }, () => {
        if (mounted) load();
      })
      .subscribe();

    const onCustomEvent = () => {
      if (mounted) load();
    };
    window.addEventListener('edufolio-achievement-added', onCustomEvent);
    window.addEventListener('focus', onCustomEvent);
    window.addEventListener('visibilitychange', onCustomEvent);

    return () => {
      mounted = false;
      window.removeEventListener('edufolio-achievement-added', onCustomEvent);
      window.removeEventListener('focus', onCustomEvent);
      window.removeEventListener('visibilitychange', onCustomEvent);
      supabase.removeChannel(channel);
    };
  }, [domain]);

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const matchesQuery =
        !query ||
        s.name?.toLowerCase().includes(query.toLowerCase()) ||
        s.roll_no?.toLowerCase().includes(query.toLowerCase());
      const matchesBranch =
        branch === 'All' ||
        s.branch === branch ||
        (s.branch && s.branch.toLowerCase().includes(branch.toLowerCase()));
      return matchesQuery && matchesBranch;
    });
  }, [students, query, branch]);

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by student name or roll number…"
            aria-label="Search leaderboard"
            className="w-full rounded-xl border border-slate-700/60 bg-[#111622] py-2.5 pl-10 pr-3.5 text-xs text-slate-200 outline-none placeholder:text-slate-500 focus:border-indigo-500/80 transition-colors"
          />
        </div>

        <GlassBranchSelect
          value={branch}
          onChange={setBranch}
          options={BRANCHES}
          ariaLabel="Filter leaderboard by branch"
        />
      </div>

      <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Achievement domain filter">
        {DOMAINS.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={domain === key}
            data-cursor-hover
            onClick={() => setDomain(key)}
            className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-medium transition-all ${
              domain === key
                ? 'bg-indigo-600/15 text-indigo-300 border-indigo-500/40 shadow-sm'
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <Icon size={13} className={domain === key ? 'text-indigo-400' : 'text-slate-400'} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-text-muted">Loading leaderboard…</p>
      ) : filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-text-muted">No students match your filters yet.</p>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((s, i) => (
            <LeaderboardRow
              key={s.id}
              rank={i + 1}
              student={s}
              onDelete={(deletedId) => setStudents((prev) => prev.filter((st) => st.id !== deletedId))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
