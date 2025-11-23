
import { Element, HeroKind, Card, CardType } from './types';

export const INITIAL_HAND_SIZE = 5;
export const HERO_STARTING_HP = 10;

export const ELEMENT_COLORS: Record<Element, string> = {
  [Element.Wood]: 'bg-green-600 border-green-800 text-green-50',
  [Element.Fire]: 'bg-red-600 border-red-800 text-red-50',
  [Element.Earth]: 'bg-yellow-700 border-yellow-900 text-yellow-50',
  [Element.Metal]: 'bg-slate-500 border-slate-700 text-slate-50',
  [Element.Water]: 'bg-blue-600 border-blue-800 text-blue-50',
};

export const ELEMENT_TEXT_COLORS: Record<Element, string> = {
  [Element.Wood]: 'text-green-500',
  [Element.Fire]: 'text-red-500',
  [Element.Earth]: 'text-yellow-500',
  [Element.Metal]: 'text-slate-400',
  [Element.Water]: 'text-blue-400',
};

export const TYPE_CN: Record<CardType, string> = {
  [CardType.Attack]: '攻击',
  [CardType.Defense]: '防御',
  [CardType.Heal]: '恢复'
};

export const ELEMENT_CN: Record<Element, string> = {
  [Element.Wood]: '木',
  [Element.Fire]: '火',
  [Element.Earth]: '土',
  [Element.Metal]: '金',
  [Element.Water]: '水',
};

export const HERO_NAMES: Record<HeroKind, string> = {
  [HeroKind.WoodHero]: '苍藤巫',
  [HeroKind.FireHero]: '烈焰武者',
  [HeroKind.EarthHero]: '压山守卫',
  [HeroKind.MetalHero]: '破锋将',
  [HeroKind.WaterHero]: '灵潮术士'
};

export const HERO_DESCRIPTIONS: Record<HeroKind, string> = {
  [HeroKind.WoodHero]: "苍藤巫 (木)：使用【恢复】卡时，回复效果翻倍。",
  [HeroKind.FireHero]: "烈焰武者 (火)：使用【攻击】卡时，伤害翻倍。",
  [HeroKind.EarthHero]: "压山守卫 (土)：使用【防御】卡时，护盾效果翻倍。",
  [HeroKind.MetalHero]: "破锋将 (金)：若本回合受到过伤害，下一次攻击伤害翻倍且无视护盾。",
  [HeroKind.WaterHero]: "灵潮术士 (水)：若单次受到伤害 ≥ 2，超出部分反弹给攻击者。"
};

// Helper to generate unique IDs
export const generateId = () => Math.random().toString(36).substr(2, 9);

// Base Deck Factory
export const createBaseDeck = (): Card[] => {
  const uniqueCards: Omit<Card, 'id'>[] = [
    // Attack
    { name: "烈焰击", element: Element.Fire, type: CardType.Attack },
    { name: "藤刺打", element: Element.Wood, type: CardType.Attack },
    { name: "石裂打", element: Element.Earth, type: CardType.Attack },
    { name: "锋芒斩", element: Element.Metal, type: CardType.Attack },
    { name: "寒潮冲击", element: Element.Water, type: CardType.Attack },
    // Defense
    { name: "焚烧护盾", element: Element.Fire, type: CardType.Defense },
    { name: "荆棘之盾", element: Element.Wood, type: CardType.Defense },
    { name: "大地护壁", element: Element.Earth, type: CardType.Defense },
    { name: "金甲护体", element: Element.Metal, type: CardType.Defense },
    { name: "流水护壁", element: Element.Water, type: CardType.Defense },
    // Heal
    { name: "炽热回流", element: Element.Fire, type: CardType.Heal },
    { name: "生命萌芽", element: Element.Wood, type: CardType.Heal },
    { name: "沉稳呼吸", element: Element.Earth, type: CardType.Heal },
    { name: "金光疗息", element: Element.Metal, type: CardType.Heal },
    { name: "清泉润体", element: Element.Water, type: CardType.Heal },
  ];

  const fullDeck: Card[] = [];

  // Game Balance Logic:
  // High aggression to end games.
  // Weights: Attack x5 (Aggressive), Defense x2 (Tactical), Heal x1 (Rare).
  
  uniqueCards.forEach(cardProto => {
      let copies = 0;
      if (cardProto.type === CardType.Attack) copies = 5; 
      else if (cardProto.type === CardType.Defense) copies = 2; 
      else if (cardProto.type === CardType.Heal) copies = 1;

      for(let i=0; i<copies; i++) {
          fullDeck.push({ ...cardProto, id: generateId() });
      }
  });

  // Total Deck Size: (5 Att * 5) + (5 Def * 2) + (5 Heal * 1) = 25 + 10 + 5 = 40 cards per cycle.
  
  return fullDeck;
};

export const FiveElementRules = {
  generates: (a: Element, b: Element): boolean => {
    return (a === Element.Wood && b === Element.Fire) ||
           (a === Element.Fire && b === Element.Earth) ||
           (a === Element.Earth && b === Element.Metal) ||
           (a === Element.Metal && b === Element.Water) ||
           (a === Element.Water && b === Element.Wood);
  },
  overcomes: (a: Element, b: Element): boolean => {
    return (a === Element.Wood && b === Element.Earth) ||
           (a === Element.Earth && b === Element.Water) ||
           (a === Element.Water && b === Element.Fire) ||
           (a === Element.Fire && b === Element.Metal) ||
           (a === Element.Metal && b === Element.Wood);
  }
};
