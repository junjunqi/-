
export enum Element {
  Wood = 'Wood',
  Fire = 'Fire',
  Earth = 'Earth',
  Metal = 'Metal',
  Water = 'Water'
}

export enum CardType {
  Attack = 'Attack',
  Defense = 'Defense',
  Heal = 'Heal'
}

export enum HeroKind {
  WoodHero = 'WoodHero',
  FireHero = 'FireHero',
  EarthHero = 'EarthHero',
  MetalHero = 'MetalHero',
  WaterHero = 'WaterHero'
}

export interface Card {
  id: string; // Added unique ID for React keys
  name: string;
  element: Element;
  type: CardType;
}

export interface ShieldBuff {
  value: number;
  element: Element;
  sourceCard: Card;
}

export interface Hero {
  id: number;
  name: string;
  kind: HeroKind;
  element: Element;
  maxHp: number;
  hp: number;
  hasMetalAttackBuff: boolean;
  persistentShield: ShieldBuff | null;
  isAI?: boolean; // New flag to identify computer players
}

export interface GameState {
  phase: 'HERO_SELECTION' | 'PLAYER_TURN' | 'DEFENDER_REACTION' | 'GAME_OVER';
  turnCount: number;
  currentPlayerIndex: number; // 0 or 1
  players: Hero[];
  hands: Card[][];
  deck: Card[];
  discard: Card[];
  logs: string[];
  
  // State for the reaction phase
  pendingAttack: {
    attackerIndex: number;
    card: Card;
    initialDamage: number;
    ignoreShield?: boolean;
  } | null;
  
  // Turn specific flags
  hasAttackedThisTurn: boolean;
}
