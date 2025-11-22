
import { Card, Hero, CardType, ShieldBuff } from '../types';
import * as Logic from './gameLogic';

// AI decision result types
export type AIAction = 
    | { type: 'PLAY_CARD'; cardIndex: number; card: Card }
    | { type: 'END_TURN' };

export const decideTurnAction = (
    aiHero: Hero,
    aiHand: Card[],
    opponentHero: Hero,
    hasAttacked: boolean
): AIAction => {
    // Filter out cards that are strictly invalid based on game rules
    // This prevents the AI from trying to play a card that the UI/Game Logic would reject, causing a freeze.
    const validHand = aiHand.map((card, index) => ({ card, index })).filter(item => {
        // Cannot heal if full HP
        if (item.card.type === CardType.Heal && aiHero.hp >= aiHero.maxHp) return false;
        // Cannot shield if already has persistent shield
        if (item.card.type === CardType.Defense && aiHero.persistentShield) return false;
        // Cannot attack if already attacked
        if (item.card.type === CardType.Attack && hasAttacked) return false;
        return true;
    });

    if (validHand.length === 0) {
        // Explicit logging for debugging
        console.log("AI: No valid cards to play (or rules prevent action). Ending turn.");
        return { type: 'END_TURN' };
    }

    // 1. Survival Priority: Heal if low HP (< 6)
    if (aiHero.hp < 6) {
        const healCards = validHand.filter(item => item.card.type === CardType.Heal);
        
        if (healCards.length > 0) {
            // Pick best heal (prefer element match for x2)
            const bestHeal = healCards.sort((a, b) => {
                const valA = Logic.calculateHealValue(aiHero, a.card).value;
                const valB = Logic.calculateHealValue(aiHero, b.card).value;
                return valB - valA;
            })[0];
            return { type: 'PLAY_CARD', cardIndex: bestHeal.index, card: bestHeal.card };
        }
    }

    // 2. Kill Opportunity: Can I kill the opponent now?
    if (!hasAttacked) {
        const attackCards = validHand.filter(item => item.card.type === CardType.Attack);
        
        for (const item of attackCards) {
            const baseDmg = Logic.calculateAttackDamage(aiHero, item.card).damage;
            let estimatedDmg = baseDmg;
            const { finalDamage } = Logic.calculateCardVsHeroDamage(estimatedDmg, item.card.element, opponentHero.element);
            
            if (finalDamage >= opponentHero.hp) {
                return { type: 'PLAY_CARD', cardIndex: item.index, card: item.card };
            }
        }
    }

    // 3. Offense: Play strongest attack if haven't attacked
    if (!hasAttacked) {
        const attackCards = validHand.filter(item => item.card.type === CardType.Attack);
        
        if (attackCards.length > 0) {
             const bestAttack = attackCards.sort((a, b) => {
                const dmgA = Logic.calculateAttackDamage(aiHero, a.card).damage;
                const dmgB = Logic.calculateAttackDamage(aiHero, b.card).damage;
                const finalA = Logic.calculateCardVsHeroDamage(dmgA, a.card.element, opponentHero.element).finalDamage;
                const finalB = Logic.calculateCardVsHeroDamage(dmgB, b.card.element, opponentHero.element).finalDamage;
                return finalB - finalA;
            })[0];
            return { type: 'PLAY_CARD', cardIndex: bestAttack.index, card: bestAttack.card };
        }
    }

    // 4. Defense/Preparation: Put up a shield if I don't have one
    // (Note: validHand filter already ensures we don't have a shield if we see defense cards here)
    const defCards = validHand.filter(item => item.card.type === CardType.Defense);
    if (defCards.length > 0) {
        // Pick best shield value
        const bestDef = defCards.sort((a, b) => {
            const valA = Logic.calculateDefenseValue(aiHero, a.card).value;
            const valB = Logic.calculateDefenseValue(aiHero, b.card).value;
            return valB - valA;
        })[0];
        return { type: 'PLAY_CARD', cardIndex: bestDef.index, card: bestDef.card };
    }

    // 5. Heal anyway if I have spare action and missing any HP
    const healCards = validHand.filter(item => item.card.type === CardType.Heal);
    if (healCards.length > 0) {
        return { type: 'PLAY_CARD', cardIndex: healCards[0].index, card: healCards[0].card };
    }

    // 6. Else End Turn (If only cards left are invalid or unwanted)
    return { type: 'END_TURN' };
};

export const decideReaction = (
    aiHero: Hero,
    aiHand: Card[],
    incomingCard: Card,
    incomingDamage: number
): Card | null => {
    if (incomingDamage <= 0) return null;

    const defCards = aiHand.filter(c => c.type === CardType.Defense);
    if (defCards.length === 0) return null;

    // Find card that mitigates the most damage
    const bestCard = defCards.sort((a, b) => {
        const baseA = Logic.calculateDefenseValue(aiHero, a).value;
        const baseB = Logic.calculateDefenseValue(aiHero, b).value;
        
        const finalA = Logic.calculateElementInteraction(baseA, a.element, incomingCard.element).finalValue;
        const finalB = Logic.calculateElementInteraction(baseB, b.element, incomingCard.element).finalValue;
        
        return finalB - finalA;
    })[0];

    return bestCard;
};
