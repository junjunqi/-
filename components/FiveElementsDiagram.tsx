import React from 'react';
import { Element } from '../types';
import { ELEMENT_CN } from '../constants';

interface FiveElementsDiagramProps {
  activeLink?: {
    source: Element;
    target: Element;
    type: 'GENERATE' | 'OVERCOME';
  };
  className?: string;
}

const FiveElementsDiagram: React.FC<FiveElementsDiagramProps> = ({ activeLink, className }) => {
  // Layout: Clockwise from Top
  // Fire (Top), Earth (Right-Top), Metal (Right-Bottom), Water (Left-Bottom), Wood (Left-Top)
  const elements = [Element.Fire, Element.Earth, Element.Metal, Element.Water, Element.Wood];
  
  // Coordinates on a 100x100 grid
  const radius = 35;
  const center = { x: 50, y: 50 };
  
  const getCoord = (index: number) => {
    const angle = (index * 72 - 90) * (Math.PI / 180);
    return {
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle)
    };
  };

  const coords = elements.map((_, i) => getCoord(i));

  const renderArrow = (start: {x: number, y: number}, end: {x: number, y: number}, isActive: boolean, isCurve: boolean) => {
    // 1. Calculate Trim to avoid overlapping circle nodes
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const offset = 12; // Circle radius + gap
    
    const sx = start.x + dx * (offset/dist);
    const sy = start.y + dy * (offset/dist);
    const ex = end.x - dx * (offset/dist);
    const ey = end.y - dy * (offset/dist);

    // 2. Define Style & Color
    // Gen (Curve): Lime Green (Life), Over (Straight): Rose Red (Impact)
    const color = isCurve ? '#84cc16' : '#be123c'; 
    
    // Make overcoming lines thicker and more visible by default
    const strokeWidth = isActive ? 3 : (isCurve ? 2 : 2);
    const opacity = isActive ? 1 : (isCurve ? 0.6 : 0.6); 
    
    const id = `arrow-${Math.random().toString(36).substr(2, 9)}`;

    let pathD = ``;

    if (isCurve) {
        // GENERATION: Smooth Curve (Outer Circle)
        const mx = (sx + ex) / 2;
        const my = (sy + ey) / 2;
        const vcx = mx - 50;
        const vcy = my - 50;
        const factor = 1.3; 
        pathD = `M ${sx} ${sy} Q ${50 + vcx*factor} ${50 + vcy*factor} ${ex} ${ey}`;
    } else {
        // OVERCOMING: Straight Line (Inner Star)
        pathD = `M ${sx} ${sy} L ${ex} ${ey}`;
    }

    // Marker Config
    // Curve (Generation): Small, subtle arrow
    // Straight (Overcoming): Large, sharp, aggressive arrow
    const mWidth = isCurve ? 4 : 10;
    const mHeight = isCurve ? 4 : 8;
    const mRefX = isCurve ? 3.5 : 9; // Adjust refX to align tip with line end
    const mRefY = isCurve ? 2 : 4;   // Center Y
    const mPoints = isCurve ? "0 0, 4 2, 0 4" : "0 0, 10 4, 0 8";

    return (
      <g key={id} className="transition-all duration-500">
        <defs>
            <marker id={id} markerWidth={mWidth} markerHeight={mHeight} refX={mRefX} refY={mRefY} orient="auto">
                <polygon points={mPoints} fill={color} opacity={opacity} />
            </marker>
        </defs>
        <path 
            d={pathD} 
            stroke={color} 
            strokeWidth={strokeWidth} 
            fill="none" 
            markerEnd={`url(#${id})`} 
            opacity={opacity}
            strokeLinecap={isCurve ? "round" : "butt"}
            className={isActive ? (isCurve ? "animate-pulse" : "animate-shake") : ""}
            filter={isActive ? "drop-shadow(0 0 3px currentColor)" : ""}
        />
      </g>
    );
  };

  const isLinkActive = (s: Element, t: Element) => activeLink?.source === s && activeLink?.target === t;

  return (
    <div className={`relative select-none ${className || 'w-56 h-56'}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl overflow-visible">
        {/* GENERATION CYCLE (Outer - Curve - Lime Green) */}
        {renderArrow(coords[4], coords[0], isLinkActive(Element.Wood, Element.Fire), true)}
        {renderArrow(coords[0], coords[1], isLinkActive(Element.Fire, Element.Earth), true)}
        {renderArrow(coords[1], coords[2], isLinkActive(Element.Earth, Element.Metal), true)}
        {renderArrow(coords[2], coords[3], isLinkActive(Element.Metal, Element.Water), true)}
        {renderArrow(coords[3], coords[4], isLinkActive(Element.Water, Element.Wood), true)}

        {/* OVERCOMING STAR (Inner - Straight - Rose Red) */}
        {renderArrow(coords[4], coords[1], isLinkActive(Element.Wood, Element.Earth), false)}
        {renderArrow(coords[1], coords[3], isLinkActive(Element.Earth, Element.Water), false)}
        {renderArrow(coords[3], coords[0], isLinkActive(Element.Water, Element.Fire), false)}
        {renderArrow(coords[0], coords[2], isLinkActive(Element.Fire, Element.Metal), false)}
        {renderArrow(coords[2], coords[4], isLinkActive(Element.Metal, Element.Wood), false)}

        {/* Nodes */}
        {elements.map((el, i) => {
            const isActive = activeLink?.source === el || activeLink?.target === el;
            const colors: Record<Element, string> = {
                [Element.Wood]: '#166534',
                [Element.Fire]: '#991b1b',
                [Element.Earth]: '#854d0e',
                [Element.Metal]: '#334155',
                [Element.Water]: '#1e3a8a',
            };
            const strokes: Record<Element, string> = {
                [Element.Wood]: '#4ade80',
                [Element.Fire]: '#f87171',
                [Element.Earth]: '#facc15',
                [Element.Metal]: '#94a3b8',
                [Element.Water]: '#60a5fa',
            };
            
            return (
                <g key={el} className="transition-transform duration-300 hover:scale-110 cursor-help z-10">
                    <circle 
                        cx={coords[i].x} 
                        cy={coords[i].y} 
                        r={9} 
                        fill={colors[el]} 
                        stroke={strokes[el]}
                        strokeWidth={isActive ? 3 : 1.5}
                        className={`transition-all ${isActive ? "animate-pop" : ""}`}
                    />
                    <text 
                        x={coords[i].x} 
                        y={coords[i].y} 
                        dy=".35em" 
                        textAnchor="middle" 
                        fill="white" 
                        fontSize="9" 
                        fontWeight="bold"
                        className="font-serif drop-shadow-md"
                    >
                        {ELEMENT_CN[el]}
                    </text>
                </g>
            );
        })}
      </svg>
    </div>
  );
};

export default FiveElementsDiagram;