
import React from 'react';
import { Card as ICard } from '../types';
import { ELEMENT_COLORS, TYPE_CN, ELEMENT_CN } from '../constants';

interface CardProps {
  card: ICard;
  onClick?: () => void;
  disabled?: boolean;
  selected?: boolean;
  isSmall?: boolean;
}

const Card: React.FC<CardProps> = ({ card, onClick, disabled, selected, isSmall }) => {
  const baseClasses = "relative flex flex-col justify-between rounded-lg shadow-md transition-transform duration-200 border-2";
  const sizeClasses = isSmall ? "w-20 h-28 p-1 text-xs" : "w-32 h-44 p-3";
  
  // Use lighter opacity and NO grayscale for better visibility
  const colorClasses = disabled 
    ? 'bg-slate-700 border-slate-600 text-slate-400' 
    : ELEMENT_COLORS[card.element];
    
  const hoverClasses = (!disabled && onClick) ? "hover:-translate-y-2 hover:shadow-xl cursor-pointer active:scale-95" : "cursor-not-allowed";
  const selectedClasses = selected ? "ring-4 ring-yellow-400 scale-105 z-10" : "";
  // Changed opacity from 40 to 60 and removed grayscale
  const disabledClasses = disabled ? "opacity-60 scale-95" : "";

  return (
    <div 
      className={`${baseClasses} ${sizeClasses} ${colorClasses} ${hoverClasses} ${selectedClasses} ${disabledClasses}`}
      onClick={!disabled ? onClick : undefined}
    >
      <div className="font-bold text-center leading-tight border-b border-white/20 pb-1 truncate">
        {card.name}
      </div>
      
      <div className="flex flex-col items-center justify-center flex-grow my-2">
        <div className={`font-serif font-bold opacity-30 ${isSmall ? 'text-2xl' : 'text-5xl'}`}>
            {ELEMENT_CN[card.element]}
        </div>
      </div>

      <div className="text-center font-semibold bg-black/20 rounded py-1 tracking-wider text-[10px] md:text-xs">
        {TYPE_CN[card.type]}
      </div>
      
      {disabled && (
          <div className="absolute inset-0 bg-black/5 flex items-center justify-center rounded-lg">
              {/* Optional: Subtle lock overlay if needed */}
          </div>
      )}
    </div>
  );
};

export const CardBack: React.FC<{ isSmall?: boolean }> = ({ isSmall }) => {
  const sizeClasses = isSmall ? "w-20 h-28" : "w-32 h-44";
  return (
    <div className={`${sizeClasses} rounded-lg shadow-lg border-2 border-slate-600 bg-slate-800 flex items-center justify-center relative overflow-hidden`}>
      <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#1e293b_10px,#1e293b_20px)] opacity-20"></div>
      <div className="w-12 h-12 rounded-full border-2 border-slate-500 flex items-center justify-center opacity-30">
         <span className="text-2xl font-serif text-slate-400">五</span>
      </div>
    </div>
  );
}

export default Card;
