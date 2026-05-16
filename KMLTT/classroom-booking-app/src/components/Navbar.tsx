import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import './Navbar.css';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const impersonation = sessionStorage.getItem('impersonation');
  const impersonatedData = impersonation ? JSON.parse(impersonation) : null;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('userToken');
      localStorage.removeItem('userUid');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
      localStorage.removeItem('studentId');
      sessionStorage.removeItem('impersonation');
      navigate('/login');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleExitImpersonation = () => {
    sessionStorage.removeItem('impersonation');
    window.location.href = '/admin/users'; // Refresh to restore real role
  };

  const getDisplayRole = (role: string) => {
    if (role === 'DEV') return 'Developer';
    if (role === 'ADMIN') return 'Administrator';
    return 'User';
  };

  return (
    <>
      {impersonatedData && (
        <div className="bg-warning text-dark text-center py-1 fw-bold">
          คุณกำลังสวมสิทธิ์เป็น: {impersonatedData.studentId} ({getDisplayRole(impersonatedData.role)})
          <button 
            className="btn btn-sm btn-dark ms-3 py-0" 
            onClick={handleExitImpersonation}
          >
            Exit
          </button>
        </div>
      )}
      <nav className="navbar navbar-expand-lg navbar-dark navbar-custom">
        <div className="container-fluid">
          <Link className="navbar-brand d-flex align-items-center" to="/">
            <img src={`/logo.svg?v=${new Date().getTime()}`} alt="ECT Logo" width="30" height="30" className="me-2" />
            ECT Booking
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
    </>
  );
};

export default Navbar;
