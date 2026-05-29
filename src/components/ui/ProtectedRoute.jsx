import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * ProtectedRoute — Require authentication to access a route.
 *
 * Usage in App.jsx:
 *   <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
 *
 * Redirects unauthenticated users to /login and stores the original
 * destination so they are returned there after signing in.
 */
const ProtectedRoute = ({ children }) => {
  const { user, userProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-vy-black flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    // Save current path so login can redirect back
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // If user is logged in via Firebase but has no Firestore profile,
  // force them to complete onboarding (unless they are already on the onboarding page).
  if (!userProfile && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" state={{ from: location.pathname }} replace />;
  }

  // If user has a profile but tries to visit the onboarding page, redirect away
  if (userProfile && location.pathname === '/onboarding') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
