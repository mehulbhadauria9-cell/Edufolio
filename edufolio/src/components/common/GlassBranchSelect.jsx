import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, GraduationCap } from 'lucide-react';

const BRANCH_METADATA = {
  All: { label: 'All Branches', description: 'Institutional leaderboard encompassing all departments' },
  CSE: { label: 'CSE', description: 'Computer Science & Engineering (inc. AI & ML)' },
  ECE: { label: 'ECE', description: 'Electronics & Communication Engineering' },
  ME: { label: 'ME', description: 'Mechanical Engineering' },
  CE: { label: 'CE', description: 'Civil Engineering' },
  IT: { label: 'IT', description: 'Information Technology' }
};

export default function GlassBranchSelect({
  value,
  onChange,
  options = ['All', 'CSE', 'ECE', 'ME', 'CE', 'IT'],
  ariaLabel = 'Filter by branch',
  fullWidth = false,
  size = 'sm' // 'sm' | 'md'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') setIsOpen(false);
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const currentLabel =
    value === 'All'
      ? 'All Branches'
      : (BRANCH_METADATA[value]?.label || value);

  return (
    <div
      ref={containerRef}
      className={`relative ${fullWidth ? 'w-full' : 'inline-block'}`}
    >
      {/* Trigger Button */}
      <button
        type="button"
        data-cursor-hover
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`group flex items-center justify-between gap-2.5 rounded-xl border border-slate-700/60 bg-[#111622]/90 backdrop-blur-md text-slate-200 transition-all duration-200 hover:border-slate-600 hover:bg-[#151c2c] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 shadow-sm ${
          fullWidth ? 'w-full' : ''
        } ${
          size === 'md' ? 'px-4 py-3 text-sm' : 'px-3.5 py-2.5 text-xs'
        } ${isOpen ? 'border-indigo-500/60 ring-2 ring-indigo-500/20' : ''}`}
      >
        <div className="flex items-center gap-2 truncate">
          <GraduationCap
            size={size === 'md' ? 16 : 14}
            className={`flex-shrink-0 transition-colors ${
              isOpen ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-300'
            }`}
          />
          <span className="truncate font-medium text-slate-200">
            {currentLabel}
          </span>
        </div>

        <ChevronDown
          size={14}
          className={`flex-shrink-0 text-slate-400 transition-transform duration-250 ${
            isOpen ? 'rotate-180 text-indigo-400' : 'group-hover:text-slate-300'
          }`}
        />
      </button>

      {/* Gaussian Blur Frosted Glass Dropdown Bar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            role="listbox"
            aria-label={ariaLabel}
            className="absolute left-0 right-0 sm:right-auto sm:min-w-[260px] z-50 mt-1.5 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/75 backdrop-blur-2xl shadow-[0_22px_45px_-10px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.14)] p-1.5 ring-1 ring-black/40"
            style={{
              backdropFilter: 'blur(24px) saturate(190%)',
              WebkitBackdropFilter: 'blur(24px) saturate(190%)'
            }}
          >
            {/* Header Hint in Glass Dropdown */}
            <div className="px-3 py-1.5 mb-1 border-b border-white/[0.06] flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Select Department
              </span>
              <span className="text-[10px] font-mono text-indigo-400/90">
                {options.length} options
              </span>
            </div>

            <div className="space-y-0.5 max-h-64 overflow-y-auto pr-0.5">
              {options.map((opt) => {
                const isSelected = value === opt;
                const meta = BRANCH_METADATA[opt];
                const displayLabel = opt === 'All' ? 'All Branches' : (meta?.label || opt);

                return (
                  <button
                    key={opt}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    data-cursor-hover
                    onClick={() => {
                      onChange(opt);
                      setIsOpen(false);
                    }}
                    className={`group flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-all duration-150 ${
                      isSelected
                        ? 'bg-indigo-600/25 text-white border border-indigo-500/30 font-medium shadow-sm'
                        : 'text-slate-300 hover:bg-white/[0.08] hover:text-white border border-transparent'
                    }`}
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold tracking-wide">
                          {displayLabel}
                        </span>
                        {opt !== 'All' && (
                          <span className="text-[10px] rounded px-1.5 py-0.2 bg-white/5 border border-white/10 font-mono text-slate-400">
                            {opt}
                          </span>
                        )}
                      </div>
                      {meta?.description && (
                        <span className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 font-sans">
                          {meta.description}
                        </span>
                      )}
                    </div>

                    {isSelected && (
                      <div className="ml-2 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md bg-indigo-500/30 text-indigo-300 border border-indigo-400/40">
                        <Check size={12} strokeWidth={2.5} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
