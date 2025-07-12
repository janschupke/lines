import { useState, useEffect, useCallback } from 'react';
import type { ConnectionStatus } from './HighScoreService';
import type { HighScoreServiceInterface } from './HighScoreServiceFactory';

export const useConnectionStatus = (service: HighScoreServiceInterface) => {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [isRetrying, setIsRetrying] = useState(false);

  const checkConnection = useCallback(async () => {
    const connectionStatus = await service.getConnectionStatus();
    setStatus(connectionStatus);
  }, [service]);

  const retryConnection = useCallback(async () => {
    setIsRetrying(true);
    await service.retryConnection();
    const newStatus = await service.getConnectionStatus();
    setStatus(newStatus);
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
