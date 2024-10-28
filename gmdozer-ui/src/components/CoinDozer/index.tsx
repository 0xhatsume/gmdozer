import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import io, { Socket } from 'socket.io-client';
import { Coin, CoinType, Platform } from '../R3Fs';
import { OrbitControls } from '@react-three/drei';

const socket: Socket = io('http://localhost:4000');

export const CoinDozer: React.FC = () => {

      const [coins, setCoins] = useState<CoinType[]>([]);

      useEffect(() => {
        socket.on('initialState', (state: { coins: Coin[] }) => {
          setCoins(state.coins);
        });

        socket.on('updateGameState', (state: { coins: Coin[] }) => {
          setCoins(state.coins);
        });
      }, []);

      const insertCoin = () => {
        const newCoin: Coin = {
          id: Math.random().toString(36).substring(7),
          position: [Math.random() * 2 - 1, 5, 0],
        };
        console.log(newCoin);
        socket.emit('insertCoin', newCoin);
      };

      console.log("coins from ui: ", coins);

      return (
        <div className="w-full h-screen flex flex-col items-center justify-center">
          <button
            className="bg-blue-500 text-white px-4 py-2 mb-4 rounded"
            onClick={insertCoin}
          >
            Insert Coin
          </button>
          <div className="w-4/5 h-4/5">
              <Canvas 
              className="w-fullh-full bg-gray-200 border-2 border-gray-300 rounded-lg"
              camera={{ 
                position: [0, 11, 8.5], 
                rotation: [-Math.PI / 8, 0, 0], // This adds a 45-degree downward tilt
                fov: 100 }}
              >
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
                
                {/* Coins */}
                {coins.map((coin) => (
                  <Coin key={coin.id} coin={coin} />
                ))}
                
                {/* <OrbitControls 
                  minPolarAngle={0} 
                  maxPolarAngle={Math.PI / 2.1}
                  minDistance={5}
                  maxDistance={20}
                /> */}
              </Canvas>
            </div>
        </div>
      );
};

