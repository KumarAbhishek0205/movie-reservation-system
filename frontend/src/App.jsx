import { Route, Routes } from 'react-router-dom';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import MovieDetail from './pages/MovieDetail';
import Booking from './pages/Booking';
import MyReservations from './pages/MyReservations';
import NotFound from './pages/NotFound';

import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Movies from './pages/admin/Movies';
import MovieForm from './pages/admin/MovieForm';
import Rooms from './pages/admin/Rooms';
import Showtimes from './pages/admin/Showtimes';
import ShowtimeForm from './pages/admin/ShowtimeForm';
import AllReservations from './pages/admin/AllReservations';
import Reports from './pages/admin/Reports';
import Users from './pages/admin/Users';

export default function App() {
  return (
    <div className="min-h-screen bg-canvas">
      <NavBar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/movies/:id" element={<MovieDetail />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/booking/:showtimeId" element={<Booking />} />
          <Route path="/reservations" element={<MyReservations />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="movies" element={<Movies />} />
            <Route path="movies/new" element={<MovieForm />} />
            <Route path="movies/:id/edit" element={<MovieForm />} />
            <Route path="rooms" element={<Rooms />} />
            <Route path="showtimes" element={<Showtimes />} />
            <Route path="showtimes/new" element={<ShowtimeForm />} />
            <Route path="reservations" element={<AllReservations />} />
            <Route path="reports" element={<Reports />} />
            <Route path="users" element={<Users />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>

      <Footer />
    </div>
  );
}
