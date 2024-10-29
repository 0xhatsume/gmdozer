import React, { useRef, useEffect } from 'react';
import { Mesh } from 'three';
import { useFrame } from '@react-three/fiber';
import { lerpVector3 } from '../../utils';

interface PusherProps {
    position: [number, number, number];
}

export const Pusher: React.FC<PusherProps> = React.memo(({ position }) => {
    const meshRef = useRef<Mesh>(null);
    const targetPos = useRef(position);
    const prevPos = useRef(position);  // Track previous position

    useEffect(() => {
        // Smooth transition handling
        const currentZ = prevPos.current[2];
        const newZ = position[2];
        
        // If direction changes, use current position to avoid jumps
        if ((currentZ < -2.9 && newZ > -2) || (currentZ > -1.1 && newZ < -2)) {
            targetPos.current = prevPos.current;
        } else {
            targetPos.current = position;
        }
        
        prevPos.current = position;
    }, [position]);

    useFrame(() => {
        if (meshRef.current) {
            const currentPos = meshRef.current.position.toArray() as [number, number, number];
            const interpolatedPos = lerpVector3(currentPos, targetPos.current, 0.3);
            meshRef.current.position.set(...interpolatedPos);
        }
    });

    return (
        <mesh
            ref={meshRef}
            position={position}
            castShadow
            receiveShadow
        >
            <boxGeometry args={[8, 0.2, 4]} />
            <meshStandardMaterial color="#666666" />
        </mesh>
    );
});