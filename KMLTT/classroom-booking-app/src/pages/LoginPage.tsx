import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import { Envelope, Lock } from 'react-bootstrap-icons';
import { auth } from '../firebase'; // Import Firebase auth instance
import { signInWithEmailAndPassword } from "firebase/auth";
import { API_BASE_URL } from '../services/api';
import './LoginPage.css';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null); // State for error messages
  const navigate = useNavigate(); // Hook for navigation

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors

    try {
      // Sign in user with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Get Firebase ID token
      const idToken = await user.getIdToken();

      // Send ID token to backend for verification and to get user details/role
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}` // Send Firebase ID token
        },
        body: JSON.stringify({ idToken }), // Send idToken in body for backend verification
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed on backend.');
      }

      const userData = await response.json(); // Backend should return user details and role
      
      // Store user data in localStorage
      localStorage.setItem('userToken', idToken);
      localStorage.setItem('userUid', userData.uid);
      localStorage.setItem('userEmail', userData.email);
      localStorage.setItem('userRole', userData.role);
      localStorage.setItem('studentId', userData.studentId); // Store studentId

      navigate('/'); // Redirect to home page
    } catch (err: any) { // Catch any errors from Firebase or backend
      console.error("Login error:", err);
      if (err.code === 'auth/invalid-email' || err.code === 'auth/user-not-found') {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      } else if (err.code === 'auth/wrong-password') {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      } else {
        setError(err.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <div className="login-card-header">
          <h1 className="login-logo">ECT</h1>
          <h2 className="text-white fs-6">Classroom Booking</h2>
        </div>
        <div className="login-card-body">
          <h3 className="login-title">เข้าสู่ระบบ</h3>
          <form onSubmit={handleLogin}>
            {error && <div className="alert alert-danger">{error}</div>} {/* Display error */}
            <div className="input-group mb-3">
              <span className="input-group-text">
                <Envelope color="var(--text-secondary)" />
              </span>
              <input
                type="text"
                className="form-control"
                id="email"
                placeholder="อีเมล"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="input-group mb-4">
              <span className="input-group-text">
                <Lock color="var(--text-secondary)" />
              </span>
              <input
                type="password"
                className="form-control"
                id="password"
                placeholder="รหัสผ่าน"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {/* Removed Login as Admin checkbox as role will be managed by backend/Firestore */}
            <button type="submit" className="btn btn-login">
              เข้าสู่ระบบ
            </button>
          </form>
          <div className="text-center mt-4">
            <p className="text-muted">
              ยังไม่มีบัญชี? <Link to="/register">สมัครสมาชิก</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
