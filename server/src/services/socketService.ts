import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';

export const setupSocketHandlers = (io: Server) => {
  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { ngoProfile: true }
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.data.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user;
    console.log(`User ${user.name} connected`);

    // Join user to their personal room
    socket.join(`user_${user.id}`);

    // Join NGO users to NGO room for notifications
    if (user.role === 'NGO' && user.ngoProfile) {
      socket.join(`ngo_${user.ngoProfile.id}`);
    }

    // Handle joining report rooms for real-time updates
    socket.on('join_report', (reportId) => {
      socket.join(`report_${reportId}`);
    });

    socket.on('leave_report', (reportId) => {
      socket.leave(`report_${reportId}`);
    });

    // Handle typing indicators for report updates
    socket.on('typing_start', (reportId) => {
      socket.to(`report_${reportId}`).emit('user_typing', {
        userId: user.id,
        userName: user.name
      });
    });

    socket.on('typing_stop', (reportId) => {
      socket.to(`report_${reportId}`).emit('user_stopped_typing', {
        userId: user.id
      });
    });

    socket.on('disconnect', () => {
      console.log(`User ${user.name} disconnected`);
    });
  });

  // Helper functions to emit events
  io.emitToUser = (userId: string, event: string, data: any) => {
    io.to(`user_${userId}`).emit(event, data);
  };

  io.emitToNGO = (ngoId: string, event: string, data: any) => {
    io.to(`ngo_${ngoId}`).emit(event, data);
  };

  io.emitToReport = (reportId: string, event: string, data: any) => {
    io.to(`report_${reportId}`).emit(event, data);
  };
};

// Extend Socket.IO types
declare module 'socket.io' {
  interface Server {
    emitToUser(userId: string, event: string, data: any): void;
    emitToNGO(ngoId: string, event: string, data: any): void;
    emitToReport(reportId: string, event: string, data: any): void;
  }
}