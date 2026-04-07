// frontend/src/components/QRScanner.jsx
// QR Code Scanner Component - Scans QR codes for session selection

import React, { useRef, useEffect, useState } from 'react';
import jsQR from 'jsqr';
import '../styles/QRScanner.css';

const QRScanner = ({ onSuccess, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const animationFrameRef = useRef(null);

  /**
   * Request camera permission and start scanning
   */
  useEffect(() => {
    const startCamera = async () => {
      try {
        // Request camera access
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment', // Use back camera on mobile
            width: { ideal: 400 },
            height: { ideal: 400 },
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasPermission(true);

          // Start scanning
          scanQRCode();
        }
      } catch (error) {
        console.error('Camera permission denied:', error);
        setHasPermission(false);
      }
    };

    startCamera();

    return () => {
      // Cleanup: stop video stream and cancel animation frame
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  /**
   * Scan for QR codes using canvas and jsQR
   */
  const scanQRCode = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      const context = canvas.getContext('2d');

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image data
      const imageData = context.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );

      // Decode QR code
      const code = jsQR(imageData.data, canvas.width, canvas.height);

      if (code && !scanned) {
        // QR code found
        setScanned(true);

        // Play success sound (optional)
        playSuccessSound();

        // Call success callback
        setTimeout(() => {
          onSuccess(code.data);
        }, 300);

        return;
      }
    }

    // Continue scanning
    animationFrameRef.current = requestAnimationFrame(scanQRCode);
  };

  /**
   * Play success sound (optional)
   */
  const playSuccessSound = () => {
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.1
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  /**
   * Handle manual QR code entry
   */
  const handleManualEntry = (e) => {
    const input = e.target.value;
    if (input.includes('session=')) {
      setScanned(true);
      onSuccess(input);
    }
  };

  return (
    <div className="qr-scanner-modal">
      <div className="qr-scanner-container">
        <div className="qr-scanner-header">
          <h2>Scan QR Code</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {hasPermission === null && (
          <div className="permission-loading">
            <p>Requesting camera permission...</p>
          </div>
        )}

        {hasPermission === false && (
          <div className="permission-denied">
            ⚠️ Camera access denied
            <p>
              Please enable camera permissions in your browser settings to scan
              QR codes.
            </p>
            <button onClick={onClose}>Close</button>
          </div>
        )}

        {hasPermission === true && (
          <>
            <div className="qr-video-container">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="qr-video"
              />
              <canvas
                ref={canvasRef}
                style={{ display: 'none' }}
              />

              {/* Scanning animation frame */}
              <div className="scanning-frame">
                <div className="corner top-left"></div>
                <div className="corner top-right"></div>
                <div className="corner bottom-left"></div>
                <div className="corner bottom-right"></div>
                <div className="scanning-line"></div>
              </div>

              {/* Scanning status */}
              <div className="scanning-status">
                <div className="scanner-dot"></div>
                <p>Scanning...</p>
              </div>
            </div>

            <div className="qr-scanner-footer">
              <p>Point your camera at the QR code</p>
              <p className="or-text">OR</p>
              <input
                type="text"
                placeholder="Paste QR code link manually"
                onChange={handleManualEntry}
                className="qr-manual-input"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default QRScanner;
