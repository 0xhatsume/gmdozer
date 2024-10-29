import React,{ useRef, useEffect } from 'react';
import { Mesh } from 'three';
//import { RigidBody } from '@react-three/rapier';
import { useFrame } from '@react-three/fiber';
import { lerpVector3 } from '../../utils';

export { CameraDebug } from './CameraDebug';
export { Platform } from './Platform';
export { CameraControls } from './CameraControls';

export interface PhysicsObject {
    id: string;
    position: [number, number, number];
    rotation: [number, number, number];
    type: 'coin' | 'platform' | 'wall';
}

export interface CoinType {
    id: string;
    position: [number, number, number];
    rotation: [number, number, number];
}

export interface CoinProps {
    position: [number, number, number];
    rotation: [number, number, number];
}

export const Coin: React.FC<CoinProps> = React.memo(({ position, rotation }) => {
    //const meshRef = useRef<Mesh>(null);
    const meshRef = useRef<Mesh>(null);
    const targetPos = useRef(position);
    const targetRot = useRef(rotation);

    useEffect(() => {
        targetPos.current = position;
        targetRot.current = rotation;
    }, [position, rotation]);

    useFrame(() => {
        if (meshRef.current) {
            const currentPos = meshRef.current.position.toArray() as [number, number, number];
            const interpolatedPos = lerpVector3(currentPos, targetPos.current, 0.3);
            
            // Rotation interpolation
            const currentRot = meshRef.current.rotation.toArray().slice(0, 3) as [number, number, number];
            const interpolatedRot = lerpVector3(currentRot, targetRot.current, 0.5);

            meshRef.current.position.set(...interpolatedPos);
            meshRef.current.rotation.set(...interpolatedRot);
        }
    });

    return (
        // <RigidBody 
        //     colliders="hull"
        //     position={position}
        //     restitution={0.3} // Bounce factor
        //     friction={0.3}     // Lower friction
        //     linearDamping={0.5} // Less resistance to movement
        //     angularDamping={0.2} // Less resistance to spinning   // Friction with other objects
        // >
            <mesh 
                ref={meshRef} 
                position={position} 
                rotation={rotation}
                castShadow receiveShadow
                >
                <cylinderGeometry args={[0.4, 0.4, 0.1, 32]} />
                <meshStandardMaterial 
                    color="#ffd700" 
                    metalness={0.7} 
                    roughness={0.3} 
                />
            </mesh>
        // </RigidBody>
    );
});