import { useContext } from 'react';
import { SocketContext } from '../contexts/SocketProvider';
import { SOCKET_EVENTS } from '../constants';

export function useUserStatus() {
  const { socket, userStatus, setUserStatus } = useContext(SocketContext);

  const getUserStatus = (userId) => {
    return userStatus.get(userId) || { status: 'offline', lastSeen: null };
  };

  const getFriendsStatus = (friendIds) => {
    if (!socket) return [];
    
    socket.emit(SOCKET_EVENTS.GET_FRIENDS_STATUS, { friendIds }, (friendsStatus) => {
      const statusMap = new Map(userStatus);
      friendsStatus.forEach(({ userId, status, lastSeen }) => {
        statusMap.set(userId, { status, lastSeen });
      });
      setUserStatus(statusMap);
    });
  };

  const isUserOnline = (userId) => {
    return getUserStatus(userId).status === 'online';
  };

  const getLastSeen = (userId) => {
    const status = getUserStatus(userId);
    if (status.status === 'online') return 'Online';
    if (!status.lastSeen) return 'Never seen';
    
    const lastSeen = new Date(status.lastSeen);
    const now = new Date();
    const diffMs = now - lastSeen;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return lastSeen.toLocaleDateString();
  };

  return {
    getUserStatus,
    getFriendsStatus,
    isUserOnline,
    getLastSeen,
    userStatus
  };
}
