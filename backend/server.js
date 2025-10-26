import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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


// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('📁 Created uploads directory');
}

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

// Body parsing middleware - but NOT for multipart/form-data
app.use((req, res, next) => {
    if (req.is('multipart/form-data')) {
        // Skip body parsing for file uploads - let multer handle it
        return next();
    }
    express.json()(req, res, next);
});
app.use((req, res, next) => {
    if (req.is('multipart/form-data')) {
        return next();
    }
    express.urlencoded({ extended: true })(req, res, next);
});

app.use('/uploads', express.static('uploads'), (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

// Multer error handling middleware
app.use((err, req, res, next) => {
    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File size too large. Maximum size is 50MB.' });
        }
        return res.status(400).json({ message: err.message });
    }
    next(err);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/hubs', learnerHubRoutes);
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
