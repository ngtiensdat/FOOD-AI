/**
 * Mục đích: Custom hook quản lý toàn bộ logic thông báo (notification).
 * Kiến thức: DIP – Navbar không còn phụ thuộc trực tiếp vào notificationService.
 *             SRP – tách biệt notification logic khỏi navigation/UI logic của Navbar.
 * Biến, hàm đặc biệt: useNotifications, handleNotificationClick, handleMarkAllAsRead, handleClearAll.
 */
import { useState, useEffect } from 'react';
import { notificationService } from '@/services/notification.service';
import { toast } from '@/store/useToastStore';
import { LABELS } from '@/constants/labels';

export interface NotificationItem {
  id: string;
  title: string;
  content: string;
  type:
    | 'LIKE'
    | 'COMMENT'
    | 'REPLY'
    | 'SHARE'
    | 'LEVEL_UP'
    | 'PROFILE_UPDATE'
    | 'SYSTEM'
    | 'WARNING'
    | 'PROMOTION'
    | 'MODERATION_REMOVE'
    | 'MODERATION_RESOLVE'
    | 'MODERATION_DISMISS'
    | string;
  isRead: boolean;
  senderAvatar?: string;
  createdAt: string;
  postId?: number;
}

interface UseNotificationsParams {
  userId?: string | number | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  socket?: any;
}

export function useNotifications({ userId, socket }: UseNotificationsParams) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeNotification, setActiveNotification] = useState<NotificationItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Fetch initial notifications
  useEffect(() => {
    if (userId) {
      const fetchNotifications = async () => {
        try {
          const res = await notificationService.getNotifications(1, 50);
          setNotifications(res || []);
        } catch (e) {
          console.error('Lỗi khi tải thông báo:', e);
        }
      };
      fetchNotifications();
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNotifications([]);
    }
  }, [userId]);

  // Listen for real-time notifications via WebSocket
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notif: NotificationItem) => {
      setNotifications((prev) => [notif, ...prev]);
      toast.success(notif.title || LABELS.NAV.NOTIFICATIONS.NEW_NOTIFICATION);
    };

    socket.on('notification', handleNewNotification);
    return () => {
      socket.off('notification', handleNewNotification);
    };
  }, [socket]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleNotificationClick = async (notifId: string) => {
    try {
      await notificationService.markAsRead(notifId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n))
      );
    } catch (e) {
      console.error('Lỗi khi đọc thông báo:', e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.error('Lỗi khi đọc tất cả thông báo:', e);
    }
  };

  const handleClearAll = async () => {
    try {
      await notificationService.clearAll();
      setNotifications([]);
    } catch (e) {
      console.error('Lỗi khi xoá tất cả thông báo:', e);
    }
  };

  return {
    notifications,
    setNotifications,
    showNotifications,
    setShowNotifications,
    activeNotification,
    setActiveNotification,
    showDetailModal,
    setShowDetailModal,
    unreadCount,
    handleNotificationClick,
    handleMarkAllAsRead,
    handleClearAll,
  };
}
