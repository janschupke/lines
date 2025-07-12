import React from 'react';

interface StatusBarProps {
  status: string;
}

const StatusBar: React.FC<StatusBarProps> = ({ status }) => {
  return <div className="status-bar bg-[#23272f] text-white py-2 px-4 rounded shadow-md text-center font-semibold">{status}</div>;
};

export default StatusBar;
