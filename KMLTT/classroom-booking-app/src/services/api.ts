import { collection, onSnapshot, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { firestoreDb } from '../firebase';
import type { Room, Booking } from './mockData';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'; 

// --- Real-time Subscriptions (Feature 3) ---

export function subscribeToRooms(callback: (rooms: Room[]) => void) {
  return onSnapshot(collection(firestoreDb, 'rooms'), (snapshot) => {
    const rooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));
    callback(rooms);
  });
}

/**
 * Subscribes to bookings with optional filtering.
 * @param callback Callback function with data
 * @param options Filtering options: userId, onlyRecent (last 24h + future)
 */
export function subscribeToBookings(
  callback: (bookings: Booking[]) => void, 
  options: { userId?: string, onlyRecent?: boolean } = {}
) {
  let q = query(collection(firestoreDb, 'bookings'), orderBy('startTime', 'desc'));

  if (options.userId) {
    q = query(q, where('userId', '==', options.userId));
  }

  if (options.onlyRecent) {
    // Only get bookings from 24 hours ago onwards
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);
    q = query(q, where('startTime', '>=', Timestamp.fromDate(yesterday)));
  } else {
    // Even for full list, limit to 200 for performance if not specified
    q = query(q, limit(200));
  }
  
  return onSnapshot(q, (snapshot) => {
    const bookings = snapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        id: doc.id, 
        ...data,
        startTime: data.startTime?.toDate ? data.startTime.toDate() : new Date(data.startTime),
        endTime: data.endTime?.toDate ? data.endTime.toDate() : new Date(data.endTime)
      } as Booking;
    });
    
    // Auto-release check (Feature 1 - Lazy approach)
    checkAutoRelease(bookings);
    
    callback(bookings);
  });
}

// --- Auto-Release Logic (Feature 1) ---

const RELEASE_TIMEOUT_MINUTES = 15;

async function checkAutoRelease(bookings: Booking[]) {
  const now = new Date();
  
  const expiredBookings = bookings.filter(b => {
    if (b.status !== 'Upcoming' || b.checkedIn) return false;
    
    const startTime = new Date(b.startTime);
    const diffInMinutes = (now.getTime() - startTime.getTime()) / (1000 * 60);
    
    return diffInMinutes >= RELEASE_TIMEOUT_MINUTES;
  });

  for (const booking of expiredBookings) {
    console.log(`Auto-releasing booking ${booking.id} due to no check-in.`);
    try {
      await updateBookingStatus(booking.id, 'Cancelled');
      // Optional: Send notification or log specifically for auto-release
    } catch (err) {
      console.error(`Failed to auto-release booking ${booking.id}:`, err);
    }
  }
}

// --- Standard API Calls ---

export async function getRooms() {
  const response = await fetch(`${API_BASE_URL}/rooms`);
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({})); // Try to parse JSON error, if any
    console.error(`getRooms failed: ${response.status} ${response.statusText}`, errorBody);
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

export async function getRoomById(id: string) {
  const response = await fetch(`${API_BASE_URL}/rooms/${id}`);
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    console.error(`getRoomById failed: ${response.status} ${response.statusText}`, errorBody);
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

export async function addRoom(roomData: any) { // Use 'any' for roomData temporarily for simplicity
  const response = await fetch(`${API_BASE_URL}/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(roomData),
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    console.error(`addRoom failed: ${response.status} ${response.statusText}`, errorBody);
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

export async function updateRoom(id: string, roomData: any) { // Use 'any' for roomData temporarily
  const response = await fetch(`${API_BASE_URL}/rooms/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(roomData),
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    console.error(`updateRoom failed: ${response.status} ${response.statusText}`, errorBody);
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

export async function deleteRoom(id: string) {
  const response = await fetch(`${API_BASE_URL}/rooms/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    console.error(`deleteRoom failed: ${response.status} ${response.statusText}`, errorBody);
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  // No content for successful delete (204)
}


export async function getBookings(userId?: string) {
  const url = userId ? `${API_BASE_URL}/bookings?userId=${userId}` : `${API_BASE_URL}/bookings`;
  const response = await fetch(url);
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    console.error(`getBookings failed: ${response.status} ${response.statusText}`, errorBody);
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

export async function getBookingById(id: string) {
  const response = await fetch(`${API_BASE_URL}/bookings/${id}`);
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    console.error(`getBookingById failed: ${response.status} ${response.statusText}`, errorBody);
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

export async function addBooking(bookingData: any) {
  const response = await fetch(`${API_BASE_URL}/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bookingData),
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    console.error(`addBooking failed: ${response.status} ${response.statusText}`, errorBody);
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

export async function updateBooking(id: string, bookingData: any) {
  const response = await fetch(`${API_BASE_URL}/bookings/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bookingData),
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    console.error(`updateBooking failed: ${response.status} ${response.statusText}`, errorBody);
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

export async function updateBookingStatus(id: string, status: string, extraData: any = {}) {
  const response = await fetch(`${API_BASE_URL}/bookings/${id}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status, ...extraData }),
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    console.error(`updateBookingStatus failed: ${response.status} ${response.statusText}`, errorBody);
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

export async function deleteBooking(id: string) {
  const response = await fetch(`${API_BASE_URL}/bookings/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    console.error(`deleteBooking failed: ${response.status} ${response.statusText}`, errorBody);
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  // No content for successful delete (204)
}

export async function getUsers() {
  const response = await fetch(`${API_BASE_URL}/users`);
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    console.error(`getUsers failed: ${response.status} ${response.statusText}`, errorBody);
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

export async function updateUserRole(uid: string, role: string) {
  const response = await fetch(`${API_BASE_URL}/users/${uid}/role`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ role }),
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    console.error(`updateUserRole failed: ${response.status} ${response.statusText}`, errorBody);
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

export async function getStats() {
  const response = await fetch(`${API_BASE_URL}/admin/stats`);
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    console.error(`getStats failed: ${response.status} ${response.statusText}`, errorBody);
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

// TODO: Further refine types for roomData, bookingData, userData
