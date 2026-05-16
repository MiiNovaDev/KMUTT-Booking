import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import RoomCard from '../components/RoomCard';
import { BuildingsFill, GearFill } from 'react-bootstrap-icons';
import { subscribeToRooms, subscribeToBookings } from '../services/api'; // Import subscriptions
import type { Room, Booking } from '../services/mockData'; // Use types
import './HomePage.css';
import { getActiveUserContext } from '../utils/authUtils';

const HomePage: React.FC = () => {
  const { role, uid } = getActiveUserContext();
  const isPrivileged = role === 'ADMIN' || role === 'DEV';
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    
    // Subscribe to real-time rooms
    const unsubscribeRooms = subscribeToRooms((fetchedRooms) => {
      setRooms(fetchedRooms);
      setLoading(false);
    });

    // Subscribe to real-time bookings - ONLY RECENT ones for speed
    const unsubscribeBookings = subscribeToBookings((fetchedBookings) => {
      setBookings(fetchedBookings);
    }, { onlyRecent: true });

    // Cleanup on unmount
    return () => {
      unsubscribeRooms();
      unsubscribeBookings();
    };
  }, []);

  const availableRooms = rooms.filter(room => room.status === 'Available');

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="container home-container text-center mt-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading real-time data...</p>
        </div>
      </div>
    );
  }

  const userUpcomingBookingsCount = bookings.filter(
    b => b.status === 'Upcoming' && b.userId === uid
  ).length;

  return (
    <div>
      <Navbar />
      <div className="container home-container">
        <div className="dashboard-header">
          <h1>Welcome to ECT Booking</h1>
          <Link to="/booking" className="btn btn-book-main">
            จองห้องเรียน
          </Link>
        </div>

        <div className="quick-actions-card">
          <h2>Quick Actions</h2>
          <div className="quick-actions-grid">
            <Link to="/all-rooms" className="quick-action-btn">
              <BuildingsFill className="icon" />
              <span>ดูห้องทั้งหมด</span>
            </Link>
            {isPrivileged && (
              <Link to="/admin" className="quick-action-btn">
                <GearFill className="icon" />
                <span>สำหรับผู้ดูแล</span>
              </Link>
            )}
          </div>
        </div>

        <section id="available-rooms" className="mt-4">
          <h2 className="section-header">ห้องว่างวันนี้</h2>
          <div className="row">
            {availableRooms.length > 0 ? (
              availableRooms.map(room => (
                <RoomCard key={room.id} room={room} bookings={bookings} />
              ))
            ) : (
              <p className="text-muted">ยังไม่มีห้องว่างสำหรับวันนี้</p>
            )}
          </div>
        </section>

        <section className="mt-5">
          <h2 className="section-header">ห้องที่กำลังจะถูกจอง</h2>
          <div className="row">
            <p className="text-muted">
              คุณมี {userUpcomingBookingsCount} รายการจองที่กำลังจะมาถึง
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomePage;
