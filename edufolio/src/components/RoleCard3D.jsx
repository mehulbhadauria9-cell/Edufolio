import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

const ACCENTS = {
  student: {
    grad: 'from-sky-700 to-slate-800',
    strip: 'border-l-[3.5px] border-l-sky-500',
    shadow: 'shadow-sm',
    border: 'border-slate-800/80',
    color: 'text-sky-400'
  },
  faculty: {
    grad: 'from-indigo-700 to-slate-800',
    strip: 'border-l-[3.5px] border-l-indigo-500',
    shadow: 'shadow-sm',
    border: 'border-slate-800/80',
    color: 'text-indigo-400'
  },
  admin: {
    grad: 'from-amber-700 to-slate-800',
    strip: 'border-l-[3.5px] border-l-amber-500',
    shadow: 'shadow-sm',
    border: 'border-slate-800/80',
    color: 'text-amber-400'
  }
};

export default function RoleCard3D({ roleKey, title, subtitle, Icon, onSelect, delay = 0 }) {
  const ref = useRef(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const accent = ACCENTS[roleKey] ?? ACCENTS.student;

  function handleMove(e) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: py * -12, ry: px * 14 });
  }

  function handleLeave() {
    setTilt({ rx: 0, ry: 0 });
  }

  return (
    <motion.button
      ref={ref}
      data-cursor-hover
      initial={{ opacity: 0, y: 40, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={() => onSelect(roleKey)}
      aria-label={`Continue as ${title}`}
      style={{ perspective: 1000 }}
      className="group relative w-full max-w-sm focus-visible:outline-none"
    >
      <motion.div
        animate={{ rotateX: tilt.rx, rotateY: tilt.ry }}
        transition={{ type: 'spring', stiffness: 150, damping: 15 }}
        style={{ transformStyle: 'preserve-3d' }}
        className={`matte-card hover-lift ${accent.strip} relative overflow-hidden rounded-2xl border ${accent.border} p-8 text-left ${accent.shadow} bg-[#121622]`}
      >
        <div
          className={`mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${accent.grad} border border-slate-700/60 shadow-sm`}
          style={{ transform: 'translateZ(30px)' }}
        >
          <Icon size={26} className="text-white" strokeWidth={1.8} />
        </div>

        <div style={{ transform: 'translateZ(30px)' }} className="flex items-center justify-between">
          <h3 className="font-display text-2xl font-bold tracking-tight text-text-primary group-hover:text-white transition-colors">
            {title}
          </h3>
          <Sparkles size={16} className={`${accent.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
        </div>

        <p style={{ transform: 'translateZ(20px)' }} className="mt-2 text-xs text-text-secondary leading-relaxed">
          {subtitle}
        </p>

        <div
          style={{ transform: 'translateZ(15px)' }}
          className={`mt-6 flex items-center justify-between border-t border-glass pt-3 text-xs font-semibold ${accent.color}`}
        >
          <span>Continue as {title}</span>
          <ArrowRight size={16} className="slide-arrow transition-transform group-hover:translate-x-2" />
        </div>
      </motion.div>
    </motion.button>
  );
}
