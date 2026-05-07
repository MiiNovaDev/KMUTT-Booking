import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import type { Room, Booking, User } from '../services/mockData';
import AddEditRoomModal from '../components/AddEditRoomModal';
import { Link } from 'react-router-dom';
import { addRoom, updateRoom, deleteRoom, getUsers, subscribeToRooms, subscribeToBookings } from '../services/api';
import './AdminPage.css';
import { getBookingDisplayInfo, sortBookings } from '../utils/bookingUtils';

const AdminPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    
    // Fetch users (less frequent, can be static for now or add subscription later)
    getUsers().then(setUsers).catch(console.error);

    const unsubscribeRooms = subscribeToRooms((fetchedRooms) => {
      setRooms(fetchedRooms);
      setLoading(false);
    });

    const unsubscribeBookings = subscribeToBookings((fetchedBookings) => {
      setBookings(fetchedBookings);
    });

    return () => {
      unsubscribeRooms();
      unsubscribeBookings();
    };
  }, []);

  const handleAddRoom = () => {
    setEditingRoom(null);
    setIsModalOpen(true);
  };

  const handleEditRoom = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId) || null;
    setEditingRoom(room);
    setIsModalOpen(true);
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (window.confirm(`Are you sure you want to delete room ${roomId}?`)) {
      try {
        await deleteRoom(roomId);
        alert(`Room ${roomId} deleted successfully.`);
      } catch (err) {
        console.error('Failed to delete room:', err);
        alert(`Failed to delete room ${roomId}.`);
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRoom(null);
  };

  const handleSaveRoom = async (roomData: Omit<Room, 'id'>) => {
    try {
      if (editingRoom) {
        await updateRoom(editingRoom.id, roomData);
        alert(`Room ${roomData.name} updated successfully.`);
      } else {
        await addRoom(roomData);
        alert(`New room ${roomData.name} added successfully.`);
      }
    } catch (err) {
      console.error('Failed to save room:', err);
      alert(`Failed to save room ${roomData.name}.`);
    } finally {
      handleCloseModal();
    }
  };

  const getUserStudentId = (userId: string) => {
    const user = users.find(u => u.uid === userId);
    return user ? user.studentId : 'Unknown User';
  };

  const getRoomName = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    return room ? room.name : 'Unknown Room';
  };

  const formatDate = (dateValue: string | Date) => {
    const date = new Date(dateValue);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTimeRange = (startValue: string | Date, endValue: string | Date) => {
    const start = new Date(startValue);
    const end = new Date(endValue);
    const startTime = start.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    const endTime = end.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    return `${startTime} - ${endTime}`;
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="container admin-container text-center mt-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading real-time data...</p>
        </div>
      </div>
    );
  }

  const visibleBookings = bookings.filter(booking => getBookingDisplayInfo(booking).isVisible);
  const sortedVisibleBookings = sortBookings(visibleBookings);

  return (
    <div>
      <Navbar />
      <div className="container admin-container">
        <div className="admin-header">
          <h1>Admin Panel</h1>
          <div className="d-flex flex-wrap gap-2">
            <Link to="/admin/users" className="btn btn-warning">
              Manage Users (จัดการสมาชิก)
            </Link>
            <Link to="/check-in" className="btn btn-info">
              Check-in (Admin Scan)
            </Link>
            <button className="btn btn-primary" onClick={handleAddRoom}>
              + Add New Room
            </button>
          </div>
        </div>

        <h2 className="section-header mt-5">Room Management</h2>
        <div className="table-responsive room-table">
          <table className="table table-striped table-hover">
            <thead className="thead-light">
              <tr>
                <th>Room ID</th>
                <th>Name</th>
                <th>Type</th>
                <th>Capacity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map(room => (
                <tr key={room.id}>
                  <td>{room.id}</td>
                  <td>{room.name}</td>
                  <td>{room.type}</td>
                  <td>{room.capacity}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-sm btn-outline-secondary admin-action-btn" 
                        onClick={() => handleEditRoom(room.id)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-danger admin-action-btn" 
                        onClick={() => handleDeleteRoom(room.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="section-header mt-5">All Bookings Overview</h2>
        <div className="table-responsive booking-table">
          {sortedVisibleBookings.length > 0 ? (
            <table className="table table-striped table-hover">
              <thead className="thead-light">
                <tr>
                  <th>Room</th>
                  <th>Student ID</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedVisibleBookings.map(booking => {
                  const { displayStatus, className } = getBookingDisplayInfo(booking);
                  return (
                    <tr key={booking.id}>
                      <td>{getRoomName(booking.roomId)}</td>
                      <td>{getUserStudentId(booking.userId)}</td>
                      <td>{formatDate(booking.startTime)}</td>
                      <td>{formatTimeRange(booking.startTime, booking.endTime)}</td>
                      <td>
                        <span className={className}>
                          {displayStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="text-muted">ยังไม่มีรายการจอง</p>
          )}
        </div>
      </div>

      <AddEditRoomModal 
        show={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveRoom}
        roomToEdit={editingRoom}
        key={editingRoom?.id || 'new'}
      />
    </div>
  );
};

export default AdminPage;
