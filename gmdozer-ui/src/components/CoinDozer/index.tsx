import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import io, { Socket } from 'socket.io-client';
import { Coin, CoinType, PhysicsObject, Platform, Pusher, CameraDebug, CameraControls } from '../R3Fs';
//import { Physics } from '@react-three/rapier';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
// Update Socket.IO configuration
const socket: Socket = io(BACKEND_URL, {
  transports: ['polling', 'websocket'],
    path: '/socket.io/',
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 20000,
    withCredentials: false,
    forceNew: true,
    autoConnect: false  // We'll manually connect
});

export const CoinDozer: React.FC = React.memo(() => {
      //console.log("CoinDozer Component");
      //const renderCount = useRef(0);

      const [pingStatus, setPingStatus] = useState<{
          status: 'idle' | 'loading' | 'success' | 'error';
          message: string;
      }>({ status: 'idle', message: '' });

      const [socketStatus, setSocketStatus] = useState<{
        connected: boolean;
        transport?: string;
    }>({ connected: false });

      const resetMachine = useCallback(() => {
          socket.emit('resetMachine');
          // Optionally clear local state immediately
          setCoins([]);
      }, []);

      const testServerConnection = async () => {
          setPingStatus({ status: 'loading', message: 'Pinging server...' });
          try {
              const response = await fetch(`${BACKEND_URL}/ping`);
              const data = await response.json();
              setPingStatus({ 
                  status: 'success', 
                  message: `Server responded: ${JSON.stringify(data)}` 
              });
          } catch (error) {
              setPingStatus({ 
                  status: 'error', 
                  message: `Failed to ping server: ${error}` 
              });
          }
      };
      
      // Ref for storing latest physics state without triggering renders
      const physicsStateRef = useRef<CoinType[]>([]);
      const rafRef = useRef<number>();
      // Visual state that triggers renders
      const [coins, setCoins] = useState<CoinType[]>([]);
      
      const [pusherPosition, setPusherPosition] = useState<[number, number, number]>([0, 0.5, -3]);

      // Add more detailed connection handling
      useEffect(() => {
        // Connect manually
        socket.connect();

        socket.on('connect', () => {
            console.log('Connected to server via:', socket.io.engine.transport.name);
            setSocketStatus({ 
              connected: true, 
              transport: socket.io.engine.transport.name 
          });
          });

        socket.io.engine.on("upgrade", (transport) => {
          console.log('Transport upgraded to:', transport.name);
          setSocketStatus({ connected: false });
        });

        socket.on('connect_error', (error) => {
            console.error('Connection Error:', error);
            // Try to reconnect with polling if websocket fails
            if (socket.io.engine.transport.name === 'websocket') {
                console.log('Falling back to polling');
                socket.io.opts.transports = ['polling'];
            }
        });

        socket.on('error', (error) => {
            console.error('Socket error:', error);
        });

        socket.on('disconnect', (reason) => {
            console.log('Disconnected:', reason);
            if (reason === 'io server disconnect') {
                // Reconnect manually if server disconnected
                socket.connect();
            }
        });

        // Cleanup
        return () => {
            socket.off('connect');
            socket.off('connect_error');
            socket.off('error');
            socket.off('disconnect');
            socket.close();
        };
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
          <div className="w-4/5 mb-4 gap-x-1 flex flex-row items-center justify-start">
            <button
                  className={`px-4 py-2 rounded text-white ${
                      pingStatus.status === 'loading' 
                          ? 'bg-yellow-500' 
                          : pingStatus.status === 'success'
                          ? 'bg-green-500'
                          : pingStatus.status === 'error'
                          ? 'bg-red-500'
                          : 'bg-blue-500'
                  }`}
                  onClick={testServerConnection}
                  disabled={pingStatus.status === 'loading'}
              >
                  Server Connection
              </button>
            
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded"
              onClick={insertCoin}
            >
              Insert Coin
            </button>

            {/* Add Reset Button */}
            <button
                className="bg-red-500 text-white px-4 py-2 rounded"
                onClick={resetMachine}
            >
                Reset Machine
            </button>

          </div>
          
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

