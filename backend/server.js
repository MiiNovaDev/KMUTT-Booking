require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin'); // Import Firebase Admin SDK
const createFirestoreFunctions = require('./models/firestore'); // Import the factory function

const app = express();
const port = process.env.PORT || 5001; 

// Middleware
app.use(cors({
  origin: true, 
  credentials: true 
}));
app.use(express.json()); 

// --- Firebase Initialization ---
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    // Use JSON from Environment Variable (Recommended for Render)
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase initialized using Environment Variable');
  } else {
    // Fallback to local file for development
    const serviceAccountPath = './credentials/firebase-admin-key.json';
    admin.initializeApp({
      credential: admin.credential.cert(require(serviceAccountPath))
    });
    console.log('Firebase initialized using local file');
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
}

const db = admin.firestore(); 
const firestore = createFirestoreFunctions(db);

// --- Auth Endpoints ---
app.post('/api/register', async (req, res) => {
  const { uid, email, studentId, role = 'USER' } = req.body;
  const idToken = req.headers.authorization?.split('Bearer ')[1];

  if (!idToken) {
    return res.status(401).json({ error: 'Unauthorized: No ID token provided.' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    if (decodedToken.uid !== uid) {
      return res.status(403).json({ error: 'Forbidden: UID mismatch.' });
    }

    await db.collection('users').doc(uid).set({
      uid: uid,
      email: email,
      studentId: studentId,
      role: role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    res.status(201).json({ uid: uid, email: email, role: role });
  } catch (error) {
    console.error('Error processing registration:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  const { idToken } = req.body;
  const authHeaderToken = req.headers.authorization?.split('Bearer ')[1];
  const tokenToVerify = authHeaderToken || idToken;

  if (!tokenToVerify) {
    return res.status(401).json({ error: 'Unauthorized: No ID token provided.' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(tokenToVerify);
    const uid = decodedToken.uid;
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};

    res.status(200).json({ 
      uid: uid, 
      email: decodedToken.email, 
      role: userData.role || 'USER',
      studentId: userData.studentId,
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
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/rooms/:id', async (req, res) => {
  try {
    const room = await firestore.getRoomById(req.params.id);
    if (room) res.json(room);
    else res.status(404).json({ message: 'Room not found' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/rooms', async (req, res) => {
  try {
    const newRoom = await firestore.addRoom(req.body);
    res.status(201).json(newRoom);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/rooms/:id', async (req, res) => {
  try {
    const updatedRoom = await firestore.updateRoom(req.params.id, req.body);
    res.json(updatedRoom);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/rooms/:id', async (req, res) => {
  try {
    await firestore.deleteRoom(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await firestore.getUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await firestore.getBookings();
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/bookings/:id', async (req, res) => {
  try {
    const booking = await firestore.getBookingById(req.params.id);
    if (booking) res.json(booking);
    else res.status(404).json({ message: 'Booking not found' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bookings', async (req, res) => {
  try {
    const newBooking = await firestore.addBooking(req.body);
    res.status(201).json(newBooking);
  } catch (error) {
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
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/bookings/:id', async (req, res) => {
  try {
    await firestore.deleteBooking(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server (Required for Render)
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;
