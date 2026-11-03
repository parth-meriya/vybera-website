import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from './AdminSidebar';

const AdminLayout = () => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="admin-theme min-h-screen bg-[#F3E7D8] flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="admin-theme flex min-h-screen bg-[#F3E7D8] text-[#30231F]">
      <AdminSidebar />
      <main className="flex-1 overflow-auto bg-[#F3E7D8]">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
