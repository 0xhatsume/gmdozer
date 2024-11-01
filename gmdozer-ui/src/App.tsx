import React, { useEffect } from 'react';
import {CoinDozer} from './components/CoinDozer';

declare global {
  interface Window {
      Telegram?: {
          WebApp?: {
              ready(): void;
              expand(): void;
              MainButton: {
                  show(): void;
                  hide(): void;
              };
          };
      };
  }
}

const App: React.FC = () => {
  useEffect(() => {
      // Initialize Telegram WebApp
      if (window.Telegram?.WebApp) {
          window.Telegram.WebApp.ready();
          window.Telegram.WebApp.expand();
      }
  }, []);

  return (
    <div className="w-full h-screen m-0 p-0 overflow-hidden bg-gray-900">
      <CoinDozer />
    </div>
  );
};

export default App;
