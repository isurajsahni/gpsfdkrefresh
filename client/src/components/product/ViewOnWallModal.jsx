import React, { useState, useEffect, useRef } from 'react';
import { HiX, HiCamera } from 'react-icons/hi';
import { motion } from 'framer-motion';

const ViewOnWallModal = ({ isOpen, onClose, imageUrl }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const streamRef = useRef(null);
  
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const dragStartInfo = useRef({ x: 0, y: 0, startPosX: 0, startPosY: 0 });

  const startCamera = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not available. Please ensure you are using a secure connection (HTTPS).");
      }
      
      const constraints = {
        video: { facingMode: 'environment' } // Prefer rear camera
      };
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      streamRef.current = newStream;
      setStream(newStream);
      setHasStarted(true);
      
      // Reset position and scale on open
      if (containerRef.current) {
        setPosition({
          x: 0,
          y: containerRef.current.clientHeight * 0.2 // Slightly above center
        });
      } else {
        setPosition({ x: 0, y: 0 });
      }
      setScale(1);

    } catch (err) {
      console.error("Error accessing camera:", err);
      // More descriptive error for iOS where permissions might be globally denied or require action
      setError("Could not access camera. Please check your browser permissions to allow camera access.");
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup on close and unmount
  useEffect(() => {
    if (!isOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setStream(null);
      setHasStarted(false);
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Bind the video stream to the video element after it has been mounted
  useEffect(() => {
    if (hasStarted && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [hasStarted, stream]);

  if (!isOpen) return null;

  const handlePointerDown = (e) => {
    setIsDragging(true);
    // Support both mouse and touch events
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    dragStartInfo.current = {
      x: clientX,
      y: clientY,
      startPosX: position.x,
      startPosY: position.y
    };
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const dx = clientX - dragStartInfo.current.x;
    const dy = clientY - dragStartInfo.current.y;
    
    setPosition({
      x: dragStartInfo.current.startPosX + dx,
      y: dragStartInfo.current.startPosY + dy
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col overflow-hidden touch-none" ref={containerRef}>
      {/* Top Header/Controls */}
      <div className="absolute top-0 left-0 right-0 p-4 z-10 flex justify-between items-center bg-gradient-to-b from-black/70 to-transparent">
        <div className="text-white">
          <p className="font-bold text-lg drop-shadow-md">View on Wall</p>
          {hasStarted && !error && <p className="text-xs opacity-80 drop-shadow-sm">Drag to move • Use slider to resize</p>}
        </div>
        <button 
          onClick={onClose}
          className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
        >
          <HiX className="w-6 h-6" />
        </button>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 relative w-full h-full bg-gray-900 flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="text-white text-center p-6 bg-black/50 rounded-xl max-w-sm">
            <p className="text-red-400 mb-2 font-bold flex items-center justify-center gap-2">
              <span className="text-2xl">⚠️</span> Camera Error
            </p>
            <p className="text-sm">{error}</p>
            <button 
              onClick={startCamera}
              className="mt-4 px-4 py-2 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : !hasStarted ? (
          /* iOS Camera Fix: Prompt user interaction directly */
          <div className="text-white text-center z-20 flex flex-col items-center justify-center p-6 bg-black/50 backdrop-blur-sm rounded-2xl max-w-sm mx-4">
            <div className="bg-accent/20 p-4 rounded-full mb-4">
              <HiCamera className="w-10 h-10 text-accent" />
            </div>
            <h3 className="text-xl font-bold mb-2">Enable Camera</h3>
            <p className="text-gray-300 text-sm mb-6 max-w-xs leading-relaxed">
              To view this product on your wall, we need access to your device's camera.
            </p>
            <button 
              onClick={startCamera} 
              disabled={isLoading}
              className="btn-primary w-full shadow-lg shadow-accent/20 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Starting Camera...' : 'Allow Camera Access'}
            </button>
          </div>
        ) : (
          <>
            {/* Live Camera Feed */}
            <video 
              ref={videoRef}
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover"
            />

            {/* Draggable Product Overlay */}
            {stream && (
              <motion.div
                className="absolute origin-center cursor-move shadow-2xl"
                style={{
                  x: position.x,
                  y: position.y,
                  scale: scale,
                  // Ensure it starts roughly centered horizontally if x=0
                  left: '50%',
                  translateX: '-50%',
                  top: '0', 
                }}
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onMouseLeave={handlePointerUp}
                onTouchStart={handlePointerDown}
                onTouchMove={handlePointerMove}
                onTouchEnd={handlePointerUp}
              >
                <img 
                  src={imageUrl} 
                  alt="Product Overlay" 
                  className="max-w-[250px] md:max-w-[350px] h-auto object-contain pointer-events-none drop-shadow-[0_20px_35px_rgba(0,0,0,0.4)]"
                  crossOrigin="anonymous"
                />
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Bottom Controls (Resize Slider) */}
      {hasStarted && !error && (
        <div className="absolute bottom-0 left-0 right-0 p-6 z-10 bg-gradient-to-t from-black/80 to-transparent pb-10">
          <div className="max-w-xs mx-auto bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <label className="text-white text-xs font-semibold mb-2 block text-center uppercase tracking-wider">
              Resize Product
            </label>
            <input 
              type="range" 
              min="0.3" 
              max="2.5" 
              step="0.05" 
              value={scale} 
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-white"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewOnWallModal;
