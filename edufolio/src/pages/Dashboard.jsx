import { Sparkles, Flame, Trophy, Award } from 'lucide-react';
import AppLayout from '../components/dashboard/AppLayout';
import { LeaderboardBackground } from '../components/background/Backgrounds';
import Metrics from '../components/dashboard/Metrics';
import Leaderboard from '../components/leaderboard/Leaderboard';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { profile, role } = useAuth();

  return (
    <AppLayout background={<LeaderboardBackground />}>
      {/* Ambient Matte Grid */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="dot-grid absolute inset-0 opacity-[0.05]" />
      </div>

      {/* Header Banner */}
      <header className="relative z-10 mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-md border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 text-[11px] font-mono font-medium text-indigo-300">
              <Sparkles size={11} className="text-indigo-400" />
              <span>Edufolio — Academic OS</span>
            </span>

            <span className="flex items-center gap-1 rounded-md border border-amber-600/30 bg-amber-600/10 px-2.5 py-0.5 text-[11px] font-mono font-medium text-amber-300">
              <Flame size={11} className="text-amber-400" />
              <span>Verified Ledger</span>
            </span>
          </div>

          <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Welcome back —{' '}
            <span className="text-slate-200 font-semibold">
              {profile?.email?.split('@')[0] ?? 'Achiever'}
            </span>
          </h1>

          <p className="mt-1 text-xs text-slate-400 font-sans">
            ITS Engineering College, Greater Noida — Verified Academic Accolades & Real-Time LeetCode Verification.
          </p>
        </div>

        {/* Quick Role Pill */}
        <div className="matte-card flex items-center gap-2 rounded-xl border border-slate-800 px-3.5 py-2 shadow-sm">
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-medium text-slate-400">Signed in as:</span>
          <span className="rounded bg-slate-800/80 px-2 py-0.5 text-xs font-mono font-bold uppercase tracking-wider text-slate-200 border border-slate-700/50">
            {role ?? 'Guest'}
          </span>
        </div>
      </header>

      {/* 3 Feature Cards in a Row */}
      <section className="relative z-10 mb-10">
        <Metrics />
      </section>

      {/* Hall of Achievement / Leaderboard */}
      <section className="relative z-10">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet/20 text-violet-light">
              <Trophy size={18} />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-text-primary">
                Hall of Achievement — Leaderboard
              </h2>
              <p className="text-xs text-text-muted">
                Real-time competitive standings, verified DSA solutions & college awards
              </p>
            </div>
          </div>
        </div>

        <Leaderboard />
      </section>
    </AppLayout>
  );
}
