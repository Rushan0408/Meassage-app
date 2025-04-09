import React from 'react';
import Navigation from '../Navigation';
import './MainLayout.css';

const MainLayout = ({ children }) => {
  return (
    <div className="main-layout">
      <Navigation />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default MainLayout; 