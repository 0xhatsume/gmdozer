import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

const BACKEND_URL = 'https://test-server-5cfl6q7hjq-de.a.run.app';

function App() {
  const [count, setCount] = useState<number>(0);
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      path: '/socket.io/'
    });

    newSocket.on('connect', () => {
      console.log('Connected to server via:', newSocket.io.engine.transport.name);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('count', (newCount: number) => {
      console.log('Received count:', newCount);
      setCount(newCount);
    });

    setSocket(socket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">WebSocket Counter</h1>
        
        <div className="mb-4">
          <div className={`inline-flex items-center ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
            <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>

        <div className="text-4xl font-bold text-center">
          {count}
        </div>
      </div>
    </div>
  );
}

export default App;