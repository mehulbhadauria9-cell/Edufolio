import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allow }) {
  const { session, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-midnight-deep text-sm text-text-muted">
        Loading Edufolio…
      </div>
    );
  }

  if (!session) return <Navigate to="/roles" replace />;
  if (allow && role && !allow.includes(role)) return <Navigate to="/dashboard" replace />;

  return children;
}
