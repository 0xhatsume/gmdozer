import { useRef } from 'react';
import { Mesh } from 'three';
import { RigidBody } from '@react-three/rapier';

export { CameraDebug } from './CameraDebug';
export { Platform } from './Platform';
export { CameraControls } from './CameraControls';

export interface CoinType {
    id: string;
    position: [number, number, number];
}

interface CoinProps {
    coin: CoinType;
}

export const Coin: React.FC<CoinProps> = ({ coin }) => {
    const meshRef = useRef<Mesh>(null);

    return (
        <RigidBody 
            colliders="hull"
            position={coin.position}
            restitution={0.3} // Bounce factor
            friction={0.3}     // Lower friction
            linearDamping={0.5} // Less resistance to movement
            angularDamping={0.2} // Less resistance to spinning   // Friction with other objects
        >
            <mesh ref={meshRef} position={coin.position} castShadow receiveShadow>
                <cylinderGeometry args={[0.4, 0.4, 0.1, 32]} />
                <meshStandardMaterial 
                    color="#ffd700" 
                    metalness={0.7} 
                    roughness={0.3} 
                />
            </mesh>
        </RigidBody>
    );
};