import React from 'react';
import { Element } from '../types';

interface ElementAvatarProps {
  element: Element;
  className?: string;
}

const ElementAvatar: React.FC<ElementAvatarProps> = ({ element, className }) => {
  const renderIcon = () => {
    switch (element) {
      case Element.Wood:
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg" fill="currentColor">
             {/* Abstract Tree/Vine */}
             <path d="M50 90 C50 90 30 70 30 50 C30 20 40 10 50 5 C60 10 70 20 70 50 C70 70 50 90 50 90 Z" fill="#15803d" />
             <path d="M50 90 C50 80 45 70 50 60 C55 50 60 40 50 20" stroke="#86efac" strokeWidth="3" fill="none" />
             <path d="M50 60 C40 50 30 45 20 30" stroke="#86efac" strokeWidth="2" fill="none" />
             <path d="M50 60 C60 50 70 45 80 30" stroke="#86efac" strokeWidth="2" fill="none" />
             <circle cx="20" cy="30" r="4" fill="#86efac" />
             <circle cx="80" cy="30" r="4" fill="#86efac" />
             <circle cx="50" cy="15" r="5" fill="#86efac" />
          </svg>
        );
      case Element.Fire:
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg" fill="currentColor">
            {/* Abstract Flame */}
            <path d="M50 10 C50 10 20 40 20 70 C20 85 35 95 50 95 C65 95 80 85 80 70 C80 40 50 10 50 10" fill="#b91c1c" />
            <path d="M50 25 C50 25 30 50 30 70 C30 80 40 85 50 85 C60 85 70 80 70 70 C70 50 50 25 50 25" fill="#ef4444" />
            <path d="M50 45 C50 45 40 60 40 70 C40 75 45 78 50 78 C55 78 60 75 60 70 C60 60 50 45 50 45" fill="#fca5a5" />
          </svg>
        );
      case Element.Earth:
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg" fill="currentColor">
             {/* Mountain/Rock */}
             <path d="M10 90 L40 30 L70 90 Z" fill="#854d0e" />
             <path d="M40 90 L70 40 L100 90 Z" fill="#a16207" />
             <path d="M25 90 L50 50 L75 90 Z" fill="#ca8a04" />
             {/* Snow caps */}
             <path d="M40 30 L47 44 L40 48 L33 44 Z" fill="#fefce8" />
             <path d="M70 40 L77 52 L70 56 L63 52 Z" fill="#fefce8" />
          </svg>
        );
      case Element.Metal:
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg" fill="currentColor">
             {/* Shield/Sword Emblem */}
             <circle cx="50" cy="50" r="40" fill="#475569" stroke="#94a3b8" strokeWidth="4" />
             <path d="M50 10 L60 30 L50 90 L40 30 Z" fill="#e2e8f0" />
             <path d="M20 40 L50 50 L80 40 L50 60 Z" fill="#94a3b8" />
             <circle cx="50" cy="50" r="8" fill="#f1f5f9" />
             <path d="M50 10 L50 90" stroke="#cbd5e1" strokeWidth="1" />
          </svg>
        );
      case Element.Water:
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg" fill="currentColor">
             {/* Waves/Whirlpool */}
             <circle cx="50" cy="50" r="40" fill="#1e40af" />
             <path d="M50 10 A 40 40 0 0 1 90 50 A 40 40 0 0 1 50 90" fill="#3b82f6" />
             <path d="M50 25 A 25 25 0 0 1 75 50 A 25 25 0 0 1 50 75" fill="#60a5fa" />
             <path d="M50 40 A 10 10 0 0 1 60 50 A 10 10 0 0 1 50 60" fill="#dbeafe" />
             <path d="M30 60 Q 50 40 70 60" stroke="#93c5fd" strokeWidth="3" fill="none" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`relative ${className}`}>
      {renderIcon()}
    </div>
  );
};

export default ElementAvatar;