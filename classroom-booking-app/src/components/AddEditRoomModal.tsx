import React, { useState } from 'react'; // Removed useEffect
import type { Room } from '../services/mockData';
import './AddEditRoomModal.css';

interface AddEditRoomModalProps {
  show: boolean;
  onClose: () => void;
  onSave: (room: Omit<Room, 'id'>) => void;
  roomToEdit: Room | null;
}

type RoomType = 'Lecture Hall' | 'Computer Lab' | 'Meeting Room' | 'Classroom';
type RoomStatus = 'Available' | 'Unavailable';

const AddEditRoomModal: React.FC<AddEditRoomModalProps> = ({ show, onClose, onSave, roomToEdit }) => {
  const [name, setName] = useState(roomToEdit ? roomToEdit.name : '');
  const [capacity, setCapacity] = useState(roomToEdit ? roomToEdit.capacity : 10);
  const [type, setType] = useState<RoomType>(roomToEdit ? roomToEdit.type : 'Classroom');
  const [location, setLocation] = useState(roomToEdit ? roomToEdit.location : '');
  const [equipment, setEquipment] = useState(roomToEdit ? roomToEdit.equipment.join(', ') : '');
  const [size, setSize] = useState(roomToEdit ? roomToEdit.size : '');
  const [status, setStatus] = useState<RoomStatus>(roomToEdit ? roomToEdit.status : 'Available');
  const [imageUrl, setImageUrl] = useState(roomToEdit ? roomToEdit.imageUrl || '' : ''); // Renamed from imageUrl360

  // useEffect removed, relying on parent component to pass unique key for re-mounting when roomToEdit changes.

  if (!show) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const roomData = {
      name,
      capacity,
      type,
      location,
      equipment: equipment.split(',').map(item => item.trim()),
      size,
      status,
      imageUrl, // Use imageUrl directly from state
      // imageUrl: `https://via.placeholder.com/400x300.png?text=${name.replace(' ', '+')}` // Removed placeholder generation
    };
    onSave(roomData);
  };

  return (
    <>
      <div className="modal-backdrop fade show"></div>
      <div className="modal fade show" style={{ display: 'block' }} tabIndex={-1}>
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{roomToEdit ? 'Edit Room' : 'Add New Room'}</h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">Room Name</label>
                  <input type="text" className="form-control" id="name" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label htmlFor="imageUrl" className="form-label">Image URL</label> {/* Renamed label */}
                  <input type="url" className="form-control" id="imageUrl" value={imageUrl} onChange={e => setImageUrl(e.target.value)} /> {/* Renamed id, value, onChange */}
                </div>
                <div className="mb-3">
                  <label htmlFor="capacity" className="form-label">Capacity</label>
                  <input type="number" className="form-control" id="capacity" value={capacity} onChange={e => setCapacity(parseInt(e.target.value, 10))} required />
                </div>
                <div className="mb-3">
                  <label htmlFor="type" className="form-label">Type</label>
                  <select className="form-select" id="type" value={type} onChange={e => setType(e.target.value as RoomType)}>
                    <option value="Classroom">Classroom</option>
                    <option value="Lecture Hall">Lecture Hall</option>
                    <option value="Computer Lab">Computer Lab</option>
                    <option value="Meeting Room">Meeting Room</option>
                  </select>
                </div>
                 <div className="mb-3">
                  <label htmlFor="location" className="form-label">Location</label>
                  <input type="text" className="form-control" id="location" value={location} onChange={e => setLocation(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label htmlFor="equipment" className="form-label">Equipment (comma-separated)</label>
                  <input type="text" className="form-control" id="equipment" value={equipment} onChange={e => setEquipment(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label htmlFor="size" className="form-label">Size</label>
                  <input type="text" className="form-control" id="size" value={size} onChange={e => setSize(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label htmlFor="status" className="form-label">Status</label>
                  <select className="form-select" id="status" value={status} onChange={e => setStatus(e.target.value as RoomStatus)}>
                    <option value="Available">Available</option>
                    <option value="Unavailable">Unavailable</option>
                  </select>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
                  <button type="submit" className="btn btn-primary">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddEditRoomModal;
