import { useRef } from 'react';
import { Mesh } from 'three';

export { Platform } from './Platform';

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
        <mesh ref={meshRef} position={coin.position} castShadow receiveShadow>
            <cylinderGeometry args={[0.4, 0.4, 0.1, 32]} />
            <meshStandardMaterial color="#ffd700" metalness={0.7} roughness={0.3} />
        </mesh>
    );
};