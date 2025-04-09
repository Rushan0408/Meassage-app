# Messaging Application

A full-stack messaging application with real-time communication built using Spring Boot and React.

## Project Structure

- `src/` - Backend Spring Boot application
- `frontend/` - Frontend React application

## Features

- User authentication (register, login, logout)
- User profile management
- Real-time messaging
- User status (online/offline/away)
- Message notifications

## Backend Technologies

- Java 17+
- Spring Boot 3.x
- Spring Security with JWT authentication
- MongoDB
- WebSocket for real-time messaging

## Frontend Technologies

- React 18.x
- React Router for navigation
- Axios for API requests
- CSS for styling

## Getting Started

### Prerequisites

- Java 17 or higher
- Maven 3.6 or higher
- Node.js 14.x or higher
- npm 6.x or higher
- MongoDB 4.4 or higher

### Running the Backend

1. Make sure MongoDB is running on the default port (27017)
2. Run the Spring Boot application:
   ```
   mvn spring-boot:run
   ```
   The backend will start on http://localhost:8080

### Running the Frontend

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm start
   ```
   The frontend will start on http://localhost:3000

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/refresh` - Refresh authentication token
- `POST /api/auth/logout` - Logout user

### User Endpoints

- `GET /api/users` - Get all users
- `GET /api/users/{id}` - Get user by ID
- `PUT /api/users/{id}` - Update user
- `PUT /api/users/status` - Update user status
- `PUT /api/users/profile-picture` - Update profile picture

### Messaging Endpoints

- `GET /api/conversations` - Get user conversations
- `POST /api/conversations` - Create a new conversation
- `GET /api/conversations/{id}` - Get conversation by ID
- `GET /api/messages/conversation/{conversationId}` - Get messages for a conversation
- `POST /api/messages` - Send a new message 