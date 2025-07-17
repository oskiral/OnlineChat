// API Configuration
export const API_BASE_URL = 'http://localhost:3001';

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
  },
  USER: {
    ME: '/api/user/me',
    SEARCH: '/api/user/search',
    BY_ID: (id) => `/api/user/${id}`,
  },
  FRIENDS: {
    GET_FRIENDS: '/api/friends/getFriends',
    GET_FRIENDS_WITH_MESSAGES: '/api/friends/getFriendsWithLastMessage',
    REQUESTS: '/api/friends/friendRequests',
    SEND_REQUEST: '/api/friends/friendRequests/send',
    ACCEPT_REQUEST: '/api/friends/friendRequests/accept',
    DECLINE_REQUEST: '/api/friends/friendRequests/decline',
  },
  ROOMS: '/api/rooms',
  MESSAGES: {
    UNREAD_COUNTS: '/api/messages/unread-counts',
    UPLOAD: '/upload',
  },
};

// Socket Events
export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  NEW_MESSAGE: 'newMessage',
  GET_MESSAGES: 'getMessages',
  MESSAGES_READ: 'messagesRead',
  MARK_MESSAGES_READ: 'markMessagesRead',
  MESSAGES_READ_CONFIRMATION: 'messagesReadConfirmation',
  MESSAGE_READ_BY: 'messageReadBy',
  FRIEND_ADDED: 'friend-added',
  FORCE_LOGOUT: 'forceLogout',
};
