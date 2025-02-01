import React, { useRef, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

// Basic Card and Button components
const Card = ({ children, className }) => (
  <div className={`p-4 w-96 bg-white shadow-xl rounded-2xl ${className}`}>
    {children}
  </div>
);

const CardContent = ({ children }) => <div>{children}</div>;

const Button = ({ className, onClick, children }) => (
  <button className={`py-2 px-4 rounded-md ${className}`} onClick={onClick}>
    {children}
  </button>
);

export default function PrankApp() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [showPrankMessage, setShowPrankMessage] = useState(false);
  const [photoData, setPhotoData] = useState(null);

  const capturePhoto = useCallback(() => {
    if (!canvasRef.current || !videoRef.current) return;

    const context = canvasRef.current.getContext("2d");
    if (context) {
      context.drawImage(videoRef.current, 0, 0, 320, 240);
      const photoDataUrl = canvasRef.current.toDataURL("image/png");
      setPhotoData(photoDataUrl);
      setShowPrankMessage(true);
    } else {
      alert("Failed to capture photo. Please try again.");
    }
  }, []);

  const requestCameraPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().then(() => {
            setTimeout(capturePhoto, 1000);
          });
        };
      }
    } catch (error) {
      alert("Camera access is required for this prank!");
    }
  }, [capturePhoto]);

  useEffect(() => {
    requestCameraPermission();
  }, [requestCameraPermission]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-yellow-200 via-pink-200 to-purple-300">
      <motion.h1
        className="text-4xl font-bold mb-4 text-purple-700"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 1 }}
      >
        Welcome to the Fun Prank Zone!
      </motion.h1>
      {!showPrankMessage ? (
        <Card className="p-4 w-96 bg-white shadow-xl rounded-2xl">
          <CardContent>
            <video ref={videoRef} className="w-full rounded-lg mb-4" />
            <canvas ref={canvasRef} width="320" height="240" hidden />
            <p className="text-gray-700 text-center mb-4">
              Allow camera access for a "fun experience!"
            </p>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          className="text-center p-8 bg-white shadow-lg rounded-lg mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h2 className="text-2xl font-bold text-green-600 mb-4">
            Congratulations!
          </h2>
          <p className="text-gray-700 mb-4">
            You've been pranked! Here's your captured photo — don't worry, it
            stays with you.
          </p>
          {photoData && (
            <img src={photoData} alt="Prank Capture" className="rounded-lg shadow-md" />
          )}
          <Button
            className="bg-indigo-500 hover:bg-indigo-700 text-white mt-4 py-2 px-4 rounded-md"
            onClick={() => navigator.clipboard.writeText(window.location.href)}
          >
            Share this Prank!
          </Button>
        </motion.div>
      )}
    </div>
  );
}
