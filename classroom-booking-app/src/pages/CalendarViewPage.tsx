import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { getRooms, getBookings } from '../services/api'; // Import API services
import type { Room, Booking } from '../services/mockData'; // Use types
import { ChevronLeft, ChevronRight } from 'react-bootstrap-icons';
import './CalendarViewPage.css';
import { getBookingDisplayInfo, sortBookings } from '../utils/bookingUtils'; // Import from utility file

const CalendarViewPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
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
    }
    fetchData();
  }, []); // Fetch data only once on mount

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    // const firstDay = new Date(year, month, 1); // Removed: unused
    const lastDay = new Date(year, month + 1, 0);
    const numDays = lastDay.getDate();

    const days = [];
    for (let i = 1; i <= numDays; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const daysInMonth = getDaysInMonth(currentDate);

  const getBookingsForDay = (day: Date) => {
    // Filter bookings for the specific day
    let bookingsOnDay = bookings.filter(booking => {
      const bookingDate = new Date(booking.startTime);
      return (
        bookingDate.getDate() === day.getDate() &&
        bookingDate.getMonth() === day.getMonth() &&
        bookingDate.getFullYear() === day.getFullYear()
      );
    });

    // Apply visibility filter from bookingUtils
    bookingsOnDay = bookingsOnDay.filter(booking => getBookingDisplayInfo(booking).isVisible);

    // Further filter to only include 'Upcoming' and 'In Use' based on displayStatus
    // This implements "แสดงยอดแค่ upcoming พอ In use กับ ใช้เสร็จไม่ต้องนับ"
    bookingsOnDay = bookingsOnDay.filter(booking => {
        const { displayStatus } = getBookingDisplayInfo(booking);
        return displayStatus === 'กำลังจะใช้งาน' || displayStatus === 'กำลังใช้งาน';
    });

    // Sort the filtered bookings
    return sortBookings(bookingsOnDay);
  };

  const getRoomName = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId); // Use fetched rooms
    return room ? room.name : 'Unknown Room';
  };

  const formatTime = (dateString: Date) => { // Expect Date object from API
    const date = new Date(dateString);
    return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  };

  const goToPreviousMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const weekDays = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0 for Sunday, 1 for Monday

  const emptyCells = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="container calendar-container text-center mt-5">
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
        <div className="container calendar-container text-center mt-5">
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="container calendar-container">
        <h1 className="section-header">ตารางห้อง / Calendar View</h1>

        <div className="calendar-navigation">
          <button className="btn btn-primary" onClick={goToPreviousMonth}>
            <ChevronLeft /> เดือนก่อนหน้า
          </button>
          <h2>
            {currentDate.toLocaleDateString('th-TH', {
              month: 'long',
              year: 'numeric',
            })}
          </h2>
          <button className="btn btn-primary" onClick={goToNextMonth}>
            เดือนถัดไป <ChevronRight />
          </button>
        </div>

        <div className="calendar-grid">
          {weekDays.map(day => (
            <div key={day} className="calendar-day-header">
              {day}
            </div>
          ))}

          {emptyCells.map(i => (
            <div key={`empty-${i}`} className="calendar-day"></div>
          ))}

          {daysInMonth.map((day) => { // Removed _index
            const bookingsToday = getBookingsForDay(day);
            const isToday =
              day.getDate() === new Date().getDate() &&
              day.getMonth() === new Date().getMonth() &&
              day.getFullYear() === new Date().getFullYear();

            return (
              <div
                key={day.toISOString()}
                className={`calendar-day ${isToday ? 'today' : ''}`}
              >
                <div className="calendar-day-number">{day.getDate()}</div>
                {bookingsToday.map(booking => {
                    const { displayStatus, className } = getBookingDisplayInfo(booking);
                    return (
                        <div key={booking.id} className={`calendar-booking-item ${className}`}>
                            {getRoomName(booking.roomId)} ({formatTime(booking.startTime)} - {formatTime(booking.endTime)})
                            <br />
                            <small>{displayStatus}</small>
                        </div>
                    );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarViewPage;
