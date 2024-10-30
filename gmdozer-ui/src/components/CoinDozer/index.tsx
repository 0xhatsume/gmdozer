import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import io, { Socket } from 'socket.io-client';
import { Coin, CoinType, PhysicsObject, Platform, Pusher, CameraDebug, CameraControls } from '../R3Fs';
//import { Physics } from '@react-three/rapier';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
const socket: Socket = io(BACKEND_URL, {
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

export const CoinDozer: React.FC = React.memo(() => {
      //console.log("CoinDozer Component");
      //const renderCount = useRef(0);
      
      // Ref for storing latest physics state without triggering renders
      const physicsStateRef = useRef<CoinType[]>([]);
      const rafRef = useRef<number>();
      // Visual state that triggers renders
      const [coins, setCoins] = useState<CoinType[]>([]);
      
      const [pusherPosition, setPusherPosition] = useState<[number, number, number]>([0, 0.5, -3]);

      // Log only on mount
      useEffect(() => {
        console.log("CoinDozer Component Mounted");
      }, []);

      // Use useCallback for event handlers
      const handlePhysicsUpdate = useCallback((state: PhysicsObject[]) => {
        
        // Handle pusher position
        const pusher = state.find(obj => obj.id === 'pusher');
        if (pusher) {
            setPusherPosition(pusher.position);
        }

        const coins = state.filter((obj: PhysicsObject) => obj.type === 'coin')
          .map((c)=>{
            return {
              id: c.id,
              position: c.position,
              rotation: c.rotation
            }
        });
        //console.log("physicsUpdate: ", coins); 
        //setCoins(coins);
        physicsStateRef.current = coins;
      }, []);

      // Update visual state using requestAnimationFrame
      const updateVisualState = useCallback(() => {
        setCoins(physicsStateRef.current);
        rafRef.current = requestAnimationFrame(updateVisualState);
      }, []);

      // const handleInitialState = useCallback((state: PhysicsObject[]) => {
      //   const coins = state.filter((obj: PhysicsObject) => obj.type === 'coin')
      //     .map((c)=>{
      //       return {
      //         id: c.id,
      //         position: c.position,
      //         rotation: c.rotation
      //       }
      //     });
      //   setCoins(coins);
      // }, []);

      useEffect(() => {
        console.log("useEffect for Server Events");

        //socket.on('initialState', handleInitialState);
        
        // socket.on('updateGameState', (state: { coins: CoinType[] }) => {
        //   setCoins(state.coins);
        // });

        // Replace updateGameState with physicsUpdate
        socket.on('physicsUpdate', handlePhysicsUpdate);
        
        // Start the animation frame loop
        rafRef.current = requestAnimationFrame(updateVisualState);

        return () => {
            //socket.off('initialState');
            socket.off('physicsUpdate');
            if (rafRef.current) {
              cancelAnimationFrame(rafRef.current);
            }
        };

      }, [handlePhysicsUpdate, updateVisualState]);

      const insertCoin = useCallback(() => {
        const newCoin: CoinType = {
          id: Math.random().toString(36).substring(7),
          position: [Math.random() * 2 - 1, 5, 0],
          rotation: [0, 0, 0],
        };
        socket.emit('insertCoin', newCoin);
      }, []);

      return (
        <div className="w-full h-screen flex flex-col items-center justify-center">
          <button
            className="bg-blue-500 text-white px-4 py-2 mb-4 rounded"
            onClick={insertCoin}
          >
            Insert Coin
          </button>
          <div className="w-4/5 h-4/5 relative">
              <div 
                id="camera-debug"
                className="absolute top-0 left-0 
                bg-black bg-opacity-50 text-white 
                p-4 rounded font-mono text-sm z-10"
              />
              <Canvas 
              className="w-fullh-full bg-gray-200 border-2 border-gray-300 rounded-lg"
              camera={{ 
                position: [0, 8.34, 6.44], 
                fov: 70 }}
                shadows
              >
                {/* <Physics debug={false}> */}
                  {/* /* Add the debug component inside Canvas */}
                  <CameraDebug />

                  <color attach="background" args={['#f0f0f0']} />
                  <ambientLight intensity={0.5} />
                  <pointLight position={[10, 10, 10]} intensity={1} />
                  <directionalLight
                    position={[-2, 5, 2]}
                    intensity={1}
                    castShadow
                  />
                  
                  {/* Add Platform */}
                  <Platform />
                  <Pusher position={pusherPosition} />

                  {/* Coins */}
                  {coins?.map((coin) => (
                    <Coin 
                      key={coin.id} 
                      position={coin.position} 
                      rotation={coin.rotation} 
                      />
                  ))}
                  
                  <CameraControls/>
                {/* </Physics> */}
              </Canvas>
            </div>
        </div>
      );
});

