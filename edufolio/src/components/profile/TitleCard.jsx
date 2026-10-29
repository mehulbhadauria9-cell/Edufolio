import { motion } from 'framer-motion';
import { Sparkles, Code2, ExternalLink, Award } from 'lucide-react';
import AvatarUpload from './AvatarUpload';

export default function TitleCard({ student, editable, onAvatarUploaded }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="matte-card border-l-[3.5px] border-l-indigo-500 relative overflow-hidden rounded-2xl border border-slate-800/80 bg-[#121622] p-6 text-center shadow-sm hover-lift"
    >
      <div className="mx-auto mb-4 w-fit relative">
        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-violet-500 to-cyan opacity-40 blur-md" />
        {editable ? (
          <AvatarUpload avatarUrl={student.avatar_url} onUploaded={onAvatarUploaded} />
        ) : student.avatar_url ? (
          <img
            src={student.avatar_url}
            alt={`${student.name}'s avatar`}
            className="relative h-28 w-28 rounded-full border-2 border-white/20 object-cover shadow-xl"
          />
        ) : (
          <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-2 border-white/20 bg-midnight-elevated text-3xl font-bold text-text-primary shadow-xl">
            {student.name?.[0] ?? '?'}
          </div>
        )}
      </div>

      <h2 className="font-display text-2xl font-bold tracking-tight text-text-primary">{student.name}</h2>
      <p className="mt-1 text-sm font-medium text-text-secondary">
        {student.branch} — Year {student.year}
      </p>
      <p className="mt-0.5 text-xs text-text-muted">Roll No. {student.roll_no}</p>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <div className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-3.5 py-1 text-xs font-mono font-medium text-indigo-300">
          <Sparkles size={11} className="text-indigo-400" />
          <span className="font-bold">{student.total_points ?? 0}</span>
          <span className="text-slate-400">pts</span>
        </div>

        {student.leetcode_handle && (
          <a
            href={`https://leetcode.com/${encodeURIComponent(student.leetcode_handle)}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1 text-xs font-mono font-medium text-slate-300 hover:border-slate-600 hover:text-white transition"
          >
            <Code2 size={11} className="text-slate-400" />
            <span>@{student.leetcode_handle}</span>
            <ExternalLink size={10} className="text-slate-500" />
          </a>
        )}
      </div>
    </motion.div>
  );
}
