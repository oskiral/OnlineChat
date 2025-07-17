# OnlineChat

A real-time chat application built with React and Node.js.

## Features

- Real-time messaging with Socket.IO
- User authentication with JWT
- Friend system (add/remove friends, friend requests)
- File and image uploads
- Avatar management
- Unread message counts
- Direct chat support
- Group chat support (future feature)

## Tech Stack

### Frontend
- React 19
- Vite
- Socket.IO Client
- CSS3

### Backend
- Node.js
- Express.js
- Socket.IO
- SQLite3
- JWT for authentication
- Multer for file uploads
- bcrypt for password hashing

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd OnlineChat
```

2. Install server dependencies:
```bash
cd server
npm install
```

3. Install client dependencies:
```bash
cd ../app
npm install
```

4. Configure environment variables:

Create `.env` file in the `server` directory:
```
JWT_SECRET=your_jwt_secret_here
PORT=3001
NODE_ENV=development
```

Create `.env` file in the `app` directory:
```
VITE_API_URL=http://localhost:3001
```

## Running the Application

### Using VS Code Tasks (Recommended)
1. Open the project in VS Code
2. Press `Ctrl+Shift+P`
3. Type "Tasks: Run Task"
4. Select "Start Backend Server"
5. Repeat and select "Start Frontend Server"

### Using Terminal

1. Start the backend server:
```bash
cd server
npm run dev
```

2. Start the frontend (in a new terminal):
```bash
cd app
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/user/me` - Get current user info
- `GET /api/user/search` - Search users
- `GET /api/user/:id` - Get user by ID

### Friends
- `GET /api/friends/getFriends` - Get user's friends
- `GET /api/friends/getFriendsWithLastMessage` - Get friends with last messages
- `GET /api/friends/friendRequests` - Get pending friend requests
- `POST /api/friends/friendRequests/send` - Send friend request
- `POST /api/friends/friendRequests/accept` - Accept friend request
- `POST /api/friends/friendRequests/decline` - Decline friend request

### Rooms
- `GET /api/rooms` - Get user's chat rooms
- `POST /api/rooms` - Create or get room

### Messages
- `GET /api/messages/unread-counts` - Get unread message counts
- `POST /upload` - Upload file

## Socket Events

### Client to Server
- `getMessages` - Get messages for a chat
- `newMessage` - Send a new message
- `messagesRead` - Mark messages as read
- `markMessagesRead` - Mark specific messages as read

### Server to Client
- `messages` - Receive messages
- `newMessage` - Receive new message
- `messagesReadConfirmation` - Confirmation of read status
- `messageReadBy` - Message read by specific user
- `friend-added` - Friend was added
- `forceLogout` - Force user logout

## Project Structure

```
OnlineChat/
├── app/                    # Frontend React application
│   ├── Components/         # React components
│   ├── src/               # Main source files
│   ├── media/             # Static assets
│   └── utils/             # Utility functions
├── server/                # Backend Node.js application
│   ├── src/
│   │   ├── config/        # Database and configuration
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Express middleware
│   │   ├── routes/        # API routes
│   │   ├── sockets/       # Socket.IO handlers
│   │   └── utils/         # Utility functions
│   └── uploads/           # Uploaded files
└── .vscode/               # VS Code configuration
```

## Development

The application uses SQLite for the database, which is automatically created when the server starts. The database includes tables for users, messages, rooms, friendships, friend requests, sessions, and message reads.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.
