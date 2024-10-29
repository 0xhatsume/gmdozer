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

    addCoin(coin:Coin) {
        const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(coin.position[0], coin.position[1], coin.position[2])
        .setLinearDamping(0.6)    // Add damping to reduce bouncing
        .setAngularDamping(1);  // Add rotational damping;
        
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
            ;
        
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