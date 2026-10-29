import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AuthShell({ background, title, subtitle, children, onBack }) {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden">
      {background}

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="matte-card w-full max-w-sm rounded-2xl border border-slate-800/80 bg-[#121622] p-8 shadow-md"
        >
          <button
            type="button"
            data-cursor-hover
            onClick={() => (onBack ? onBack() : navigate(-1))}
            aria-label="Go back"
            className="mb-6 flex items-center gap-2 text-xs font-medium text-slate-400 transition-colors hover:text-slate-200"
          >
            <ArrowLeft size={14} /> Back
          </button>

          <h1 className="font-display text-2xl font-semibold text-text-primary">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-text-secondary">{subtitle}</p>}

          <div className="mt-6">{children}</div>
        </motion.div>
      </div>
    </div>
  );
}
