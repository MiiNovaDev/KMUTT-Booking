import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getRooms, subscribeToBookings } from '../services/api';
import type { Room, Booking } from '../services/mockData';
import { PeopleFill, GeoAltFill, AspectRatio, Tools, Calendar3 } from 'react-bootstrap-icons';
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
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date management
  const queryParams = new URLSearchParams(location.search);
  const initialDate = queryParams.get('date') || new Date().toISOString().split('T')[0];
  const [viewDate, setViewDate] = useState(initialDate);

  const selectedStartTime = queryParams.get('startTime');
  const selectedEndTime = queryParams.get('endTime');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const fetchedRooms = await getRooms();
        const foundRoom = fetchedRooms.find((r: Room) => r.id === id);
        setRoom(foundRoom || null);
      } catch (err) {
        setError('Failed to fetch data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();

    // Subscribe to real-time bookings - use onlyRecent to speed up initial load
    const unsubscribe = subscribeToBookings((fetchedBookings) => {
      setAllBookings(fetchedBookings);
    }, { onlyRecent: true });

    return () => unsubscribe();
  }, [id]);

  // Filter bookings for this room on the selected date
  const roomBookingsOnDate = useMemo(() => {
    return allBookings.filter(b => {
      if (b.roomId !== id || b.status === 'Cancelled') return false;
      const bDate = new Date(b.startTime).toISOString().split('T')[0];
      return bDate === viewDate;
    });
  }, [allBookings, id, viewDate]);

  // Generate 12 slots from 08:00 to 20:00
  const timelineSlots = useMemo(() => {
    const slots = [];
    for (let hour = 8; hour < 20; hour++) {
      const timeStr = `${hour.toString().padStart(2, '0')}:00`;
      const nextTimeStr = `${(hour + 1).toString().padStart(2, '0')}:00`;
      
      const slotStart = new Date(`${viewDate}T${timeStr}:00`);
      const slotEnd = new Date(`${viewDate}T${nextTimeStr}:00`);

      const isBusy = roomBookingsOnDate.some(b => {
        const bStart = new Date(b.startTime);
        const bEnd = new Date(b.endTime);
        return slotStart < bEnd && slotEnd > bStart;
      });

      slots.push({ time: timeStr, isBusy });
    }
    return slots;
  }, [viewDate, roomBookingsOnDate]);

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

  const confirmationLink = `/confirmation?roomId=${room.id}&date=${viewDate}&startTime=${selectedStartTime || ''}&endTime=${selectedEndTime || ''}`;

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

            {/* Availability Timeline */}
            <div className="availability-section mt-5">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="m-0"><Calendar3 className="me-2" />ตารางการใช้งานห้อง</h4>
                <input 
                  type="date" 
                  className="form-control w-auto" 
                  value={viewDate} 
                  onChange={(e) => setViewDate(e.target.value)}
                />
              </div>

              <div className="timeline-wrapper shadow-sm">
                <div className="timeline-bar">
                  {timelineSlots.map(slot => (
                    <div 
                      key={slot.time} 
                      className={`timeline-slot ${slot.isBusy ? 'is-busy' : 'is-available'}`}
                    >
                      <span className="slot-label">{slot.time}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="d-flex gap-4 mt-3 justify-content-center">
                <div className="d-flex align-items-center">
                  <div className="legend-dot available me-2"></div>
                  <small>ว่าง (Available)</small>
                </div>
                <div className="d-flex align-items-center">
                  <div className="legend-dot busy me-2"></div>
                  <small>ไม่ว่าง (Reserved)</small>
                </div>
              </div>
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
              
              {viewDate === initialDate && selectedStartTime && selectedEndTime ? (
                <Link to={confirmationLink} className="btn btn-book-room mt-3">
                  จองห้องนี้ ({selectedStartTime} - {selectedEndTime})
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
