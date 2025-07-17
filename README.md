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

### Alternative: Manual Setup

If you prefer to run servers manually:

1. Start the backend:
```bash
cd server
npm run dev
```

2. Start the frontend (in a new terminal):
```bash
cd app
npm run dev
```
## Project Structure

### Frontend (app/)
```text
app/
├── public/
│   └── media/                 # Static assets (icons, images)
├── src/
│   ├── App.jsx               # Main application component
│   ├── main.jsx              # React entry point
│   ├── index.css             # Global styles
│   ├── constants.js          # API endpoints and constants
│   └── contexts/
│       └── SocketProvider.jsx # Socket.IO context provider
├── Components/               # React components (current structure)
│   ├── AppLayout.jsx         # Main layout component
│   ├── Sidebar.jsx           # Navigation sidebar
│   ├── RightPanel.jsx        # Main content area
│   ├── Chat.jsx              # Chat interface
│   ├── FriendList.jsx        # Friends list component
│   ├── Login.jsx             # Authentication form
│   ├── UserPanel.jsx         # User profile panel
│   ├── Avatar.jsx            # Avatar component
│   ├── Settings*.jsx         # Settings components
│   ├── Friend*.jsx           # Friend-related components
│   └── *.css                 # Component styles
├── utils/
│   └── resizeImage.js        # Image processing utilities
├── package.json              # Frontend dependencies
└── vite.config.js            # Vite configuration
```

### Backend (server/)
```text
server/
├── src/
│   ├── index.js              # Server entry point
│   ├── config/
│   │   ├── database.js       # SQLite database setup
│   │   ├── config.js         # Environment configuration
│   │   └── chat.db           # SQLite database file
│   ├── controllers/          # Route handlers
│   │   ├── authController.js # Authentication logic
│   │   ├── userController.js # User management
│   │   ├── friendsController.js # Friends system
│   │   ├── messageController.js # Message handling
│   │   └── roomController.js # Chat rooms
│   ├── middleware/           # Express middleware
│   │   ├── authenticate.js   # JWT authentication
│   │   ├── uploadAvatar.js   # Avatar upload handling
│   │   └── uploadFile.js     # File upload handling
│   ├── routes/               # API routes
│   │   ├── authRoutes.js     # Authentication endpoints
│   │   ├── userRoutes.js     # User endpoints
│   │   ├── friendRoutes.js   # Friends endpoints
│   │   ├── messageRoutes.js  # Message endpoints
│   │   └── roomRoutes.js     # Room endpoints
│   ├── sockets/              # Socket.IO handlers
│   │   ├── index.js          # Socket connection management
│   │   └── handlers/         # Event handlers
│   │       ├── handleGetMessages.js
│   │       ├── handleNewMessage.js
│   │       └── handleMarkMessagesRead.js
│   ├── utils/                # Utility functions
│   │   ├── ioInstance.js     # Socket.IO instance management
│   │   └── room.js           # Room management utilities
│   └── uploads/              # User uploaded files
│       └── avatars/          # User avatar images
├── package.json              # Backend dependencies
└── .env                      # Environment variables
```

## API Endpoints
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

## Development Guidelines

### Code Organization
- Keep components small and focused on a single responsibility
- Use descriptive names for components, functions, and variables
- Group related components in logical folders
- Separate business logic from UI components

### State Management
- Use React Context for global state (Socket, User)
- Keep local state in components when possible
- Implement proper state cleanup in useEffect hooks

### API Integration
- Use constants for API endpoints (see `src/constants.js`)
- Implement proper error handling for API calls
- Add loading states for better UX

### Socket.IO Best Practices
- Handle connection/disconnection gracefully
- Implement proper event cleanup
- Use namespaces for different types of events

### Performance Considerations
- Implement message pagination for large chat histories
- Use React.memo for frequently re-rendering components
- Optimize image uploads with compression

## Planned Improvements

### Features
- [ ] Group chat support
- [ ] Message reactions and replies
- [ ] File sharing improvements
- [ ] Push notifications
- [ ] Dark/Light theme toggle
- [ ] Message search functionality
- [ ] User status indicators (online/offline)


## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.
