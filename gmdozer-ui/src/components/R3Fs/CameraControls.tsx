import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

export const CameraControls = () => {
    const { camera } = useThree();
    return (
        <OrbitControls 
            makeDefault
            minDistance={5}
            maxDistance={20}
            target={[0, 2.4, 0]}
        />
    )
}
