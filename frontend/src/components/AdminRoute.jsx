import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

export default function AdminRoute() {
  const { isAdmin, loading, isAuthenticated } = useAuth();

  if (loading) return <Loader label="Checking access" />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
}
