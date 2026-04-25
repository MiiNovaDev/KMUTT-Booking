import React, { useState, useEffect, useRef } from 'react'; // Added useRef
import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { getBookingById, updateBookingStatus } from '../services/api'; // Import specific API services
import type { Booking } from '../services/mockData'; // Use types
import './CheckInPage.css';

const qrcodeRegionId = "html5qr-code-full-region";

const CheckInPage: React.FC = () => {
  const [scannedData, setScannedData] = useState<{ bookingId: string, roomId: string } | null>(null);
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null); // State for fetched booking
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkInMessage, setCheckInMessage] = useState<string>('รอการสแกน QR Code...'); // New state for status messages
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false); // New state for confirmation modal

  const scannerRef = useRef<Html5QrcodeScanner | null>(null); // Use useRef for scanner instance
  const qrcodeRegionRef = useRef<HTMLDivElement>(null); // Ref for the QR code region element

  // Helper to format time (re-used from other pages)
  const formatTimeRange = (startValue: string | Date, endValue: string | Date) => {
    const start = new Date(startValue);
    const end = new Date(endValue);
    const startTime = start.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    const endTime = end.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    return `${startTime} - ${endTime}`;
  };

  const handleConfirmCheckIn = async () => {
    if (!currentBooking) return; // Should not happen if modal is open

    setConfirmationModalOpen(false); // Close modal immediately
    setLoading(true); // Indicate that check-in processing is happening
    setCheckInMessage(`กำลังอัปเดตสถานะการจองเป็น "กำลังใช้งาน"...`);

    try {
      await updateBookingStatus(currentBooking.id, 'In Use');
      setCheckInMessage(`เช็คอินสำเร็จ! การจองห้อง ${currentBooking.roomName || currentBooking.roomId} (ID: ${currentBooking.id}) ยืนยันการใช้งานแล้ว`);
      setCurrentBooking({ ...currentBooking, status: 'In Use' }); // Update local state
    } catch (err: any) {
      console.error('CheckInPage: Check-in confirmation failed:', err);
      setCheckInMessage(`เกิดข้อผิดพลาดในการเช็คอิน: ${err.message || 'unknown error'}`);
      setError(`เช็คอินไม่สำเร็จ: ${err.message || 'unknown error'}`);
    } finally {
      setLoading(false); // End loading regardless of success or failure
    }
  };

  const handleCancelCheckIn = () => {
    setConfirmationModalOpen(false);
    setCheckInMessage('การเช็คอินถูกยกเลิก. รอการสแกน QR Code ใหม่...');
    setCurrentBooking(null); // Clear booking data
    setScannedData(null); // Clear scanned data
    // Re-initialize scanner if it was cleared
    if (!scannerRef.current) {
        setLoading(true); // Will trigger useEffect to re-initialize scanner
    }
  };


  useEffect(() => {
    // Clear any previous scan status when component mounts
    setScannedData(null);
    setCurrentBooking(null);
    setCheckInMessage('รอการสแกน QR Code...');
    setError(null); // Clear previous errors on re-mount or re-render
    setConfirmationModalOpen(false); // Ensure modal is closed on mount

    console.log("CheckInPage useEffect: Starting scanner initialization logic.");

    // Early return if the ref is not yet available.
    if (!qrcodeRegionRef.current) {
        console.log("CheckInPage useEffect: qrcodeRegionRef.current is null, deferring scanner initialization.");
        setLoading(true); // Keep loading state true while waiting for ref
        return; 
    }

    // If scanner is already initialized, do nothing.
    if (scannerRef.current) {
        console.log("CheckInPage useEffect: Scanner already initialized, skipping.");
        setLoading(false); // Ensure loading is off if already initialized
        return;
    }

    // Now qrcodeRegionRef.current is guaranteed to be available and scanner not initialized.
    console.log("CheckInPage useEffect: qrcodeRegionRef.current is available. Attempting to initialize scanner.");
    let html5QrcodeScannerInstance: Html5QrcodeScanner | null = null;

    try {
        html5QrcodeScannerInstance = new Html5QrcodeScanner(
            qrcodeRegionId,
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                disableFlip: false,
            },
            /* verbose= */ false
        );
  
        const onScanSuccess = async (decodedText: string, decodedResult: unknown) => {
          console.log(`CheckInPage: QR Code scanned: ${decodedText}`, decodedResult);
          
          // Clear the scanner after a successful scan
          if (scannerRef.current) {
            scannerRef.current.clear().catch(error => {
              console.error("CheckInPage: Failed to clear html5QrcodeScanner after success", error);
            });
            scannerRef.current = null; // Mark as cleared
          }
          setLoading(false); // Set loading to false after a successful scan
  
          let parsedData: { bookingId: string, roomId: string };
          try {
            parsedData = JSON.parse(decodedText);
            if (!parsedData.bookingId || !parsedData.roomId) {
              throw new Error("Invalid QR data format: Missing bookingId or roomId");
            }
            setScannedData(parsedData);
          } catch (_error) {
            setCheckInMessage(`Error: ไม่สามารถอ่านข้อมูล QR Code ได้ หรือข้อมูลไม่ถูกต้อง: ${decodedText}`);
            return;
          }
  
          // --- Check-in verification and update logic ---
          const { bookingId, roomId } = parsedData;
          setCheckInMessage(`กำลังตรวจสอบการจอง ID: ${bookingId}...`);
  
          try {
            const fetchedBooking = await getBookingById(bookingId);
            if (!fetchedBooking) {
              setCheckInMessage(`ไม่พบการจองสำหรับรหัส: ${bookingId}`);
              return;
            }
  
            if (fetchedBooking.roomId !== roomId) {
              setCheckInMessage(`เช็คอินไม่สำเร็จ! การจองห้อง "${fetchedBooking.roomName || fetchedBooking.roomId}" (ID: ${bookingId}) ไม่ตรงกับห้องที่สแกน (${roomId})`);
              return;
            }
  
            setCurrentBooking(fetchedBooking); // Store fetched booking
            setCheckInMessage(`การจอง "${fetchedBooking.roomName || fetchedBooking.roomId}" (ID: ${bookingId}) พบแล้ว. สถานะปัจจุบัน: ${fetchedBooking.status}. ยืนยันการเช็คอิน?`);
            setConfirmationModalOpen(true); // Open confirmation modal
            // The actual status update will happen in handleConfirmCheckIn
  
          } catch (err: any) {
            console.error('CheckInPage: Check-in process failed:', err);
            setCheckInMessage(`เกิดข้อผิดพลาดในการเช็คอิน: ${err.message || 'unknown error'}`);
          }
        };
  
        const onScanError = (_errorMessage: string) => {
          // console.warn(errorMessage);
        };
      
        console.log("CheckInPage useEffect: Calling html5QrcodeScannerInstance.render().");
        html5QrcodeScannerInstance.render(onScanSuccess, onScanError);
        setLoading(false);
        scannerRef.current = html5QrcodeScannerInstance; // Save scanner instance to ref
    } catch (err: any) {
        console.error("CheckInPage useEffect: Error setting up HTML5 QR Code Scanner in try-catch:", err);
        setError(`เกิดข้อผิดพลาดในการตั้งค่าเครื่องสแกน: ${err.message || 'unknown error'}`);
        setLoading(false); // Ensure loading state is false on immediate setup error
    }

    // Cleanup function
    return () => {
      console.log("CheckInPage useEffect: Cleanup function running.");
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => {
          console.error("CheckInPage: Failed to clear html5QrcodeScanner on unmount", err);
        }).finally(() => {
          scannerRef.current = null; // Ensure ref is cleared
          console.log("CheckInPage useEffect: Scanner cleared during cleanup.");
        });
      }
    };
  }, [qrcodeRegionRef.current]); // Re-run effect when qrcodeRegionRef.current changes (i.e., becomes available)

  return (
    <div>
      <Navbar />
      <div className="check-in-container">
        <div className="check-in-card">
          <h2 className="section-header">Admin: สแกน QR Code เช็คอิน</h2>
          <p className="text-muted mb-4">
            วาง QR Code ของผู้จองให้อยู่ในกรอบเพื่อทำการสแกน
          </p>

          <div 
            id={qrcodeRegionId} 
            ref={qrcodeRegionRef} // Attach ref here
            style={{ width: '100%', maxWidth: '300px', margin: '0 auto', minHeight: '250px', position: 'relative' }} // Added minHeight and position:relative
          >
            {loading ? (
              <div className="text-center" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading scanner...</span>
                </div>
                <p className="mt-2">Loading scanner...</p>
              </div>
            ) : error ? (
              <div className="alert alert-danger mt-3" role="alert" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%' }}>
                {error}
              </div>
            ) : null}
          </div>


          {scannedData && (
            <p className="check-in-status-message mt-3">
              QR Code ที่สแกน: <strong>Booking ID: {scannedData.bookingId}, Room ID: {scannedData.roomId}</strong>
            </p>
          )}
          {currentBooking && (
            <div className="booking-details-display mt-3">
              <p><strong>ห้อง:</strong> {currentBooking.roomName || currentBooking.roomId}</p>
              <p><strong>ผู้จอง (UID):</strong> {currentBooking.userId}</p>
              <p><strong>เวลา:</strong> {formatTimeRange(currentBooking.startTime, currentBooking.endTime)}</p>
              <p><strong>สถานะปัจจุบัน:</strong> {currentBooking.status}</p>
            </div>
          )}
          
          <p className="check-in-status-message mt-3">
            สถานะ: {checkInMessage}
          </p>
          
          <Link to="/admin" className="btn btn-outline-secondary mt-4">
            กลับหน้า Admin
          </Link>

          {/* Confirmation Modal */}
          {confirmationModalOpen && currentBooking && (
            <div 
                className="modal" 
                style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1050 }}
            >
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">ยืนยันการเช็คอิน</h5>
                    <button type="button" className="btn-close" aria-label="Close" onClick={handleCancelCheckIn}></button>
                  </div>
                  <div className="modal-body">
                    <p>คุณต้องการยืนยันการเช็คอินสำหรับการจองนี้หรือไม่?</p>
                    <p><strong>ห้อง:</strong> {currentBooking.roomName || currentBooking.roomId}</p>
                    <p><strong>เวลา:</strong> {formatTimeRange(currentBooking.startTime, currentBooking.endTime)}</p>
                    <p><strong>ผู้จอง (UID):</strong> {currentBooking.userId}</p>
                    <p><strong>สถานะปัจจุบัน:</strong> {currentBooking.status}</p>
                    {currentBooking.status !== 'Upcoming' && (
                        <div className="alert alert-warning mt-2">
                            การจองนี้มีสถานะเป็น "{currentBooking.status}" ไม่ใช่ "Upcoming". 
                            การยืนยันอาจไม่เปลี่ยนสถานะ หรือเป็นการเช็คอินซ้ำ.
                        </div>
                    )}
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={handleCancelCheckIn}>ยกเลิก</button>
                    <button type="button" className="btn btn-primary" onClick={handleConfirmCheckIn}
                            disabled={currentBooking.status !== 'Upcoming'}>
                      ยืนยันเช็คอิน
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckInPage;


