import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MailCheck, RefreshCw } from 'lucide-react';
import AuthShell from '../../components/auth/AuthShell';
import { FormField } from '../../components/auth/FormField';
import { SecurityBackground } from '../../components/background/Backgrounds';
import { useAuth } from '../../context/AuthContext';

export default function ForgotPassword() {
  const { sendPasswordReset } = useAuth();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  // Countdown timer for resending reset link
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  async function handleSendLink(e) {
    if (e) e.preventDefault();
    setError('');

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    const { error: sendError } = await sendPasswordReset(cleanEmail);
    setLoading(false);

    if (sendError) {
      setError(sendError.message || 'Failed to send reset link. Please check your email.');
      return;
    }

    setSent(true);
    setResendCooldown(60);
  }

  async function handleResend() {
    if (resendCooldown > 0 || resending) return;
    setError('');
    setResending(true);
    const { error: sendError } = await sendPasswordReset(email.trim());
    setResending(false);

    if (sendError) {
      setError(sendError.message || 'Failed to resend link. Please wait a moment.');
      return;
    }

    setResendCooldown(60);
  }

  return (
    <AuthShell
      background={<SecurityBackground />}
      title={sent ? 'Check Your Email' : 'Reset Password'}
      subtitle={
        sent
          ? "We've dispatched a secure reset link to your email."
          : "Enter your registered email and we'll send you a password reset link."
      }
    >
      {sent ? (
        <div className="text-center">
          <div className="mb-6 rounded-2xl border border-status-success/30 bg-status-success/10 p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-status-success/20 text-status-success">
              <MailCheck size={28} />
            </div>
            <h2 className="text-base font-semibold text-text-primary">Reset Link Sent!</h2>
            <p className="mt-2 text-xs leading-relaxed text-text-secondary">
              A secure password reset link has been sent to{' '}
              <strong className="text-text-primary">{email}</strong>.
            </p>
            <p className="mt-2 text-[11px] text-text-muted">
              Click the link inside the email to set your new password. The link will expire in 1 hour.
            </p>
          </div>

          <div className="space-y-3">
            {resendCooldown > 0 ? (
              <span className="block text-xs text-text-muted">
                Resend link in <span className="font-mono text-text-secondary">{resendCooldown}s</span>
              </span>
            ) : (
              <button
                type="button"
                data-cursor-hover
                onClick={handleResend}
                disabled={resending}
                className="text-xs text-text-secondary underline decoration-text-muted underline-offset-4 transition-colors hover:text-text-primary"
              >
                {resending ? 'Sending new link…' : "Didn't receive email? Resend Link"}
              </button>
            )}

            <div>
              <button
                type="button"
                data-cursor-hover
                onClick={() => {
                  setSent(false);
                  setError('');
                }}
                className="text-xs text-violet-active underline hover:text-text-primary"
              >
                Use a different email address
              </button>
            </div>

            <div className="pt-2">
              <Link
                to="/roles"
                data-cursor-hover
                className="block w-full rounded-xl border border-standard bg-midnight-input py-2.5 text-center text-xs font-medium text-text-secondary transition-colors hover:text-text-primary"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSendLink} noValidate>
          <FormField
            label="Registered Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="name@school.edu"
          />

          {error && (
            <p
              role="alert"
              className="mb-4 rounded-lg border border-status-error/30 bg-status-error/10 px-3 py-2 text-xs text-status-error"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            data-cursor-hover
            disabled={loading}
            className="w-full rounded-xl bg-aurora-gradient py-3 text-sm font-semibold text-white shadow-glow-violet transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Sending Reset Link…
              </>
            ) : (
              <>
                <Mail size={16} />
                Send Reset Link
              </>
            )}
          </button>

          <div className="mt-4 text-center">
            <Link
              to="/roles"
              data-cursor-hover
              className="text-xs text-text-secondary underline decoration-text-muted underline-offset-4 transition-colors hover:text-text-primary"
            >
              Remember your password? Sign In
            </Link>
          </div>
        </form>
      )}
    </AuthShell>
  );
}
