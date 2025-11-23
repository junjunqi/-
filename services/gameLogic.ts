
import { Card, Element, Hero, HeroKind, ShieldBuff, CardType } from '../types';
import { FiveElementRules, ELEMENT_CN } from '../constants';

// Return type for calculations including UI effects
export interface CalculationResult {
    value: number;
    log: string[];
    effect: 'GENERATE' | 'OVERCOME' | 'WEAK' | 'PASSIVE' | 'REFLECT' | 'NONE';
}

// Helper to shuffle
export const shuffleDeck = (deck: Card[]): Card[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

// Calculation Logic
export const calculateAttackDamage = (attacker: Hero, card: Card): { damage: number, log: string[], effect: CalculationResult['effect'], ignoreShield: boolean } => {
  let damage = 1;
  const logs: string[] = [];
  let effect: CalculationResult['effect'] = 'NONE';
  let ignoreShield = false;

  // 1. Hero Passives (Calculated First)
  
  // Fire Hero: Damage * 2
  if (attacker.kind === HeroKind.FireHero) {
    damage *= 2;
    effect = 'PASSIVE';
    logs.push(`【被动】烈焰武者特性触发，伤害翻倍！`);
  }

  // Metal Hero: Counter Attack * 2 + Ignore Shield
  if (attacker.kind === HeroKind.MetalHero && attacker.hasMetalAttackBuff) {
    damage *= 2;
    ignoreShield = true;
    effect = 'PASSIVE';
    logs.push(`【反击】金英雄触发反击特性：伤害翻倍且无视护盾！`);
  }

  // 2. Elemental Generation (Attribute Calculation) -> x2
  if (FiveElementRules.generates(attacker.element, card.element)) {
    damage *= 2;
    effect = 'GENERATE';
    logs.push(`【相生】英雄(${ELEMENT_CN[attacker.element]}) 生 卡牌(${ELEMENT_CN[card.element]})，伤害翻倍！`);
  }

  return { damage, log: logs, effect, ignoreShield };
};

export const calculateDefenseValue = (defender: Hero, card: Card): { value: number, log: string[], effect: CalculationResult['effect'] } => {
  let value = 1;
  const logs: string[] = [];
  let effect: CalculationResult['effect'] = 'NONE';

  // 1. Hero Generates Card -> x2
  if (FiveElementRules.generates(defender.element, card.element)) {
    value *= 2;
    effect = 'GENERATE';
    logs.push(`【相生】英雄(${ELEMENT_CN[defender.element]}) 生 卡牌(${ELEMENT_CN[card.element]})，护盾翻倍！`);
  }

  // 2. Earth Hero Passive
  if (defender.kind === HeroKind.EarthHero) {
    value *= 2;
    if (effect === 'NONE') effect = 'PASSIVE';
    logs.push(`【被动】压山守卫特性触发，护盾翻倍！`);
  }

  return { value, log: logs, effect };
};

export const calculateHealValue = (hero: Hero, card: Card): { value: number, log: string[], effect: CalculationResult['effect'] } => {
  let value = 1;
  const logs: string[] = [];
  let effect: CalculationResult['effect'] = 'NONE';

  if (FiveElementRules.generates(hero.element, card.element)) {
    value *= 2;
    effect = 'GENERATE';
    logs.push(`【相生】英雄(${ELEMENT_CN[hero.element]}) 生 卡牌(${ELEMENT_CN[card.element]})，恢复量翻倍！`);
  }

  if (hero.kind === HeroKind.WoodHero) {
    value *= 2;
    if (effect === 'NONE') effect = 'PASSIVE';
    logs.push(`【被动】苍藤巫特性触发，恢复量翻倍！`);
  }

  return { value, log: logs, effect };
};

export const calculateElementInteraction = (
  baseValue: number, 
  defendingElement: Element, 
  attackingElement: Element
): { finalValue: number, log: string[], effect: CalculationResult['effect'] } => {
  let value = baseValue;
  const logs: string[] = [];
  let effect: CalculationResult['effect'] = 'NONE';

  if (FiveElementRules.overcomes(defendingElement, attackingElement)) {
    value *= 2;
    effect = 'OVERCOME';
    logs.push(`【克制】防御方(${ELEMENT_CN[defendingElement]}) 克 攻击方(${ELEMENT_CN[attackingElement]})，防御效果 x2！`);
  } else if (FiveElementRules.overcomes(attackingElement, defendingElement)) {
    value = Math.floor(value / 2);
    effect = 'WEAK';
    logs.push(`【被克】攻击方(${ELEMENT_CN[attackingElement]}) 克 防御方(${ELEMENT_CN[defendingElement]})，防御效果减半。`);
  }

  return { finalValue: value, log: logs, effect };
};

export const calculateCardVsHeroDamage = (damage: number, cardElement: Element, heroElement: Element): { finalDamage: number, log: string[], effect: CalculationResult['effect'] } => {
    let d = damage;
    const logs: string[] = [];
    let effect: CalculationResult['effect'] = 'NONE';

    if (FiveElementRules.overcomes(heroElement, cardElement)) {
        d = Math.floor(d / 2);
        effect = 'WEAK';
        logs.push(`【抵抗】英雄属性(${ELEMENT_CN[heroElement]}) 克 卡牌属性(${ELEMENT_CN[cardElement]})，受到伤害减半。`);
    } else if (FiveElementRules.overcomes(cardElement, heroElement)) {
        d *= 2;
        effect = 'OVERCOME';
        logs.push(`【重创】卡牌属性(${ELEMENT_CN[cardElement]}) 克 英雄属性(${ELEMENT_CN[heroElement]})，受到伤害 x2！`);
    }
    
    return { finalDamage: d, log: logs, effect };
};
