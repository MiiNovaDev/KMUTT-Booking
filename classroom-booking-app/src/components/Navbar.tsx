import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { BookFill } from 'react-bootstrap-icons';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import './Navbar.css';

const Navbar: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // localStorage is also cleared in ProtectedRoute's onAuthStateChanged,
      // but clearing it here as well for immediate feedback and safety.
      localStorage.removeItem('userToken');
      localStorage.removeItem('userUid');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
      localStorage.removeItem('studentId');
      navigate('/login');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark navbar-custom">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">
          <BookFill /> KMUTT Booking
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <NavLink className="nav-link" to="/" end>
                Home
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/my-bookings">
                My Bookings
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/calendar">
                Calendar
              </NavLink>
            </li>
          </ul>
          <div className="d-flex">
            <button onClick={handleLogout} className="btn btn-logout">
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
