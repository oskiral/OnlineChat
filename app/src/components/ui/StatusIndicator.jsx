import { useUserStatus } from '../../hooks/useUserStatus';
import '../../styles/StatusIndicator.css';

export default function StatusIndicator({ userId, showText = false, size = 'small' }) {
  const { isUserOnline, getLastSeen } = useUserStatus();
  
  const isOnline = isUserOnline(userId);
  const lastSeen = getLastSeen(userId);

  return (
    <div className={`status-indicator ${size}`}>
      <div className={`status-dot ${isOnline ? 'online' : 'offline'}`}></div>
      {showText && (
        <span className="status-text">
          {isOnline ? 'Online' : lastSeen}
        </span>
      )}
    </div>
  );
}
