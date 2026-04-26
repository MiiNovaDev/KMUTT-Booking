export interface Room {
  id: string;
  name: string;
  capacity: number;
  status: 'Available' | 'Unavailable';
  imageUrl: string;
  location: string;
  equipment: string[];
  size: string;
  type: 'Lecture Hall' | 'Computer Lab' | 'Meeting Room' | 'Classroom';
}

export const mockRooms: Room[] = [
  {
    id: 'LX-101',
    name: 'Lecture Hall 101',
    capacity: 120,
    status: 'Available',
    imageUrl: 'https://via.placeholder.com/400x300.png?text=LX-101',
    location: 'LX Building, 1st Floor',
    equipment: ['Projector', 'Whiteboard', 'Sound System'],
    size: '150 sq.m.',
    type: 'Lecture Hall',
  },
  {
    id: 'CB2-305',
    name: 'Computer Lab 305',
    capacity: 40,
    status: 'Available',
    imageUrl: 'https://via.placeholder.com/400x300.png?text=CB2-305',
    location: 'Classroom Building 2, 3rd Floor',
    equipment: ['Computers', 'Projector', 'Whiteboard'],
    size: '80 sq.m.',
    type: 'Computer Lab',
  },
  {
    id: 'SIT-401',
    name: 'SIT Meeting Room',
    capacity: 12,
    status: 'Available', // Changed to Available
    imageUrl: 'https://via.placeholder.com/400x300.png?text=SIT-401',
    location: 'SIT Building, 4th Floor',
    equipment: ['Projector', 'Conference Table'],
    size: '40 sq.m.',
    type: 'Meeting Room',
  },
  {
    id: 'CB4-208',
    name: 'Small Classroom 208',
    capacity: 30,
    status: 'Available',
    imageUrl: 'https://via.placeholder.com/400x300.png?text=CB4-208',
    location: 'Classroom Building 4, 2nd Floor',
    equipment: ['Whiteboard'],
    size: '50 sq.m.',
    type: 'Classroom',
  },
];

export interface Booking {
  id: string;
  roomId: string;
  userId: string;
  studentId?: string; // Add studentId to booking
  startTime: Date;
  endTime: Date;
  status: 'Upcoming' | 'In Use' | 'Completed' | 'Cancelled';
  roomName?: string; // Add optional roomName for convenience in UI
}

export interface User {
  uid: string;
  studentId: string;
  displayName: string;
  email: string;
  role: 'STUDENT' | 'ADMIN';
}

// Helper to set a specific time for today
const setTimeForToday = (hour: number, minute: number) => {
    const d = new Date();
    d.setHours(hour, minute, 0, 0);
    return d;
}

export const mockBookings: Booking[] = [
    {
        id: 'booking-1',
        roomId: 'SIT-401',
        userId: 'user-123', // Example user
        startTime: setTimeForToday(17, 0), // Today 17:00
        endTime: setTimeForToday(19, 0),   // Today 19:00
        status: 'Upcoming',
    }
]
