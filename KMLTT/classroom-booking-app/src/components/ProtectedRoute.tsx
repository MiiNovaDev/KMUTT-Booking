import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../firebase'; // Import Firebase auth instance
import { onAuthStateChanged } from "firebase/auth";
import { getActiveUserContext } from '../utils/authUtils';

interface ProtectedRouteProps {
  children: React.ReactElement;
  adminOnly?: boolean; // New prop to indicate if route is admin only
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    console.log("ProtectedRoute: Initializing auth check...");
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("ProtectedRoute: onAuthStateChanged triggered", user ? `User: ${user.email}` : "No user");
      if (user) {
        setIsAuthenticated(true);
        const context = getActiveUserContext();
        setUserRole(context.role); 
      } else {
        console.log("ProtectedRoute: User is NOT authenticated. Clearing data.");
        setIsAuthenticated(false);
        setUserRole(null);
        // Clear local storage if user logs out
        localStorage.removeItem('userToken');
        localStorage.removeItem('userUid');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userRole');
        localStorage.removeItem('studentId');
        sessionStorage.removeItem('impersonation');
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

  // Use the context role for route protection
  if (adminOnly && userRole !== 'ADMIN' && userRole !== 'DEV') {
    alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้'); // Alert for unauthorized admin access
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
