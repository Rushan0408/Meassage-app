import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

// Toast container that will hold all toast notifications
const ToastContainer = ({ children }) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-xs w-full">
      {children}
    </div>
  );
};

// Individual toast notification
const Toast = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onClose?.();
      }, 300); // Wait for fade-out animation
    }, duration);
    
    return () => clearTimeout(timer);
  }, [duration, onClose]);
  
  // Get appropriate colors based on toast type
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500 border-green-600';
      case 'error':
        return 'bg-red-500 border-red-600';
      case 'warning':
        return 'bg-yellow-500 border-yellow-600';
      case 'info':
      default:
        return 'bg-blue-500 border-blue-600';
    }
  };
  
  return (
    <div 
      className={`
        ${getTypeStyles()}
        ${isVisible ? 'opacity-100' : 'opacity-0'}
        transform transition-all duration-300 ease-in-out
        border rounded-md p-3 text-white shadow-md
      `}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">{message}</div>
        <button 
          onClick={() => setIsVisible(false)}
          className="ml-2 text-white opacity-70 hover:opacity-100 focus:outline-none"
        >
          &times;
        </button>
      </div>
    </div>
  );
};

// Toast manager for adding and removing toasts
let toasts = [];
let setToasts = () => {};

// Create portal element if it doesn't exist
const createPortalRoot = () => {
  let portalRoot = document.getElementById('toast-portal');
  if (!portalRoot) {
    portalRoot = document.createElement('div');
    portalRoot.id = 'toast-portal';
    document.body.appendChild(portalRoot);
  }
  return portalRoot;
};

// Initialize toast portal
const initToastPortal = () => {
  // Create portal root if needed
  const portalRoot = createPortalRoot();
  
  // Set up state management
  const ToastPortal = () => {
    const [toastList, setToastList] = useState([]);
    
    // Expose state setter globally
    setToasts = setToastList;
    toasts = toastList;
    
    const removeToast = (id) => {
      setToastList(current => current.filter(toast => toast.id !== id));
    };
    
    return ReactDOM.createPortal(
      <ToastContainer>
        {toastList.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </ToastContainer>,
      portalRoot
    );
  };
  
  return ToastPortal;
};

// Show a toast notification
export const showToast = (message, type = 'info', duration = 3000) => {
  // Generate a more unique ID using timestamp + random number to avoid duplicates
  const id = Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);
  setToasts(current => [...current, { id, message, type, duration }]);
  return id;
};

// Remove a specific toast
export const removeToast = (id) => {
  setToasts(current => current.filter(toast => toast.id !== id));
};

// Create and export the ToastPortal component
export const ToastPortal = initToastPortal(); 