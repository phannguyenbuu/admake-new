/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
  useState,
  type ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  socketId: string | null;
  connectionError: string | null;
  emit: (type: string, payload?: any) => void;
  on: (event: string, callback: (_data: any) => void) => void;
  off: (event: string, callback?: (_data: any) => void) => void;
  disconnect: () => void;
}

interface SocketProviderProps {
  children: ReactNode;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (_error: Error) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider: React.FC<SocketProviderProps> = ({
  children,
  onConnect,
  onDisconnect,
  onError,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const listenersRef = useRef<Map<string, Set<(_data: any) => void>>>(
    new Map()
  );
  const socketRef = useRef<Socket | null>(null);
  const intervalRef = useRef<number | null>(null);

  const socketUrl = import.meta.env.VITE_SOCKET;

  const getToken = () => {
    const token = localStorage.getItem("ACCESS_TOKEN");
    return token || "";
  };

  const updateConnectionStatus = useCallback(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const currentConnected = socket.connected;
    const currentId = socket.id;

    // Cập nhật trạng thái nếu có thay đổi
    if (currentConnected !== isConnected) {
      setIsConnected(currentConnected);
      setSocketId(currentId || null);

      if (currentConnected) {
        setConnectionError(null);
        onConnect?.();
      } else {
        onDisconnect?.();
      }
    } else if (currentConnected && currentId !== socketId) {
      // Cập nhật ID nếu thay đổi
      setSocketId(currentId || null);
    }
  }, [isConnected, socketId, onConnect, onDisconnect]);

  const buildSocket = useCallback(() => {
    if (socketRef.current) {
      return socketRef.current;
    }

    const token = getToken();

    const socket = io(socketUrl, {
      autoConnect: false,
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Sử dụng auth thay vì query (cách khuyến nghị cho Socket.IO v4+)
    socket.io.opts.query = { authorization: token };

    // Event listeners cơ bản
    socket.on("connect", () => {
      setIsConnected(true);
      setSocketId(socket.id || null);
      setConnectionError(null);
      onConnect?.();
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      setSocketId(null);
      onDisconnect?.();
    });

    socket.on("connect_error", (err) => {
      const errorMessage = err && err.message ? err.message : String(err);
      setConnectionError(errorMessage);
      setIsConnected(false);
      setSocketId(null);
      onError?.(err);
    });

    socket.on("error", (error) => {
      setConnectionError(String(error));
    });

    socketRef.current = socket;
    return socket;
  }, [socketUrl, onConnect, onDisconnect, onError]);

  useEffect(() => {
    const socket = buildSocket();

    // Connect nếu chưa connected
    if (!socket.connected) {
      socket.connect();
    }

    // Bắt đầu interval để cập nhật trạng thái liên tục
    intervalRef.current = window.setInterval(() => {
      updateConnectionStatus();
    }, 1000); // Kiểm tra mỗi giây

    return () => {
      const s = socketRef.current;
      if (!s) return;

      // Clear interval
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      s.off("connect");
      s.off("disconnect");
      s.off("connect_error");
      s.off("error");
      s.off("notification");
      s.off("reconnect");
    };
  }, [buildSocket, updateConnectionStatus]);

  const emit = useCallback((type: string, payload?: any) => {
    const s = socketRef.current;
    if (!s) {
      return;
    }
    s.emit(type, payload);
  }, []);

  const on = useCallback((event: string, callback: (_data: any) => void) => {
    const s = socketRef.current;
    if (!s) {
      return;
    }

    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
      s.on(event, (data: any) => {
        const set = listenersRef.current.get(event);
        if (!set) return;
        for (const fn of set) fn(data);
      });
    }

    listenersRef.current.get(event)!.add(callback);
  }, []);

  const off = useCallback((event: string, callback?: (_data: any) => void) => {
    const s = socketRef.current;
    if (!s) return;
    const set = listenersRef.current.get(event);
    if (!set) return;

    if (callback) set.delete(callback);
    else set.clear();

    if (!set.size) {
      s.off(event);
      listenersRef.current.delete(event);
    }
  }, []);

  const disconnect = useCallback(() => {
    const s = socketRef.current;
    if (!s) return;
    s.io.opts.reconnection = false;
    s.disconnect();
    socketRef.current = null;
    setIsConnected(false);
    setSocketId(null);

    // Clear interval
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const value: SocketContextType = {
    socket: socketRef.current,
    isConnected,
    socketId,
    connectionError,
    emit,
    on,
    off,
    disconnect,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within a SocketProvider");
  return ctx;
};
