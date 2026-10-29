import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import AuthShell from '../../components/auth/AuthShell';
import { FormField } from '../../components/auth/FormField';
import { AuthBackground } from '../../components/background/Backgrounds';
import { useAuth } from '../../context/AuthContext';

const ROLE_META = {
  student: { label: 'Student', accent: 'teal', strip: 'border-l-sky-500', button: 'bg-sky-600 hover:bg-sky-500' },
  faculty: { label: 'Faculty', accent: 'violet', strip: 'border-l-indigo-500', button: 'bg-indigo-600 hover:bg-indigo-500' },
  admin: { label: 'Admin', accent: 'copper', strip: 'border-l-amber-500', button: 'bg-amber-600 hover:bg-amber-500' }
};

export default function Login() {
  const { role } = useParams();
  const meta = ROLE_META[role] ?? ROLE_META.student;
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { data, error: signInError } = await signIn(email, password);
    setLoading(false);

    if (signInError) {
      setError(signInError.message || 'Unable to sign in. Check your credentials.');
      return;
    }

    navigate('/dashboard');
  }

  return (
    <AuthShell
      background={<AuthBackground accent={meta.accent} />}
      title={`${meta.label} Sign In`}
      subtitle="Welcome back — enter your credentials to access your dashboard."
    >
      <form onSubmit={handleSubmit} noValidate>
        <FormField
          label="Email or Username"
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          placeholder="e.g. pratham1805_ or email address"
        />

        <FormField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          placeholder="Enter your password"
        />

        {error && (
          <p role="alert" className="mb-4 rounded-xl border border-status-error/30 bg-status-error/10 px-4 py-2.5 text-xs text-status-error">
            {error}
          </p>
        )}

        <button
          type="submit"
          data-cursor-hover
          disabled={loading}
          className={`group flex w-full items-center justify-center gap-2 rounded-xl ${meta.button} py-3 text-xs font-semibold text-white shadow-sm transition-all hover-lift disabled:opacity-60`}
        >
          <span>{loading ? 'Authenticating…' : `Sign In as ${meta.label}`}</span>
          {!loading && <ArrowRight size={14} className="slide-arrow transition-transform group-hover:translate-x-1" />}
        </button>

        <div className="mt-4 flex items-center justify-between text-xs text-text-secondary">
          <Link
            to="/forgot-password"
            data-cursor-hover
            className="hover:text-text-primary underline decoration-text-muted underline-offset-4 transition-colors"
          >
            Forgot Password?
          </Link>

          <Link
            to="/roles"
            data-cursor-hover
            className="text-cyan hover:underline transition-colors font-medium"
          >
            Change Role &rarr;
          </Link>
        </div>

        <div className="mt-6 rounded-2xl border border-glass bg-white/[0.02] p-3.5 text-center text-[11px] leading-relaxed text-text-muted">
          <ShieldCheck size={14} className="mx-auto mb-1 text-cyan inline-block mr-1" />
          <span>Institutional access secured by encrypted JWT token authentication.</span>
        </div>
      </form>
    </AuthShell>
  );
}
