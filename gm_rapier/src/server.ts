import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import RAPIER from '@dimforge/rapier3d-compat';
//import * as RAPIER from '@dimforge/rapier3d-compat/rapier';
//import RAPIER from 'https://cdn.skypack.dev/@dimforge/rapier3d-compat';
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
    private pusherBody!: RAPIER.RigidBody;
    private pusherForward: boolean = true;
    private isInitialized: boolean = false;
    private readonly PUSHER_SPEED = 1.0;
    private readonly PUSHER_MIN_Z = -3.0;
    private readonly PUSHER_MAX_Z = -1.0;
    private readonly KILL_ZONE_Y = -2.0;  // Height below which coins are removed

    // Add public method to check initialization status
    public getIsInitialized(): boolean {
        return this.isInitialized;
    }

    constructor() {
        this.initialize();
        // Initialize physics world
        // RAPIER.init().then(() => {
        //     const gravity = { x: 0.0, y: -9.81, z: 0.0 };
        //     this.world = new RAPIER.World(gravity);

        //     // Add solver iterations for better stability
        //     //this.world.maxVelocityIterations = 8;  // Default is 4
        //     //this.world.maxPositionIterations = 4;  // Default is 1


        //     this.bodies = new Map();
        //     // Add static platform and walls
        //     this.addPlatform();
        //     this.addPusher();
        // });
    }

    private async initialize() {
        try {
            await RAPIER.init();
            const gravity = { x: 0.0, y: -9.81, z: 0.0 };
            this.world = new RAPIER.World(gravity);
            this.bodies = new Map();
            this.addPlatform();
            this.addPusher();
            this.isInitialized = true;
            console.log('Physics world initialized successfully');
        } catch (error) {
            console.error('Failed to initialize physics world:', error);
            this.isInitialized = false;
        }
    }

    addPlatform() {
        // Add static ground platform
        // const groundColliderDesc = RAPIER.ColliderDesc.cuboid(5.0, 0.25, 4.0);
        // this.world.createCollider(groundColliderDesc);

        // Main platform (floor)
        const floorBodyDesc = RAPIER.RigidBodyDesc.fixed();
        const floorBody = this.world.createRigidBody(floorBodyDesc);
        const floorColliderDesc = RAPIER.ColliderDesc.cuboid(5.0, 0.25, 4.0); // [10/2, 0.5/2, 8/2]
        //.setTranslation(0, 0, 0);
        this.world.createCollider(floorColliderDesc, floorBody);

        // Back wall
        const backWallBodyDesc = RAPIER.RigidBodyDesc.fixed();
        const backWallBody = this.world.createRigidBody(backWallBodyDesc);
        const backWallColliderDesc = RAPIER.ColliderDesc.cuboid(5.0, 1.0, 0.1) // [10/2, 2/2, 0.2/2]
            .setTranslation(0, 1, -4); // Matches front-end position
        this.world.createCollider(backWallColliderDesc, backWallBody);

        // Left wall
        const leftWallBodyDesc = RAPIER.RigidBodyDesc.fixed();
        const leftWallBody = this.world.createRigidBody(leftWallBodyDesc);
        const leftWallColliderDesc = RAPIER.ColliderDesc.cuboid(0.1, 1.0, 4.0) // [0.2/2, 2/2, 8/2]
            .setTranslation(-5, 1, 0);
        this.world.createCollider(leftWallColliderDesc, leftWallBody);

        // Right wall
        const rightWallBodyDesc = RAPIER.RigidBodyDesc.fixed();
        const rightWallBody = this.world.createRigidBody(rightWallBodyDesc);
        const rightWallColliderDesc = RAPIER.ColliderDesc.cuboid(0.1, 1.0, 4.0) // [0.2/2, 2/2, 8/2]
            .setTranslation(5, 1, 0);
        this.world.createCollider(rightWallColliderDesc, rightWallBody);
    }

    addPusher() {
        const pusherBodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased()
            .setTranslation(0, 0.5, this.PUSHER_MIN_Z);
        
        this.pusherBody = this.world.createRigidBody(pusherBodyDesc);
        
        const pusherColliderDesc = RAPIER.ColliderDesc.cuboid(4.0, 0.1, 2.0)
            .setFriction(0.8)
            .setRestitution(0.2);
        
        this.world.createCollider(pusherColliderDesc, this.pusherBody);
    }

    updatePusher() {
        if (!this.isInitialized) return;
        const position = this.pusherBody.translation();
        let newZ = position.z;

        if (this.pusherForward) {
            newZ += this.PUSHER_SPEED * (1/60); // Move forward
            if (newZ >= this.PUSHER_MAX_Z) {
                this.pusherForward = false;
            }
        } else {
            newZ -= this.PUSHER_SPEED * (1/60); // Move backward
            if (newZ <= this.PUSHER_MIN_Z) {
                this.pusherForward = true;
            }
        }

        this.pusherBody.setNextKinematicTranslation({
            x: position.x,
            y: position.y,
            z: newZ
        });
    }

    addCoin(coin:Coin) {
        if (!this.isInitialized) return;
        const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(coin.position[0], coin.position[1], coin.position[2])
        .setLinearDamping(0.6)    // Add damping to reduce bouncing
        .setAngularDamping(4);  // Add rotational damping;
        // .setAdditionalMassProperties(    // Add more mass stability
        //     1.0,                         // Mass
        //     { x: 0, y: 0, z: 0 },       // Center of mass
        //     { x: 1, y: 1, z: 1 }        // Principal angular inertia
        // );

        const rigidBody = this.world.createRigidBody(rigidBodyDesc);        
        
        // // Rotate the cylinder to lay flat (90 degrees around X axis)
        // const rotation = new RAPIER.Quaternion(
        //     Math.sin(Math.PI / 2), // x
        //     0,                     // y
        //     0,                     // z
        //     Math.cos(Math.PI / 2)  // w
        // );
        // rigidBody.setRotation(rotation, false);

        // Adjust cylinder dimensions to match visual coin
        // args: halfHeight, radius
        const colliderDesc = RAPIER.ColliderDesc
            .cylinder(0.05, 0.4)  // [height/2, radius]
            .setRestitution(0.5)      // Bounciness
            .setFriction(0.3)         // Surface friction
            .setDensity(20)         // Mass density
            .setFrictionCombineRule(RAPIER.CoefficientCombineRule.Max);  // Use maximum friction
            //.setFrictionCombineRule(RAPIER.CoefficientCombineRule.Max)
            //.setRestitutionCombineRule(RAPIER.CoefficientCombineRule.Min);  // Minimize bouncing
            ;
        
        this.world.createCollider(colliderDesc, rigidBody);
        this.bodies.set(coin.id, rigidBody);
    }

    step() {

        if (!this.isInitialized) {
            return [{
                id: 'pusher',
                position: [0, 0.5, -3],
                rotation: [0, 0, 0],
                type: 'platform'
            }];
        }

        this.updatePusher();
        this.world.step();

        // Check for and remove fallen coins before getting positions
        this.removeFallenCoins();
        
        // Get updated positions of all objects
        const positions: PhysicsObject[] = [];

        // Add pusher position
        const pusherPos = this.pusherBody.translation();
        const pusherRot = this.pusherBody.rotation();
        positions.push({
            id: 'pusher',
            position: [pusherPos.x, pusherPos.y, pusherPos.z],
            rotation: [0, 0, 0],
            type: 'platform'
        });

        this.bodies.forEach((body, id) => {
            const position = body.translation();
            const rotation = body.rotation();

            // Convert quaternion to Euler angles
            // Rapier quaternion is in (x, y, z, w) format
            const euler = {
                x: Math.atan2(2 * (rotation.w * rotation.x + rotation.y * rotation.z), 
                             1 - 2 * (rotation.x * rotation.x + rotation.y * rotation.y)),
                y: Math.asin(2 * (rotation.w * rotation.y - rotation.z * rotation.x)),
                z: Math.atan2(2 * (rotation.w * rotation.z + rotation.x * rotation.y),
                             1 - 2 * (rotation.y * rotation.y + rotation.z * rotation.z))
            };

            positions.push({
                id,
                position: [position.x, position.y, position.z],
                rotation: [euler.x, euler.y, euler.z],
                type: 'coin'
            });
        });
        
        return positions;
    }

    private removeFallenCoins() {
        const coinsToRemove: string[] = [];

        this.bodies.forEach((body, id) => {
            const position = body.translation();
            if (position.y < this.KILL_ZONE_Y) {
                coinsToRemove.push(id);
            }
        });

        coinsToRemove.forEach(id => {
            const body = this.bodies.get(id);
            if (body) {
                this.world.removeRigidBody(body);
                this.bodies.delete(id);
            }
        });
    }
}


const app = express();
//app.use(cors());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
}));

// Add a health check endpoint
app.get('/_ah/health', (req, res) => {
    if (physicsWorld.getIsInitialized()) {
        res.status(200).send('OK');
    } else {
        res.status(503).send('Initializing');
    }
});

app.get('/ping', (req, res) => {
    res.json({
        status: 'success',
        message: 'pong',
        timestamp: new Date(),
        initialized: physicsWorld.getIsInitialized()
    });
});

// Add error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: [
            process.env.FRONTEND_URL || 'http://localhost:3000',
            'https://gmdozer.vercel.app'
        ],
        methods: ['GET', 'POST'],
        credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
    path: '/socket.io/',
    allowEIO3: true
});

// Add better error handling for the server
server.on('error', (error) => {
    console.error('Server error:', error);
});

// Initialize physics
const physicsWorld = new PhysicsWorld();

let gameLoopInterval: NodeJS.Timeout;

// Wait for physics to initialize before starting the game loop
const startGameLoop = () => {
    if (!physicsWorld.getIsInitialized()) {
        setTimeout(startGameLoop, 100);
        return;
    }

    // Run physics loop
    const PHYSICS_STEP = 1000 / 60;
    gameLoopInterval = setInterval(() => {
        const positions = physicsWorld.step();
        io.emit('physicsUpdate', positions);
    }, PHYSICS_STEP);
};

// Run physics loop
// const PHYSICS_STEP = 1000 / 60; // 60 FPS
// setInterval(() => {
//     const positions = physicsWorld.step();
//     io.emit('physicsUpdate', positions);
//     //console.log("physicsUpdate: ", positions);
// }, PHYSICS_STEP);

interface Coin {
    id: string;
    position: [number, number, number];
    rotation: [number, number, number];
}

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    if (!physicsWorld.getIsInitialized()) {
        socket.emit('error', { message: 'Server initializing, please try again in a moment' });
        return;
    }

    const initialState = physicsWorld.step();
    //socket.emit('initialState', globalGameState);
    socket.emit('initialState', initialState);

    socket.on('insertCoin', (coin: Coin) => {
        if (!physicsWorld.getIsInitialized()) {
            socket.emit('error', { message: 'Server not ready' });
            return;
        }
        //globalGameState.coins.push(coin);
        physicsWorld.addCoin(coin);
        //io.emit('updateGameState', globalGameState);
    });

    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });

    socket.on('disconnect', (reason) => {
        console.log('A user disconnected:', socket.id, 
            'Reason:', reason);
    });
});

// Add WebSocket connection error handling
io.on('connect_error', (err) => {
    console.error('Socket connection error:', err);
});

const PORT = process.env.PORT || 8081;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    startGameLoop();
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    if (gameLoopInterval) {
        clearInterval(gameLoopInterval);
    }
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});