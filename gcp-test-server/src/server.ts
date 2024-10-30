import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    },
    pingTimeout: 60000,
    pingInterval: 25000
});

// Health check
app.get('/_ah/health', (req, res) => {
    res.status(200).send('OK');
});

// Add ping endpoint for testing
app.get('/ping', (req, res) => {
    res.json({ 
        message: 'pong',
        timestamp: new Date().toISOString()
    });
});

let count = 0;

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.emit('count', count);

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

setInterval(() => {
    count++;
    io.emit('count', count);
    console.log('Count updated:', count);
}, 2000);

const PORT = process.env.PORT || 8081;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});