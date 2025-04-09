import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';

const AuthPage = () => {
  const [activeTab, setActiveTab] = useState('login');
  const navigate = useNavigate();

  const handleAuthSuccess = () => {
    navigate('/dashboard');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="flex w-full rounded-t-lg overflow-hidden">
          <button 
            className={`flex-1 py-4 text-center font-medium text-sm focus:outline-none transition-colors
              ${activeTab === 'login' 
                ? 'bg-white text-primary border-t-2 border-primary' 
                : 'bg-gray-100 text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('login')}
          >
            Login
          </button>
          <button 
            className={`flex-1 py-4 text-center font-medium text-sm focus:outline-none transition-colors
              ${activeTab === 'register' 
                ? 'bg-white text-primary border-t-2 border-primary' 
                : 'bg-gray-100 text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('register')}
          >
            Register
          </button>
        </div>
        
        <div className="bg-white shadow-md rounded-b-lg">
          {activeTab === 'login' ? (
            <LoginForm onLoginSuccess={handleAuthSuccess} />
          ) : (
            <RegisterForm onRegisterSuccess={handleAuthSuccess} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage; 