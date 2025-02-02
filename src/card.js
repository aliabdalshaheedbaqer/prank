// components.js
import React from 'react';

export const Card = ({ children, className }) => (
  <div className={`card shadow-lg rounded-4 ${className}`} style={{ maxWidth: "400px", margin: "0 auto" }}>
    <div className="card-body">{children}</div>
  </div>
);

export const Button = ({ className, onClick, children }) => (
  <button className={`btn ${className}`} onClick={onClick}>
    {children}
  </button>
);
