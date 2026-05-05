import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import { Person, Envelope, Lock } from 'react-bootstrap-icons';
import { auth } from '../firebase'; // Import Firebase auth instance
import { createUserWithEmailAndPassword } from "firebase/auth";
import { API_BASE_URL } from '../services/api';
import './LoginPage.css'; // Reuse login page styles for now

const RegisterPage: React.FC = () => {
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null); // State for error messages
  const navigate = useNavigate(); // Hook for navigation

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors

    if (password !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน!");
      return;
    }

    try {
      // Create user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Get Firebase ID token
      const idToken = await user.getIdToken();

      // Send additional user details (studentId, role) to your backend
      // Backend will verify ID token and store user details in Firestore
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}` // Send Firebase ID token for verification
        },
        body: JSON.stringify({
          uid: user.uid, // Send UID to backend
          email: user.email,
          studentId: studentId,
          role: 'USER', // Default role for new registrations
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed on backend.');
      }

      alert("สมัครสมาชิกสำเร็จ! โปรดเข้าสู่ระบบ");
      navigate('/login'); // Redirect to login page
    } catch (err: any) { // Catch any errors from Firebase or backend
      console.error("Registration error:", err);
      // Firebase auth errors have a 'code' property
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
          <h1 className="login-logo">ECT</h1>
          <h2 className="text-white fs-6">Classroom Booking</h2>
        </div>
        <div className="login-card-body">
          <h3 className="login-title">สมัครสมาชิก</h3>
          <form onSubmit={handleRegister}>
            {error && <div className="alert alert-danger">{error}</div>} {/* Display error */}
            <div className="input-group mb-3">
              <span className="input-group-text">
                <Person color="var(--text-secondary)" />
              </span>
              <input
                type="text"
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
                className="form-control"
                id="email"
                placeholder="อีเมล"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="input-group mb-3">
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
            <div className="input-group mb-4">
              <span className="input-group-text">
                <Lock color="var(--text-secondary)" />
              </span>
              <input
                type="password"
                className="form-control"
                id="confirmPassword"
                placeholder="ยืนยันรหัสผ่าน"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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