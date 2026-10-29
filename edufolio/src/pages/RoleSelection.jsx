import { GraduationCap, UserCheck, ShieldAlert, Sparkles, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { RoleSelectionBackground } from '../components/background/Backgrounds';
import RoleCard3D from '../components/RoleCard3D';

const ROLES = [
  {
    key: 'student',
    title: 'Student',
    subtitle: 'Showcase your algorithmic LeetCode score, competitive milestones — and college achievements.',
    Icon: GraduationCap
  },
  {
    key: 'faculty',
    title: 'Faculty',
    subtitle: 'Provision student accounts, evaluate milestones — and award verified achievement points.',
    Icon: UserCheck
  },
  {
    key: 'admin',
    title: 'Admin',
    subtitle: 'Manage institution accounts, configure roles, student records — and system controls.',
    Icon: ShieldAlert
  }
];

export default function RoleSelection() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0B0F17]">
      <RoleSelectionBackground />

      {/* Subtle Dot Grid Overlay */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="dot-grid absolute inset-0 opacity-[0.05]" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center max-w-2xl"
        >
          <div className="mb-3 flex items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-mono font-medium text-indigo-300">
              <Sparkles size={12} className="text-indigo-400" />
              <span>Edufolio — Portal Access</span>
            </span>

            <span className="inline-flex items-center gap-1 rounded-md border border-amber-600/30 bg-amber-600/10 px-2.5 py-1 text-xs font-mono font-medium text-amber-300">
              <Flame size={12} />
              <span>ITS Greater Noida</span>
            </span>
          </div>

          <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Choose Your <span className="text-slate-200">Role</span>
          </h1>
          <p className="mt-2 text-xs text-slate-400 sm:text-sm leading-relaxed font-sans">
            Select your account type to access verified student records, real-time LeetCode scores — and institutional rankings.
          </p>
        </motion.div>

        <div className="grid w-full max-w-6xl grid-cols-1 gap-8 sm:grid-cols-3 px-4">
          {ROLES.map((r, i) => (
            <RoleCard3D
              key={r.key}
              roleKey={r.key}
              title={r.title}
              subtitle={r.subtitle}
              Icon={r.Icon}
              delay={i * 0.12}
              onSelect={(role) => navigate(`/login/${role}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
