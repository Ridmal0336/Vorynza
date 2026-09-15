import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import StaticPage from './pages/StaticPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

import HallSearchPage from './pages/halls/HallSearchPage';
import HallDetailPage from './pages/halls/HallDetailPage';
import PackagesPage from './pages/packages/PackagesPage';
import CateringMenuPage from './pages/catering-menu/CateringMenuPage';
import BookingPage from './pages/booking/BookingPage';

import DashboardLayout from './pages/dashboard/DashboardLayout';
import MyBookings from './pages/dashboard/MyBookings';
import MyProfile from './pages/dashboard/MyProfile';
import PaymentHistory from './pages/dashboard/PaymentHistory';

import AdminLayout from './pages/admin/AdminLayout';
import AdminOverview from './pages/admin/AdminOverview';
import AdminHotels from './pages/admin/AdminHotels';
import AdminHalls from './pages/admin/AdminHalls';
import AdminPackages from './pages/admin/AdminPackages';
import AdminCatering from './pages/admin/AdminCatering';
import AdminReservations from './pages/admin/AdminReservations';
import AdminInvoices from './pages/admin/AdminInvoices';
import AdminUsers from './pages/admin/AdminUsers';
import AdminReports from './pages/admin/AdminReports';

const ADMIN = ['ADMIN'];
const ADMIN_MANAGER = ['ADMIN', 'MANAGER'];

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<StaticPage page="about" />} />
        <Route path="contact" element={<StaticPage page="contact" />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />

        {/* Customer browse */}
        <Route path="halls" element={<HallSearchPage />} />
        <Route path="search" element={<HallSearchPage />} />
        <Route path="halls/:id" element={<HallDetailPage />} />
        <Route path="packages" element={<PackagesPage />} />
        <Route path="catering" element={<CateringMenuPage />} />

        {/* Booking flow */}
        <Route
          path="book"
          element={
            <ProtectedRoute>
              <BookingPage />
            </ProtectedRoute>
          }
        />
        <Route path="reservations/new" element={<Navigate to="/book" replace />} />

        {/* Customer dashboard */}
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard/bookings" replace />} />
          <Route path="bookings" element={<MyBookings />} />
          <Route path="profile" element={<MyProfile />} />
          <Route path="payments" element={<PaymentHistory />} />
        </Route>

        {/* Legacy customer routes */}
        <Route path="reservations" element={<Navigate to="/dashboard/bookings" replace />} />
        <Route path="invoices" element={<Navigate to="/dashboard/payments" replace />} />

        {/* Admin */}
        <Route
          path="admin"
          element={
            <ProtectedRoute roles={ADMIN_MANAGER}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/overview" replace />} />
          <Route path="overview" element={<AdminOverview />} />
          <Route
            path="hotels"
            element={
              <ProtectedRoute roles={ADMIN}>
                <AdminHotels />
              </ProtectedRoute>
            }
          />
          <Route
            path="halls"
            element={
              <ProtectedRoute roles={ADMIN}>
                <AdminHalls />
              </ProtectedRoute>
            }
          />
          <Route
            path="packages"
            element={
              <ProtectedRoute roles={ADMIN}>
                <AdminPackages />
              </ProtectedRoute>
            }
          />
          <Route
            path="catering"
            element={
              <ProtectedRoute roles={ADMIN}>
                <AdminCatering />
              </ProtectedRoute>
            }
          />
          <Route path="reservations" element={<AdminReservations />} />
          <Route path="invoices" element={<AdminInvoices />} />
          <Route
            path="users"
            element={
              <ProtectedRoute roles={ADMIN}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route path="reports" element={<AdminReports />} />
        </Route>

        {/* Legacy admin routes */}
        <Route path="users" element={<Navigate to="/admin/users" replace />} />
        <Route path="reports" element={<Navigate to="/admin/reports" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
