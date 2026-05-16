import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import type { User } from '../services/mockData';
import { getUsers, updateUserRole } from '../services/api';
import './AdminPage.css'; // Reusing admin styles
import { useNavigate } from 'react-router-dom';

const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const currentUserRole = localStorage.getItem('userRole');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const fetchedUsers = await getUsers();
      
      // Sort: DEV first, then ADMIN, then USER
      const sortedUsers = [...fetchedUsers].sort((a, b) => {
        const roleOrder: { [key: string]: number } = { 'DEV': 0, 'ADMIN': 1, 'USER': 2 };
        return (roleOrder[a.role] ?? 99) - (roleOrder[b.role] ?? 99);
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

  const handleImpersonate = (user: User) => {
    const impersonationData = {
      uid: user.uid,
      role: user.role,
      studentId: user.studentId
    };
    sessionStorage.setItem('impersonation', JSON.stringify(impersonationData));
    alert(`กำลังสวมสิทธิ์เป็น ${user.studentId}`);
    navigate('/');
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

  const getBadgeClass = (role: string) => {
    switch (role) {
      case 'DEV': return 'bg-dark';
      case 'ADMIN': return 'bg-danger';
      default: return 'bg-primary';
    }
  };

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
                {currentUserRole === 'DEV' && <th>Dev Actions</th>}
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.uid}>
                  <td>{user.studentId}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`badge ${getBadgeClass(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <select 
                      className="form-select form-select-sm w-auto"
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.uid, e.target.value)}
                      disabled={user.role === 'DEV'}
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                      {user.role === 'DEV' && <option value="DEV">DEV</option>}
                    </select>
                  </td>
                  {currentUserRole === 'DEV' && (
                    <td>
                      {user.role !== 'DEV' && (
                        <button 
                          className="btn btn-sm btn-outline-info"
                          onClick={() => handleImpersonate(user)}
                        >
                          View as User
                        </button>
                      )}
                    </td>
                  )}
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
