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
    }
});

interface Coin {
    id: string;
    position: [number, number, number];
}

interface GameState {
    coins: Coin[];
}

let globalGameState: GameState = {
    coins: [],
};

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    socket.emit('initialState', globalGameState);

    socket.on('insertCoin', (coin: Coin) => {
        globalGameState.coins.push(coin);
        io.emit('updateGameState', globalGameState);
    });

    socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
    });
});

server.listen(4000, () => {
    console.log('Server listening on port 4000');
});