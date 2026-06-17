// Mục đích: React Context Provider quản lý kết nối WebSocket (Socket.IO) cho toàn bộ ứng dụng.
// Ý nghĩa: Cung cấp socket instance và trạng thái kết nối (isConnected) thông qua Context, tránh kết nối thừa (thiết lập 1 lần ở root).
// Các biến đặc biệt: useSocket() hook để lấy socket bất kỳ đâu trong cây component.
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/useAuthStore';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket] = useState<Socket | null>(() => {
    if (typeof window === 'undefined') return null;
    const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return io(`${socketUrl}/notifications`, {
      withCredentials: true,
      autoConnect: false,
    });
  });
  
  const [isConnected, setIsConnected] = useState(false);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    const onConnect = () => {
      setIsConnected(true);
      if (user && user.id) {
        socket.emit('register', user.id);
      }
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // If user is logged in, connect socket. Otherwise, disconnect.
    if (user && user.id) {
      if (!socket.connected) {
        socket.connect();
      } else {
        // If already connected but user changes, re-register
        socket.emit('register', user.id);
      }
    } else {
      if (socket.connected) {
        socket.disconnect();
      }
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [socket, user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
