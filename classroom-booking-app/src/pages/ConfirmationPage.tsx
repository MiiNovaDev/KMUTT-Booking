import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom'; // Import useLocation, useNavigate
import Navbar from '../components/Navbar';
import { QrCode } from 'react-bootstrap-icons';
import { getRoomById, addBooking } from '../services/api'; // Import API services
import type { Room } from '../services/mockData'; // Use types
import './ConfirmationPage.css';

const ConfirmationPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract booking details from URL parameters
  const queryParams = new URLSearchParams(location.search);
  const roomId = queryParams.get('roomId');
  const selectedDate = queryParams.get('date');
  const selectedStartTime = queryParams.get('startTime');
  const selectedEndTime = queryParams.get('endTime');

  useEffect(() => {
    async function fetchRoomDetails() {
      if (!roomId) {
        setError('Room ID is missing for booking confirmation.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const fetchedRoom = await getRoomById(roomId);
        setRoom(fetchedRoom);
      } catch (err) {
        console.error('Failed to fetch room details:', err);
        setError('Failed to load room details. Please ensure the backend server is running.');
      } finally {
        setLoading(false);
      }
    }
    fetchRoomDetails();
  }, [roomId]); // Re-fetch if roomId changes

  const handleConfirm = async () => {
    if (!room || !selectedDate || !selectedStartTime || !selectedEndTime) {
      alert("ข้อมูลการจองไม่ครบถ้วน.");
      return;
    }

    // Time validation: ensure end time is after start time
    if (selectedStartTime >= selectedEndTime) {
      alert("เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น.");
      return;
    }

    const userUid = localStorage.getItem('userUid'); // Get user UID from localStorage
    if (!userUid) {
      alert("คุณต้องเข้าสู่ระบบเพื่อทำการจอง.");
      navigate('/login');
      return;
    }

    try {
      const bookingData = {
        roomId: room.id,
        roomName: room.name, // Store room name for easier display
        userId: userUid,
        startTime: new Date(`${selectedDate}T${selectedStartTime}:00`).toISOString(), // ISO string for backend
        endTime: new Date(`${selectedDate}T${selectedEndTime}:00`).toISOString(), // ISO string for backend
        status: 'Upcoming', // Default status
        createdAt: new Date().toISOString(),
      };
      
      await addBooking(bookingData);
      alert(`การจองห้อง ${room.name} สำเร็จ!`);
      navigate('/my-bookings'); // Redirect to My Bookings page
    } catch (err) {
      console.error('Failed to confirm booking:', err);
      alert('เกิดข้อผิดพลาดในการจองห้อง. โปรดลองอีกครั้ง');
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="confirmation-container text-center mt-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">กำลังโหลดข้อมูลห้อง...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Navbar />
        <div className="confirmation-container text-center mt-5">
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!room || !selectedDate || !selectedStartTime || !selectedEndTime) {
    return (
      <div>
        <Navbar />
        <div className="confirmation-container text-center mt-5">
          <div className="alert alert-warning" role="alert">
            ไม่พบข้อมูลการจอง หรือข้อมูลไม่ครบถ้วน.
            <Link to="/booking" className="btn btn-primary mt-3">
              กลับไปหน้าจอง
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const bookingDateTime = new Date(`${selectedDate}T${selectedStartTime}:00`);
  const displayDate = bookingDateTime.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const displayTime = `${selectedStartTime} - ${selectedEndTime} น.`;


  return (
    <div>
      <Navbar />
      <div className="confirmation-container">
        <div className="confirmation-card">
          <h2 className="section-header">ยืนยันการจอง</h2>
          <p className="summary-item">
            <strong>ห้อง:</strong> {room.name}
          </p>
          <p className="summary-item">
            <strong>วันที่:</strong> {displayDate}
          </p>
          <p className="summary-item">
            <strong>เวลา:</strong> {displayTime}
          </p>

          <div className="qr-code-placeholder">
            <QrCode size={50} />
            <br />
            {/* QR code data should eventually include actual booking ID once confirmed */}
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(JSON.stringify({ roomId: room.id, date: selectedDate, startTime: selectedStartTime, endTime: selectedEndTime }))}`} 
              alt="QR Code for Check-in" 
              className="mt-2"
            />
            <p className="text-muted mt-2">สแกนเพื่อเช็คอิน (เมื่อถึงเวลา)</p>
          </div>

          <div className="d-grid gap-2">
            <button className="btn btn-confirm" onClick={handleConfirm}>
              ยืนยันการจอง
            </button>
            <Link to="/booking" className="btn btn-outline-secondary">
              ยกเลิก
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPage;
