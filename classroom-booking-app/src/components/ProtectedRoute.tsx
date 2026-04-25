import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../firebase'; // Import Firebase auth instance
import { onAuthStateChanged } from "firebase/auth";

interface ProtectedRouteProps {
  children: React.ReactElement;
  adminOnly?: boolean; // New prop to indicate if route is admin only
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        // Fetch role from localStorage for now, but ideally this would come from backend/ID Token claims
        setUserRole(localStorage.getItem('userRole')); 
      } else {
        setIsAuthenticated(false);
        setUserRole(null);
        // Clear local storage if user logs out
        localStorage.removeItem('userToken');
        localStorage.removeItem('userUid');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userRole');
        localStorage.removeItem('studentId');
      }
      setLoading(false);
    });

    return () => unsubscribe(); // Cleanup subscription
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    alert('โปรดเข้าสู่ระบบเพื่อเข้าถึงหน้านี้'); // Alert the user
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && userRole !== 'ADMIN') {
    alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้'); // Alert for unauthorized admin access
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
