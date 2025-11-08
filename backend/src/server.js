require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { connectToDatabase } = require('./utils/db');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const adminExternalRoutes = require('./routes/adminExternal');
const adminStatsRoutes = require('./routes/adminStats');
const adminSchedulerRoutes = require('./routes/adminScheduler');
const notificationsRoutes = require('./routes/notifications');
const adminUploadRoutes = require('./routes/adminUploadRoutes');
const facultyRoutes = require('./routes/faculty');
const studentRoutes = require('./routes/student');
const { seedInitialAdmin, seedTestStudent } = require('./utils/seed');
const { Server } = require('socket.io');
const schedulerService = require('./services/schedulerService');
const Notification = require('./models/Notification');

const app = express();

// Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser clients (no origin) and any explicitly allowed origins
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', adminUploadRoutes);
app.use('/api/admin', adminExternalRoutes);
app.use('/api/admin', adminStatsRoutes);
app.use('/api/admin', adminSchedulerRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/student', studentRoutes);

// Root route
app.get('/', (_req, res) => {
  res.json({ 
    message: 'Stack Hack Backend API',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      admin: '/api/admin',
      faculty: '/api/faculty',
      student: '/api/student',
      notifications: '/api/notifications'
    }
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Use environment PORT or default to 4000
const PORT = process.env.PORT || 4000;
async function start() {
  if (!process.env.JWT_SECRET) {
    // eslint-disable-next-line no-console
    console.warn('Warning: JWT_SECRET is not set. Login will fail. Set it in your .env.');
  }
  await connectToDatabase(process.env.MONGODB_URI);
  await seedInitialAdmin();
  await seedTestStudent();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { 
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173', 
      credentials: true,
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type", "Authorization"],
      transports: ['websocket', 'polling']
    },
    allowEIO3: true,
    path: '/socket.io/',
  });
  // Handle socket connections and notifications
  io.on('connection', (socket) => {
    const { jobId, userId, role } = socket.handshake.query || {};
    if (jobId) socket.join(jobId);
    if (userId) {
      socket.join(`user:${userId}`);
      socket.join(`role:${role}`);
    }
    // Allow clients to request joining rooms after connection
    socket.on('join', (payload) => {
      try {
        if (!payload) return;
        // support both string payloads like 'user:123' or objects { userId, role }
        if (typeof payload === 'string') {
          // if multiple rooms sent (comma separated), join each
          payload.split(',').map(p => p.trim()).forEach(room => {
            if (room) {
              socket.join(room);
              console.log('Socket joined room (string):', room);
            }
          });
        } else if (typeof payload === 'object') {
          const { userId: uid, role: r } = payload;
          if (uid) {
            socket.join(`user:${uid}`);
            console.log('Socket joined room:', `user:${uid}`);
          }
          if (r) {
            socket.join(`role:${r}`);
            console.log('Socket joined room:', `role:${r}`);
          }
        }
      } catch (e) {
        console.error('Join handler error:', e);
      }
    });
    
    socket.on('readNotification', async (notificationId) => {
      try {
        await Notification.findByIdAndUpdate(notificationId, { read: true });
        io.to(`user:${userId}`).emit('notificationRead', notificationId);
      } catch (e) {
        console.error('Read notification error:', e);
      }
    });
    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected', socket.id, reason);
    });
  });
  
  // Make io available to other modules
  app.set('io', io);
  
  schedulerService.init(io);

  // Development helper endpoint to emit a notification without requiring admin auth
  if (process.env.NODE_ENV === 'development' || process.env.ALLOW_DEV_EMIT === 'true') {
    const Notification = require('./models/Notification');
    app.post('/dev/emit-notification', express.json(), async (req, res) => {
      try {
        const { userId, role, title, message } = req.body || {};
        if (!userId || !title || !message) return res.status(400).json({ message: 'userId, title and message required' });
        const notif = await Notification.create({ userId: String(userId), role: role || 'faculty', title, message });
        io.to(`user:${userId}`).emit('newNotification', { notification: notif });
        console.log('Dev emitted notification to', `user:${userId}`);
        return res.json({ notification: notif });
      } catch (e) {
        console.error('Dev emit-notification error:', e);
        return res.status(500).json({ message: 'Failed to emit', error: e.message });
      }
    });
  }
  server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on port ${PORT}`);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server:', err);
  process.exit(1);
});


