export interface NotificationData {
  id: number;
  userId: number;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  type: string;
  senderAvatar?: string;
}

export const addNotification = (userId: number, title: string, content: string, type: string, senderAvatar?: string) => {
  if (typeof window === 'undefined') return;
  const key = `foodai_notifications_${userId}`;
  const stored = localStorage.getItem(key) || '[]';
  let notifs: NotificationData[] = [];
  try {
    notifs = JSON.parse(stored);
  } catch (e) {}
  
  const newNotif: NotificationData = {
    id: Date.now() + Math.random(),
    userId,
    title,
    content,
    isRead: false,
    createdAt: new Date().toISOString(),
    type,
    senderAvatar
  };
  
  localStorage.setItem(key, JSON.stringify([newNotif, ...notifs]));
  
  // Dispatch a custom event to notify components in the same window
  window.dispatchEvent(new Event('foodai_notifications_updated'));
};
