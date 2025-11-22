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
  const colorClasses = ELEMENT_COLORS[card.element];
  const hoverClasses = (!disabled && onClick) ? "hover:-translate-y-2 hover:shadow-xl cursor-pointer active:scale-95" : "opacity-80 cursor-not-allowed";
  const selectedClasses = selected ? "ring-4 ring-yellow-400 scale-105 z-10" : "";

  return (
    <div 
      className={`${baseClasses} ${sizeClasses} ${colorClasses} ${hoverClasses} ${selectedClasses}`}
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
    </div>
  );
};

export default Card;