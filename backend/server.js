import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import learnerHubRoutes from './routes/learnerHubs.js';
import trainerRoutes from './routes/trainers.js';
import sessionRoutes from './routes/sessions.js';
import ratingRoutes from './routes/ratings.js';
import roadmapRoutes from './routes/roadmaps.js';
import activityRoutes from './routes/activities.js';
import messageRoutes from './routes/messages.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST']
    }
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'), (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

// Multer error handling middleware
app.use((err, req, res, next) => {
    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File size too large. Maximum size is 5MB.' });
        }
        return res.status(400).json({ message: err.message });
    }
    next(err);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/learner-hubs', learnerHubRoutes);
app.use('/api/trainers', trainerRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/roadmaps', roadmapRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/messages', messageRoutes);

// Socket.IO for real-time chat
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-hub', (hubId) => {
        socket.join(`hub-${hubId}`);
        console.log(`User ${socket.id} joined hub ${hubId}`);
    });

    socket.on('send-message', (data) => {
        io.to(`hub-${data.hubId}`).emit('receive-message', data);
    });

    socket.on('typing', (data) => {
        socket.to(`hub-${data.hubId}`).emit('user-typing', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

export { io };
