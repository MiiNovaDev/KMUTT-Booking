import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import RoomCard from '../components/RoomCard';
import { getRooms, getBookings } from '../services/api'; // Import API services
import type { Room, Booking } from '../services/mockData'; // Use types
import './AllRoomsPage.css';

const AllRoomsPage: React.FC = () => {
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

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="container all-rooms-container text-center mt-5">
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
        <div className="container all-rooms-container text-center mt-5">
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
      <div className="container all-rooms-container">
        <h1 className="all-rooms-header">ห้องทั้งหมด / All Rooms</h1>
        <div className="row mt-4">
          {rooms.length > 0 ? (
            rooms.map(room => <RoomCard key={room.id} room={room} bookings={bookings} />)
          ) : (
            <p className="text-muted text-center">ไม่พบห้องใดๆ ในระบบ</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllRoomsPage;
