import { useState } from 'react';
import { motion } from 'framer-motion';
import AppLayout from '../../components/dashboard/AppLayout';
import { FormBackground } from '../../components/background/Backgrounds';
import { FormField } from '../../components/auth/FormField';
import { createManagedAccount } from '../../services/accountService';
import GlassBranchSelect from '../../components/common/GlassBranchSelect';

const BRANCHES = ['CSE', 'ECE', 'ME', 'CE', 'IT'];

const initialForm = { name: '', email: '', roll_no: '', branch: 'CSE', year: 1, cgpa: '', leetcode_handle: '', password: '' };

export default function RegisterStudent() {
  const [form, setForm] = useState(initialForm);
  const [createdPassword, setCreatedPassword] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    setError('');
    const usedPassword = form.password?.trim() || 'Student123!';
    try {
      await createManagedAccount({
        role: 'student',
        ...form,
        year: Number(form.year),
        cgpa: Number(form.cgpa),
        password: usedPassword
      });
      setCreatedPassword(usedPassword);
      setStatus('success');
      setForm(initialForm);
    } catch (err) {
      setError(err.message ?? 'Could not register student.');
      setStatus('error');
    }
  }

  return (
    <AppLayout background={<FormBackground variant="registration" />}>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] uppercase tracking-widest text-sky-400 font-mono font-bold">STUDENT ENROLLMENT</span>
          <span className="text-white/20">—</span>
          <span className="text-[10px] text-slate-400">Verifiable Identity</span>
        </div>
        <h1 className="font-display text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <span>Register Student</span>
          <span className="text-slate-600 font-light">—</span>
          <span className="text-xs font-normal text-slate-400 font-mono">Academic Ledger</span>
        </h1>
        <p className="mt-1 text-xs text-slate-400 font-sans">
          Create a verified student record with LeetCode handle tracking & cumulative metrics.
        </p>
      </div>

      <div className="matte-card border-l-[3.5px] border-l-sky-500 w-full max-w-3xl xl:max-w-4xl rounded-2xl border border-slate-800/80 bg-[#121622] p-8 shadow-sm">
        <form onSubmit={handleSubmit} noValidate>
          <FormField label="Full Name" value={form.name} onChange={(e) => update('name', e.target.value)} />
          <FormField label="Email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} autoComplete="off" />
          <FormField label="Roll Number" value={form.roll_no} onChange={(e) => update('roll_no', e.target.value)} />

          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">Branch</label>
              <GlassBranchSelect
                value={form.branch}
                onChange={(b) => update('branch', b)}
                options={BRANCHES}
                ariaLabel="Select student department"
                fullWidth={true}
                size="md"
              />
            </div>
            <FormField label="Year" type="number" value={form.year} onChange={(e) => update('year', e.target.value)} />
          </div>

          <div className="mb-4 grid grid-cols-2 gap-4">
            <FormField label="CGPA" type="number" value={form.cgpa} onChange={(e) => update('cgpa', e.target.value)} required={false} />
            <FormField
              label="LeetCode Handle"
              value={form.leetcode_handle}
              onChange={(e) => update('leetcode_handle', e.target.value)}
              required={false}
              placeholder="e.g. striver_79"
            />
          </div>

          <div className="mb-4">
            <FormField
              label="Account Password (Optional)"
              type="password"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              required={false}
              autoComplete="new-password"
              placeholder="Defaults to Student123! if blank"
            />
          </div>

          {status === 'success' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              role="status"
              className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-xs text-emerald-400"
            >
              <p className="font-bold">Student account created successfully!</p>
              <p className="mt-1.5 text-slate-300">
                Login Password: <strong className="rounded-lg bg-black/40 px-2.5 py-1 font-mono text-sky-300 border border-white/10">{createdPassword}</strong>
              </p>
            </motion.div>
          )}
          {error && (
            <p role="alert" className="mb-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            data-cursor-hover
            disabled={status === 'loading'}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 py-3 text-xs font-semibold text-white shadow-sm hover-lift transition-all disabled:opacity-60"
          >
            <span>{status === 'loading' ? 'Enrolling…' : 'Enroll Student Record'}</span>
            <span className="text-slate-200 font-mono transition-transform duration-200 group-hover:translate-x-1">→</span>
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
