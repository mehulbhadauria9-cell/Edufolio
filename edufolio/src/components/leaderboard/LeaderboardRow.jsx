import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Trash2, Code2, ChevronRight, Sparkles } from 'lucide-react';
import RankBadge from './RankBadge';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

export default function LeaderboardRow({ rank, student, onDelete }) {
  const navigate = useNavigate();
  const { role } = useAuth();
  const isTop3 = rank <= 3;

  const stripClass =
    rank === 1
      ? 'border-l-[3.5px] border-l-amber-500'
      : rank === 2
      ? 'border-l-[3.5px] border-l-slate-400'
      : rank === 3
      ? 'border-l-[3.5px] border-l-amber-700'
      : 'border-l-[3.5px] border-l-indigo-500/80';

  return (
    <motion.div
      whileHover={{ scale: 1.008, x: 2 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className={`matte-card hover-lift group flex w-full items-center justify-between gap-4 rounded-xl border border-slate-800/80 px-4 py-3.5 text-left transition-all ${stripClass} ${
        isTop3 ? 'bg-[#131927]' : 'bg-[#10141F]'
      }`}
    >
      <div
        role="button"
        tabIndex={0}
        data-cursor-hover
        onClick={() => navigate(`/profile/${student.id}`)}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-4"
      >
        <RankBadge rank={rank} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors">
              {student.name}
            </p>
            {rank === 1 && (
              <span className="flex items-center gap-1 rounded-md border border-amber-600/30 bg-amber-600/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                <Sparkles size={9} />
                <span>CHAMPION</span>
              </span>
            )}
            {student.leetcode_handle && (
              <span className="hidden items-center gap-1 rounded-md border border-slate-700 bg-slate-800/70 px-2 py-0.5 text-[10px] font-mono text-slate-300 sm:inline-flex">
                <Code2 size={10} className="text-slate-400" />
                <span>@{student.leetcode_handle}</span>
              </span>
            )}
          </div>
          <p className="truncate text-xs text-slate-400 mt-0.5">
            {student.roll_no} — {student.branch} {student.year ? `— Year ${student.year}` : ''}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="font-display text-lg font-bold text-text-primary">
            {student.total_points ?? 0}
          </p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-text-muted">points</p>
        </div>

        <ChevronRight
          size={16}
          className="slide-arrow text-text-muted transition-transform group-hover:text-text-primary"
        />

        {role === 'admin' && (
          <button
            type="button"
            data-cursor-hover
            title={`Remove ${student.name}`}
            onClick={async (e) => {
              e.stopPropagation();
              const confirmed = window.confirm(
                `Are you sure you want to permanently remove student "${student.name}" (${student.roll_no})? This will delete their achievements and account.`
              );
              if (!confirmed) return;
              if (onDelete) {
                onDelete(student.id);
              }
              supabase.from('students').delete().eq('id', student.id);
            }}
            className="rounded-lg p-2 text-text-muted transition hover:bg-status-error/15 hover:text-status-error"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </motion.div>
  );
}
