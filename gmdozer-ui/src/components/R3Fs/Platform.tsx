// import { useRef } from 'react';
// import { Mesh } from 'three';
import { RigidBody } from '@react-three/rapier';

export const Platform: React.FC = () => {
    //const platformRef = useRef<Mesh>(null);

    return (
        <group>
            {/* Main platform */}
            <RigidBody type="fixed" colliders="cuboid">
                <mesh position={[0, 0, 0]} rotation={[0, 0, 0]} receiveShadow>
                    <boxGeometry args={[10, 0.5, 8]} />
                    <meshStandardMaterial color="#444444" />
                </mesh>
            </RigidBody>

            {/* Back wall */}
            <RigidBody type="fixed" colliders="cuboid">
                <mesh position={[0, 1, -4]} rotation={[0, 0, 0]}>
                    <boxGeometry args={[10, 2, 0.2]} />
                    <meshStandardMaterial color="#666666" />
                </mesh>
            </RigidBody>

            {/* Left wall */}
            <RigidBody type="fixed" colliders="cuboid">
                <mesh position={[-5, 1, 0]} rotation={[0, 0, 0]}>
                    <boxGeometry args={[0.2, 2, 8]} />
                    <meshStandardMaterial color="#666666" />
                </mesh>
            </RigidBody>

            {/* Right wall */}
            <RigidBody type="fixed" colliders="cuboid">
                <mesh position={[5, 1, 0]} rotation={[0, 0, 0]}>
                    <boxGeometry args={[0.2, 2, 8]} />
                    <meshStandardMaterial color="#666666" />
                </mesh>
            </RigidBody>
        </group>
    );
};