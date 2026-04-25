import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '../components/Navbar';
import RoomCard from '../components/RoomCard';
import { CalendarDate, Clock, People, BuildingsFill } from 'react-bootstrap-icons';
import { getRooms, getBookings } from '../services/api'; // Import API services
import type { Room, Booking } from '../services/mockData'; // Use types
import './BookingPage.css';

const BookingPage: React.FC = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [capacity, setCapacity] = useState(1);
  const [roomType, setRoomType] = useState('All');

  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeError, setTimeError] = useState<string | null>(null); // New state for time validation error
  const [dateError, setDateError] = useState<string | null>(null); // New state for date validation error
  const [pastTimeError, setPastTimeError] = useState<string | null>(null); // New state for past time validation error

  // Calculate today's date and max booking date (14 days from today)
  const today = new Date();
  const todayISO = today.toISOString().split('T')[0]; // Format YYYY-MM-DD
  const maxBookingDate = new Date();
  maxBookingDate.setDate(today.getDate() + 14);
  const maxBookingDateISO = maxBookingDate.toISOString().split('T')[0]; // Format YYYY-MM-DD


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

  // Validate start and end times
  useEffect(() => {
    if (startTime && endTime) {
      if (startTime >= endTime) {
        setTimeError('เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น');
      } else {
        setTimeError(null);
      }
    }
  }, [startTime, endTime]);

  // Validate selected date against max booking date
  useEffect(() => {
    if (date) {
      const selectedDateObj = new Date(date);
      if (selectedDateObj > new Date(maxBookingDate.getFullYear(), maxBookingDate.getMonth(), maxBookingDate.getDate())) {
        setDateError(`ไม่สามารถจองล่วงหน้าเกิน ${maxBookingDate.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}`);
      } else {
        setDateError(null);
      }
    }
  }, [date, maxBookingDate]); // Depend on date and maxBookingDate

  // Validate selected time for today's date
  useEffect(() => {
    if (date === todayISO && startTime) {
      const selectedDateTime = new Date(`${date}T${startTime}:00`);
      if (selectedDateTime < new Date()) {
        setPastTimeError('ไม่สามารถจองเวลาที่ผ่านมาได้');
      } else {
        setPastTimeError(null);
      }
    } else if (date !== todayISO) {
        setPastTimeError(null); // Clear pastTimeError if not today's date
    }
  }, [date, startTime, todayISO]); // Depend on date, startTime, and todayISO

  const getDynamicTimeOptions = (currentDate: string) => {
    const allTimeOptions = Array.from({ length: 11 }, (_, i) => {
      const hour = i + 8;
      return `${hour.toString().padStart(2, '0')}:00`;
    });

    if (currentDate === todayISO) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      const futureTimeOptions = allTimeOptions.filter(time => {
        const hour = parseInt(time.split(':')[0], 10);
        const minute = parseInt(time.split(':')[1], 10);
        return hour > currentHour || (hour === currentHour && minute > currentMinute);
      });
      return futureTimeOptions;
    }
    return allTimeOptions;
  };

  const dynamicTimeOptions = useMemo(() => getDynamicTimeOptions(date), [date, todayISO]);

  // Adjust startTime if the selected date changes to today and the current startTime is in the past
  // Or reset startTime/endTime to defaults if changing to a future date to avoid past time restrictions
  useEffect(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    if (date === todayISO) {
      const selectedStartTimeAsDate = new Date(`${date}T${startTime}:00`);
      
      // If selected startTime is in the past for today's date
      if (selectedStartTimeAsDate < now) {
        const nextAvailableTime = dynamicTimeOptions.find(time => {
          const hour = parseInt(time.split(':')[0], 10);
          const minute = parseInt(time.split(':')[1], 10);
          return hour > currentHour || (hour === currentHour && minute > currentMinute);
        });

        if (nextAvailableTime) {
          setStartTime(nextAvailableTime);
          // Adjust endTime to be at least one hour after the new startTime
          const newSelectedStartTimeHour = parseInt(nextAvailableTime.split(':')[0], 10);
          const newSelectedEndTimeHour = newSelectedStartTimeHour + 1;
          const newEndTime = `${newSelectedEndTimeHour.toString().padStart(2, '0')}:00`;
          // Only adjust if current endTime is before or same as new startTime or if it becomes invalid
          if (parseInt(endTime.split(':')[0], 10) <= newSelectedStartTimeHour || parseInt(endTime.split(':')[0], 10) < newSelectedEndTimeHour) {
              setEndTime(newEndTime);
          }
        } else {
          // If no future times available for today, set a default or show error
          // Note: Setting to 09:00 will likely trigger pastTimeError, but it's a fallback
          setStartTime('09:00'); 
          setEndTime('10:00');
        }
      }
    } else {
      // If date is not today, ensure startTime/endTime are not restricted by current time
      // Keep existing selection, but clear pastTimeError (already handled in other useEffect)
      // Optionally reset to default if the user wants
      // setStartTime('09:00'); 
      // setEndTime('10:00');
    }
  }, [date, todayISO, startTime, endTime, dynamicTimeOptions]);


  const roomTypes = useMemo(() => 
    ['All', ...Array.from(new Set(rooms.map(r => r.type)))]
  , [rooms]); // Depend on fetched rooms
  
  const filteredRooms = useMemo(() => {
    if (timeError || dateError || pastTimeError) { // Do not filter if there's any validation error
      return [];
    }

    const requestedStartTime = new Date(`${date}T${startTime}:00`);
    const requestedEndTime = new Date(`${date}T${endTime}:00`);

    return rooms.filter(room => { // Use fetched rooms
      // Filter 1: Basic properties (Status, Type, Capacity)
      if (room.status === 'Unavailable') return false;
      const typeMatch = roomType === 'All' || room.type === roomType;
      const capacityMatch = room.capacity >= (capacity || 1);
      if (!typeMatch || !capacityMatch) return false;

      // Filter 2: Check for booking conflicts
      const hasConflict = bookings.some(booking => { // Use fetched bookings
        if (booking.roomId !== room.id) return false;
        
        const bookingStartTime = new Date(booking.startTime);
        const bookingEndTime = new Date(booking.endTime);

        const isOverlapping = requestedStartTime < bookingEndTime && requestedEndTime > bookingStartTime;
        
        return isOverlapping;
      });

      return !hasConflict;
    });
  }, [date, startTime, endTime, capacity, roomType, rooms, bookings, timeError, dateError, pastTimeError]); // Depend on all filter states and fetched data, including new pastTimeError

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="container booking-container text-center mt-5">
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
        <div className="container booking-container text-center mt-5">
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
      <div className="container booking-container">
        <h1 className="section-header">จองห้องเรียน / Book a Classroom</h1>

        <div className="card filter-card">
          <h3>ตัวกรอง</h3>
          <form className="row g-3 align-items-end">
            <div className="col-md-3">
              <label htmlFor="date" className="form-label">วันที่</label>
              <div className="input-group">
                <span className="input-group-text"><CalendarDate /></span>
                <input 
                  type="date" 
                  className="form-control" 
                  id="date" 
                  value={date} 
                  onChange={e => setDate(e.target.value)} 
                  min={todayISO} 
                  max={maxBookingDateISO} // Set max attribute here
                />
              </div>
            </div>
            <div className="col-md-2">
              <label htmlFor="startTime" className="form-label">ตั้งแต่</label>
              <div className="input-group">
                <span className="input-group-text"><Clock /></span>
                <select id="startTime" className="form-select" value={startTime} onChange={e => setStartTime(e.target.value)}>
                  {dynamicTimeOptions.map(time => <option key={time} value={time}>{time}</option>)}
                </select>
              </div>
            </div>
            <div className="col-md-2">
              <label htmlFor="endTime" className="form-label">ถึง</label>
              <div className="input-group">
                <span className="input-group-text"><Clock /></span>
                <select id="endTime" className="form-select" value={endTime} onChange={e => setEndTime(e.target.value)}>
                  {dynamicTimeOptions.map(time => <option key={time} value={time}>{time}</option>)}
                </select>
              </div>
            </div>
            <div className="col-md-2">
              <label htmlFor="capacity" className="form-label">จำนวนคน (ขั้นต่ำ)</label>
              <div className="input-group">
                <span className="input-group-text"><People /></span>
                <input type="number" className="form-control" id="capacity" min="1" value={capacity} onChange={e => setCapacity(parseInt(e.target.value, 10))} />
              </div>
            </div>
            <div className="col-md-3">
              <label htmlFor="roomType" className="form-label">ประเภทห้อง</label>
              <div className="input-group">
                <span className="input-group-text"><BuildingsFill /></span>
                <select id="roomType" className="form-select" value={roomType} onChange={e => setRoomType(e.target.value)}>
                  {roomTypes.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
            </div>
          </form>
          {timeError && <div className="alert alert-danger mt-3">{timeError}</div>} {/* Display time validation error */}
          {dateError && <div className="alert alert-danger mt-3">{dateError}</div>} {/* Display date validation error */}
          {pastTimeError && <div className="alert alert-danger mt-3">{pastTimeError}</div>} {/* Display past time validation error */}
        </div>

        <div className="mt-4">
          <h3 className="section-header">ผลการค้นหา</h3>
          <div className="row">
            {filteredRooms.length > 0 ? (
              filteredRooms.map(room => (
                <RoomCard 
                  key={room.id} 
                  room={room} 
                  selectedDate={date}
                  selectedStartTime={startTime}
                  selectedEndTime={endTime}
                  bookings={bookings} // Pass fetched bookings
                />
              ))
            ) : (
              <p className="text-muted">ไม่พบห้องที่ตรงกับเงื่อนไข</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
