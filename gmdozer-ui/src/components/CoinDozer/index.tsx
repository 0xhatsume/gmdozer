import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import io, { Socket } from 'socket.io-client';

const socket: Socket = io('http://localhost:4000');

type Coin = {
    id: string;
    position: [number, number, number];
};

export const CoinDozer: React.FC = () => {

     const [coins, setCoins] = useState<Coin[]>([]);

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

     return (
       <div className="w-full h-screen flex flex-col items-center justify-center">
         <button
           className="bg-blue-500 text-white px-4 py-2 mb-4 rounded"
           onClick={insertCoin}
         >
           Insert Coin
         </button>
         <Canvas className="w-full h-full bg-gray-200">
           <ambientLight />
           <pointLight position={[10, 10, 10]} />
           {coins.map((coin) => (
             <mesh key={coin.id} position={coin.position}>
               <cylinderBufferGeometry args={[0.1, 0.1, 0.05, 32]} />
               <meshStandardMaterial color={'gold'} />
             </mesh>
           ))}
         </Canvas>
       </div>
     );
};

