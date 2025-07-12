import React from 'react';

interface ToggleBarProps {
  showGuide: boolean;
  setShowGuide: (v: boolean) => void;
  showHighScores: boolean;
  setShowHighScores: (v: boolean) => void;
}

const ToggleBar: React.FC<ToggleBarProps> = ({ 
  showGuide, 
  setShowGuide, 
  showHighScores, 
  setShowHighScores 
}) => (
  <div className="flex justify-center gap-3 w-full max-w-xl mx-auto">
    <button
      onClick={() => setShowGuide(!showGuide)}
      className={`font-semibold text-base px-4 py-2 rounded-lg border-none cursor-pointer min-w-[120px] transition-colors ${
        showGuide ? 'bg-[#ffe082] text-black' : 'bg-[#444] text-white hover:bg-[#555]'
      }`}
    >
      {showGuide ? 'Hide Guide' : 'Show Guide'}
    </button>
    <button
      onClick={() => setShowHighScores(!showHighScores)}
      className={`font-semibold text-base px-4 py-2 rounded-lg border-none cursor-pointer min-w-[120px] transition-colors ${
        showHighScores ? 'bg-[#ffe082] text-black' : 'bg-[#444] text-white hover:bg-[#555]'
      }`}
    >
      {showHighScores ? 'Hide Scores' : 'Show Scores'}
    </button>
  </div>
);

export default ToggleBar; 
