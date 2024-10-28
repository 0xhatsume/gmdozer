import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import RAPIER from '@dimforge/rapier3d-compat';
import cors from 'cors';

interface PhysicsObject {
    id: string;
    position: [number, number, number];
    rotation: [number, number, number];
    type: 'coin' | 'platform' | 'wall';
}
    
class PhysicsWorld {
    private world!: RAPIER.World;
    private bodies!: Map<string, RAPIER.RigidBody>;

    constructor() {
        // Initialize physics world
        RAPIER.init().then(() => {
            const gravity = { x: 0.0, y: -9.81, z: 0.0 };
            this.world = new RAPIER.World(gravity);
            this.bodies = new Map();

            // Add static platform and walls
            this.addPlatform();
        });
    }

    addPlatform() {
        // Add static ground platform
        const groundColliderDesc = RAPIER.ColliderDesc.cuboid(5.0, 0.25, 4.0);
        this.world.createCollider(groundColliderDesc);
    }

    addCoin(coin:Coin) {
        const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(coin.position[0], coin.position[1], coin.position[2]);
        
        const rigidBody = this.world.createRigidBody(rigidBodyDesc);
        const colliderDesc = RAPIER.ColliderDesc.cylinder(0.05, 0.4);
        this.world.createCollider(colliderDesc, rigidBody);
        
        this.bodies.set(coin.id, rigidBody);
    }

    step() {
        this.world.step();
        
        // Get updated positions of all objects
        const positions: PhysicsObject[] = [];
        this.bodies.forEach((body, id) => {
            const position = body.translation();
            const rotation = body.rotation();
            positions.push({
                id,
                position: [position.x, position.y, position.z],
                rotation: [rotation.x, rotation.y, rotation.z],
                type: 'coin'
            });
        });
        
        return positions;
    }
}


const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
    origin: '*',
    methods: ['GET', 'POST']
    }
});

// Initialize physics
const physicsWorld = new PhysicsWorld();

// Run physics loop
const PHYSICS_STEP = 1000 / 60; // 60 FPS
setInterval(() => {
    const positions = physicsWorld.step();
    io.emit('physicsUpdate', positions);
    //console.log("physicsUpdate: ", positions);
}, PHYSICS_STEP);

interface Coin {
    id: string;
    position: [number, number, number];
    rotation: [number, number, number];
}

interface GameState {
    coins: Coin[];
}

// let globalGameState: GameState = {
//     coins: [],
// };

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    const initialState = physicsWorld.step();
    //socket.emit('initialState', globalGameState);
    socket.emit('initialState', initialState);

    socket.on('insertCoin', (coin: Coin) => {
        //globalGameState.coins.push(coin);
        physicsWorld.addCoin(coin);
        //io.emit('updateGameState', globalGameState);
    });

    socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
    });
});

server.listen(4000, () => {
    console.log('Server listening on port 4000');
});