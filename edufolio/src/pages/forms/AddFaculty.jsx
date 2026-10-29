import { useState } from 'react';
import { CheckCircle2, Shield } from 'lucide-react';
import AppLayout from '../../components/dashboard/AppLayout';
import { FormBackground } from '../../components/background/Backgrounds';
import { FormField } from '../../components/auth/FormField';
import { createManagedAccount } from '../../services/accountService';

const initialForm = { name: '', email: '', department: '', password: '' };

export default function AddFaculty() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState('idle');
  const [createdPassword, setCreatedPassword] = useState('');
  const [error, setError] = useState('');

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    setError('');
    const usedPassword = form.password?.trim() || 'Faculty123!';

    try {
      await createManagedAccount({
        role: 'faculty',
        name: form.name,
        email: form.email,
        department: form.department,
        password: usedPassword
      });
      setCreatedPassword(usedPassword);
      setStatus('success');
      setForm(initialForm);
    } catch (err) {
      setError(err.message ?? 'Could not create faculty account.');
      setStatus('error');
    }
  }

  return (
    <AppLayout background={<FormBackground variant="faculty" />}>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-mono font-bold">ADMINISTRATIVE PROVISIONING</span>
          <span className="text-white/20">—</span>
          <span className="text-[10px] text-slate-400">Institutional Faculty</span>
        </div>
        <h1 className="font-display text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <span>Add Faculty Account</span>
          <span className="text-slate-600 font-light">—</span>
          <span className="text-xs font-normal text-slate-400 font-mono">Access Grant</span>
        </h1>
        <p className="mt-1 text-xs text-slate-400 font-sans">
          Provision a verified faculty officer with customized credentials & validation authorities.
        </p>
      </div>

      <div className="matte-card border-l-[3.5px] border-l-indigo-500 w-full max-w-3xl xl:max-w-4xl rounded-2xl border border-slate-800/80 bg-[#121622] p-8 shadow-sm">
        <form onSubmit={handleSubmit} noValidate>
          <FormField
            label="Full Name"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="e.g. Dr. Alan Turing"
          />

          <FormField
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            autoComplete="off"
            placeholder="e.g. faculty.name@edufolio.edu"
          />

          <FormField
            label="Department"
            value={form.department}
            onChange={(e) => update('department', e.target.value)}
            placeholder="e.g. Computer Science, AI & ML, Robotics"
          />

          {/* Password Option */}
          <div className="mb-4">
            <FormField
              label="Account Password"
              type="password"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              required={false}
              autoComplete="new-password"
              placeholder="e.g. Faculty123! (Defaults to Faculty123! if blank)"
            />
            <p className="-mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
              <Shield size={12} className="text-violet-400" />
              <span>Set the initial login password for this faculty member. Defaults to <strong className="text-white">Faculty123!</strong> if left empty.</span>
            </p>
          </div>

          {status === 'success' && (
            <div className="mb-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-400">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 size={16} />
                <span>Faculty account created successfully!</span>
              </div>
              <p className="mt-1.5 text-slate-300">
                Login Password:{' '}
                <strong className="rounded-lg bg-black/40 px-2.5 py-1 font-mono text-indigo-300 border border-white/10">
                  {createdPassword}
                </strong>
              </p>
            </div>
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
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3 text-xs font-semibold text-white shadow-sm hover-lift transition-all disabled:opacity-60"
          >
            <span>{status === 'loading' ? 'Creating Account…' : 'Add Faculty Member'}</span>
            <span className="text-slate-300 font-mono transition-transform duration-200 group-hover:translate-x-1">→</span>
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
