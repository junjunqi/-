import React from 'react';
import { Element } from '../types';
import { ELEMENT_CN } from '../constants';

interface FiveElementsDiagramProps {
  activeLink?: {
    source: Element;
    target: Element;
    type: 'GENERATE' | 'OVERCOME';
  };
}

const FiveElementsDiagram: React.FC<FiveElementsDiagramProps> = ({ activeLink }) => {
  // Layout (clockwise, starting at top): Wood -> Fire -> Earth -> Metal -> Water
  // This matches常见五行示意图，便于识别生克方向
  const elements = [Element.Wood, Element.Fire, Element.Earth, Element.Metal, Element.Water];
  
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

  const renderArrow = (
    start: {x: number, y: number}, 
    end: {x: number, y: number}, 
    isActive: boolean, 
    isGenerate: boolean
  ) => {
    // Trim line so arrow heads don't overlap nodes
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const offset = 11; 
    
    const sx = start.x + dx * (offset/dist);
    const sy = start.y + dy * (offset/dist);
    const ex = end.x - dx * (offset/dist);
    const ey = end.y - dy * (offset/dist);

    // Colors & weights
    const color = isGenerate ? '#84cc16' : '#f87171'; 
    const baseOpacity = isGenerate ? 0.75 : 0.4; // 克线更清晰
    const strokeWidth = isActive ? 3.2 : (isGenerate ? 2 : 2);
    const opacity = isActive ? 1 : baseOpacity; 
    
    const id = `arrow-${Math.random().toString(36).substr(2, 9)}`;

    let pathD = ``;

    if (isGenerate) {
        // 生：外圈柔和曲线
        const mx = (sx + ex) / 2;
        const my = (sy + ey) / 2;
        const vcx = mx - center.x;
        const vcy = my - center.y;
        const factor = 1.28; 
        pathD = `M ${sx} ${sy} Q ${center.x + vcx*factor} ${center.y + vcy*factor} ${ex} ${ey}`;
    } else {
        // 克：标准五芒星直线，保持示意图形状
        pathD = `M ${sx} ${sy} L ${ex} ${ey}`;
    }

    // Marker
    const mWidth = isGenerate ? 4 : 7;
    const mHeight = isGenerate ? 4 : 6;
    const mRefX = isGenerate ? 3.5 : 6; 
    const mRefY = isGenerate ? 2 : 3;   
    const mPoints = isGenerate ? "0 0, 4 2, 0 4" : "0 0, 7 3, 0 6";

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
            strokeLinecap="round"
            className={isActive ? "animate-pop" : ""}
            filter={isActive ? "drop-shadow(0 0 4px currentColor)" : ""}
            strokeDasharray={isGenerate ? undefined : undefined} 
        />
      </g>
    );
  };

  const isLinkActive = (s: Element, t: Element) => activeLink?.source === s && activeLink?.target === t;

  return (
    <div className="w-56 h-56 relative select-none">
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl overflow-visible">
        {/* GENERATION CYCLE (Outer - Curve - Lime Green) */}
        {renderArrow(coords[4], coords[0], isLinkActive(Element.Wood, Element.Fire), true)}
        {renderArrow(coords[0], coords[1], isLinkActive(Element.Fire, Element.Earth), true)}
        {renderArrow(coords[1], coords[2], isLinkActive(Element.Earth, Element.Metal), true)}
        {renderArrow(coords[2], coords[3], isLinkActive(Element.Metal, Element.Water), true)}
        {renderArrow(coords[3], coords[4], isLinkActive(Element.Water, Element.Wood), true)}

        {/* OVERCOMING STAR (Inner - Curved, subtle) */}
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
