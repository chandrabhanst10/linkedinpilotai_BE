import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt.js';

export interface CustomSocket extends Socket {
  userId?: string;
}

let ioInstance: Server | null = null;

export const initSocket = (server: HttpServer): Server => {
  const allowedOrigins = [process.env.CLIENT_URL].filter(Boolean);
  ioInstance = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  ioInstance.use((socket: CustomSocket, next) => {
    let token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

    // Fallback to cookie
    if (!token && socket.handshake.headers?.cookie) {
      const cookies: Record<string, string> = {};
      socket.handshake.headers.cookie.split(';').forEach((cookie) => {
        const parts = cookie.split('=');
        const name = parts[0].trim();
        const value = parts.slice(1).join('=');
        cookies[name] = decodeURIComponent(value);
      });
      if (cookies.accessToken) {
        token = cookies.accessToken;
      }
    }

    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return next(new Error('Authentication error: Token expired or invalid'));
    }

    socket.userId = decoded.id;
    next();
  });

  ioInstance.on('connection', (socket: CustomSocket) => {
    if (!socket.userId) return;
    console.log(`Socket client connected: ${socket.id} (User: ${socket.userId})`);
    
    // Join room for target user
    socket.join(socket.userId);

    socket.on('disconnect', () => {
      console.log(`Socket client disconnected: ${socket.id}`);
    });
  });

  return ioInstance;
};

export interface INotificationPayload {
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  isRead: boolean;
  createdAt: Date;
}

export const sendNotification = (userId: string, notificationData: Partial<INotificationPayload>): void => {
  if (!ioInstance) {
    console.warn('Socket.io instance not initialized, cannot emit notification');
    return;
  }
  
  // Emit to user's private room
  ioInstance.to(userId.toString()).emit('notification', notificationData);
  console.log(`[Socket.io] Pushed notification to user ${userId}: ${notificationData.title}`);
};

export const getIO = (): Server | null => ioInstance;
