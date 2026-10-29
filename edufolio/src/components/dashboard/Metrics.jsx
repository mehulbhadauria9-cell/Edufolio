import { useEffect, useState } from 'react';
import { Code2, Trophy, Crown, Sparkles, ArrowRight, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Metrics() {
  const [totals, setTotals] = useState({ students: 0, achievements: 0, topScorer: '—', topPoints: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [{ count: studentCount }, { count: achievementCount }, { data: top }] = await Promise.all([
          supabase.from('students').select('id', { count: 'exact', head: true }),
          supabase.from('achievements').select('id', { count: 'exact', head: true }),
          supabase.from('students').select('id, name, total_points').order('total_points', { ascending: false }).limit(1)
        ]);

        if (!mounted) return;
        setTotals({
          students: studentCount ?? 0,
          achievements: achievementCount ?? 0,
          topScorer: top?.[0]?.name ?? '—',
          topPoints: top?.[0]?.total_points ?? 0,
          topId: top?.[0]?.id
        });
      } catch (err) {
        console.error('Error loading metrics:', err);
      }
    }

    load();

    const channel = supabase
      .channel(`metrics-realtime-${Date.now()}`)
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

    return () => {
      mounted = false;
      window.removeEventListener('edufolio-achievement-added', onCustomEvent);
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
      {/* Feature Card 1: LeetCode Live Sync */}
      <div
        role="button"
        tabIndex={0}
        data-cursor-hover
        onClick={() => navigate('/profile')}
        className="matte-card hover-lift group relative overflow-hidden rounded-2xl p-6 text-left border-l-[3.5px] border-l-sky-500 border-slate-800/80 bg-[#121622] transition-all"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <Code2 size={22} />
          </div>
          <span className="flex items-center gap-1 rounded-md border border-sky-500/20 bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-mono font-medium text-sky-300">
            <Sparkles size={10} />
            <span>LIVE SYNC</span>
          </span>
        </div>

        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-mono">Algorithmic Tracker</p>
        <h3 className="mt-1 font-display text-lg font-bold text-slate-100">
          LeetCode Integration — Live
        </h3>
        <p className="mt-2 text-xs text-slate-400 leading-relaxed font-sans">
          Real-time GraphQL API score sync across Easy, Medium & Hard milestones.
        </p>

        <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-3 text-xs font-medium text-sky-400">
          <span>View Real-Time Rings</span>
          <ArrowRight size={14} className="slide-arrow transition-transform" />
        </div>
      </div>

      {/* Feature Card 2: Multi-Domain Achievement */}
      <div
        role="button"
        tabIndex={0}
        data-cursor-hover
        onClick={() => navigate('/dashboard')}
        className="matte-card hover-lift group relative overflow-hidden rounded-2xl p-6 text-left border-l-[3.5px] border-l-indigo-500 border-slate-800/80 bg-[#121622] transition-all"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Trophy size={22} />
          </div>
          <span className="flex items-center gap-1 rounded-md border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-mono font-medium text-indigo-300">
            <TrendingUp size={10} />
            <span>{totals.achievements} HONORS</span>
          </span>
        </div>

        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-mono">Hall of Achievement</p>
        <h3 className="mt-1 font-display text-lg font-bold text-slate-100">
          Verified Honors — All Domains
        </h3>
        <p className="mt-2 text-xs text-slate-400 leading-relaxed font-sans">
          Competitive Programming, Hackathons, Academics, Sports & Cultural accolades.
        </p>

        <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-3 text-xs font-medium text-indigo-400">
          <span>Explore Leaderboard</span>
          <ArrowRight size={14} className="slide-arrow transition-transform" />
        </div>
      </div>

      {/* Feature Card 3: College Standing & Top Honors */}
      <div
        role="button"
        tabIndex={0}
        data-cursor-hover
        onClick={() => totals.topId ? navigate(`/profile/${totals.topId}`) : null}
        className="matte-card hover-lift group relative overflow-hidden rounded-2xl p-6 text-left border-l-[3.5px] border-l-amber-500 border-slate-800/80 bg-[#121622] transition-all"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Crown size={22} />
          </div>
          <span className="flex items-center gap-1 rounded-md border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-mono font-medium text-amber-300">
            <Sparkles size={10} />
            <span>RANK #1</span>
          </span>
        </div>

        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-mono">ITS Greater Noida</p>
        <h3 className="mt-1 font-display text-lg font-bold text-slate-100 truncate">
          {totals.topScorer}
        </h3>
        <p className="mt-2 text-xs text-slate-400 leading-relaxed font-sans">
          Leading the college leaderboard with <strong className="text-slate-200">{totals.topPoints} points</strong> across all domains.
        </p>

        <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-3 text-xs font-medium text-amber-400">
          <span>View Champion Profile</span>
          <ArrowRight size={14} className="slide-arrow transition-transform" />
        </div>
      </div>
    </div>
  );
}
