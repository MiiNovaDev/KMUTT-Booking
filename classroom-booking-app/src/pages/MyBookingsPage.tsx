import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { getRooms, getBookings, deleteBooking } from '../services/api'; // Import API services, including deleteBooking
import type { Room, Booking } from '../services/mockData'; // Use types
import './MyBookingsPage.css';
import { getBookingDisplayInfo, sortBookings } from '../utils/bookingUtils'; // Import from utility file

const MyBookingsPage: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookingsData = async () => {
    try {
      setLoading(true);
      const fetchedRooms = await getRooms();
      const fetchedBookings = await getBookings();
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
  }, []); // Fetch data only once on mount

  const getRoomName = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId); // Use fetched rooms
    return room ? room.name : 'Unknown Room';
  };

  const formatDate = (dateString: Date) => { // Expect Date object from API
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTimeRange = (startString: Date, endString: Date) => { // Expect Date objects
    const start = new Date(startString);
    const end = new Date(endString);
    const startTime = start.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    const endTime = end.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    return `${startTime} - ${endTime}`;
  };

  const handleEdit = (bookingId: string) => {
    // For now, only alert that it's not implemented. Full implementation would involve a modal.
    alert(`ฟังก์ชันแก้ไขการจอง ${bookingId} ยังไม่เปิดใช้งาน`);
  };

  const handleCancelBooking = async (bookingId: string) => {
    const bookingToCancel = bookings.find(b => b.id === bookingId);
    const roomName = getRoomName(bookingToCancel?.roomId || '');
    if (window.confirm(`คุณต้องการยกเลิกการจองห้อง ${roomName} ใช่หรือไม่?`)) {
      try {
        await deleteBooking(bookingId); // Call the API to delete the booking
        alert(`การจองห้อง ${roomName} (ID: ${bookingId}) ถูกยกเลิกเรียบร้อยแล้ว`);
        fetchBookingsData(); // Re-fetch bookings after cancellation
      } catch (err) {
        console.error('Failed to cancel booking:', err);
        alert(`ไม่สามารถยกเลิกการจองห้อง ${roomName} (ID: ${bookingId}) ได้`);
      }
    } else {
      console.log(`Cancellation of booking ${bookingId} aborted.`);
    }
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
        </div>
      </div>
    );
  }

  const visibleBookings = bookings.filter(booking => getBookingDisplayInfo(booking).isVisible);
  const sortedVisibleBookings = sortBookings(visibleBookings);

  return (
    <div>
      <Navbar />
      <div className="container my-bookings-container">
        <h1 className="my-bookings-header">ห้องของฉัน / My Bookings</h1>

        <div className="row">
          {sortedVisibleBookings.length > 0 ? ( // Use sorted and filtered bookings
            sortedVisibleBookings.map(booking => {
              const { displayStatus, className } = getBookingDisplayInfo(booking);
              const currentTime = new Date();
              const bookingStartTime = new Date(booking.startTime);
              const isPastStartTime = bookingStartTime < currentTime; // New variable to check if start time has passed

              return (
                <div key={booking.id} className="col-md-6 col-lg-4">
                  <div className="booking-card">
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

                    {booking.status === 'Upcoming' && !isPastStartTime && ( // Show QR code only if upcoming and start time has not passed
                      <div className="booking-qr-code-container">
                        <p className="text-muted mb-2">แสดง QR Code สำหรับเช็คอิน</p>
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(JSON.stringify({ bookingId: booking.id, roomId: booking.roomId }))}`} 
                          alt={`QR Code for booking ${booking.id}`} 
                        />
                      </div>
                    )}

                    <div className="booking-actions">
                      {booking.status === 'Upcoming' && !isPastStartTime && ( // Show actions only if upcoming and start time has not passed
                        <>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleCancelBooking(booking.id)}>ยกเลิก</button>
                          <button className="btn btn-sm btn-outline-secondary" onClick={() => handleEdit(booking.id)}>แก้ไข</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center text-muted">คุณยังไม่มีรายการจอง</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyBookingsPage;
