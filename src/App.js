// App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Podcast from './podcast'; // Import Podcast component
import VectmAboNezar from './vectm'; // Import Podcast component
import 'bootstrap/dist/css/bootstrap.min.css'; // Bootstrap CSS

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Podcast />} />
        <Route path="/vectmAboNezar" element={<VectmAboNezar />} />
     
      </Routes>
    </Router>
  );
};

export default App;
