# OnlineChat

Real-time chat application with React frontend and Node.js backend using Socket.IO.

## Features

- Real-time messaging with Socket.IO
- User authentication (JWT)
- Friend system with requests
- File/image sharing
- Avatar upload
- Message read status

## Quick Start

### Backend
```bash
cd server
npm install
npm run dev
```

### Frontend
```bash
cd app
npm install
npm run dev
```

Default URLs:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Project Structure

```
app/                    # React frontend
├── src/
│   ├── components/     # React components
│   │   ├── auth/       # Login/Register
│   │   ├── chat/       # Chat interface
│   │   ├── friends/    # Friends management
│   │   ├── settings/   # User settings
│   │   └── ui/         # UI components
│   ├── contexts/       # React contexts
│   └── utils/          # Utilities
└── constants.js        # API endpoints

server/                 # Node.js backend
├── src/
│   ├── controllers/    # Route handlers
│   ├── middleware/     # Auth & uploads
│   ├── routes/         # API routes
│   ├── sockets/        # Socket.IO handlers
│   └── config/         # Database & config
└── uploads/           # User uploaded files
```

## Tech Stack

**Frontend:** React 19, Socket.IO Client, Vite
**Backend:** Node.js, Express, Socket.IO, SQLite, JWT, Multer
