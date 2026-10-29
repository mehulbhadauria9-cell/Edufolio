import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { SplashBackground } from '../components/background/Backgrounds';

const WORDMARK = 'EDUFOLIO';

export default function SplashScreen() {
  const navigate = useNavigate();
  const [dissolve, setDissolve] = useState(false);

  useEffect(() => {
    const dissolveTimer = setTimeout(() => setDissolve(true), 3200);
    const navTimer = setTimeout(() => navigate('/roles'), 4800);
    return () => {
      clearTimeout(dissolveTimer);
      clearTimeout(navTimer);
    };
  }, [navigate]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0B0F17] flex items-center justify-center">
      <SplashBackground />

      {/* Dot Grid overlay */}
      <div className="absolute inset-0 dot-grid opacity-25 pointer-events-none" />

      {/* Dissolve overlay into Deep Matte Obsidian */}
      <AnimatePresence>
        {dissolve && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.4, ease: 'easeInOut' }}
            className="absolute inset-0 bg-[#0B0F17]/95 z-20 pointer-events-none"
          />
        )}
      </AnimatePresence>

      <div className="relative z-30 flex h-full flex-col items-center justify-center px-6 text-center">
        {/* Top badge with subtle matte border */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 py-1.5 text-xs font-mono font-medium text-slate-300 shadow-sm"
        >
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          <span>Academic Operating System — 2026</span>
        </motion.div>

        {/* Wordmark with crisp matte white */}
        <div className="flex select-none" aria-label="Edufolio">
          {WORDMARK.split('').map((letter, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 28, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ delay: 0.1 * i, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-6xl sm:text-8xl font-black tracking-tight text-white drop-shadow-sm"
            >
              {letter}
            </motion.span>
          ))}
        </div>

        {/* Subtitle with em dash */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.7 }}
          className="mt-5 max-w-lg text-sm sm:text-base font-normal tracking-wide text-slate-400 font-sans leading-relaxed"
        >
          Empowering real-time talent verification — algorithmic excellence, verified achievements & dynamic student leaderboards.
        </motion.p>

        {/* Subtle matte accent divider */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 1.5, duration: 0.6 }}
          className="mt-6 h-0.5 w-32 rounded-full bg-slate-700"
        />

        {/* Fast Action Skip Button */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 0.5 }}
          className="mt-9"
        >
          <button
            type="button"
            onClick={() => navigate('/roles')}
            className="group relative inline-flex items-center gap-2.5 rounded-xl bg-slate-900 px-6 py-3 text-xs font-semibold text-white border border-slate-700/80 shadow-sm hover:bg-slate-800 hover:border-slate-600 transition-all hover-lift"
          >
            <span>Enter Edufolio Portal</span>
            <ArrowRight className="h-4 w-4 text-slate-400 transition-transform duration-200 group-hover:translate-x-1" />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
