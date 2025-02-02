import React, { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import 'bootstrap/dist/css/bootstrap.min.css';

const VictimPage = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

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
          const photoPath = doc.data().photoUrl; // Should only be the relative path
          console.log("Fetching image with path:", photoPath);

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

  return (
    <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-dark text-white">
      {loading ? (
        <div>جاري تحميل الصور...</div>
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
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VictimPage;
