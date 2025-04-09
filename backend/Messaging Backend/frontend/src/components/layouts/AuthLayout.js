import React from 'react';
import { Link } from 'react-router-dom';
import './AuthLayout.css';

const AuthLayout = ({ children }) => {
  return (
    <div className="auth-layout">
      <div className="auth-container">
        <div className="auth-logo">
          <Link to="/">
            <h1>Message App</h1>
          </Link>
        </div>
        <div className="auth-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout; 