import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getRooms } from '../services/api';
import type { Room } from '../services/mockData';
import { PeopleFill, GeoAltFill, AspectRatio, Tools } from 'react-bootstrap-icons';
import './RoomDetailPage.css';

// Declare pannellum for TypeScript
declare global {
  interface Window {
    pannellum: any;
  }
}

const PannellumViewer: React.FC<{ imageUrl: string }> = ({ imageUrl }) => {
  const viewerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewerRef.current && window.pannellum) {
      const viewer = window.pannellum.viewer(viewerRef.current, {
        type: 'equirectangular',
        panorama: imageUrl,
        autoLoad: true,
        compass: true,
      });

      return () => {
        viewer.destroy();
      };
    }
  }, [imageUrl]);

  return (
    <div 
      ref={viewerRef} 
      style={{ width: '100%', height: '100%' }} 
      className="rounded shadow-sm"
    />
  );
};

const RoomDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryParams = new URLSearchParams(location.search);
  const selectedDate = queryParams.get('date');
  const selectedStartTime = queryParams.get('startTime');
  const selectedEndTime = queryParams.get('endTime');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const fetchedRooms = await getRooms();
        const foundRoom = fetchedRooms.find((r: Room) => r.id === id);
        console.log("Fetched Room Data:", foundRoom);
        setRoom(foundRoom || null);
      } catch (err) {
        setError('Failed to fetch data. Please ensure the backend server is running.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

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

  if (error || !room) {
    return (
      <div>
        <Navbar />
        <div className="container mt-5 text-center">
          <div className="alert alert-danger" role="alert">
            {error || 'Room Not Found'}
          </div>
          <Link to="/booking" className="btn btn-primary mt-3">Back to Booking</Link>
        </div>
      </div>
    );
  }

  const confirmationLink = `/confirmation?roomId=${room.id}&date=${selectedDate || ''}&startTime=${selectedStartTime || ''}&endTime=${selectedEndTime || ''}`;

  return (
    <div>
      <Navbar />
      <div className="container room-detail-container">
        <h1 className="room-detail-header">{room.name}</h1>

        <div className="row">
          <div className="col-md-8">
            {room.panoramicUrl ? (
              <div className="room-360-container mb-4">
                <div className="ratio ratio-16x9 shadow-sm rounded overflow-hidden bg-dark border">
                  <PannellumViewer imageUrl={room.panoramicUrl} />
                </div>
                <p className="text-muted mt-2 text-center">
                  <small>คลิกค้างและลากเพื่อหมุนดูภาพ 360 องศา</small>
                </p>
              </div>
            ) : (
              <div className="room-image-container mb-4">
                <img src={room.imageUrl} alt={room.name} className="img-fluid rounded shadow-sm" />
              </div>
            )}
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
