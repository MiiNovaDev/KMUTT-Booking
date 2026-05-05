import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { getRooms, getBookings, deleteBooking } from '../services/api'; 
import type { Room, Booking } from '../services/mockData'; 
import './MyBookingsPage.css';
import { getBookingDisplayInfo, sortBookings } from '../utils/bookingUtils'; 
import { CalendarPlus } from 'react-bootstrap-icons';

const MyBookingsPage: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  const fetchBookingsData = async () => {
    try {
      setLoading(true);
      const userUid = localStorage.getItem('userUid');
      const fetchedRooms = await getRooms();
      const fetchedBookings = await getBookings(userUid || undefined);
      setRooms(fetchedRooms);
      setBookings(fetchedBookings);
    } catch (err) {
      setError('Failed to fetch data. Please ensure the backend server is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookingsData();
  }, []);

  const getRoomName = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    return room ? room.name : 'Unknown Room';
  };

  const formatDate = (dateString: Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTimeRange = (startString: Date, endString: Date) => {
    const start = new Date(startString);
    const end = new Date(endString);
    const startTime = start.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    const endTime = end.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    return `${startTime} - ${endTime}`;
  };

  const handleCancelBooking = async (bookingId: string) => {
    const bookingToCancel = bookings.find(b => b.id === bookingId);
    const roomName = getRoomName(bookingToCancel?.roomId || '');
    if (window.confirm(`คุณต้องการยกเลิกการจองห้อง ${roomName} ใช่หรือไม่?`)) {
      try {
        await deleteBooking(bookingId);
        alert(`การจองห้อง ${roomName} ถูกยกเลิกเรียบร้อยแล้ว`);
        fetchBookingsData();
      } catch (err) {
        console.error('Failed to cancel booking:', err);
        alert(`ไม่สามารถยกเลิกการจองห้องได้`);
      }
    }
  };

  const generateGoogleCalendarUrl = (booking: Booking) => {
    const roomName = getRoomName(booking.roomId);
    const start = new Date(booking.startTime).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const end = new Date(booking.endTime).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const details = `Booking for ${roomName}. Student ID: ${booking.studentId || 'N/A'}`;
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("จองห้องเรียน: " + roomName)}&dates=${start}/${end}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(roomName)}&sf=true&output=xml`;
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="container my-bookings-container text-center mt-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Navbar />
        <div className="container my-bookings-container text-center mt-5">
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
          <button className="btn btn-primary mt-3" onClick={() => fetchBookingsData()}>
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  const currentTime = new Date();
  
  // Logic: Split bookings into Upcoming and Past
  const filteredBookings = bookings.filter(booking => getBookingDisplayInfo(booking).isVisible);
  
  const upcomingBookings = sortBookings(filteredBookings.filter(b => new Date(b.endTime) >= currentTime));
  const pastBookings = sortBookings(filteredBookings.filter(b => new Date(b.endTime) < currentTime)).reverse(); // Show latest past bookings first

  const displayBookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

  return (
    <div>
      <Navbar />
      <div className="container my-bookings-container">
        <h1 className="my-bookings-header">ห้องของฉัน / My Bookings</h1>

        {/* Tab Navigation */}
        <div className="booking-tabs mb-4">
          <button 
            className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            รายการจองที่กำลังจะมาถึง ({upcomingBookings.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'past' ? 'active' : ''}`}
            onClick={() => setActiveTab('past')}
          >
            ประวัติการจอง ({pastBookings.length})
          </button>
        </div>

        <div className="row">
          {displayBookings.length > 0 ? (
            displayBookings.map(booking => {
              const { displayStatus, className } = getBookingDisplayInfo(booking);
              const bookingStartTime = new Date(booking.startTime);
              const isPastStartTime = bookingStartTime < currentTime;

              return (
                <div key={booking.id} className="col-md-6 col-lg-4">
                  <div className={`booking-card ${activeTab === 'past' ? 'past-card' : ''}`}>
                    <h5 className="room-name">{getRoomName(booking.roomId)}</h5>
                    <div className="booking-details">
                      <p className="mb-0">
                        <strong>วันที่:</strong> {formatDate(new Date(booking.startTime))}
                      </p>
                      <p className="mb-0">
                        <strong>เวลา:</strong> {formatTimeRange(new Date(booking.startTime), new Date(booking.endTime))}
                      </p>
                    </div>
                    <div className="booking-status mt-2">
                      สถานะ: {' '}
                      <span className={className}>
                        {displayStatus}
                      </span>
                    </div>

                    {booking.status === 'Upcoming' && !isPastStartTime && (
                      <div className="booking-qr-code-container">
                        <p className="text-muted mb-2">แสดง QR Code สำหรับเช็คอิน</p>
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(JSON.stringify({ bookingId: booking.id, roomId: booking.roomId }))}`} 
                          alt={`QR Code for booking ${booking.id}`} 
                        />
                      </div>
                    )}

                    <div className="booking-actions">
                      {booking.status === 'Upcoming' && !isPastStartTime && (
                        <>
                          <a 
                            href={generateGoogleCalendarUrl(booking)} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="btn btn-sm btn-outline-primary me-2"
                            title="Add to Google Calendar"
                          >
                            <CalendarPlus className="me-1" /> เพิ่มในปฏิทิน
                          </a>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleCancelBooking(booking.id)}>ยกเลิก</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center text-muted py-5">
              {activeTab === 'upcoming' ? 'คุณยังไม่มีรายการจองที่กำลังจะมาถึง' : 'คุณยังไม่มีประวัติการจอง'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyBookingsPage;
