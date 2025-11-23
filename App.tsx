
import React, { useState, useEffect, useRef } from 'react';
import { 
  Card, Hero, GameState, HeroKind, Element, CardType 
} from './types';
import { 
  INITIAL_HAND_SIZE, HERO_STARTING_HP, HERO_DESCRIPTIONS, HERO_NAMES,
  createBaseDeck, ELEMENT_CN, ELEMENT_TEXT_COLORS, FiveElementRules, ELEMENT_COLORS
} from './constants';
import * as Logic from './services/gameLogic';
import * as AIStrategy from './services/aiStrategy';
import { audio } from './services/audio';
import CardComponent, { CardBack } from './components/Card';
import HeroDisplay from './components/HeroDisplay';
import GameLog from './components/GameLog';
import ElementAvatar from './components/ElementAvatar';
import FiveElementsDiagram from './components/FiveElementsDiagram';

// Initial Dummy State
const initialHeroState = (id: number, kind: HeroKind, element: Element, name: string, isAI: boolean = false): Hero => ({
  id,
  name,
  kind,
  element,
  maxHp: HERO_STARTING_HP,
  hp: HERO_STARTING_HP,
  hasMetalAttackBuff: false,
  persistentShield: null,
  isAI
});

const App: React.FC = () => {
  // ---------------- State ----------------
  const [gameState, setGameState] = useState<GameState>({
    phase: 'HERO_SELECTION',
    turnCount: 0,
    currentPlayerIndex: 0,
    players: [],
    hands: [[], []],
    deck: [],
    discard: [],
    logs: [],
    pendingAttack: null,
    hasAttackedThisTurn: false
  });

  const [selectedHeroP1, setSelectedHeroP1] = useState<HeroKind | null>(null);
  
  // Visual Feedback State
  const [effectMessage, setEffectMessage] = useState<{text: string, color: string, size?: string} | null>(null);
  const [screenShake, setScreenShake] = useState(false);
  const [screenFlash, setScreenFlash] = useState<'red' | 'gold' | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  
  // New: Interaction Link HUD State
  const [interactionTip, setInteractionTip] = useState<{ source: Element, target: Element, type: 'GENERATE' | 'OVERCOME' } | null>(null);

  // AI Timer Ref
  const aiTimeoutRef = useRef<number | null>(null);

  // ---------------- Init Audio ----------------
  useEffect(() => {
      const initAudio = () => {
          audio.init();
          // Start BGM immediately on first click if waiting
          if (gameState.phase === 'HERO_SELECTION' && !isMuted) {
             audio.startBGM();
          }
      };
      window.addEventListener('click', initAudio, { once: true });
      return () => window.removeEventListener('click', initAudio);
  }, [gameState.phase, isMuted]);

  // ---------------- AI Loop ----------------
  useEffect(() => {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const defenderIndex = gameState.currentPlayerIndex === 0 ? 1 : 0;
    const defender = gameState.players[defenderIndex];

    // Clear any existing timers on state change
    if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
        aiTimeoutRef.current = null;
    }

    // 1. AI Turn Logic (Active Phase)
    if (gameState.phase === 'PLAYER_TURN' && currentPlayer?.isAI && !gameState.pendingAttack) {
         aiTimeoutRef.current = window.setTimeout(() => {
             const aiHand = gameState.hands[gameState.currentPlayerIndex];
             const action = AIStrategy.decideTurnAction(currentPlayer, aiHand, defender, gameState.hasAttackedThisTurn);
             
             if (action.type === 'PLAY_CARD') {
                 const result = handlePlayCard(action.card, action.cardIndex);
                 // Safety fallback: If AI tried to play an invalid card and it was rejected, end turn
                 if (result === false) {
                    console.warn("AI attempted invalid move, forcing end turn.");
                    endTurn();
                 }
             } else {
                 endTurn();
             }
         }, 1000); // Reduced thinking time to 1.0s
    }

    // 2. AI Reaction Logic (Defender Phase)
    if (gameState.phase === 'DEFENDER_REACTION' && defender?.isAI && gameState.pendingAttack) {
         aiTimeoutRef.current = window.setTimeout(() => {
             const aiHand = gameState.hands[defenderIndex];
             const reactionCard = AIStrategy.decideReaction(
                 defender, 
                 aiHand, 
                 gameState.pendingAttack!.card, 
                 gameState.pendingAttack!.initialDamage
             );
             handleDefenderReaction(reactionCard);
         }, 1000);
    }

    // ADDED gameState.hands to dependencies to trigger re-eval after playing Heal/Defense
  }, [gameState.phase, gameState.turnCount, gameState.currentPlayerIndex, gameState.pendingAttack, gameState.hasAttackedThisTurn, gameState.hands]);

  // ---------------- Helpers ----------------
  const addLog = (msg: string) => {
    setGameState(prev => ({ ...prev, logs: [...prev.logs, msg] }));
  };

  const triggerVisuals = (effect: Logic.CalculationResult['effect'], sourceEl?: Element, targetEl?: Element) => {
      let msg = null;
      
      // Set Link HUD
      if (sourceEl && targetEl) {
          if (effect === 'GENERATE') setInteractionTip({ source: sourceEl, target: targetEl, type: 'GENERATE' });
          if (effect === 'OVERCOME') setInteractionTip({ source: sourceEl, target: targetEl, type: 'OVERCOME' });
          if (effect === 'WEAK') setInteractionTip({ source: sourceEl, target: targetEl, type: 'OVERCOME' }); // Weak is just reverse overcome
          
          setTimeout(() => setInteractionTip(null), 2500);
      }

      if (effect === 'GENERATE') {
          msg = { text: '🔥 五行相生！效果翻倍！', color: 'text-green-400', size: 'text-5xl' };
          setScreenFlash('gold');
          audio.playBuff();
      }
      if (effect === 'OVERCOME') {
          msg = { text: '💥 五行克制！暴击！', color: 'text-red-500', size: 'text-6xl' };
          setScreenShake(true);
          setScreenFlash('red');
          audio.playImpact(true);
      }
      if (effect === 'WEAK') {
          msg = { text: '🛡️ 属性抵抗！效果减半', color: 'text-gray-400' };
          audio.playDefense();
      }
      if (effect === 'REFLECT') {
          msg = { text: '🌀 伤害反弹！', color: 'text-blue-400' };
          setScreenShake(true);
          audio.playImpact(false);
      }
      
      if (msg) {
          setEffectMessage(msg);
          setTimeout(() => {
              setEffectMessage(null);
              setScreenShake(false);
              setScreenFlash(null);
          }, 1500);
      }
  };

  // ---------------- Game Flow Actions ----------------

  const initializeGame = (playerHeroKind: HeroKind) => {
    const heroes = Object.keys(HERO_NAMES) as HeroKind[];
    const aiHeroKind = heroes[Math.floor(Math.random() * heroes.length)];

    const getHeroDetails = (kind: HeroKind, id: number, isAI: boolean) => {
      const map: Record<HeroKind, {el: Element}> = {
        [HeroKind.WoodHero]: { el: Element.Wood },
        [HeroKind.FireHero]: { el: Element.Fire },
        [HeroKind.EarthHero]: { el: Element.Earth },
        [HeroKind.MetalHero]: { el: Element.Metal },
        [HeroKind.WaterHero]: { el: Element.Water },
      };
      let name = HERO_NAMES[kind];
      if (isAI) name += " (电脑)";
      return initialHeroState(id, kind, map[kind].el, name, isAI);
    };

    const p1 = getHeroDetails(playerHeroKind, 0, false);
    const p2 = getHeroDetails(aiHeroKind, 1, true);
    
    let deck = Logic.shuffleDeck(createBaseDeck());
    const hand1: Card[] = [];
    const hand2: Card[] = [];
    const discard: Card[] = [];

    const draw = (hand: Card[]) => {
      if (deck.length === 0) return;
      hand.push(deck[0]);
      deck.shift();
    };

    for(let i=0; i<INITIAL_HAND_SIZE; i++) {
      draw(hand1);
      draw(hand2);
    }

    setGameState({
      phase: 'PLAYER_TURN',
      turnCount: 1,
      currentPlayerIndex: 0,
      players: [p1, p2],
      hands: [hand1, hand2],
      deck,
      discard,
      logs: ['游戏开始！', `${p1.name} 对战 ${p2.name}`],
      pendingAttack: null,
      hasAttackedThisTurn: false
    });
    
    audio.startBGM();
  };

  const drawCard = (playerIndex: number) => {
    audio.playDrawCard();
    setGameState(prev => {
      let { deck, discard, hands, logs } = prev;
      const newDeck = [...deck];
      let newDiscard = [...discard];
      const newHands = [...hands];
      
      if (newDeck.length === 0) {
        if (newDiscard.length === 0) {
          return { ...prev, logs: [...logs, "牌库和弃牌堆已空！无法抽牌。"] };
        }
        logs = [...logs, "牌库耗尽，弃牌堆洗切为牌库。"];
        const shuffled = Logic.shuffleDeck(newDiscard);
        newDeck.push(...shuffled);
        newDiscard = [];
      }

      const card = newDeck.shift();
      if (card) {
        newHands[playerIndex] = [...newHands[playerIndex], card];
      }

      return {
        ...prev,
        deck: newDeck,
        discard: newDiscard,
        hands: newHands,
        logs
      };
    });
  };

  const endTurn = () => {
    const nextPlayerIdx = gameState.currentPlayerIndex === 0 ? 1 : 0;
    const nextTurnCount = nextPlayerIdx === 0 ? gameState.turnCount + 1 : gameState.turnCount;
    const nextPlayer = gameState.players[nextPlayerIdx];

    setGameState(prev => ({
      ...prev,
      phase: 'PLAYER_TURN',
      currentPlayerIndex: nextPlayerIdx,
      turnCount: nextTurnCount,
      hasAttackedThisTurn: false,
      logs: [...prev.logs, `--- 回合结束。轮到 ${nextPlayer.name} ---`]
    }));
    
    setTimeout(() => drawCard(nextPlayerIdx), 300);
  };

  // ---------------- Card Interaction Handlers ----------------

  // Returns true if card was played successfully, false if invalid
  const handlePlayCard = (card: Card, cardIndex: number): boolean => {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const opponentIndex = gameState.currentPlayerIndex === 0 ? 1 : 0;
    const opponentHand = gameState.hands[opponentIndex];

    // --- Validation Checks ---
    if (card.type === CardType.Attack && gameState.hasAttackedThisTurn) return false;
    
    if (card.type === CardType.Heal && currentPlayer.hp >= currentPlayer.maxHp) {
        // Only show alert for human player
        if (!currentPlayer.isAI) {
            alert("生命值已满，无需恢复！");
        }
        return false;
    }

    if (card.type === CardType.Defense && currentPlayer.persistentShield) {
        if (!currentPlayer.isAI) {
            alert("已有护盾，无法叠加！");
        }
        return false;
    }
    // -------------------------

    const consumeCard = () => {
      const newHands = [...gameState.hands];
      newHands[gameState.currentPlayerIndex] = newHands[gameState.currentPlayerIndex].filter((_, i) => i !== cardIndex);
      return newHands;
    };

    if (card.type === CardType.Attack) {
      audio.playAttack();

      const { damage, log, effect, ignoreShield } = Logic.calculateAttackDamage(currentPlayer, card);
      triggerVisuals(effect, currentPlayer.element, card.element);

      const hasDefenseCards = opponentHand.some(c => c.type === CardType.Defense);
      
      const attackState = {
        attackerIndex: gameState.currentPlayerIndex,
        card: card,
        initialDamage: damage,
        ignoreShield: ignoreShield
      };

      const newHands = consumeCard();

      setGameState(prev => ({
        ...prev,
        hands: newHands,
        phase: hasDefenseCards ? 'DEFENDER_REACTION' : 'PLAYER_TURN', 
        pendingAttack: attackState,
        logs: [...prev.logs, `${currentPlayer.name} 使用了【${card.name}】发起攻击！`, ...log],
        discard: [...prev.discard, card] 
      }));

      if (!hasDefenseCards) {
        resolveAttack(attackState, null);
      }

    } else if (card.type === CardType.Defense) {
       audio.playDefense();
       const { value, log, effect } = Logic.calculateDefenseValue(currentPlayer, card);
       triggerVisuals(effect, currentPlayer.element, card.element);

       const newHands = consumeCard();
       
       const newPlayers = [...gameState.players];
       newPlayers[gameState.currentPlayerIndex] = {
         ...currentPlayer,
         persistentShield: { value, element: card.element, sourceCard: card }
       };

       setGameState(prev => ({
         ...prev,
         players: newPlayers,
         hands: newHands,
         logs: [...prev.logs, `${currentPlayer.name} 装备了【${card.name}】作为护盾 (值: ${value})。`, ...log]
       }));

    } else if (card.type === CardType.Heal) {
      audio.playHeal();
      const { value, log, effect } = Logic.calculateHealValue(currentPlayer, card);
      triggerVisuals(effect, currentPlayer.element, card.element);

      const newHands = consumeCard();
      
      const newPlayers = [...gameState.players];
      const healedHp = Math.min(currentPlayer.maxHp, currentPlayer.hp + value);
      const actualHeal = healedHp - currentPlayer.hp;
      
      newPlayers[gameState.currentPlayerIndex] = { ...currentPlayer, hp: healedHp };

      setGameState(prev => ({
        ...prev,
        players: newPlayers,
        hands: newHands,
        logs: [...prev.logs, `${currentPlayer.name} 使用【${card.name}】恢复了 ${actualHeal} 点生命。`, ...log],
        discard: [...prev.discard, card]
      }));
    }
    
    return true;
  };

  // ---------------- Resolution Logic ----------------

  const resolveAttack = (attack: NonNullable<GameState['pendingAttack']>, defenseCard: Card | null) => {
    setGameState(prev => {
      const attackerIdx = attack.attackerIndex;
      const defenderIdx = attackerIdx === 0 ? 1 : 0;
      let attacker = { ...prev.players[attackerIdx] };
      let defender = { ...prev.players[defenderIdx] };
      const logs = [...prev.logs];
      const discard = [...prev.discard];

      // Atomically update hands if defense card was used
      const hands = [...prev.hands];
      if (defenseCard) {
          hands[defenderIdx] = hands[defenderIdx].filter(c => c.id !== defenseCard.id);
      }

      let currentDamage = attack.initialDamage;

      // 1. Persistent Shield Check
      // Only check shield if NOT ignored
      if (defender.persistentShield && currentDamage > 0) {
        if (attack.ignoreShield) {
            logs.push(`⚡ 【穿透】攻击无视了 ${defender.name} 的持久护盾！`);
        } else {
            logs.push(`${defender.name} 的护盾触发！`);
            const { finalValue: blocked, log, effect } = Logic.calculateElementInteraction(
            defender.persistentShield.value, 
            defender.persistentShield.element, 
            attack.card.element
            );
            if(effect !== 'NONE') {
                if (effect === 'OVERCOME') triggerVisuals('OVERCOME', defender.persistentShield.element, attack.card.element);
                if (effect === 'WEAK') triggerVisuals('OVERCOME', attack.card.element, defender.persistentShield.element);
            } else {
                audio.playImpact(false);
            }

            logs.push(...log);
            logs.push(`护盾抵消了 ${blocked} 点伤害。`);
            currentDamage = Math.max(0, currentDamage - blocked);

            discard.push(defender.persistentShield.sourceCard);
            defender.persistentShield = null;
        }
      }

      // 2. Defense Card
      if (defenseCard && currentDamage > 0) {
        const { value: defBase } = Logic.calculateDefenseValue(defender, defenseCard);
        const { finalValue: defFinal, log: interactionLog, effect } = Logic.calculateElementInteraction(
          defBase, defenseCard.element, attack.card.element
        );
        
        if(effect !== 'NONE') {
             if (effect === 'OVERCOME') triggerVisuals('OVERCOME', defenseCard.element, attack.card.element);
             if (effect === 'WEAK') triggerVisuals('OVERCOME', attack.card.element, defenseCard.element);
        } else {
             audio.playDefense();
        }

        logs.push(...interactionLog);
        
        const blocked = Math.min(defFinal, currentDamage);
        currentDamage -= blocked;
        logs.push(`防御卡【${defenseCard.name}】抵消了 ${blocked} 点伤害。剩余伤害：${currentDamage}。`);
        
        discard.push(defenseCard);
      }

      // 3. Final Damage & Passives
      let damageToAttacker = 0;
      let damageToDefender = currentDamage;

      if (damageToDefender > 0) {
        if (defender.kind === HeroKind.MetalHero) {
          defender.hasMetalAttackBuff = true;
          logs.push(`${defender.name} (金) 被击中！下次攻击伤害翻倍且无视护盾。`);
        }

        const { finalDamage, log: elLog, effect } = Logic.calculateCardVsHeroDamage(damageToDefender, attack.card.element, defender.element);
        damageToDefender = finalDamage;
        
        if(effect === 'OVERCOME') triggerVisuals('OVERCOME', attack.card.element, defender.element); 
        else if (effect === 'WEAK') triggerVisuals('WEAK', defender.element, attack.card.element);
        else audio.playImpact(false);
        
        logs.push(...elLog);

        if (defender.kind === HeroKind.WaterHero && damageToDefender >= 2) {
          const reflect = damageToDefender - 2;
          damageToDefender = 2;
          damageToAttacker += reflect;
          triggerVisuals('REFLECT');
          logs.push(`${defender.name} (水) 反弹了 ${reflect} 点伤害！`);
        }
      } else {
        logs.push("攻击被完全抵挡！");
        audio.playDefense();
      }

      // Apply HP Changes
      if (damageToDefender > 0) {
        defender.hp -= damageToDefender;
        logs.push(`${defender.name} 受到 ${damageToDefender} 点伤害。`);
      }
      if (damageToAttacker > 0) {
        attacker.hp -= damageToAttacker;
        logs.push(`${attacker.name} 受到 ${damageToAttacker} 点反弹伤害。`);
      }

      if (attacker.kind === HeroKind.MetalHero && attacker.hasMetalAttackBuff) {
         attacker.hasMetalAttackBuff = false;
      }

      const newPlayers = [...prev.players];
      newPlayers[attackerIdx] = attacker;
      newPlayers[defenderIdx] = defender;

      let phase: GameState['phase'] = 'PLAYER_TURN';

      if (attacker.hp <= 0 || defender.hp <= 0) {
        phase = 'GAME_OVER';
        logs.push("游戏结束！");
        if (attacker.hp <= 0 && defender.hp <= 0) logs.push("同归于尽！");
        else if (attacker.hp <= 0) logs.push(`${defender.name} 获胜！`);
        else logs.push(`${attacker.name} 获胜！`);
      }

      return {
        ...prev,
        players: newPlayers,
        hands, // Updated atomically
        discard,
        logs,
        phase,
        pendingAttack: null,
        hasAttackedThisTurn: true,
        currentPlayerIndex: attackerIdx
      };
    });
  };

  const handleDefenderReaction = (card: Card | null) => {
    if (!gameState.pendingAttack) return;
    resolveAttack(gameState.pendingAttack, card);
  };

  // ---------------- Render Helpers ----------------

  const renderHeroSelection = () => {
    const heroes = Object.keys(HERO_DESCRIPTIONS) as HeroKind[];
    
    const select = (kind: HeroKind) => {
      audio.playHover();
      initializeGame(kind); // Direct start with AI
    };

    const mapElement = (kind: HeroKind): Element => {
        const map: Record<HeroKind, Element> = {
            [HeroKind.WoodHero]: Element.Wood,
            [HeroKind.FireHero]: Element.Fire,
            [HeroKind.EarthHero]: Element.Earth,
            [HeroKind.MetalHero]: Element.Metal,
            [HeroKind.WaterHero]: Element.Water,
        };
        return map[kind];
    }

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-4 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 to-slate-950">
        <h1 className="text-6xl text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 mb-2 font-black tracking-[0.5em] drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]">五行对决</h1>
        <p className="text-gray-400 mb-10 font-serif text-lg italic tracking-widest">Five Elements Battle</p>
        
        <h2 className="text-2xl text-white mb-8 font-serif border-b-2 border-yellow-600/50 pb-2 px-10">
          选择你的英雄 (开始游戏)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-7xl w-full px-4">
          {heroes.map(kind => {
              const element = mapElement(kind);
              const borderColor = {
                  [Element.Wood]: 'group-hover:border-green-500',
                  [Element.Fire]: 'group-hover:border-red-500',
                  [Element.Earth]: 'group-hover:border-yellow-600',
                  [Element.Metal]: 'group-hover:border-slate-400',
                  [Element.Water]: 'group-hover:border-blue-500',
              }[element];
              
              const textColor = {
                  [Element.Wood]: 'group-hover:text-green-400',
                  [Element.Fire]: 'group-hover:text-red-400',
                  [Element.Earth]: 'group-hover:text-yellow-400',
                  [Element.Metal]: 'group-hover:text-slate-300',
                  [Element.Water]: 'group-hover:text-blue-400',
              }[element];

              return (
                <button
                  key={kind}
                  onClick={() => select(kind)}
                  onMouseEnter={() => audio.playHover()}
                  className={`group relative bg-slate-900/50 border-2 border-slate-700 ${borderColor} p-6 rounded-2xl text-center transition-all duration-300 hover:-translate-y-3 hover:shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col items-center overflow-hidden backdrop-blur-sm`}
                >
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity bg-gradient-to-t from-current to-transparent ${textColor}`}></div>
                  
                  <div className="relative w-24 h-24 mb-6 rounded-full bg-slate-800 border-4 border-slate-600 shadow-inner flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <ElementAvatar element={element} className="w-16 h-16" />
                  </div>
                  
                  <div className={`font-black text-2xl text-slate-200 mb-3 ${textColor} transition-colors tracking-widest`}>
                      {HERO_NAMES[kind]}
                  </div>
                  <p className="text-gray-400 text-xs leading-relaxed opacity-80 group-hover:opacity-100">
                      {HERO_DESCRIPTIONS[kind].split('：')[1]}
                  </p>
                </button>
              );
          })}
        </div>
      </div>
    );
  };

  // ---------------- Main Render ----------------

  if (gameState.phase === 'HERO_SELECTION') {
    return renderHeroSelection();
  }

  const playerIdx = gameState.currentPlayerIndex;
  const opponentIdx = playerIdx === 0 ? 1 : 0;
  const isReactionPhase = gameState.phase === 'DEFENDER_REACTION';
  
  const bottomPlayerIdx = 0; 
  const topPlayerIdx = 1;
  const topPlayer = gameState.players[topPlayerIdx];
  const bottomPlayer = gameState.players[bottomPlayerIdx];

  return (
    <div className={`min-h-screen bg-slate-900 text-gray-100 flex flex-col md:flex-row overflow-hidden relative transition-colors duration-200 
        ${screenShake ? 'animate-shake' : ''} 
        ${screenFlash === 'red' ? 'animate-flash-red' : ''}
        ${screenFlash === 'gold' ? 'animate-flash-gold' : ''}
    `}>
      
      <button 
        onClick={() => { audio.toggleMute(!isMuted); setIsMuted(!isMuted); }}
        className="absolute top-4 right-4 z-50 bg-slate-800/80 hover:bg-slate-700 text-white p-3 rounded-full border border-slate-600 shadow-lg backdrop-blur"
        title={isMuted ? "开启音效" : "静音"}
      >
          {isMuted ? '🔇' : '🔊'}
      </button>

      {/* Interaction Link HUD (Top Left) */}
      {interactionTip && (
          <div className="absolute top-20 left-4 z-50 bg-slate-900/90 border border-yellow-500/30 p-4 rounded-xl shadow-2xl flex items-center gap-4 animate-pop pointer-events-none backdrop-blur-md">
             <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-600 p-2">
                    <ElementAvatar element={interactionTip.source} className="w-full h-full" />
                </div>
                <div className={`text-xs mt-1 font-bold ${ELEMENT_TEXT_COLORS[interactionTip.source]}`}>{ELEMENT_CN[interactionTip.source]}</div>
             </div>
             
             <div className="flex flex-col items-center text-yellow-500 font-bold px-2">
                 <div className="text-2xl animate-pulse">
                    {interactionTip.type === 'GENERATE' ? '▶ 生 ▶' : '⚔️ 克 ⚔️'}
                 </div>
                 <div className="text-[10px] uppercase tracking-widest bg-slate-800 px-2 rounded border border-yellow-500/30 mt-1">
                    {interactionTip.type === 'GENERATE' ? '相生增强' : '相克压制'}
                 </div>
             </div>
             
             <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-600 p-2">
                    <ElementAvatar element={interactionTip.target} className="w-full h-full" />
                </div>
                <div className={`text-xs mt-1 font-bold ${ELEMENT_TEXT_COLORS[interactionTip.target]}`}>{ELEMENT_CN[interactionTip.target]}</div>
             </div>
        </div>
      )}

      {/* Visual Text Overlay - Positioned at top 20% to avoid blocking center board */}
      {effectMessage && (
          <div className="absolute top-[20%] inset-x-0 flex justify-center z-50 pointer-events-none">
              <div className={`font-black ${effectMessage.color} drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] animate-pop text-center`}>
                  <div className={`${effectMessage.size || 'text-5xl'}`}>{effectMessage.text}</div>
              </div>
          </div>
      )}

      {/* Sidebar */}
      <div className="w-full md:w-1/4 bg-slate-950 border-b md:border-r border-slate-800 flex flex-col p-4 order-1 md:order-2 shadow-2xl z-40">
        <div className="mb-4">
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-yellow-200 flex justify-between items-center">
              <span>第 {gameState.turnCount} 回合</span>
              <span className="text-xs px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-gray-300 font-normal">
                  {isReactionPhase ? '防御阶段' : '出牌阶段'}
              </span>
          </h1>
          <p className="text-sm text-gray-400 mt-2 pl-1 border-l-2 border-yellow-600/30">
            {gameState.players[playerIdx].isAI 
                ? (isReactionPhase ? `⚡ 电脑正在思考如何防御...` : `🤖 电脑正在思考出牌...`)
                : (isReactionPhase ? `⚡ 轮到你防御` : `🎲 轮到你行动`)}
          </p>
        </div>
        <GameLog logs={gameState.logs} />
        
        {/* Five Elements Diagram */}
        <div className="mt-auto pt-6 hidden md:flex flex-col items-center opacity-80 hover:opacity-100 transition-opacity">
             <h3 className="text-xs uppercase text-yellow-600 font-bold mb-2 tracking-wider">五行阵法图</h3>
             <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 shadow-inner w-full flex justify-center">
                 <FiveElementsDiagram 
                    activeLink={interactionTip ? { 
                        source: interactionTip.source, 
                        target: interactionTip.target, 
                        type: interactionTip.type 
                    } : undefined} 
                 />
             </div>
        </div>
      </div>

      {/* Game Board */}
      <div className="flex-1 flex flex-col relative p-2 md:p-6 order-2 md:order-1 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
        
        {/* TOP AREA (Opponent/AI) */}
        <div className="flex-1 flex flex-col items-center justify-start py-4 relative transition-all duration-500">
          <div className="scale-90 opacity-90 hover:opacity-100 transition-all relative z-20">
            <HeroDisplay 
                hero={topPlayer} 
                isCurrentTurn={playerIdx === topPlayerIdx}
                isOpponent={true}
            />
          </div>
          
          {/* Opponent Hands - Z-Index 10 to be below Hero Tooltip */}
          <div className="flex -space-x-6 mt-6 relative z-10">
            {gameState.hands[topPlayerIdx].map((card, i) => (
               <div key={card.id} className="transform hover:-translate-y-2 transition-transform">
                   {topPlayer.isAI ? (
                       <CardBack isSmall={window.innerWidth < 768} />
                   ) : (
                       <CardComponent card={card} disabled isSmall={window.innerWidth < 768} />
                   )}
               </div>
            ))}
          </div>
        </div>

        {/* CENTER ACTIONS */}
        <div className="h-24 md:h-32 flex items-center justify-center z-30 relative">
           {/* Player is reacting - NEW DEFENDER ALERT UI */}
           {isReactionPhase && !bottomPlayer.isAI && playerIdx === topPlayerIdx && gameState.pendingAttack && (
               /* Using fixed center positioning but without backdrop to avoid blocking card clicks */
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-in zoom-in-95 duration-200 pointer-events-none">
                   <div className="bg-slate-900 border-2 border-red-600 rounded-2xl shadow-2xl max-w-xl w-[90vw] md:w-auto overflow-hidden flex flex-col md:flex-row pointer-events-auto">
                       
                       {/* Left: Threat Intel */}
                       <div className="p-4 bg-red-950/30 flex-1 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-red-900/50 relative">
                           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-transparent"></div>
                           <h3 className="text-red-400 uppercase tracking-widest font-bold text-[10px] mb-2">⚠️ 敌方攻击判定</h3>
                           
                           <div className="flex items-center gap-4">
                               <div className={`w-16 h-20 rounded-lg border-2 flex flex-col items-center justify-center ${ELEMENT_COLORS[gameState.pendingAttack.card.element]}`}>
                                   <ElementAvatar element={gameState.pendingAttack.card.element} className="w-8 h-8 mb-1" />
                                   <div className="font-bold text-xs">{gameState.pendingAttack.card.name}</div>
                               </div>
                               <div className="text-center">
                                    <div className="text-gray-400 text-[10px] uppercase font-bold">伤害</div>
                                    <div className="text-3xl font-black text-white drop-shadow-md">
                                      {gameState.pendingAttack.initialDamage}
                                      {gameState.pendingAttack.ignoreShield && <span className="text-[10px] block text-yellow-500">⚡ 无视护盾</span>}
                                    </div>
                               </div>
                           </div>
                       </div>

                       {/* Right: Tactical Analysis */}
                       <div className="p-4 flex-[1.5] bg-slate-900 flex flex-col">
                           <h3 className="text-yellow-500 uppercase tracking-widest font-bold text-[10px] mb-2 border-b border-gray-700 pb-1">
                               🛡️ 战术建议
                           </h3>
                           
                           <div className="space-y-2 flex-grow text-xs">
                               {/* 1. Counter Defense Hint */}
                               {(() => {
                                   const attackEl = gameState.pendingAttack.card.element;
                                   const counterEl = [Element.Wood, Element.Fire, Element.Earth, Element.Metal, Element.Water].find(e => FiveElementRules.overcomes(e, attackEl));
                                   if (!counterEl) return null;
                                   
                                   const hasCounter = gameState.hands[bottomPlayerIdx].some(c => c.type === CardType.Defense && c.element === counterEl);

                                   return (
                                       <div className={`p-2 rounded border flex items-center gap-2 ${hasCounter ? 'bg-green-900/20 border-green-600/50' : 'bg-gray-800 border-gray-700'}`}>
                                           <div className="text-lg">✨</div>
                                           <div>
                                               <div className={`font-bold ${hasCounter ? 'text-green-400' : 'text-gray-400'}`}>完美防御：{ELEMENT_CN[counterEl]}</div>
                                               <div className="text-[10px] text-gray-500">防御值翻倍</div>
                                           </div>
                                       </div>
                                   );
                               })()}

                               {/* 2. Weakness Warning */}
                               {(() => {
                                   const attackEl = gameState.pendingAttack.card.element;
                                   const weakEl = [Element.Wood, Element.Fire, Element.Earth, Element.Metal, Element.Water].find(e => FiveElementRules.overcomes(attackEl, e));
                                   if (!weakEl) return null;

                                   return (
                                       <div className="p-2 rounded border bg-red-900/10 border-red-900/30 flex items-center gap-2">
                                           <div className="text-lg">🚫</div>
                                           <div>
                                               <div className="font-bold text-red-400">避免：{ELEMENT_CN[weakEl]}</div>
                                               <div className="text-[10px] text-gray-500">防御值减半</div>
                                           </div>
                                       </div>
                                   );
                               })()}
                           </div>

                           <div className="mt-3 flex gap-2">
                               <button 
                                 onClick={() => handleDefenderReaction(null)}
                                 className="px-3 py-1.5 rounded bg-slate-800 text-gray-400 hover:bg-slate-700 hover:text-white text-xs font-bold border border-slate-700 transition-colors whitespace-nowrap"
                               >
                                 承伤(放弃)
                               </button>
                               <div className="flex-grow text-right text-[10px] text-gray-500 flex items-center justify-end">
                                   点击下方卡牌应对 ⬇
                               </div>
                           </div>
                       </div>
                   </div>
               </div>
           )}
           
           {/* Normal Turn End Button (Only for Human Player) */}
           {!isReactionPhase && playerIdx === bottomPlayerIdx && gameState.phase !== 'GAME_OVER' && (
             <button 
               onClick={endTurn}
               onMouseEnter={() => audio.playHover()}
               className="group relative px-10 py-4 bg-slate-800 text-white rounded-full font-bold shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-yellow-500/50 hover:border-yellow-400 overflow-hidden transition-all hover:scale-105 active:scale-95"
             >
               <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/80 to-yellow-800/80 opacity-0 group-hover:opacity-100 transition-opacity"></div>
               <span className="relative z-10 flex items-center gap-2">
                   <span>结束回合</span> 
                   <span className="text-yellow-500 group-hover:text-white">▶</span>
               </span>
             </button>
           )}

           {/* Game Over */}
           {gameState.phase === 'GAME_OVER' && (
               <div className="flex flex-col items-center gap-6 bg-black/60 p-8 rounded-3xl backdrop-blur-sm border border-white/10 relative z-50">
                   <div className="text-5xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] tracking-widest">胜负已分</div>
                   <button 
                    onClick={() => window.location.reload()}
                    className="px-10 py-3 bg-green-600 hover:bg-green-500 text-white rounded-full font-bold shadow-lg animate-bounce"
                    >
                    开启新对决
                    </button>
               </div>
           )}
        </div>

        {/* BOTTOM AREA (Player) */}
        <div className="flex-1 flex flex-col items-center justify-end py-4 relative">
          <div className="flex flex-wrap justify-center gap-3 md:gap-4 mb-8 z-10 px-2 perspective-1000">
            {gameState.hands[bottomPlayerIdx].map((card, i) => {
                // Logic for enabling/disabling cards in UI
                let disabled = false;
                
                // If it's not my turn (or I'm defending and it's reaction phase)
                const isMyTurn = playerIdx === bottomPlayerIdx;
                
                if (isReactionPhase) {
                    // If I am defending (I am P0, P1 is attacking/current)
                    if (playerIdx !== bottomPlayerIdx) {
                        if (card.type !== CardType.Defense) disabled = true;
                    } else {
                        // I am attacking, can't play cards while waiting
                        disabled = true;
                    }
                } else {
                    // Normal Phase
                    if (!isMyTurn) disabled = true;
                    if (card.type === CardType.Attack && gameState.hasAttackedThisTurn) disabled = true;
                    // Rule: Cannot heal at max HP
                    if (card.type === CardType.Heal && bottomPlayer.hp >= bottomPlayer.maxHp) disabled = true;
                    // Rule: Cannot stack shields
                    if (card.type === CardType.Defense && bottomPlayer.persistentShield) disabled = true;
                }

                // Updated class for visibility: just opacity-90, no grayscale, no pointer-events-none (to allow cursor to show)
                const opacityClass = disabled ? 'opacity-90' : 'hover:z-20';
                
                return (
                    <div key={card.id} className={`transition-all duration-300 ${opacityClass}`}>
                        <CardComponent 
                            card={card} 
                            onClick={() => {
                                if (!disabled) {
                                    isReactionPhase ? handleDefenderReaction(card) : handlePlayCard(card, i);
                                }
                            }}
                            disabled={disabled}
                            isSmall={window.innerWidth < 768}
                        />
                    </div>
                );
            })}
          </div>

          <HeroDisplay 
            hero={bottomPlayer} 
            isCurrentTurn={playerIdx === bottomPlayerIdx}
            isOpponent={false}
          />
        </div>

      </div>
    </div>
  );
};

export default App;
