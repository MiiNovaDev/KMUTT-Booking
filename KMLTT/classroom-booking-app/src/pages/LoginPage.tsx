import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Envelope, Lock } from 'react-bootstrap-icons';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from "firebase/auth";
import { API_BASE_URL } from '../services/api';
import './LoginPage.css';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const idToken = await user.getIdToken();

      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed on backend.');
      }

      const userData = await response.json();
      
      localStorage.setItem('userToken', idToken);
      localStorage.setItem('userUid', userData.uid);
      localStorage.setItem('userEmail', userData.email);
      localStorage.setItem('userRole', userData.role);
      localStorage.setItem('studentId', userData.studentId);

      navigate('/');
    } catch (err: any) {
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
          <div className="d-flex align-items-center justify-content-center gap-2 mb-1">
            <img src={`/logo.svg?v=${new Date().getTime()}`} alt="ECT Logo" width="40" height="40" />
            <h1 className="login-logo mb-0">ECT</h1>
          </div>
          <h2 className="text-white fs-6">Classroom Booking</h2>
        </div>
        <div className="login-card-body">
          <h3 className="login-title">เข้าสู่ระบบ</h3>
          <form onSubmit={handleLogin}>
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="input-group mb-3">
              <span className="input-group-text">
                <Envelope color="var(--text-secondary)" />
              </span>
              <input
                type="email"
                name="email"
                className="form-control"
                id="email"
                placeholder="อีเมล"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username email"
                required
              />
            </div>
            <div className="input-group mb-4">
              <span className="input-group-text">
                <Lock color="var(--text-secondary)" />
              </span>
              <input
                type="password"
                name="password"
                className="form-control"
                id="password"
                placeholder="รหัสผ่าน"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
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
