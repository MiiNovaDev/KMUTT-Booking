import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom'; // Import useLocation
import Navbar from '../components/Navbar';
import { getRooms } from '../services/api'; // Import only getRooms
import type { Room } from '../services/mockData'; // Use types
import { PeopleFill, GeoAltFill, AspectRatio, Tools } from 'react-bootstrap-icons';
import './RoomDetailPage.css';

const RoomDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation(); // Hook to access URL parameters
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract booking details from URL parameters
  const queryParams = new URLSearchParams(location.search);
  const selectedDate = queryParams.get('date');
  const selectedStartTime = queryParams.get('startTime');
  const selectedEndTime = queryParams.get('endTime');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const fetchedRooms = await getRooms();
        // Removed getBookings() as it's not directly used here
        const foundRoom = fetchedRooms.find((r: Room) => r.id === id);
        setRoom(foundRoom || null);
      } catch (err) {
        setError('Failed to fetch data. Please ensure the backend server is running.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]); // Re-fetch if ID changes

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="container mt-5 text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading room details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Navbar />
        <div className="container mt-5 text-center">
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div>
        <Navbar />
        <div className="container mt-5">
          <h1 className="text-center section-header">Room Not Found</h1>
          <p className="text-center">The room you are looking for does not exist.</p>
          <div className="text-center">
            <Link to="/booking" className="btn btn-primary mt-3">
              Back to Booking
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Construct link to confirmation page with booking details
  const confirmationLink = `/confirmation?roomId=${room.id}&date=${selectedDate || ''}&startTime=${selectedStartTime || ''}&endTime=${selectedEndTime || ''}`;

  return (
    <div>
      <Navbar />
      <div className="container room-detail-container">
        <h1 className="room-detail-header">{room.name}</h1>

        <div className="row">
          <div className="col-md-8">
            <div className="room-image-container">
              <img src={room.imageUrl} alt={room.name} className="img-fluid" />
            </div>
          </div>
          <div className="col-md-4">
            <div className="room-info-card">
              <h4>ข้อมูลห้อง</h4>
              <div className="room-info-item">
                <PeopleFill className="icon" />
                <span>ความจุ: {room.capacity} ที่นั่ง</span>
              </div>
              <div className="room-info-item">
                <AspectRatio className="icon" />
                <span>ขนาดห้อง: {room.size}</span>
              </div>
              <div className="room-info-item">
                <Tools className="icon" />
                <span>อุปกรณ์: {room.equipment.join(', ')}</span>
              </div>
              <div className="room-info-item">
                <GeoAltFill className="icon" />
                <span>สถานที่: {room.location}</span>
              </div>
              {selectedDate && selectedStartTime && selectedEndTime ? (
                <Link to={confirmationLink} className="btn btn-book-room mt-3">
                  จองห้องนี้
                </Link>
              ) : (
                <Link to="/booking" className="btn btn-book-room mt-3">
                  เลือกวันและเวลาเพื่อจอง
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetailPage;
