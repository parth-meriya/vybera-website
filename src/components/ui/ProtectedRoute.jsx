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
  const { user, loading } = useAuth();
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

  return children;
};

export default ProtectedRoute;
