import type { Booking } from '../services/mockData';

// Helper function to determine display status and visibility
// This is duplicated from MyBookingsPage.tsx and AdminPage.tsx
// In a larger application, this would ideally be in a shared context or service.
export const getBookingDisplayInfo = (booking: Booking) => {
    const currentTime = new Date();
    const bookingEndTime = new Date(booking.endTime);
    
    // Normalize dates to start of day for comparison
    const currentDay = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate());
    const bookingEndDay = new Date(bookingEndTime.getFullYear(), bookingEndTime.getMonth(), bookingEndTime.getDate());

    let displayStatus = '';
    let className = '';
    let isVisible = true; // Default to true, then filter

    // If the booking's end day is before the current day, it should not be visible.
    if (bookingEndDay < currentDay) {
        isVisible = false;
    }

    if (booking.status === 'Upcoming') {
      displayStatus = 'กำลังจะใช้งาน';
      className = 'status-upcoming';
    } else if (booking.status === 'In Use' as string) {
      if (bookingEndTime < currentTime) {
        displayStatus = 'ใช้งานเสร็จสิ้น';
        className = 'status-finished';
      } else {
        displayStatus = 'กำลังใช้งาน';
        className = 'status-in-use';
      }
    } else if (booking.status === 'Completed') {
      displayStatus = 'ใช้ไปแล้ว';
      className = 'status-completed';
    } else if (booking.status === 'Cancelled') {
      displayStatus = 'ยกเลิกแล้ว';
      className = 'status-cancelled';
    } else {
      displayStatus = 'สถานะไม่ทราบ';
      className = 'status-unknown';
    }

    return { displayStatus, className, isVisible };
};

// Sort function for bookings based on status priority and then start time
export const sortBookings = (bookings: Booking[]): Booking[] => {
  const statusPriority: { [key: string]: number } = {
    'กำลังจะใช้งาน': 0, // Upcoming
    'กำลังใช้งาน': 1, // In Use
    'ใช้งานเสร็จสิ้น': 2, // In Use but past end time
    'ใช้ไปแล้ว': 3, // Completed
    'ยกเลิกแล้ว': 4, // Cancelled
    'สถานะไม่ทราบ': 5, // Fallback
  };

  return [...bookings].sort((a, b) => {
    const infoA = getBookingDisplayInfo(a);
    const infoB = getBookingDisplayInfo(b);

    // Primary sort: by status priority
    const priorityA = statusPriority[infoA.displayStatus] !== undefined ? statusPriority[infoA.displayStatus] : 99;
    const priorityB = statusPriority[infoB.displayStatus] !== undefined ? statusPriority[infoB.displayStatus] : 99;

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // Secondary sort: by startTime if primary sort is equal
    const startTimeA = new Date(a.startTime).getTime();
    const startTimeB = new Date(b.startTime).getTime();
    return startTimeA - startTimeB;
  });
};
