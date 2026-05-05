import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Room, Booking } from '../services/mockData'; // Import Booking type
import './RoomCard.css';

interface RoomCardProps {
  room: Room;
  selectedDate?: string;
  selectedStartTime?: string;
  selectedEndTime?: string;
  bookings: Booking[]; // New prop for bookings data
}

const RoomCard: React.FC<RoomCardProps> = ({ 
  room, 
  selectedDate, 
  selectedStartTime, 
  selectedEndTime,
  bookings // Destructure new prop
}) => {
  const isAvailableForSelectedTime = useMemo(() => {
    if (!selectedDate || !selectedStartTime || !selectedEndTime) {
      // If no time is selected, consider it available if the room itself is available
      return room.status === 'Available';
    }

    const requestedStartTime = new Date(`${selectedDate}T${selectedStartTime}:00`);
    const requestedEndTime = new Date(`${selectedDate}T${selectedEndTime}:00`);

    // Check for booking conflicts for this specific room
    const hasConflict = bookings.some(booking => { // Use bookings prop
      if (booking.roomId !== room.id) return false;
      
      const bookingStartTime = new Date(booking.startTime);
      const bookingEndTime = new Date(booking.endTime);

      const isOverlapping = requestedStartTime < bookingEndTime && requestedEndTime > bookingStartTime;
      
      return isOverlapping;
    });

    return room.status === 'Available' && !hasConflict;
  }, [room, selectedDate, selectedStartTime, selectedEndTime, bookings]); // Add bookings to dependency array

  const bookingParams = new URLSearchParams();
  if (selectedDate) bookingParams.append('date', selectedDate);
  if (selectedStartTime) bookingParams.append('startTime', selectedStartTime);
  if (selectedEndTime) bookingParams.append('endTime', selectedEndTime);

  const roomDetailLink = `/room/${room.id}?${bookingParams.toString()}`;

  return (
    <div className="col-md-4 col-sm-6 mb-4">
      <div className={`card h-100 room-card ${!isAvailableForSelectedTime ? 'card-unavailable-overlay' : ''}`}>
        <img src={room.imageUrl} className="card-img-top" alt={room.name} />
        <div className="card-body d-flex flex-column">
          <h5 className="card-title">
            <Link to={roomDetailLink}>{room.name}</Link>
          </h5>
          <p className="card-text mb-1">Capacity: {room.capacity} seats</p>
          <p className={`card-text ${isAvailableForSelectedTime ? 'card-status-available' : 'card-status-unavailable'}`}>
            Status: {isAvailableForSelectedTime ? 'ว่าง (ตามเวลาที่เลือก)' : 'ไม่ว่าง (ตามเวลาที่เลือก)'}
          </p>
          <Link 
            to={roomDetailLink} 
            className="btn btn-outline-primary mt-auto"
            onClick={(e) => {
              if (!isAvailableForSelectedTime) {
                e.preventDefault(); // Prevent navigation if not available
                alert('ห้องไม่ว่างในช่วงเวลาที่เลือก กรุณาเลือกเวลาอื่น');
              }
            }}
          >
            {isAvailableForSelectedTime ? 'View Details' : 'ไม่ว่าง'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RoomCard;
