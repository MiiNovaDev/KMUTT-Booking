const admin = require('firebase-admin'); // Import admin to get access to firestore

// Helper to convert Firestore document to a plain object with id
const docToObject = (doc) => {
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
};

// Functions will now take 'db' as an argument
const createFirestoreFunctions = (db) => ({
  // --- Rooms Collection ---
  getRooms: async () => {
    const snapshot = await db.collection('rooms').get();
    return snapshot.docs.map(docToObject);
  },

  getRoomById: async (id) => {
    const doc = await db.collection('rooms').doc(id).get();
    return docToObject(doc);
  },

  addRoom: async (roomData) => {
    const docRef = await db.collection('rooms').add(roomData);
    return { id: docRef.id, ...roomData };
  },

  updateRoom: async (id, roomData) => {
    await db.collection('rooms').doc(id).update(roomData);
    return { id, ...roomData };
  },

  deleteRoom: async (id) => {
    await db.collection('rooms').doc(id).delete();
    return { id };
  },

  // --- Bookings Collection ---
  getBookings: async () => {
    const snapshot = await db.collection('bookings').get();
    return snapshot.docs.map(docToObject);
  },

  getBookingById: async (id) => {
    const doc = await db.collection('bookings').doc(id).get();
    return docToObject(doc);
  },

  addBooking: async (bookingData) => {
    console.log('Attempting to add booking to Firestore:', bookingData); // Debug log
    const docRef = await db.collection('bookings').add(bookingData);
    console.log('Booking added with ID:', docRef.id); // Debug log
    return { id: docRef.id, ...bookingData };
  },

  updateBooking: async (id, bookingData) => {
    await db.collection('bookings').doc(id).update(bookingData);
    return { id, ...bookingData };
  },

  deleteBooking: async (id) => {
    await db.collection('bookings').doc(id).delete();
    return { id };
  },

  // --- Users Collection ---
  getUsers: async () => {
    const snapshot = await db.collection('users').get();
    return snapshot.docs.map(docToObject);
  },

  getUserById: async (id) => {
    const doc = await db.collection('users').doc(id).get();
    return docToObject(doc);
  },

  addUser: async (userData) => {
    const docRef = await db.collection('users').add(userData);
    return { id: docRef.id, ...userData };
  },

  updateUser: async (id, userData) => {
    await db.collection('users').doc(id).update(userData);
    return { id, ...userData };
  },

  deleteUser: async (id) => {
    await db.collection('users').doc(id).delete();
    return { id };
  },
});

module.exports = createFirestoreFunctions;
