import React, { useEffect, useRef } from 'react';

interface GameLogProps {
  logs: string[];
}

const GameLog: React.FC<GameLogProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="bg-gray-900 text-gray-300 p-3 rounded-lg h-32 md:h-48 overflow-y-auto text-sm font-mono shadow-inner border border-gray-700 scrollbar-hide">
      {logs.length === 0 && <div className="text-gray-600 italic text-center mt-10">Battle log will appear here...</div>}
      {logs.map((log, index) => (
        <div key={index} className="mb-1 border-b border-gray-800 pb-1 last:border-0">
            <span className="text-gray-500 mr-2">[{index + 1}]</span>
            {log}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
};

export default GameLog;