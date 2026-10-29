import { useEffect, useState } from 'react';
import AppLayout from '../../components/dashboard/AppLayout';
import { StaticRoleBackground } from '../../components/background/Backgrounds';
import { supabase } from '../../lib/supabaseClient';

const ROLE_STYLES = {
  student: 'border-student/30 bg-student/10 text-student-light',
  faculty: 'border-faculty/30 bg-faculty/10 text-faculty-light',
  admin: 'border-admin/30 bg-admin/10 text-admin-light'
};

export default function ManageRoles() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('id, email, role, created_at').order('created_at', { ascending: false });
    setProfiles(data ?? []);
    setLoading(false);
  }

  // Role changes go through a privileged RPC/Edge Function on the server —
  // never a direct client-side UPDATE to profiles.role — so users can never
  // self-promote and every change is auditable.
  async function changeRole(id, newRole) {
    setBusyId(id);
    const { error } = await supabase.rpc('admin_set_role', { target_id: id, new_role: newRole });
    if (!error) await load();
    setBusyId(null);
  }

  return (
    <AppLayout background={<StaticRoleBackground />}>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-mono font-bold">RBAC ACCESS GOVERNANCE</span>
          <span className="text-white/20">—</span>
          <span className="text-[10px] text-slate-400">Cryptographic Permission Matrix</span>
        </div>
        <h1 className="font-display text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <span>Manage Platform Roles</span>
          <span className="text-slate-600 font-light">—</span>
          <span className="text-xs font-normal text-slate-400 font-mono">Privilege Control</span>
        </h1>
        <p className="mt-1 text-xs text-slate-400 font-sans">
          Assign platform roles and governance boundaries. Changes are audited via privileged RPC functions.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <p className="text-xs text-slate-400">Loading verified security accounts…</p>
        </div>
      ) : (
        <div className="space-y-3">
          {profiles.map((p) => (
            <div
              key={p.id}
              className="matte-card border-l-[3.5px] border-l-indigo-500/80 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800/80 bg-[#121622] p-4.5 hover-lift transition-all"
            >
              <div>
                <p className="text-xs font-bold text-slate-100 font-mono tracking-wide">{p.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-block rounded-md border border-slate-700 bg-slate-800/80 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider font-bold text-slate-300`}>
                    {p.role}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Joined: {new Date(p.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex gap-1.5">
                {['student', 'faculty', 'admin'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    data-cursor-hover
                    disabled={busyId === p.id || p.role === r}
                    onClick={() => changeRole(p.id, r)}
                    className={`rounded-lg border px-3 py-1 text-xs font-medium capitalize transition-all ${
                      p.role === r
                        ? 'border-indigo-500/40 bg-indigo-500/20 text-indigo-300 font-semibold shadow-sm'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    } disabled:cursor-not-allowed`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
