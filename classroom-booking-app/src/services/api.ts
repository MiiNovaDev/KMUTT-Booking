const API_BASE_URL = 'http://localhost:5001/api'; // Ensure this matches your backend port

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


export async function getBookings() {
  const response = await fetch(`${API_BASE_URL}/bookings`);
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

export async function updateBookingStatus(id: string, status: string) {
  const response = await fetch(`${API_BASE_URL}/bookings/${id}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
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

// TODO: Further refine types for roomData, bookingData, userData
