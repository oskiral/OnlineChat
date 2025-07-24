// API Configuration
export const API_BASE_URL = 'http://localhost:3001';

// App Configuration
export const MESSAGE_LIMITS = {
  MAX_LENGTH: 1000,
  WARNING_THRESHOLD: 900
};

export const FILE_LIMITS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
};

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    // Legacy
    LEGACY_LOGOUT: '/logout',
  },
  USER: {
    ME: '/api/user/me',
    SEARCH: '/api/user/search',
    BY_ID: (id) => `/api/user/${id}`,
    UPLOAD_AVATAR: '/api/user/uploadAvatar',
    REMOVE_AVATAR: '/api/user/removeAvatar',
    UPDATE_USERNAME: '/api/user/changeUsername',
    CHANGE_PASSWORD: '/api/user/changePassword',
    // Legacy endpoints
    UN_UPLOAD_AVATAR: '/unUploadAvatar',
    GET_USER: (id) => `/users/${id}`,
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
    UPLOAD: '/api/messages/upload',
  },
  POLLS: {
    CREATE: '/api/polls',
    GET: '/api/polls',
    VOTE: '/api/polls/vote',
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
  // Status events
  USER_STATUS_CHANGED: 'user_status_changed',
  GET_USER_STATUS: 'get_user_status',
  GET_FRIENDS_STATUS: 'get_friends_status',
};

