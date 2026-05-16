import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { getConfig, updateConfig } from '../services/api';
import './AdminPage.css';

const SystemConfigPage: React.FC = () => {
  const [config, setConfig] = useState({
    autoReleaseMinutes: 15,
    maxBookingDaysAdvance: 14,
    maintenanceMode: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const data = await getConfig();
      setConfig(data);
    } catch (err) {
      console.error('Failed to fetch config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateConfig(config);
      alert('บันทึกการตั้งค่าระบบเรียบร้อยแล้ว');
    } catch (err) {
      console.error('Failed to save config:', err);
      alert('ไม่สามารถบันทึกการตั้งค่าได้');
    } finally {
      setSaving(false);
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
          <p className="mt-2">กำลังโหลดการตั้งค่าระบบ...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="container admin-container">
        <div className="admin-header">
          <h1>System Configuration (Dev Only)</h1>
        </div>

        <div className="card shadow-sm border-0 mt-4">
          <div className="card-body p-4">
            <form onSubmit={handleSave}>
              <div className="mb-4">
                <label className="form-label fw-bold">ระยะเวลาเช็คอินอัตโนมัติ (Auto-release Minutes)</label>
                <div className="input-group">
                  <input 
                    type="number" 
                    className="form-control" 
                    value={config.autoReleaseMinutes}
                    onChange={e => setConfig({...config, autoReleaseMinutes: parseInt(e.target.value)})}
                    min="1"
                    max="60"
                  />
                  <span className="input-group-text">นาที</span>
                </div>
                <div className="form-text">หากนักศึกษาไม่เช็คอินภายในเวลานี้ ระบบจะยกเลิกการจองโดยอัตโนมัติ</div>
              </div>

              <div className="mb-4">
                <label className="form-label fw-bold">ระยะเวลาจองล่วงหน้าสูงสุด (Max Booking Advance Days)</label>
                <div className="input-group">
                  <input 
                    type="number" 
                    className="form-control" 
                    value={config.maxBookingDaysAdvance}
                    onChange={e => setConfig({...config, maxBookingDaysAdvance: parseInt(e.target.value)})}
                    min="1"
                    max="90"
                  />
                  <span className="input-group-text">วัน</span>
                </div>
                <div className="form-text">กำหนดให้นักศึกษาสามารถจองห้องล่วงหน้าได้ไม่เกินกี่วัน</div>
              </div>

              <div className="mb-4">
                <div className="form-check form-switch">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    id="maintenanceSwitch"
                    checked={config.maintenanceMode}
                    onChange={e => setConfig({...config, maintenanceMode: e.target.checked})}
                  />
                  <label className="form-check-label fw-bold" htmlFor="maintenanceSwitch">
                    โหมดปิดปรับปรุง (Maintenance Mode)
                  </label>
                </div>
                <div className="form-text text-danger">เมื่อเปิดโหมดนี้ User และ Admin จะไม่สามารถจองห้องได้</div>
              </div>

              <hr />
              
              <div className="d-flex gap-2">
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-outline-secondary"
                  onClick={fetchConfig}
                  disabled={saving}
                >
                  คืนค่า (Reset)
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemConfigPage;
