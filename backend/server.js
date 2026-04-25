require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin'); // Import Firebase Admin SDK
const createFirestoreFunctions = require('./models/firestore'); // Import the factory function

const app = express();
const port = process.env.PORT || 5001; // Using port from env or 5001

// Middleware
app.use(cors({
  origin: true, // Reflect request origin, allowing any origin to access the API in development/easy mode
  credentials: true 
}));
app.use(express.json()); // for parsing application/json

// --- Firebase Initialization ---
// Path to service account key, allowing for environment override or local file
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './credentials/firebase-admin-key.json';

try {
  // Initialize Firebase Admin SDK
  // Check if we have the full JSON in an environment variable first (Best for Render/Cloud)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    // Fallback to local file
    admin.initializeApp({
      credential: admin.credential.cert(require(serviceAccountPath))
    });
  }
  console.log('Firebase Admin SDK initialized and Firestore connected...');
} catch (error) {
  console.error('Firebase initialization error:', error);
}

const db = admin.firestore(); // Get a reference to the Firestore database

// Create Firestore functions with the initialized db instance
const firestore = createFirestoreFunctions(db);

// --- Auth Endpoints ---
app.post('/api/register', async (req, res) => {
  const { uid, email, studentId, role = 'USER' } = req.body; // Expect uid, email from frontend after Firebase Auth registration
  const idToken = req.headers.authorization?.split('Bearer ')[1]; // Get ID token from header

  if (!idToken) {
    return res.status(401).json({ error: 'Unauthorized: No ID token provided.' });
  }

  try {
    // Verify ID token to ensure it's a legitimate Firebase user and get their UID
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    if (decodedToken.uid !== uid) {
      return res.status(403).json({ error: 'Forbidden: UID mismatch.' });
    }

    // Store additional user details in Firestore using the UID from Firebase Auth
    await db.collection('users').doc(uid).set({
      uid: uid,
      email: email,
      studentId: studentId,
      role: role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true }); // Use merge: true to avoid overwriting if doc exists (e.g. from custom claims later)

    res.status(201).json({ uid: uid, email: email, role: role });
  } catch (error) {
    console.error('Error processing registration:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  const { idToken } = req.body; // Frontend sends idToken in body
  // Also expect idToken in Authorization header for consistency with /api/register pattern
  const authHeaderToken = req.headers.authorization?.split('Bearer ')[1];

  // Use idToken from body if header is not present, or prefer header for security.
  const tokenToVerify = authHeaderToken || idToken;

  if (!tokenToVerify) {
    return res.status(401).json({ error: 'Unauthorized: No ID token provided.' });
  }

  try {
    // Verify the ID token from the client
    const decodedToken = await admin.auth().verifyIdToken(tokenToVerify);
    const uid = decodedToken.uid;

    // Get user details from Firestore (where we store role and studentId)
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};

    res.status(200).json({ 
      uid: uid, 
      email: decodedToken.email, 
      role: userData.role || 'USER', // Use role from Firestore
      studentId: userData.studentId, // Use studentId from Firestore
      token: tokenToVerify 
    });

  } catch (error) {
    console.error('Error during login:', error);
    res.status(401).json({ error: 'Unauthorized', details: error.message });
  }
});


// --- API Endpoints for Firestore ---
app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = await firestore.getRooms();
    res.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/rooms/:id', async (req, res) => {
  try {
    const room = await firestore.getRoomById(req.params.id);
    if (room) {
      res.json(room);
    } else {
      res.status(404).json({ message: 'Room not found' });
    }
  } catch (error) {
    console.error('Error fetching room by ID:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/rooms', async (req, res) => {
  try {
    const newRoom = await firestore.addRoom(req.body);
    res.status(201).json(newRoom);
  } catch (error) {
    console.error('Error adding room:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/rooms/:id', async (req, res) => {
  try {
    const updatedRoom = await firestore.updateRoom(req.params.id, req.body);
    res.json(updatedRoom);
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/rooms/:id', async (req, res) => {
  try {
    await firestore.deleteRoom(req.params.id);
    res.status(204).send(); // No content
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await firestore.getUsers();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await firestore.getUserById(req.params.id);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const newUser = await firestore.addUser(req.body);
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const updatedUser = await firestore.updateUser(req.params.id, req.body);
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await firestore.deleteUser(req.params.id);
    res.status(204).send(); // No content
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: error.message });
  }
});


app.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await firestore.getBookings();
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/bookings/:id', async (req, res) => {
  try {
    const booking = await firestore.getBookingById(req.params.id);
    if (booking) {
      res.json(booking);
    } else {
      res.status(404).json({ message: 'Booking not found' });
    }
  } catch (error) {
    console.error('Error fetching booking by ID:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bookings', async (req, res) => {
  try {
    const newBooking = await firestore.addBooking(req.body);
    res.status(201).json(newBooking);
  } catch (error) {
    console.error('Error adding booking:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/bookings/:id', async (req, res) => {
  try {
    const updatedBooking = await firestore.updateBooking(req.params.id, req.body);
    res.json(updatedBooking);
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/bookings/:id/status', async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  try {
    const updatedBooking = await firestore.updateBooking(id, { status: status });
    res.json(updatedBooking);
  } catch (error) {
    console.error(`Error updating booking status for ${id}:`, error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/bookings/:id', async (req, res) => {
  try {
    await firestore.deleteBooking(req.params.id);
    res.status(204).send(); // No content
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ error: error.message });
  }
});

// Initialize and start the server
async function initializeServer() {
  try {
    // Firebase is initialized directly, no async connectDB needed here anymore.
    if (process.env.NODE_ENV !== 'production') {
      app.listen(port, () => {
        console.log(`Server running on port ${port}`);
      });
    }
  } catch (error) {
    console.error('Failed to initialize server:', error.stack);
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
}

initializeServer();

// Export the app for Vercel
module.exports = app;






