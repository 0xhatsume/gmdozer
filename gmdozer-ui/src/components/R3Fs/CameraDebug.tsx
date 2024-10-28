import { useEffect } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
// ... other existing imports ...

// Create a new component for the debug info
export const CameraDebug: React.FC = () => {
    const { camera } = useThree();

    useEffect(() => {
        const updateDebugInfo = () => {
        const info = document.getElementById('camera-debug');
        if (info) {
            info.innerHTML = `
            Camera Position: [${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)}]<br/>
            Camera Rotation: [
            ${(camera.rotation.x * 180 / Math.PI).toFixed(2)}°, 
            ${(camera.rotation.y * 180 / Math.PI).toFixed(2)}°, 
            ${(camera.rotation.z * 180 / Math.PI).toFixed(2)}°]<br/>
            FOV: ${camera instanceof THREE.PerspectiveCamera ? camera.fov.toFixed(2) : 'N/A'}°
            `;
        }
        };

        // Update every frame
        const interval = setInterval(updateDebugInfo, 100);
        return () => clearInterval(interval);
    }, [camera]);

    return null;
};