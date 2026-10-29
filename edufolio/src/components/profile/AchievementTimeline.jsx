import { motion } from 'framer-motion';
import { Award, Sparkles, Calendar } from 'lucide-react';

const DOMAIN_STYLES = {
  competitive_programming: { color: '#0EA5E9', strip: 'border-l-sky-500', label: 'Competitive Programming' },
  sports: { color: '#D97706', strip: 'border-l-amber-500', label: 'Sports & Athletics' },
  cultural: { color: '#A855F7', strip: 'border-l-purple-500', label: 'Cultural & Arts' },
  academics: { color: '#10B981', strip: 'border-l-emerald-500', label: 'Academic Excellence' },
  technical: { color: '#6366F1', strip: 'border-l-indigo-500', label: 'Technical & Hackathons' }
};

export default function AchievementTimeline({ achievements }) {
  if (!achievements?.length) {
    return (
      <div className="matte-card rounded-2xl border border-slate-800 bg-[#121622] p-12 text-center shadow-sm">
        <Award size={32} className="mx-auto mb-3 text-slate-500" />
        <p className="font-semibold text-slate-200">No achievements logged yet</p>
        <p className="mt-1 text-xs text-slate-400">
          Every journey begins with the courage to begin — awards logged by faculty will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="relative pl-7">
      <div
        className="absolute bottom-0 left-2.5 top-0 w-[2px] bg-slate-800"
        aria-hidden="true"
      />
      <ul className="space-y-4">
        {achievements.map((a, i) => {
          const config = DOMAIN_STYLES[a.domain] ?? { color: '#6366F1', strip: 'border-l-indigo-500', label: a.domain };
          return (
            <motion.li
              key={a.id}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              className="relative"
            >
              <span
                className="absolute -left-[23px] top-4 h-3 w-3 rounded-full ring-4 ring-[#0B0F17]"
                style={{ background: config.color }}
                aria-hidden="true"
              />
              <div
                className={`matte-card hover-lift border-l-[3.5px] ${config.strip} relative overflow-hidden rounded-xl border border-slate-800/80 bg-[#121622] p-4 text-left shadow-sm`}
              >
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                    style={{ color: config.color, backgroundColor: `${config.color}15` }}
                  >
                    <Sparkles size={10} />
                    <span>{config.label}</span>
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-text-muted">
                    <Calendar size={11} />
                    <span>{new Date(a.date_awarded).toLocaleDateString()}</span>
                  </span>
                </div>

                <h4 className="font-display text-base font-bold text-text-primary">{a.title}</h4>

                {a.description && (
                  <p className="mt-1 text-xs leading-relaxed text-text-secondary">{a.description}</p>
                )}

                <div className="mt-3 flex items-center justify-between border-t border-glass pt-2.5">
                  <span className="text-[11px] text-text-muted">Verified Institutional Award</span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-cyan">
                    <Award size={13} />
                    <span>+{a.points} points</span>
                  </span>
                </div>
              </div>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
