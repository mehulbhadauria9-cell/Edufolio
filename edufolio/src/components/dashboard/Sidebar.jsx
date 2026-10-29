import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, Trophy, UserCircle, UserPlus, ClipboardList, ShieldCheck, LogOut, Download, Users, UserMinus, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV = {
  student: [
    { to: '/dashboard', label: 'Home / Leaderboard', Icon: Trophy },
    { to: '/profile', label: 'My Profile', Icon: UserCircle },
    { to: '/install', label: 'Install Edufolio App', Icon: Download }
  ],
  faculty: [
    { to: '/dashboard', label: 'Home / Leaderboard', Icon: Trophy },
    { to: '/register-student', label: 'Add / Register Student', Icon: UserPlus },
    { to: '/log-achievement', label: 'Log Achievement', Icon: ClipboardList }
  ],
  admin: [
    { to: '/dashboard', label: 'Home / Leaderboard', Icon: Trophy },
    { to: '/manage-students', label: 'Manage / Remove Students', Icon: UserMinus },
    { to: '/log-achievement', label: 'Log Achievement', Icon: ClipboardList },
    { to: '/add-student', label: 'Add Student Account', Icon: UserPlus },
    { to: '/add-faculty', label: 'Add Faculty Account', Icon: Users },
    { to: '/manage-roles', label: 'Manage Roles', Icon: ShieldCheck }
  ]
};

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const { role, signOut } = useAuth();
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const items = NAV[role] ?? NAV.student;

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    document.body.classList.toggle('no-scroll', open);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  async function handleLogout() {
    await signOut();
    navigate('/roles');
  }

  return (
    <>
      <button
        type="button"
        data-cursor-hover
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={open}
        className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-[#121622] text-slate-200 transition-colors hover:border-slate-700 shadow-sm"
      >
        <Menu size={18} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-[#0B0F17]/80 backdrop-blur-sm"
              aria-hidden="true"
            />
            <motion.nav
              ref={panelRef}
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
              role="dialog"
              aria-label="Main navigation"
              className="fixed left-0 top-0 z-50 h-full w-72 border-r border-slate-800 bg-[#121622] p-6 shadow-2xl"
            >
              <div className="mb-8 flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-display text-base font-bold tracking-wide text-white">Edufolio</span>
                    <p className="text-[10px] text-slate-400 font-mono tracking-wider">ACADEMIC OS</p>
                  </div>
                </div>
                <button
                  type="button"
                  data-cursor-hover
                  onClick={() => setOpen(false)}
                  aria-label="Close navigation menu"
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <ul className="space-y-1.5">
                {items.map(({ to, label, Icon }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      data-cursor-hover
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        `group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-[#182030] text-white border-l-[3.5px] border-l-indigo-500 font-semibold'
                            : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent'
                        }`
                      }
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon size={16} className="text-slate-400 group-hover:text-indigo-400 transition-colors" />
                        <span>{label}</span>
                      </div>
                      <span className="text-[11px] text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all">→</span>
                    </NavLink>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                data-cursor-hover
                onClick={handleLogout}
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-[#121622] px-4 py-2.5 text-xs font-semibold text-slate-300 transition-all hover:bg-slate-800 hover:text-rose-400 shadow-sm"
              >
                <LogOut size={14} />
                <span>Disconnect — Sign Out</span>
              </button>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
