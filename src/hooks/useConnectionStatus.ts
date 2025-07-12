import { useState, useEffect } from 'react';

export function useConnectionStatus() {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');

  useEffect(() => {
    const handleConnectionStatusChange = (event: CustomEvent) => {
      if (event.detail?.status) {
        setConnectionStatus(event.detail.status);
      }
    };

    window.addEventListener('highScoreConnectionStatus', handleConnectionStatusChange as EventListener);

    return () => {
      window.removeEventListener('highScoreConnectionStatus', handleConnectionStatusChange as EventListener);
    };
  }, []);

  return connectionStatus;
} 
