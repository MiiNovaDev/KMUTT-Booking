import { Routes, Route } from 'react-router-dom';
import './App.css';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BookingPage from './pages/BookingPage';
import RoomDetailPage from './pages/RoomDetailPage';
import ConfirmationPage from './pages/ConfirmationPage';
import MyBookingsPage from './pages/MyBookingsPage';
import CalendarViewPage from './pages/CalendarViewPage';
import CheckInPage from './pages/CheckInPage';
import AdminPage from './pages/AdminPage';
import AllRoomsPage from './pages/AllRoomsPage';
import ProtectedRoute from './components/ProtectedRoute';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/booking" element={<BookingPage />} />
      <Route path="/room/:id" element={<RoomDetailPage />} />
      <Route path="/confirmation" element={<ConfirmationPage />} />
      
      <Route 
        path="/my-bookings" 
        element={
          <ProtectedRoute>
            <MyBookingsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/calendar" 
        element={
          <ProtectedRoute>
            <CalendarViewPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/check-in" 
        element={
          <ProtectedRoute adminOnly={true}>
            <CheckInPage />
          </ProtectedRoute>
        } 
      />
      <Route path="/all-rooms" element={<AllRoomsPage />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly={true}>
            <AdminPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
