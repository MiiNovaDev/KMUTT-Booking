import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { getStats } from '../services/api';
import './AdminPage.css'; // Reusing admin styles
import { Link } from 'react-router-dom';

const DevDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="container admin-container text-center mt-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">กำลังโหลดข้อมูลสถานะระบบ...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="container admin-container">
        <div className="admin-header">
          <h1>Dev Dashboard (System Health)</h1>
          <div className="d-flex gap-2">
            <Link to="/dev/config" className="btn btn-outline-dark">Settings (ตั้งค่าระบบ)</Link>
            <button className="btn btn-outline-primary" onClick={fetchStats}>Refresh</button>
          </div>
        </div>

        <div className="row mt-4">
          <div className="col-md-4 mb-4">
            <div className="card shadow-sm border-0">
              <div className="card-body">
                <h5 className="card-title text-muted">สรุปจำนวน (Totals)</h5>
                <ul className="list-group list-group-flush">
                  <li className="list-group-item d-flex justify-content-between">
                    ห้องทั้งหมด <span>{stats?.totalRooms}</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between">
                    การจองทั้งหมด <span>{stats?.totalBookings}</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between">
                    ผู้ใช้ทั้งหมด <span>{stats?.totalUsers}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="col-md-4 mb-4">
            <div className="card shadow-sm border-0">
              <div className="card-body">
                <h5 className="card-title text-muted">สถานะห้อง (Room Status)</h5>
                <div className="d-flex flex-column gap-2 mt-3">
                  <div className="progress" style={{ height: '25px' }}>
                    <div 
                      className="progress-bar bg-success" 
                      role="progressbar" 
                      style={{ width: `${(stats?.roomStatus?.available / stats?.totalRooms) * 100}%` }}
                    >
                      ว่าง ({stats?.roomStatus?.available})
                    </div>
                    <div 
                      className="progress-bar bg-danger" 
                      role="progressbar" 
                      style={{ width: `${(stats?.roomStatus?.unavailable / stats?.totalRooms) * 100}%` }}
                    >
                      ไม่ว่าง ({stats?.roomStatus?.unavailable})
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4 mb-4">
            <div className="card shadow-sm border-0">
              <div className="card-body">
                <h5 className="card-title text-muted">บทบาท (User Roles)</h5>
                <div className="mt-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span>Developer</span> <span>{stats?.userRoles?.dev}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-1 text-danger">
                    <span>ADMIN</span> <span>{stats?.userRoles?.admin}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-1 text-primary">
                    <span>USER</span> <span>{stats?.userRoles?.user}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card mt-4 shadow-sm border-0">
          <div className="card-header bg-dark text-white">System Logs (Simulated)</div>
          <div className="card-body bg-light">
            <pre style={{ fontSize: '0.85rem' }}>
              {`[${new Date().toISOString()}] INFO: Server started on port 5001\n` +
               `[${new Date().toISOString()}] INFO: Firebase Admin SDK initialized\n` +
               `[${new Date().toISOString()}] SUCCESS: Auto-release check completed\n` +
               `[${new Date().toISOString()}] INFO: Dev accessed stats API`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevDashboardPage;
