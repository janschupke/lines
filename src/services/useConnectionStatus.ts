import { useState, useEffect, useCallback } from 'react';
import type { HighScoreService, ConnectionStatus } from './HighScoreService';

export const useConnectionStatus = (service: HighScoreService) => {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [isRetrying, setIsRetrying] = useState(false);

  const checkConnection = useCallback(async () => {
    const connected = await service.isConnected();
    setStatus(connected ? 'connected' : 'error');
  }, [service]);

  const retryConnection = useCallback(async () => {
    setIsRetrying(true);
    const connected = await service.retryConnection();
    setStatus(connected ? 'connected' : 'error');
    setIsRetrying(false);
  }, [service]);

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, [checkConnection]);

  return {
    status,
    isRetrying,
    retryConnection,
    checkConnection
  };
}; 
