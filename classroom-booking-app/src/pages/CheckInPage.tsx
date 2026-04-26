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
    let isMounted = true;
    let html5QrcodeScannerInstance: Html5QrcodeScanner | null = null;

    const initializeScanner = async () => {
      if (!isMounted) return;

      const element = document.getElementById(qrcodeRegionId);
      if (!element) {
        // If element is not found, it might be due to a re-render.
        // Wait a bit and try once more.
        await new Promise(resolve => setTimeout(resolve, 100));
        if (isMounted) initializeScanner();
        return;
      }

      console.log("CheckInPage: Initializing scanner instance.");
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

        const onScanSuccess = async (decodedText: string) => {
          console.log(`CheckInPage: QR Code scanned: ${decodedText}`);
          
          if (html5QrcodeScannerInstance) {
            try {
              await html5QrcodeScannerInstance.clear();
              html5QrcodeScannerInstance = null;
              scannerRef.current = null;
            } catch (err) {
              console.error("CheckInPage: Error clearing scanner after success", err);
            }
          }
          
          setLoading(false);

          let parsedData: { bookingId: string, roomId: string };
          try {
            parsedData = JSON.parse(decodedText);
            if (!parsedData.bookingId || !parsedData.roomId) {
              throw new Error("Invalid format");
            }
            setScannedData(parsedData);
          } catch (_error) {
            setCheckInMessage(`Error: ข้อมูล QR Code ไม่ถูกต้อง`);
            return;
          }

          const { bookingId, roomId } = parsedData;
          setCheckInMessage(`กำลังตรวจสอบการจอง...`);

          try {
            const fetchedBooking = await getBookingById(bookingId);
            if (!fetchedBooking) {
              setCheckInMessage(`ไม่พบการจอง ID: ${bookingId}`);
              return;
            }

            if (fetchedBooking.roomId !== roomId) {
              setCheckInMessage(`เช็คอินไม่สำเร็จ! ห้องไม่ตรงกัน`);
              return;
            }

            setCurrentBooking(fetchedBooking);
            setCheckInMessage(`พบการจอง. ยืนยันการเช็คอิน?`);
            setConfirmationModalOpen(true);

          } catch (err: any) {
            setCheckInMessage(`เกิดข้อผิดพลาด: ${err.message || 'unknown error'}`);
          }
        };

        const onScanError = () => {
          // Ignore frequent scanning errors
        };

        html5QrcodeScannerInstance.render(onScanSuccess, onScanError);
        scannerRef.current = html5QrcodeScannerInstance;
        setLoading(false);
      } catch (err: any) {
        console.error("CheckInPage: Scanner initialization failed", err);
        setError(`ไม่สามารถเริ่มเครื่องสแกนได้: ${err.message}`);
        setLoading(false);
      }
    };

    initializeScanner();

    return () => {
      isMounted = false;
      if (scannerRef.current) {
        const scannerToClear = scannerRef.current;
        scannerRef.current = null;
        scannerToClear.clear().catch(err => {
          console.error("CheckInPage: Cleanup clear error", err);
        });
      }
    };
  }, []);

  return (
    <div>
      <Navbar />
      <div className="check-in-container">
        <div className="check-in-card">
          <h2 className="section-header">Admin: สแกน QR Code เช็คอิน</h2>
          <p className="text-muted mb-4">
            วาง QR Code ของผู้จองให้อยู่ในกรอบเพื่อทำการสแกน
          </p>

          <div className="scanner-container-wrapper" style={{ position: 'relative', width: '100%', maxWidth: '300px', margin: '0 auto', minHeight: '250px' }}>
            {loading && (
              <div className="text-center" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10 }}>
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">กำลังเตรียมกล้อง...</p>
              </div>
            )}
            
            {error && (
              <div className="alert alert-danger" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10, width: '100%' }}>
                {error}
              </div>
            )}

            <div id={qrcodeRegionId}></div>
          </div>


          {scannedData && (
            <p className="check-in-status-message mt-3">
              QR Code ที่สแกน: <strong>Booking ID: {scannedData.bookingId}</strong>
            </p>
          )}
          {currentBooking && (
            <div className="booking-details-display mt-3">
              <p><strong>ห้อง:</strong> {currentBooking.roomName || currentBooking.roomId}</p>
              <p><strong>ผู้จอง:</strong> {currentBooking.studentId || currentBooking.userId || 'ไม่ทราบรหัส'}</p>
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
                    <p><strong>ผู้จอง:</strong> {currentBooking.studentId || currentBooking.userId || 'ไม่ทราบรหัส'}</p>
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


