import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import * as CANNON from 'cannon-es';
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
        (this.world.solver as CANNON.GSSolver).iterations = 20;
        
        // Create a default contact material for better collision handling
        const defaultMaterial = new CANNON.Material('default');
        const defaultContactMaterial = new CANNON.ContactMaterial(
            defaultMaterial,
            defaultMaterial,
            {
                friction: 0.3,
                restitution: 1.2,
            }
        );
        this.world.addContactMaterial(defaultContactMaterial);
        
        this.bodies = new Map();
        this.addPlatform();
    }

    addPlatform() {
        const groundMaterial = new CANNON.Material('ground');
        
        // Floor
        const floorShape = new CANNON.Box(new CANNON.Vec3(5, 0.25, 4));
        const floorBody = new CANNON.Body({ 
            mass: 0,
            material: groundMaterial
        });
        floorBody.addShape(floorShape);
        floorBody.position.set(0, 0, 0);
        this.world.addBody(floorBody);

        // Back wall
        const backWallShape = new CANNON.Box(new CANNON.Vec3(5, 1, 0.1));
        const backWallBody = new CANNON.Body({ 
            mass: 0,
            material: groundMaterial
        });
        backWallBody.addShape(backWallShape);
        backWallBody.position.set(0, 1, -4);
        this.world.addBody(backWallBody);

        // Left wall
        const leftWallShape = new CANNON.Box(new CANNON.Vec3(0.1, 1, 4));
        const leftWallBody = new CANNON.Body({ 
            mass: 0,
            material: groundMaterial
        });
        leftWallBody.addShape(leftWallShape);
        leftWallBody.position.set(-5, 1, 0);
        this.world.addBody(leftWallBody);

        // Right wall
        const rightWallShape = new CANNON.Box(new CANNON.Vec3(0.1, 1, 4));
        const rightWallBody = new CANNON.Body({ 
            mass: 0,
            material: groundMaterial
        });
        rightWallBody.addShape(rightWallShape);
        rightWallBody.position.set(5, 1, 0);
        this.world.addBody(rightWallBody);
    }

    addCoin(coin: Coin) {
        const coinMaterial = new CANNON.Material('coin');
        
        const shape = new CANNON.Cylinder(0.4, 0.4, 0.1, 32);
        const body = new CANNON.Body({
            mass: 1,
            material: coinMaterial,
            linearDamping: 0.2,
            angularDamping: 0.2,
        });
        
        body.addShape(shape);
        body.position.set(coin.position[0], coin.position[1], coin.position[2]);
        
        const quat = new CANNON.Quaternion();
        //quat.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
        body.quaternion.copy(quat);

        // Add contact material for coin-ground interaction
        const coinGroundContact = new CANNON.ContactMaterial(
            coinMaterial,
            this.world.defaultMaterial,
            {
                friction: 0.5,
                restitution: 0.8
            }
        );
        this.world.addContactMaterial(coinGroundContact);

        this.world.addBody(body);
        this.bodies.set(coin.id, body);
    }

    step() {
        this.world.step(1/60);
        
        const positions: PhysicsObject[] = [];
        this.bodies.forEach((body, id) => {
            // Convert quaternion to Euler angles
            const euler = new CANNON.Vec3();
            body.quaternion.toEuler(euler);

            positions.push({
                id,
                position: [body.position.x, body.position.y, body.position.z],
                rotation: [euler.x, euler.y, euler.z],
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