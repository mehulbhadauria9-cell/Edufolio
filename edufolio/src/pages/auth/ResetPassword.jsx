import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { CheckCircle2, KeyRound, RefreshCw, AlertTriangle, ArrowRight } from 'lucide-react';
import AuthShell from '../../components/auth/AuthShell';
import { FormField } from '../../components/auth/FormField';
import { SecurityBackground } from '../../components/background/Backgrounds';
import { useAuth } from '../../context/AuthContext';

export default function ResetPassword() {
  const { verifyResetToken, resetPasswordWithToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [targetEmail, setTargetEmail] = useState('');
  const [tokenError, setTokenError] = useState('');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setTokenValid(false);
      setTokenError('No reset token found in URL. Please click the link in your email.');
      return;
    }

    async function checkToken() {
      setVerifying(true);
      const { data, error } = await verifyResetToken(token);
      setVerifying(false);

      if (error || !data?.valid) {
        setTokenValid(false);
        setTokenError(error?.message || 'This reset link has expired or is invalid.');
        return;
      }

      setTokenValid(true);
      setTargetEmail(data.email || '');
    }

    checkToken();
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirm) {
      setFormError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    const { error: resetError } = await resetPasswordWithToken(token, password);
    setSubmitting(false);

    if (resetError) {
      setFormError(resetError.message || 'Failed to update password. The link may have expired.');
      return;
    }

    setSuccess(true);
    setTimeout(() => navigate('/roles'), 2200);
  }

  return (
    <AuthShell
      background={<SecurityBackground />}
      title={
        success
          ? 'Password Updated!'
          : tokenValid
          ? 'Set New Password'
          : verifying
          ? 'Verifying Link…'
          : 'Link Invalid'
      }
      subtitle={
        success
          ? 'Your password has been changed successfully.'
          : tokenValid
          ? `Choose a new secure password for ${targetEmail}.`
          : verifying
          ? 'Checking your reset link credentials…'
          : 'This reset link cannot be used.'
      }
    >
      {verifying && (
        <div className="flex flex-col items-center py-8 text-center">
          <RefreshCw size={28} className="animate-spin text-violet-active mb-3" />
          <p className="text-xs text-text-secondary">Validating your reset token…</p>
        </div>
      )}

      {!verifying && success && (
        <div className="flex flex-col items-center py-4 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-status-success/20 text-status-success">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-base font-semibold text-text-primary">Password Reset Complete!</h2>
          <p className="mt-2 text-xs text-text-secondary">
            You can now sign in with your new password. Redirecting you to sign in…
          </p>
          <div className="mt-6 w-full">
            <Link
              to="/roles"
              data-cursor-hover
              className="block w-full rounded-xl bg-aurora-gradient py-3 text-center text-sm font-semibold text-white shadow-glow-violet transition-opacity hover:opacity-90"
            >
              Go to Sign In
            </Link>
          </div>
        </div>
      )}

      {!verifying && !tokenValid && !success && (
        <div className="text-center py-2">
          <div className="mb-4 flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-status-warning/20 text-status-warning">
            <AlertTriangle size={24} />
          </div>
          <p className="text-sm font-medium text-text-primary mb-2">Reset Link Expired or Invalid</p>
          <p className="text-xs text-text-muted mb-6 leading-relaxed">
            {tokenError || 'This reset link has expired or has already been used. Please request a new one.'}
          </p>
          <Link
            to="/forgot-password"
            data-cursor-hover
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-aurora-gradient py-3 text-sm font-semibold text-white shadow-glow-violet transition-opacity hover:opacity-90"
          >
            Request New Reset Link <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {!verifying && tokenValid && !success && (
        <form onSubmit={handleSubmit} noValidate>
          {targetEmail && (
            <div className="mb-4 rounded-xl border border-glass bg-midnight-input/80 px-3.5 py-2.5 text-xs text-text-secondary">
              Resetting password for: <span className="font-semibold text-text-primary">{targetEmail}</span>
            </div>
          )}

          <FormField
            label="New Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="At least 8 characters"
          />

          <FormField
            label="Confirm Password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            placeholder="Re-enter new password"
          />

          {formError && (
            <p
              role="alert"
              className="mb-4 rounded-lg border border-status-error/30 bg-status-error/10 px-3 py-2 text-xs text-status-error"
            >
              {formError}
            </p>
          )}

          <button
            type="submit"
            data-cursor-hover
            disabled={submitting}
            className="w-full rounded-xl bg-aurora-gradient py-3 text-sm font-semibold text-white shadow-glow-violet transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Updating Password…
              </>
            ) : (
              <>
                <KeyRound size={16} />
                Update Password
              </>
            )}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
