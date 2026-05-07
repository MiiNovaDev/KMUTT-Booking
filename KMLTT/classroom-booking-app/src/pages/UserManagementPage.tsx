import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import type { User } from '../services/mockData';
import { getUsers, updateUserRole } from '../services/api';
import './AdminPage.css'; // Reusing admin styles

const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const fetchedUsers = await getUsers();
      
      // Sort: ADMIN first, then USER
      const sortedUsers = [...fetchedUsers].sort((a, b) => {
        if (a.role === 'ADMIN' && b.role !== 'ADMIN') return -1;
        if (a.role !== 'ADMIN' && b.role === 'ADMIN') return 1;
        return 0;
      });
      
      setUsers(sortedUsers);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('ไม่สามารถโหลดข้อมูลผู้ใช้งานได้');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (uid: string, newRole: string) => {
    try {
      await updateUserRole(uid, newRole);
      alert('อัปเดตสิทธิ์ผู้ใช้งานสำเร็จ');
      fetchUsers(); // Refresh and re-sort
    } catch (err) {
      console.error('Failed to update role:', err);
      alert('ไม่สามารถอัปเดตสิทธิ์ได้');
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
          <p className="mt-2">กำลังโหลดข้อมูลผู้ใช้งาน...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="container admin-container">
        <div className="admin-header">
          <h1>จัดการสมาชิก (User Management)</h1>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="table-responsive room-table mt-4">
          <table className="table table-striped table-hover">
            <thead className="thead-light">
              <tr>
                <th>รหัสนักศึกษา</th>
                <th>อีเมล</th>
                <th>สิทธิ์ปัจจุบัน</th>
                <th>เปลี่ยนสิทธิ์</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.uid}>
                  <td>{user.studentId}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`badge ${user.role === 'ADMIN' ? 'bg-danger' : 'bg-primary'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <select 
                      className="form-select form-select-sm w-auto"
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.uid, e.target.value)}
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagementPage;
