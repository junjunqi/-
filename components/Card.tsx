
import React from 'react';
import { Card as ICard, CardType } from '../types';
import { ELEMENT_COLORS, TYPE_CN, ELEMENT_CN } from '../constants';

interface CardProps {
  card: ICard;
  onClick?: () => void;
  disabled?: boolean;
  selected?: boolean;
  isSmall?: boolean;
}

const CardTypeIcon: React.FC<{ type: CardType, className?: string }> = ({ type, className }) => {
  const commonClasses = `drop-shadow-sm ${className || ''}`;
  switch (type) {
    case CardType.Attack:
      // Sword Icon
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={commonClasses}>
          <path d="M14.5 13.5L19.5 18.5L18 20L13 15L9.5 18.5L3 21L5.5 14.5L2 11L9.5 3.5C10.5 2.5 12.5 2.5 13.5 3.5L15 5L16.5 3.5C17.5 2.5 19.5 2.5 20.5 3.5C21.5 4.5 21.5 6.5 20.5 7.5L19 9L20.5 10.5C21.5 11.5 21.5 13.5 20.5 14.5L14.5 8.5L13 10L14.5 11.5V13.5H14.5Z" />
          <path d="M6.5 15.5L9.5 18.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        </svg>
      );
    case CardType.Defense:
      // Shield Icon
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={commonClasses}>
          <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
          <path d="M12 4L18 7V11C18 15.5 15.5 19.5 12 21C8.5 19.5 6 15.5 6 11V7L12 4Z" fillOpacity="0.5" />
        </svg>
      );
    case CardType.Heal:
      // Heart Icon
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={commonClasses}>
          <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z" />
          {/* Plus Sign Inside */}
          <path d="M12 6V11M9.5 8.5H14.5" stroke="rgba(0,0,0,0.3)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

const Card: React.FC<CardProps> = ({ card, onClick, disabled, selected, isSmall }) => {
  const baseClasses = "relative flex flex-col justify-between rounded-lg shadow-md transition-transform duration-200 border-2";
  const sizeClasses = isSmall ? "w-20 h-28 p-1 text-xs" : "w-32 h-44 p-3";
  
  const colorClasses = ELEMENT_COLORS[card.element];
    
  const hoverClasses = (!disabled && onClick) 
    ? "hover:-translate-y-2 hover:shadow-xl cursor-pointer active:scale-95" 
    : "cursor-not-allowed";

  const selectedClasses = selected ? "ring-4 ring-yellow-400 scale-105 z-10" : "";
  
  // Only slightly reduce opacity/brightness to indicate state
  const disabledClasses = disabled ? "opacity-90 brightness-95" : "";

  return (
    <div 
      className={`${baseClasses} ${sizeClasses} ${colorClasses} ${hoverClasses} ${selectedClasses} ${disabledClasses}`}
      onClick={!disabled ? onClick : undefined}
    >
      <div className="font-bold text-center leading-tight border-b border-white/20 pb-1 truncate">
        {card.name}
      </div>
      
      <div className="flex flex-col items-center justify-center flex-grow my-1">
        <div className={`font-serif font-bold opacity-30 ${isSmall ? 'text-2xl' : 'text-5xl'}`}>
            {ELEMENT_CN[card.element]}
        </div>
      </div>

      <div className="flex flex-col items-center justify-end">
        <CardTypeIcon type={card.type} className={`${isSmall ? 'w-5 h-5' : 'w-10 h-10'} opacity-90`} />
        {!isSmall && <div className="text-[10px] opacity-80 font-bold mt-1 tracking-widest">{TYPE_CN[card.type]}</div>}
      </div>
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
