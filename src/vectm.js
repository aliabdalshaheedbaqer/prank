import React, { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import 'bootstrap/dist/css/bootstrap.min.css';

const VictimPage = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null); // Track the selected image
  const [isFullscreen, setIsFullscreen] = useState(false); // Track fullscreen mode

  const db = getFirestore();
  const storage = getStorage();

  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);
      setErrorMessage(null);

      try {
        const querySnapshot = await getDocs(collection(db, 'pranked_photo'));
        const fetchedImages = [];

        for (const doc of querySnapshot.docs) {
          const photoPath = doc.data().photoUrl;

          if (photoPath) {
            const storageRef = ref(storage, photoPath);
            try {
              const downloadUrl = await getDownloadURL(storageRef);
              fetchedImages.push({ id: doc.id, url: downloadUrl });
            } catch (error) {
              console.error(`Error fetching download URL for ${photoPath}:`, error.message);
            }
          }
        }

        if (fetchedImages.length === 0) {
          setErrorMessage('لم يتم العثور على صور.');
        }

        setImages(fetchedImages);
      } catch (error) {
        setErrorMessage('خطأ في جلب الصور من Firestore.');
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [db, storage]);

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl); // Set the clicked image to be displayed in full screen
    setIsFullscreen(true); // Enable fullscreen mode
  };

  const closeFullScreen = () => {
    setIsFullscreen(false); // Disable fullscreen mode
    setSelectedImage(null); // Reset the selected image
  };

  return (
    <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-dark text-white">
      {loading ? (
        <div className="d-flex justify-content-center align-items-center">
          <div className="spinner-border text-light" role="status">
            <span className="visually-hidden">جاري تحميل الصور...</span>
          </div>
        </div>
      ) : errorMessage ? (
        <div className="text-danger">{errorMessage}</div>
      ) : (
        <div className="container">
          <h2 className="mb-4 text-center text-light">صور الضحايا</h2>
          <div className="row">
            {images.map((image) => (
              <div key={image.id} className="col-md-4 mb-4">
                <img
                  src={image.url}
                  alt="صورة الضحية"
                  className="img-fluid rounded shadow-lg"
                  style={{ maxWidth: '100%', height: 'auto' }}
                  loading="lazy"
                  onClick={() => handleImageClick(image.url)} // Open the image in full screen when clicked
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fullscreen image display */}
      {isFullscreen && selectedImage && (
        <div
          className="position-fixed top-0 left-0 w-100 h-100 d-flex justify-content-center align-items-center bg-dark bg-opacity-75"
          onClick={closeFullScreen} // Close fullscreen on click
          style={{ cursor: 'zoom-out' }}
        >
          <img
            src={selectedImage}
            alt="Full-size"
            className="img-fluid"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>
      )}
    </div>
  );
};

export default VictimPage;
