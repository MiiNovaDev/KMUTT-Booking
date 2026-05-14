import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Person, Envelope, Lock } from 'react-bootstrap-icons';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { API_BASE_URL } from '../services/api';
import './LoginPage.css';

const RegisterPage: React.FC = () => {
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน!");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const idToken = await user.getIdToken();

      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          studentId: studentId,
          role: 'USER',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed on backend.');
      }

      alert("สมัครสมาชิกสำเร็จ! โปรดเข้าสู่ระบบ");
      navigate('/login');
    } catch (err: any) {
      console.error("Registration error:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError('อีเมลนี้ถูกใช้ไปแล้ว');
      } else if (err.code === 'auth/invalid-email') {
        setError('รูปแบบอีเมลไม่ถูกต้อง');
      } else if (err.code === 'auth/weak-password') {
        setError('รหัสผ่านควรมีอย่างน้อย 6 ตัวอักษร');
      } else {
        setError(err.message || "เกิดข้อผิดพลาดในการสมัครสมาชิก");
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
          <h3 className="login-title">สมัครสมาชิก</h3>
          <form onSubmit={handleRegister}>
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="input-group mb-3">
              <span className="input-group-text">
                <Person color="var(--text-secondary)" />
              </span>
              <input
                type="text"
                name="studentId"
                className="form-control"
                id="studentId"
                placeholder="รหัสนักศึกษา"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
              />
            </div>
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
                autoComplete="email"
                required
              />
            </div>
            <div className="input-group mb-3">
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
                autoComplete="new-password"
                required
              />
            </div>
            <div className="input-group mb-4">
              <span className="input-group-text">
                <Lock color="var(--text-secondary)" />
              </span>
              <input
                type="password"
                name="confirmPassword"
                className="form-control"
                id="confirmPassword"
                placeholder="ยืนยันรหัสผ่าน"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
            <button type="submit" className="btn btn-login">
              สมัครสมาชิก
            </button>
          </form>
          <div className="text-center mt-4">
            <p className="text-muted">
              มีบัญชีอยู่แล้ว? <Link to="/login">เข้าสู่ระบบ</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
