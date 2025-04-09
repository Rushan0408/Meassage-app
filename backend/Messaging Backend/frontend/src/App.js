import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from './utils/auth';
import AuthPage from './pages/AuthPage';
import UsersPage from './pages/UsersPage';
import UserProfilePage from './pages/UserProfilePage';
import SettingsPage from './pages/SettingsPage';
import ConversationsPage from './pages/ConversationsPage';
import ConversationPage from './pages/ConversationPage';
import CreateConversationPage from './pages/CreateConversationPage';
import Navigation from './components/Navigation';
import NotificationsManager from './components/NotificationsManager';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './components/ui/card';
import { ToastPortal, showToast } from './components/ui/ToastPortal';

// Protected route component
const ProtectedRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/" />;
};

// Layout component that includes navigation for authenticated routes
const LayoutWithNavigation = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="pt-16 px-4 md:px-6 max-w-6xl mx-auto">
        {children}
      </main>
    </div>
  );
};

// Dashboard component 
const Dashboard = () => (
  <div className="mt-8">
    <Card>
      <CardHeader>
        <CardTitle>Welcome to your dashboard!</CardTitle>
        <CardDescription>
          Start chatting with your contacts or discover new people
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Use the navigation links above to explore the app. You can view your conversations, 
          find users, or update your profile settings.
        </p>
      </CardContent>
    </Card>
  </div>
);

function App() {
  // Get current user ID from localStorage
  const userId = localStorage.getItem('userId');
  
  // Global error handling
  useEffect(() => {
    // Add global error handler to show toast notifications
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Filter out some common React development errors and API errors
      const errorString = args.join(' ');
      
      // Skip showing toasts for certain errors
      const shouldSkip = 
        errorString.includes('React DevTools') || 
        errorString.includes('Warning:') ||
        errorString.includes('React does not recognize') ||
        // Don't show toasts for ERR_DUPLICATE_REQUEST errors
        errorString.includes('ERR_DUPLICATE_REQUEST') ||
        errorString.includes('A similar request is already in progress') ||
        // Other common non-critical errors
        errorString.includes('Request already in progress');
      
      if (!shouldSkip) {
        showToast(`Error: ${args[0]}`, 'error', 5000);
      }
      
      originalConsoleError.apply(console, args);
    };
    
    // Handle global unhandled promise rejections
    const handleUnhandledRejection = (event) => {
      showToast(`Unhandled error: ${event.reason?.message || 'Unknown error'}`, 'error', 5000);
    };
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      console.error = originalConsoleError;
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
  
  return (
    <Router>
      <div className="min-h-screen bg-background font-sans antialiased">
        <Routes>
          <Route 
            path="/" 
            element={isAuthenticated() ? <Navigate to="/dashboard" /> : <AuthPage />} 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <LayoutWithNavigation>
                  <Dashboard />
                </LayoutWithNavigation>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/conversations" 
            element={
              <ProtectedRoute>
                <LayoutWithNavigation>
                  <ConversationsPage />
                </LayoutWithNavigation>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/conversations/create" 
            element={
              <ProtectedRoute>
                <LayoutWithNavigation>
                  <CreateConversationPage />
                </LayoutWithNavigation>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/conversations/:id" 
            element={
              <ProtectedRoute>
                <LayoutWithNavigation>
                  <ConversationPage />
                </LayoutWithNavigation>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/users" 
            element={
              <ProtectedRoute>
                <LayoutWithNavigation>
                  <UsersPage />
                </LayoutWithNavigation>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/users/:id" 
            element={
              <ProtectedRoute>
                <LayoutWithNavigation>
                  <UserProfilePage />
                </LayoutWithNavigation>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <LayoutWithNavigation>
                  <UserProfilePage />
                </LayoutWithNavigation>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <LayoutWithNavigation>
                  <SettingsPage />
                </LayoutWithNavigation>
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        
        {/* Add NotificationsManager when user is authenticated */}
        {isAuthenticated() && <NotificationsManager />}
        
        {/* Toast notifications portal */}
        <ToastPortal />
      </div>
    </Router>
  );
}

export default App; 