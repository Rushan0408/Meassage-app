# Messaging App Frontend

This is the frontend for a messaging application built with React. It connects to a Spring Boot backend that provides authentication, user management, and messaging capabilities.

## Features

- User authentication (login/register)
- User profile management
- Messaging interface
- Real-time updates with WebSocket

## Getting Started

### Prerequisites

- Node.js 14.x or higher
- npm 6.x or higher

### Installation

1. Clone the repository
2. Navigate to the frontend directory:
   ```
   cd frontend
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Start the development server:
   ```
   npm start
   ```

The app will run at http://localhost:3000 and will proxy API requests to the backend server at http://localhost:8080.

## Project Structure

- `src/components` - Reusable UI components
- `src/pages` - Page components that represent routes
- `src/services` - API service functions
- `src/utils` - Utility functions

## Backend API

The frontend connects to a Spring Boot backend with the following API endpoints:

### Authentication
- POST /api/auth/register - Register a new user
- POST /api/auth/login - Login
- GET /api/auth/me - Get current user profile
- POST /api/auth/logout - Logout
- POST /api/auth/refresh - Refresh authentication token

### User Management
- GET /api/users - Get list of users
- GET /api/users/{id} - Get user by ID
- PUT /api/users/{id} - Update user
- PUT /api/users/status - Update user status
- PUT /api/users/profile-picture - Update profile picture 