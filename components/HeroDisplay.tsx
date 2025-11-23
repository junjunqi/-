import React from 'react';
import { Hero, HeroKind } from '../types';
import { ELEMENT_COLORS, ELEMENT_TEXT_COLORS, ELEMENT_CN, HERO_DESCRIPTIONS, HERO_NAMES } from '../constants';
import ElementAvatar from './ElementAvatar';

interface HeroDisplayProps {
  hero: Hero;
  isCurrentTurn: boolean;
  isOpponent: boolean;
}

const HeroDisplay: React.FC<HeroDisplayProps> = ({ hero, isCurrentTurn, isOpponent }) => {
  const hpPercent = (hero.hp / hero.maxHp) * 100;
  
  // Dynamic positioning for tooltip
  // CHANGED: Tooltip now appears to the RIGHT of the hero card to avoid covering hands (top or bottom)
  // On very small screens, it might still overlap, but for desktop/tablet play this clears the card area.
  const tooltipPositionClass = "left-[100%] ml-4 top-1/2 -translate-y-1/2 origin-left";

  const arrowPositionClass = "top-1/2 -translate-y-1/2 -left-2 rotate-45 border-l border-b";

  return (
    <div className={`relative z-30 group flex items-center p-3 md:p-4 rounded-xl transition-all duration-300 border-2 ${
      isCurrentTurn ? 'bg-white border-yellow-400 shadow-lg scale-[1.02]' : 'bg-gray-100 border-gray-200 opacity-90'
    }`}>
      
      {/* Avatar */}
      <div className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center bg-slate-800 border-2 border-slate-600 overflow-hidden relative shadow-inner">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/30 z-10"></div>
        <ElementAvatar element={hero.element} className="w-12 h-12 md:w-16 md:h-16 z-0" />
      </div>

      <div className="ml-4 flex-grow min-w-[180px]">
        <div className="flex justify-between items-center mb-1">
          <div>
            <h3 className={`font-black text-xl leading-none ${ELEMENT_TEXT_COLORS[hero.element]} tracking-wide`}>{HERO_NAMES[hero.kind]}</h3>
            <div className="flex items-center gap-1 mt-1">
                <span className="text-[10px] text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded font-bold">
                    {ELEMENT_CN[hero.element]}系英雄
                </span>
                {/* Tooltip Trigger Icon */}
                <div className="w-5 h-5 rounded-full bg-gray-400 text-white flex items-center justify-center text-xs cursor-help hover:bg-yellow-500 transition-colors shadow-sm">?</div>
            </div>
          </div>
          <div className="text-right">
             <div className="flex items-baseline justify-end">
                <span className={`text-3xl font-black ${hero.hp < 4 ? 'text-red-600 animate-pulse' : 'text-gray-800'}`}>
                  {hero.hp}
                </span>
                <span className="text-gray-400 text-sm font-bold ml-1">/{hero.maxHp}</span>
             </div>
          </div>
        </div>

        {/* HP Bar */}
        <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden border border-gray-400 shadow-inner">
          <div 
            className={`h-full transition-all duration-500 shadow-[0_0_10px_rgba(0,0,0,0.2)] ${hero.hp < 4 ? 'bg-gradient-to-r from-red-600 to-red-400' : 'bg-gradient-to-r from-green-600 to-green-400'}`} 
            style={{ width: `${Math.max(0, hpPercent)}%` }}
          />
        </div>

        {/* Status Icons */}
        <div className="flex gap-2 mt-2 text-xs">
            {hero.persistentShield && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded border border-blue-200 flex items-center font-bold shadow-sm">
                    🛡️ {hero.persistentShield.value} ({ELEMENT_CN[hero.persistentShield.element]})
                </span>
            )}
            {hero.hasMetalAttackBuff && (
                <span className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded border border-slate-300 flex items-center font-bold shadow-sm">
                    ⚔️ 蓄力
                </span>
            )}
        </div>
      </div>

      {/* Skill Tooltip */}
      <div className={`absolute ${tooltipPositionClass} w-80 bg-slate-900/95 backdrop-blur text-white text-sm p-4 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 text-center border border-yellow-500/50 transform group-hover:scale-105 hidden md:block`}>
          <div className="font-bold text-yellow-400 mb-2 text-lg tracking-widest border-b border-white/10 pb-1">英雄天赋</div>
          <div className="leading-relaxed text-gray-200">{HERO_DESCRIPTIONS[hero.kind]}</div>
          {/* Arrow */}
          <div className={`absolute ${arrowPositionClass} w-4 h-4 bg-slate-900 border-yellow-500/50`}></div>
      </div>
      
      {isOpponent && isCurrentTurn && (
         <div className="absolute -top-3 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-bounce z-40">
            思考中...
         </div>
      )}
    </div>
  );
};

export default HeroDisplay;