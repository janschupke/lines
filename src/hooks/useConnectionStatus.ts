import { useState, useEffect } from 'react';

// Type for the connection status event detail
interface ConnectionStatusEventDetail {
  status: 'connected' | 'disconnected' | 'connecting';
}

// Type guard to validate event detail structure
function isValidConnectionStatusEventDetail(detail: unknown): detail is ConnectionStatusEventDetail {
  if (detail === null || typeof detail !== 'object') {
    return false;
  }
  
  const detailObj = detail as Record<string, unknown>;
  const status = detailObj.status;
  
  return (
    typeof status === 'string' &&
    ['connected', 'disconnected', 'connecting'].includes(status)
  );
}

export function useConnectionStatusEvent() {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');

  useEffect(() => {
    const handleConnectionStatusChange = (event: CustomEvent) => {
      // Validate that event.detail exists and has the expected structure
      if (event.detail && isValidConnectionStatusEventDetail(event.detail)) {
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
