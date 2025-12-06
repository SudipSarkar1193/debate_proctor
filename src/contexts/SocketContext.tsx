import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { io, Socket } from "socket.io-client";


interface SocketContextType {
  socket: Socket | null;
}

interface SocketProviderProps {
  children: ReactNode;
}


const SocketContext = createContext<SocketContextType | null>(null);


export function useSocket(): Socket {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error("useSocket must be used inside <SocketProvider>");
  }

  return context.socket!;
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const url = import.meta.env.VITE_SERVER_URL as string;

  useEffect(() => {
    const newSocket: Socket = io(url, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 2000,
      timeout: 20000,
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [url]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
