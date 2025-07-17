# OnlineChat

A real-time chat application built with React and Node.js.

## Features

### ✅ Implemented
- **Real-time messaging** with Socket.IO
- **User authentication** with JWT tokens
- **Friend system** (add/remove friends, friend requests)
- **File and image uploads** with secure handling
- **Avatar management** for user profiles
- **Unread message counts** with real-time updates
- **Direct chat support** between users
- **Optimistic updates** for immediate UI feedback
- **Message deduplication** to prevent duplicates
- **Responsive design** for various screen sizes
- **Session persistence** across browser refreshes

### 🚧 In Development
- **Group chat support** (backend ready, frontend pending)
- **Message reactions** and replies
- **Enhanced file sharing** with previews

### 📋 Planned Features
- **Push notifications** for new messages
- **Dark/Light theme toggle**
- **Message search functionality**
- **User status indicators** (online/offline)
- **Message encryption** for privacy
- **Voice messages** support
- **Screen sharing** capabilities

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
│   ├── components/           # Organized React components
│   │   ├── index.js          # Main component exports
│   │   ├── auth/             # Authentication components
│   │   │   ├── index.js      # Auth exports
│   │   │   └── Login.jsx     # Login/Register form
│   │   ├── chat/             # Chat-related components
│   │   │   ├── index.js      # Chat exports
│   │   │   └── Chat.jsx      # Main chat interface
│   │   ├── friends/          # Friend system components
│   │   │   ├── index.js      # Friends exports
│   │   │   ├── FriendList.jsx     # Friends list
│   │   │   ├── FriendCard.jsx     # Individual friend item
│   │   │   ├── FriendsView.jsx    # Friends page view
│   │   │   ├── FriendSearch.jsx   # Friend search component
│   │   │   ├── FriendRequests.jsx # Friend requests list
│   │   │   ├── FriendRequestCard.jsx # Friend request item
│   │   │   └── FriendsPage.jsx    # Complete friends page
│   │   ├── layout/           # Layout components
│   │   │   ├── index.js      # Layout exports
│   │   │   ├── AppLayout.jsx # Main app layout
│   │   │   ├── Sidebar.jsx   # Navigation sidebar
│   │   │   └── RightPanel.jsx # Main content area
│   │   ├── settings/         # Settings components
│   │   │   ├── index.js      # Settings exports
│   │   │   ├── SettingsBlock.jsx # Settings container
│   │   │   └── UserSettings.jsx  # User settings form
│   │   └── ui/               # Reusable UI components
│   │       ├── index.js      # UI exports
│   │       ├── Avatar.jsx    # Avatar component
│   │       └── UserPanel.jsx # User profile panel
│   ├── contexts/
│   │   └── SocketProvider.jsx # Socket.IO context provider
│   ├── styles/               # Organized CSS files
│   │   ├── Avatar.css        # Avatar styles
│   │   ├── Chat.css          # Chat styles
│   │   ├── FriendSearch.css  # Friend search styles
│   │   ├── FriendsView.css   # Friends view styles
│   │   ├── Login.css         # Login form styles
│   │   ├── Settings.css      # Settings styles
│   │   └── UserSettings.css  # User settings styles
│   └── utils/
│       └── resizeImage.js    # Image processing utilities
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

## Architecture & Design Principles

### Component Organization
The frontend follows a feature-based folder structure for better maintainability:

- **`auth/`** - Authentication related components (Login, Register)
- **`chat/`** - Core chat functionality (Chat interface, Messages)
- **`friends/`** - Friend system (Friend list, Requests, Search)
- **`layout/`** - Application layout components (Sidebar, Panels)
- **`settings/`** - User settings and preferences
- **`ui/`** - Reusable UI components (Avatar, Buttons, etc.)

Each folder contains an `index.js` file for clean imports:
```javascript
// Instead of
import FriendList from './components/friends/FriendList';
import FriendCard from './components/friends/FriendCard';

// Use
import { FriendList, FriendCard } from './components/friends';
```

### Real-time Communication
- **Socket.IO** for bidirectional real-time communication
- **Optimistic updates** for immediate UI feedback
- **Message deduplication** to prevent duplicate messages
- **Connection state management** with automatic reconnection

### State Management Strategy
- **React Context** for global state (Socket connection, User data)
- **Local state** for component-specific data
- **Proper cleanup** in useEffect hooks to prevent memory leaks

### File Upload System
- **Multer** middleware for handling file uploads
- **Image compression** for optimized storage
- **Secure file validation** and path handling
- **Static file serving** for uploaded content

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

## Recent Improvements

### Frontend Refactor (Latest)
- **🔧 Reorganized component structure** into logical folders (auth/, chat/, friends/, layout/, settings/, ui/)
- **🎨 Moved CSS files** to dedicated `styles/` directory
- **📦 Created index.js exports** for cleaner imports
- **🔗 Updated all import paths** to use new structure

### Bug Fixes (Latest)
- **🐛 Fixed message duplication** in real-time chat caused by optimistic updates
- **✅ Improved message deduplication logic** with proper temp ID replacement
- **🎯 Fixed message rendering** showing all messages as from other users
- **📁 Fixed file upload paths** and added missing authentication headers
- **🔍 Enhanced debugging** with comprehensive logging throughout the application

### Technical Improvements
- **🧹 Better socket handling** with proper listener cleanup
- **⚡ Optimized optimistic updates** with robust fallback mechanisms
- **🔐 Enhanced security** for file uploads with proper validation
- **📊 Improved error handling** across all components

## Planned Improvements

### Features
- [ ] Group chat support (backend ready)
- [ ] Message reactions and replies
- [ ] File sharing improvements with previews
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

## Usage Examples

### Adding New Components
When creating new components, follow the organized structure:

```javascript
// Create component in appropriate folder
// src/components/newFeature/NewComponent.jsx

// Export from folder index
// src/components/newFeature/index.js
export { default as NewComponent } from './NewComponent';

// Import in parent components
import { NewComponent } from '../components/newFeature';
```

### API Integration Example
```javascript
// Use constants for consistent endpoints
import { API_ENDPOINTS } from '../constants';

const response = await fetch(API_ENDPOINTS.FRIENDS.GET_FRIENDS, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### Socket.IO Usage Pattern
```javascript
useEffect(() => {
  if (!socket) return;

  const handleEvent = (data) => {
    // Handle socket event
  };

  socket.on('eventName', handleEvent);

  return () => {
    socket.off('eventName', handleEvent);
  };
}, [socket]);
```

## Troubleshooting

### Common Issues

**Socket connection fails:**
- Check if backend server is running on port 3001
- Verify JWT token is valid and not expired
- Check browser console for connection errors

**File uploads not working:**
- Ensure uploads directory exists in server folder
- Check file permissions on server
- Verify authentication headers are included

**Messages appearing twice:**
- This was fixed in the latest update with improved deduplication logic
- If still occurring, check browser console for errors

**Components not rendering:**
- Check import paths after the reorganization
- Verify all required dependencies are installed
- Look for errors in browser developer tools

### Development Tips
- Use browser developer tools to inspect Socket.IO events
- Check server logs for API errors and database issues
- Use React Developer Tools for component debugging
- Monitor network tab for failed API requests
