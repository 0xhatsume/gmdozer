import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import CANNON from 'cannon';
import cors from 'cors';

interface PhysicsObject {
    id: string;
    position: [number, number, number];
    rotation: [number, number, number];
    type: 'coin' | 'platform' | 'wall';
}

class PhysicsWorld {
    private world: CANNON.World;
    private bodies: Map<string, CANNON.Body>;

    constructor() {
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.81, 0);
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.solver.iterations = 10;
        
        this.bodies = new Map();
        this.addPlatform();
    }

    addPlatform() {
        // Floor
        const floorShape = new CANNON.Box(new CANNON.Vec3(5, 0.25, 4));
        const floorBody = new CANNON.Body({ mass: 0 }); // mass 0 makes it static
        floorBody.addShape(floorShape);
        floorBody.position.set(0, 0, 0);
        this.world.addBody(floorBody);

        // Back wall
        const backWallShape = new CANNON.Box(new CANNON.Vec3(5, 1, 0.1));
        const backWallBody = new CANNON.Body({ mass: 0 });
        backWallBody.addShape(backWallShape);
        backWallBody.position.set(0, 1, -4);
        this.world.addBody(backWallBody);

        // Left wall
        const leftWallShape = new CANNON.Box(new CANNON.Vec3(0.1, 1, 4));
        const leftWallBody = new CANNON.Body({ mass: 0 });
        leftWallBody.addShape(leftWallShape);
        leftWallBody.position.set(-5, 1, 0);
        this.world.addBody(leftWallBody);

        // Right wall
        const rightWallShape = new CANNON.Box(new CANNON.Vec3(0.1, 1, 4));
        const rightWallBody = new CANNON.Body({ mass: 0 });
        rightWallBody.addShape(rightWallShape);
        rightWallBody.position.set(5, 1, 0);
        this.world.addBody(rightWallBody);
    }

    addCoin(coin: Coin) {
        const shape = new CANNON.Cylinder(0.4, 0.4, 0.1, 16); // radius top, radius bottom, height, segments
        const body = new CANNON.Body({
            mass: 1,
            linearDamping: 0.5,
            angularDamping: 0.5
        });
        
        body.addShape(shape);
        body.position.set(coin.position[0], coin.position[1], coin.position[2]);
        
        // Rotate cylinder to stand vertically (Cannon.js cylinders are horizontal by default)
        const quat = new CANNON.Quaternion();
        quat.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI/4);
        body.quaternion.copy(quat);

        const coinMaterial = new CANNON.Material("coinMaterial");
        coinMaterial.friction = 0.5;
        coinMaterial.restitution = 0.8;
        body.material = coinMaterial;

        this.world.addBody(body);
        this.bodies.set(coin.id, body);
    }

    step() {
        this.world.step(1/60);
        
        const positions: PhysicsObject[] = [];
        this.bodies.forEach((body, id) => {
            positions.push({
                id,
                position: [body.position.x, body.position.y, body.position.z],
                rotation: [body.quaternion.x, body.quaternion.y, body.quaternion.z],
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