import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";
import { Ship, Anchor, Fish, Utensils, Skull, Dice5, Coins, User, Waves, MapPin, Sailboat, LifeBuoy, TrendingUp, TrendingDown, Settings, Bot, Play, Info, Sparkles, AlertTriangle, X, Globe } from 'lucide-react';

// --- Constants & Types ---

const BOARD_SIZE = 16;
const START_MONEY = 1500;
const START_HUNGER = 0;
const MAX_HUNGER = 12;

type SpaceType = 'START' | 'BOAT' | 'RESTAURANT' | 'CHANCE' | 'STORM' | 'JAIL';
type BoatType = 'TRAWLER' | 'SAILBOAT' | 'DINGHY' | 'YACHT';
type Lang = 'IS' | 'EN';

interface BoardSpace {
  id: number;
  name: string;
  type: SpaceType;
  price?: number;
  rent?: number;
  owner?: number | null;
  imageUrl?: string;
  description?: string;
  isGenerated?: boolean;
}

interface Player {
  id: number;
  name: string;
  color: string;
  position: number;
  money: number;
  hunger: number;
  isJailed: boolean;
  inventory: number[];
  isAi: boolean;
  boatType: BoatType;
}

interface GameLog {
  id: number;
  text: string;
  type: 'info' | 'alert' | 'success';
}

interface MarketState {
  fishPrice: number;
  meatPrice: number;
  trend: 'STABLE' | 'BOOM' | 'CRASH';
}

// Translations
const T = {
  IS: {
    subtitle: "TAUGAKERFIS ÚTGÁFA",
    fish: "FISKUR",
    meat: "KJÖT",
    marketStable: "MARKAÐUR\nSTÖÐUGUR",
    marketBoom: "UPPSVEIFLA",
    marketCrash: "HRUN",
    calculating: "Reiknar...",
    sailing: "Siglir...",
    awaiting: "Bíður skipana",
    purchase: "Kaupa",
    for: "fyrir",
    acquire: "KAUPA",
    pass: "SLEPPA",
    rollDice: "KASTA",
    systemBusy: "Kerfi Upptekið",
    aiControl: "Gervigreind stýrir",
    commsLog: "FJARSKIPTASKRÁ",
    consulting: "Rætt við Völvuna",
    generating: "Býr til sögu...",
    accept: "SAMÞYKKJA ÖRLÖGIN",
    processing: "Gervigreind hugsar...",
    rent: "Leiga",
    lobbyTitle: "MAÍGREIFINN",
    lobbySubtitle: "GERVIGREINDAR STÝRÐ SJÓMENNSKA",
    human: "Mannlegur",
    ai: "Gervigreind",
    addCrew: "BÆTA VIÐ ÁHÖFN",
    embark: "LEGGJA ÚR HÖFN",
    trawler: "Togari",
    sailboat: "Seglskúta",
    yacht: "Snekkja",
    dinghy: "Julla",
    log_dock: "leggur að bryggju",
    log_starve: "féll í yfirlið!",
    log_storm: "Lenti í stormi!",
    log_jail: "Skrúfan flæktist.",
    log_rent: "Borgaði leigu",
    log_welcome: "Velkomin heim að",
    log_buy: "keypti",
    log_poor: "Ekki nægt fé.",
    log_market_boom: "UPPSVEIFLA! Verð rjúka upp!",
    log_market_crash: "HRUN! Markaðurinn hrundi.",
    start_desc: "Örugg höfn. Fáðu 200kr.",
    storm_desc: "Náttúruöflin.",
    chance_desc: "Örlög hafsins.",
    jail_desc: "Flæktir net.",
    ai_generating: "Gervigreind teiknar",
    signal_lost: "Samband rofnaði við",
    mystery_title: "Djúpið Kallar",
    mystery_desc: "Dularfullt hljóð úr hyldýpinu...",
    radio_silence: "Ekkert samband",
    oracle_lost: "Náði ekki sambandi við Völvuna."
  },
  EN: {
    subtitle: "NEURAL EDITION",
    fish: "FISH",
    meat: "MEAT",
    marketStable: "MARKET\nSTABLE",
    marketBoom: "BOOM",
    marketCrash: "CRASH",
    calculating: "Calculating...",
    sailing: "Sailing...",
    awaiting: "Awaiting orders",
    purchase: "Purchase",
    for: "for",
    acquire: "ACQUIRE",
    pass: "PASS",
    rollDice: "ROLL DICE",
    systemBusy: "System Busy",
    aiControl: "AI Skipper in control",
    commsLog: "COMMS LOG",
    consulting: "Consulting the Oracle",
    generating: "Generating Narrative...",
    accept: "ACCEPT FATE",
    processing: "AI is processing...",
    rent: "Rent",
    lobbyTitle: "MAÍGREIFINN",
    lobbySubtitle: "THE AI POWERED MARITIME EXPERIENCE",
    human: "Human Captain",
    ai: "AI Neural Net",
    addCrew: "ADD CREW MEMBER",
    embark: "EMBARK",
    trawler: "Trawler",
    sailboat: "Sailboat",
    yacht: "Yacht",
    dinghy: "Dinghy",
    log_dock: "docks at Harbor",
    log_starve: "collapsed from starvation!",
    log_storm: "Caught in the storm!",
    log_jail: "Propeller tangled.",
    log_rent: "Paid rent",
    log_welcome: "Welcome home to",
    log_buy: "purchased",
    log_poor: "Insufficient funds.",
    log_market_boom: "MARKET BOOM! Prices skyrocket!",
    log_market_crash: "MARKET CRASH! Port economy collapses.",
    start_desc: "Safe haven. Collect 200kr.",
    storm_desc: "Nature's wrath.",
    chance_desc: "The sea decides.",
    jail_desc: "Tangled nets.",
    ai_generating: "AI Generating Assets",
    signal_lost: "Signal lost generating",
    mystery_title: "The Deep Calls",
    mystery_desc: "A mysterious echo from the abyss...",
    radio_silence: "Radio Silence",
    oracle_lost: "The connection to the oracle is lost."
  }
};

const INITIAL_BOARD: BoardSpace[] = [
  { id: 0, name: "Reykjavíkurhöfn", type: 'START', description: "Örugg höfn. Fáðu 200kr." },
  { id: 1, name: "Jón Páll", type: 'BOAT', price: 100, rent: 20, description: "Lítill og sterkur." },
  { id: 2, name: "Sjómannalífið", type: 'CHANCE', description: "Örlög hafsins." },
  { id: 3, name: "Kjallarinn", type: 'RESTAURANT', price: 150, rent: 30, description: "Heit súpa, kaldir veggir." },
  { id: 4, name: "Gunnvör", type: 'BOAT', price: 180, rent: 35, description: "Hraðskreiðastur á Vestfjörðum." },
  { id: 5, name: "Stormur", type: 'STORM', description: "Náttúruöflin." },
  { id: 6, name: "Humarvagninn", type: 'RESTAURANT', price: 200, rent: 40, description: "Humar draumar." },
  { id: 7, name: "Sæbjörg", type: 'BOAT', price: 220, rent: 45, description: "Björgunarskipið." },
  { id: 8, name: "Grandagarður", type: 'START', description: "Hvíldu lúin bein." },
  { id: 9, name: "Harpa", type: 'BOAT', price: 240, rent: 50, description: "Gler og stál á sjó." },
  { id: 10, name: "Sjómannalífið", type: 'CHANCE', description: "Örlög hafsins." },
  { id: 11, name: "Sægreifinn", type: 'RESTAURANT', price: 350, rent: 70, description: "Goðsögnin lifir." },
  { id: 12, name: "Sjóli", type: 'BOAT', price: 260, rent: 55, description: "Hátækni togari." },
  { id: 13, name: "Sjófangelsið", type: 'JAIL', description: "Flæktir net." },
  { id: 14, name: "Moby Dick", type: 'BOAT', price: 300, rent: 60, description: "Hvíti hvalurinn." },
  { id: 15, name: "Bryggjan", type: 'RESTAURANT', price: 280, rent: 60, description: "Bjór og útsýni." },
];

const DEFAULT_PLAYERS: Player[] = [
  { id: 0, name: "Skipstjóri 1", color: "bg-amber-500", position: 0, money: START_MONEY, hunger: START_HUNGER, isJailed: false, inventory: [], isAi: false, boatType: 'TRAWLER' },
  { id: 1, name: "Gervigreind", color: "bg-cyan-500", position: 0, money: START_MONEY, hunger: START_HUNGER, isJailed: false, inventory: [], isAi: true, boatType: 'YACHT' },
];

// --- Helpers ---

const getAi = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Components ---

function App() {
  const [view, setView] = useState<'LOBBY' | 'GAME'>('LOBBY');
  const [lang, setLang] = useState<Lang>('IS');
  const [players, setPlayers] = useState<Player[]>(DEFAULT_PLAYERS);
  const [board, setBoard] = useState<BoardSpace[]>(INITIAL_BOARD);
  
  const [turn, setTurn] = useState(0);
  const [round, setRound] = useState(1);
  const [gameState, setGameState] = useState<'IDLE' | 'MOVING' | 'EVENT' | 'GAME_OVER' | 'AI_THINKING'>('IDLE');
  const [logs, setLogs] = useState<GameLog[]>([]);
  const [currentEvent, setCurrentEvent] = useState<{ title: string, text: string, image?: string, effect?: number } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [market, setMarket] = useState<MarketState>({ fishPrice: 1.0, meatPrice: 1.0, trend: 'STABLE' });

  const currentPlayer = players[turn];
  const t = T[lang];

  useEffect(() => {
    if (turn === 0 && round > 1) {
      updateMarket();
    }
  }, [round]);

  // AI Turn Handling
  useEffect(() => {
    if (view === 'GAME' && currentPlayer.isAi && gameState === 'IDLE') {
      const runAiTurn = async () => {
        setGameState('AI_THINKING');
        // AI "Thinking" time
        await new Promise(r => setTimeout(r, 1500));
        handleRoll(true);
      };
      runAiTurn();
    }
  }, [turn, view, gameState]);

  const addLog = (text: string, type: 'info' | 'alert' | 'success' = 'info') => {
    setLogs(prev => [...prev.slice(-4), { id: Date.now(), text, type }]);
  };

  const updateMarket = () => {
    const r = Math.random();
    let newFish = 1.0;
    let newMeat = 1.0;
    let trend: MarketState['trend'] = 'STABLE';

    if (r > 0.85) {
      trend = 'BOOM';
      newFish = 1.6;
      newMeat = 1.4;
      addLog(t.log_market_boom, 'success');
    } else if (r < 0.15) {
      trend = 'CRASH';
      newFish = 0.5;
      newMeat = 0.6;
      addLog(t.log_market_crash, 'alert');
    } else {
      newFish = 0.8 + Math.random() * 0.4;
      newMeat = 0.8 + Math.random() * 0.4;
    }

    setMarket({ fishPrice: Number(newFish.toFixed(2)), meatPrice: Number(newMeat.toFixed(2)), trend });
  };

  const generatePropertyImage = async (spaceId: number, name: string, type: string) => {
    try {
      addLog(`${t.ai_generating}: ${name}...`, 'info');
      const ai = getAi();
      
      const imagePromise = ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: `Epic, cinematic digital art of an Icelandic ${type.toLowerCase()} named "${name}" at night with aurora borealis. Dark moody teal and gold lighting, hyperrealistic, reflection in water.` }]
        },
        config: { imageConfig: { aspectRatio: "1:1", imageSize: "1K" } }
      });

      const languagePrompt = lang === 'IS' ? "in Icelandic" : "in English";
      const textPromise = ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Write a 10-word noir-style evocative description for a ${type} named "${name}" ${languagePrompt}.`
      });

      const [imageResponse, textResponse] = await Promise.all([imagePromise, textPromise]);

      let imageUrl = "";
      for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) imageUrl = `data:image/png;base64,${part.inlineData.data}`;
      }

      const description = textResponse.text?.trim() || "";

      setBoard(prev => prev.map(s => s.id === spaceId ? { 
        ...s, 
        imageUrl: imageUrl || s.imageUrl, 
        description: description || s.description, 
        isGenerated: true 
      } : s));
    } catch (e) {
      console.error(e);
      addLog(`${t.signal_lost} ${name}.`, 'alert');
    }
  };

  const triggerChanceEvent = async () => {
    setAiLoading(true);
    setGameState('EVENT');
    const ai = getAi();
    
    try {
      const languagePrompt = lang === 'IS' ? "in Icelandic" : "in English";
      const textResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a random event for a maritime board game ${languagePrompt}. Return JSON: {title, description, effect (number -100 to 100)}.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              effect: { type: Type.NUMBER }
            },
            required: ['title', 'description', 'effect']
          }
        }
      });

      const eventData = JSON.parse(textResponse.text || "{}");
      
      const imageResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: `Tarot card style illustration of: ${eventData.description}. Mystic, glowing, dark fantasy style.` }]
        },
        config: { imageConfig: { aspectRatio: "1:1", imageSize: "1K" } }
      });

      let imageUrl = "";
      for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) imageUrl = `data:image/png;base64,${part.inlineData.data}`;
      }

      setCurrentEvent({
        title: String(eventData.title || t.mystery_title),
        text: String(eventData.description || t.mystery_desc),
        image: imageUrl,
        effect: Number(eventData.effect || 0)
      });
    } catch (e) {
      console.error(e);
      setCurrentEvent({ title: t.radio_silence, text: t.oracle_lost, effect: 0 });
    } finally {
      setAiLoading(false);
    }
  };

  const handleRoll = async (isAi = false) => {
    if (gameState !== 'IDLE' && gameState !== 'AI_THINKING') return;
    setGameState('MOVING');

    // Roll animation delay
    const roll = Math.floor(Math.random() * 6) + 1;
    await new Promise(r => setTimeout(r, 800));

    let newPos = (currentPlayer.position + roll) % BOARD_SIZE;
    
    if (newPos < currentPlayer.position) {
      addLog(`${currentPlayer.name} ${t.log_dock}. +200kr`, 'success');
      updatePlayer(turn, { money: currentPlayer.money + 200, hunger: Math.max(0, currentPlayer.hunger - 1) });
      if (turn === players.length - 1) setRound(r => r + 1);
    }

    updatePlayer(turn, { position: newPos, hunger: currentPlayer.hunger + 1 });
    
    if (currentPlayer.hunger + 1 >= MAX_HUNGER) {
      addLog(`${currentPlayer.name} ${t.log_starve}`, 'alert');
      updatePlayer(turn, { position: 0, money: Math.max(0, currentPlayer.money - 100), hunger: 0 });
      newPos = 0;
    }

    const space = board[newPos];
    handleLandOnSpace(space, newPos, isAi);
  };

  const handleLandOnSpace = async (space: BoardSpace, pos: number, isAi: boolean) => {
    // Trigger generation if not present
    if ((space.type === 'BOAT' || space.type === 'RESTAURANT') && !space.imageUrl && !space.isGenerated) {
       generatePropertyImage(space.id, space.name, space.type);
    }

    if (space.type === 'CHANCE') {
      await triggerChanceEvent();
      if (isAi) setTimeout(() => resolveEvent(true), 3000);
    } else if (space.type === 'STORM') {
      addLog(`${t.log_storm} -50kr`, 'alert');
      updatePlayer(turn, { money: Math.max(0, currentPlayer.money - 50), hunger: currentPlayer.hunger + 1 });
      endTurn(isAi);
    } else if (space.type === 'JAIL') {
      addLog(`${t.log_jail}`, 'alert');
      endTurn(isAi);
    } else if (space.type === 'BOAT' || space.type === 'RESTAURANT') {
      if (space.owner === undefined || space.owner === null) {
        if (isAi) {
           const price = space.price || 0;
           // AI Logic
           if (currentPlayer.money > (price + 250)) {
             setTimeout(() => buyProperty(true), 1000);
           } else {
             setTimeout(() => endTurn(true), 1000);
           }
        } else {
           setGameState('IDLE');
           // Player decides in UI
        }
      } else if (space.owner !== turn) {
        const owner = players[space.owner];
        const baseRent = space.rent || 0;
        let finalRent = Math.floor(baseRent * (space.type === 'BOAT' ? market.fishPrice : market.meatPrice));
        
        addLog(`${t.log_rent}: ${finalRent}kr -> ${owner.name}`, 'alert');
        
        let newHunger = currentPlayer.hunger;
        if (space.type === 'RESTAURANT') {
          newHunger = Math.max(0, newHunger - 3);
          addLog("Maturinn góður. Hungur -3.", 'success');
        }

        updatePlayer(turn, { money: Math.max(0, currentPlayer.money - finalRent), hunger: newHunger });
        updatePlayer(space.owner, { money: owner.money + finalRent });
        endTurn(isAi);
      } else {
         addLog(`${t.log_welcome} ${space.name}.`);
         if (space.type === 'RESTAURANT') updatePlayer(turn, { hunger: Math.max(0, currentPlayer.hunger - 3) });
         endTurn(isAi);
      }
    } else {
      endTurn(isAi);
    }
  };

  const buyProperty = (isAi = false) => {
    const space = board[players[turn].position];
    if (space.price && players[turn].money >= space.price) {
      updatePlayer(turn, { 
        money: players[turn].money - space.price,
        inventory: [...players[turn].inventory, space.id]
      });
      setBoard(prev => prev.map(s => s.id === space.id ? { ...s, owner: turn } : s));
      addLog(`${players[turn].name} ${t.log_buy} ${space.name}`, 'success');
      endTurn(isAi);
    } else if (!isAi) {
      addLog(t.log_poor, 'alert');
    }
  };

  const resolveEvent = (isAi = false) => {
    if (currentEvent) {
      updatePlayer(turn, { money: Math.max(0, players[turn].money + (currentEvent.effect || 0)) });
    }
    setCurrentEvent(null);
    endTurn(isAi);
  };

  const endTurn = (isAi = false) => {
    if (gameState === 'GAME_OVER') return;
    const nextIdx = (turn + 1) % players.length;
    setTimeout(() => {
        setGameState('IDLE');
        setTurn(nextIdx);
    }, isAi ? 1200 : 0);
  };

  const updatePlayer = (idx: number, updates: Partial<Player>) => {
    setPlayers(prev => prev.map((p, i) => i === idx ? { ...p, ...updates } : p));
  };

  const toggleLang = () => {
    setLang(prev => prev === 'IS' ? 'EN' : 'IS');
  };

  // --- Views ---

  if (view === 'LOBBY') {
    return <Lobby players={players} setPlayers={setPlayers} onStart={() => setView('GAME')} lang={lang} onToggleLang={toggleLang} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      
      {/* HUD Header */}
      <div className="fixed top-0 left-0 right-0 p-4 z-50 flex justify-between items-start pointer-events-none">
        <div className="glass-panel px-6 py-3 rounded-2xl pointer-events-auto flex items-center gap-4 animate-float">
          <Anchor className="text-cyan-400" size={24} />
          <div>
            <h1 className="text-xl font-serif font-bold text-white tracking-widest">MAÍGREIFINN</h1>
            <div className="text-[10px] text-cyan-300/70 tracking-[0.2em]">{t.subtitle}</div>
          </div>
        </div>

        <div className="flex gap-4 pointer-events-auto">
           {/* Market Ticker */}
           <div className="glass-panel px-4 py-2 rounded-xl flex gap-6 text-xs font-mono">
              <div className="flex flex-col items-center">
                <div className="text-cyan-400 font-bold flex items-center gap-1"><Fish size={12}/> {t.fish}</div>
                <div>{Math.round(market.fishPrice * 100)}%</div>
              </div>
              <div className="w-px bg-white/10"></div>
              <div className="flex flex-col items-center">
                <div className="text-amber-400 font-bold flex items-center gap-1"><Utensils size={12}/> {t.meat}</div>
                <div>{Math.round(market.meatPrice * 100)}%</div>
              </div>
              <div className="w-px bg-white/10"></div>
              <div className="flex items-center">
                 {market.trend === 'BOOM' && <TrendingUp className="text-green-400" size={20} />}
                 {market.trend === 'CRASH' && <TrendingDown className="text-red-400" size={20} />}
                 {market.trend === 'STABLE' && <span className="text-slate-400 text-[10px] whitespace-pre-line text-center">{t.marketStable}</span>}
              </div>
           </div>

           <button onClick={toggleLang} className="glass-panel w-10 h-10 rounded-xl flex items-center justify-center text-cyan-300 hover:text-white transition-colors">
              <span className="font-bold text-xs">{lang}</span>
           </button>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-8 items-center lg:items-start mt-20">
        
        {/* Left: Player Status */}
        <div className="w-full lg:w-64 space-y-4 order-2 lg:order-1">
           {players.map((p, i) => (
             <div key={p.id} className={`glass-card p-4 rounded-xl border-l-4 transition-all duration-300 ${turn === i ? 'border-cyan-400 scale-105 bg-white/10' : 'border-transparent opacity-70'}`}>
                <div className="flex justify-between items-center mb-2">
                   <div className="font-serif font-bold text-sm truncate">{p.name}</div>
                   {p.isAi && <Bot size={14} className="text-cyan-300"/>}
                </div>
                <div className="flex items-center gap-2 mb-2">
                   <div className={`w-8 h-8 rounded-full ${p.color} flex items-center justify-center text-white shadow-lg`}>
                      <BoatIcon type={p.boatType} />
                   </div>
                   <div className="text-xs space-y-0.5">
                      <div className="flex items-center gap-1"><Coins size={10} className="text-amber-400"/> {p.money}kr</div>
                      <div className="flex items-center gap-1"><Utensils size={10} className={p.hunger > 8 ? "text-red-400" : "text-green-400"}/> {p.hunger}/{MAX_HUNGER}</div>
                   </div>
                </div>
                {turn === i && <div className="text-[10px] text-cyan-300 italic animate-pulse">
                  {gameState === 'AI_THINKING' ? t.calculating : gameState === 'MOVING' ? t.sailing : t.awaiting}
                </div>}
             </div>
           ))}
        </div>

        {/* Center: The Board */}
        <div className="flex-1 order-1 lg:order-2">
           <RenderBoard board={board} players={players} />
        </div>

        {/* Right: Controls & Logs */}
        <div className="w-full lg:w-80 flex flex-col gap-4 order-3 h-[500px]">
           
           {/* Action Deck */}
           <div className="glass-panel p-6 rounded-2xl min-h-[160px] flex flex-col justify-center relative overflow-hidden group">
              {/* Background accent */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent pointer-events-none"></div>
              
              <div className="relative z-10">
                <div className="text-xs uppercase tracking-widest text-slate-400 mb-2 font-bold">Stjórnborð</div>
                
                {gameState === 'IDLE' && !currentPlayer.isAi ? (
                  <div className="space-y-3">
                    {board[currentPlayer.position].owner === null && board[currentPlayer.position].price ? (
                      <div className="animate-fade-in">
                        <div className="text-sm mb-2">{t.purchase} <span className="font-bold text-cyan-300">{board[currentPlayer.position].name}</span> {t.for} {board[currentPlayer.position].price}kr?</div>
                        <div className="flex gap-2">
                          <button onClick={() => buyProperty(false)} disabled={currentPlayer.money < (board[currentPlayer.position].price || 0)} className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white py-2 rounded-lg font-bold transition-all disabled:opacity-50 disabled:grayscale">
                            {t.acquire}
                          </button>
                          <button onClick={() => endTurn(false)} className="flex-1 border border-slate-500 hover:bg-slate-700/50 text-slate-300 py-2 rounded-lg transition-all">
                            {t.pass}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => handleRoll(false)} className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white py-4 rounded-xl font-bold shadow-lg shadow-amber-900/20 transform hover:-translate-y-1 transition-all flex items-center justify-center gap-3">
                         <Dice5 size={24}/> {t.rollDice}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-cyan-300/50 italic gap-2">
                    {gameState === 'AI_THINKING' && <Sparkles className="animate-spin" size={16}/>}
                    {gameState === 'MOVING' && <Waves className="animate-bounce" size={16}/>}
                    <span>{currentPlayer.isAi ? t.aiControl : t.systemBusy}</span>
                  </div>
                )}
              </div>
           </div>

           {/* Log Feed */}
           <div className="flex-1 glass-card rounded-2xl p-4 overflow-hidden flex flex-col">
              <div className="text-[10px] uppercase text-slate-500 font-bold mb-2 flex justify-between items-center">
                <span>{t.commsLog}</span>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-hide">
                 {[...logs].reverse().map((log) => (
                   <div key={log.id} className={`text-xs p-2 rounded border-l-2 animate-fade-in ${
                     log.type === 'alert' ? 'border-red-500 bg-red-900/20 text-red-200' : 
                     log.type === 'success' ? 'border-green-500 bg-green-900/20 text-green-200' : 
                     'border-cyan-500 bg-cyan-900/10 text-cyan-100'
                   }`}>
                     {log.text}
                   </div>
                 ))}
              </div>
           </div>

        </div>
      </div>

      {/* Event Overlay */}
      {(currentEvent || aiLoading) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="glass-panel max-w-md w-full rounded-2xl overflow-hidden border border-cyan-500/30 shadow-2xl shadow-cyan-900/50 animate-pop-in">
            {aiLoading ? (
               <div className="h-64 flex flex-col items-center justify-center gap-6">
                 <div className="relative">
                   <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin"></div>
                   <div className="absolute inset-0 flex items-center justify-center">
                     <Sparkles size={24} className="text-amber-400 animate-pulse" />
                   </div>
                 </div>
                 <div className="text-center">
                   <div className="text-cyan-300 font-serif text-lg">{t.consulting}</div>
                   <div className="text-xs text-cyan-500/70 mt-1">{t.generating}</div>
                 </div>
               </div>
            ) : (
              <>
                <div className="h-64 relative bg-slate-900">
                   {currentEvent?.image ? (
                     <img src={currentEvent.image} className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-slate-700"><Waves size={64}/></div>
                   )}
                   <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                   <div className="absolute bottom-4 left-6 right-6">
                     <h2 className="text-2xl font-serif text-white mb-1">{currentEvent?.title}</h2>
                     <div className={`text-lg font-bold ${currentEvent?.effect! >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                       {currentEvent?.effect! > 0 ? '+' : ''}{currentEvent?.effect} kr
                     </div>
                   </div>
                </div>
                <div className="p-6">
                  <p className="text-slate-300 leading-relaxed mb-6 font-light">{currentEvent?.text}</p>
                  {!currentPlayer.isAi && (
                    <button onClick={() => resolveEvent(false)} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-3 rounded-xl font-bold transition-all">
                      {t.accept}
                    </button>
                  )}
                  {currentPlayer.isAi && <div className="text-center text-xs text-slate-500 animate-pulse">{t.processing}</div>}
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

// --- Subcomponents ---

const Lobby = ({ players, setPlayers, onStart, lang, onToggleLang }: { players: Player[], setPlayers: React.Dispatch<React.SetStateAction<Player[]>>, onStart: () => void, lang: Lang, onToggleLang: () => void }) => {
  const t = T[lang];
  
  const updatePlayer = (id: number, updates: Partial<Player>) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const addPlayer = () => {
    if (players.length >= 4) return;
    const id = players.length;
    setPlayers([...players, { 
      id, name: `Skipstjóri ${id + 1}`, color: "bg-purple-500", position: 0, money: START_MONEY, hunger: START_HUNGER, isJailed: false, inventory: [], isAi: true, boatType: 'TRAWLER' 
    }]);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
       {/* Background Elements */}
       <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
       </div>

       <div className="glass-panel p-10 rounded-3xl max-w-4xl w-full relative z-10 border border-white/10 shadow-2xl">
          <div className="absolute top-6 right-6">
             <button onClick={onToggleLang} className="glass-card px-4 py-2 rounded-lg flex items-center gap-2 text-cyan-300 hover:text-white transition-colors">
               <Globe size={16}/> <span className="font-bold text-xs">{lang}</span>
             </button>
          </div>
          
          <div className="text-center mb-12">
             <h1 className="text-6xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 to-cyan-500 mb-4">{t.lobbyTitle}</h1>
             <p className="text-slate-400 tracking-[0.3em] uppercase text-sm">{t.lobbySubtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
             {players.map(p => (
               <div key={p.id} className="glass-card p-4 rounded-xl flex items-center gap-4 relative group">
                  <div className={`w-16 h-16 rounded-2xl ${p.color} flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform`}>
                     <BoatIcon type={p.boatType} />
                  </div>
                  <div className="flex-1 space-y-2">
                     <input 
                       className="w-full bg-transparent border-b border-white/20 text-white font-serif focus:border-cyan-400 outline-none pb-1"
                       value={p.name}
                       onChange={e => updatePlayer(p.id, { name: e.target.value })}
                     />
                     <div className="flex gap-2">
                        <select 
                          className="bg-white/5 border border-white/10 rounded text-xs text-slate-300 p-1 outline-none"
                          value={p.isAi ? "AI" : "HUMAN"}
                          onChange={e => updatePlayer(p.id, { isAi: e.target.value === "AI" })}
                        >
                           <option value="HUMAN">{t.human}</option>
                           <option value="AI">{t.ai}</option>
                        </select>
                        <select 
                          className="bg-white/5 border border-white/10 rounded text-xs text-slate-300 p-1 outline-none"
                          value={p.boatType}
                          onChange={e => updatePlayer(p.id, { boatType: e.target.value as BoatType })}
                        >
                           <option value="TRAWLER">{t.trawler}</option>
                           <option value="SAILBOAT">{t.sailboat}</option>
                           <option value="YACHT">{t.yacht}</option>
                           <option value="DINGHY">{t.dinghy}</option>
                        </select>
                     </div>
                  </div>
                  {players.length > 2 && (
                     <button onClick={() => setPlayers(prev => prev.filter(x => x.id !== p.id))} className="absolute top-2 right-2 text-white/20 hover:text-red-400 transition-colors"><X size={16}/></button>
                  )}
               </div>
             ))}
             {players.length < 4 && (
               <button onClick={addPlayer} className="glass-card p-4 rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:text-white hover:bg-white/10 border-dashed border-2 border-white/10 hover:border-white/30 transition-all">
                  <User size={20}/> <span>{t.addCrew}</span>
               </button>
             )}
          </div>

          <button onClick={onStart} className="w-full py-5 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl font-bold text-xl tracking-widest text-white shadow-lg shadow-cyan-900/50 hover:shadow-cyan-500/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-3">
             <Play size={24} fill="currentColor"/> {t.embark}
          </button>
       </div>
    </div>
  );
};

const BoatIcon = ({ type }: { type: BoatType }) => {
  switch(type) {
    case 'SAILBOAT': return <Sailboat size={24} />;
    case 'DINGHY': return <LifeBuoy size={24} />;
    case 'YACHT': return <Anchor size={24} />;
    default: return <Ship size={24} />;
  }
};

const RenderBoard = ({ board, players }: { board: BoardSpace[], players: Player[] }) => {
    // Board logic remains, but visual presentation is key
    const top = board.slice(0, 5);
    const right = board.slice(5, 8);
    const bottom = [...board.slice(8, 13)].reverse();
    const left = [...board.slice(13, 16)].reverse();

    return (
      <div className="relative glass-panel p-4 rounded-3xl shadow-2xl border border-white/10 aspect-square max-w-2xl mx-auto flex flex-col justify-between overflow-hidden">
        {/* Central Hub decoration */}
        <div className="absolute inset-0 m-32 border border-white/5 rounded-2xl flex flex-col items-center justify-center pointer-events-none">
           <div className="w-full h-full bg-cyan-900/10 rounded-xl backdrop-blur-sm flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              <Anchor size={120} className="text-white/5 animate-pulse" />
           </div>
        </div>

        <div className="flex gap-2 h-[15%] z-10">{top.map(s => <Space key={s.id} space={s} players={players} />)}</div>
        <div className="flex flex-1 py-2 gap-2 z-10">
           <div className="flex flex-col w-[15%] gap-2">{left.map(s => <Space key={s.id} space={s} players={players} />)}</div>
           <div className="flex-1"></div>
           <div className="flex flex-col w-[15%] gap-2">{right.map(s => <Space key={s.id} space={s} players={players} />)}</div>
        </div>
        <div className="flex gap-2 h-[15%] z-10">{bottom.map(s => <Space key={s.id} space={s} players={players} />)}</div>
      </div>
    );
};

const Space = ({ space, players }: { space: BoardSpace, players: Player[] }) => {
  const [hover, setHover] = useState(false);
  const playersHere = players.filter(p => p.position === space.id);

  // Background styling
  const hasImage = !!space.imageUrl;
  
  return (
    <div 
      className={`relative flex-1 rounded-xl overflow-hidden transition-all duration-300 group ${hasImage ? 'border-0' : 'border border-white/10 bg-white/5'}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Background Image Layer */}
      {hasImage ? (
         <div className="absolute inset-0">
            <img src={space.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>
         </div>
      ) : (
         <div className="absolute inset-0 flex items-center justify-center opacity-10">
            {space.type === 'BOAT' && <Ship size={32} />}
            {space.type === 'RESTAURANT' && <Utensils size={32} />}
            {space.type === 'START' && <Anchor size={32} />}
            {space.type === 'CHANCE' && <Dice5 size={32} />}
         </div>
      )}

      {/* Content */}
      <div className="absolute inset-0 p-1 flex flex-col justify-between z-10">
         {/* Top Icons */}
         <div className="flex justify-between items-start">
             <div className={`p-1 rounded-full ${hasImage ? 'bg-black/50 backdrop-blur' : 'bg-white/10'}`}>
                {space.type === 'BOAT' && <Ship size={10} className="text-cyan-300"/>}
                {space.type === 'RESTAURANT' && <Utensils size={10} className="text-amber-300"/>}
                {space.type === 'CHANCE' && <Sparkles size={10} className="text-purple-300"/>}
                {space.type === 'START' && <Anchor size={10} className="text-green-300"/>}
                {space.type === 'JAIL' && <AlertTriangle size={10} className="text-red-300"/>}
                {space.type === 'STORM' && <Waves size={10} className="text-blue-300"/>}
             </div>
             {space.owner !== undefined && space.owner !== null && (
               <div className={`w-3 h-3 rounded-full border border-white/50 ${players[space.owner].color}`}></div>
             )}
         </div>

         {/* Players */}
         <div className="flex flex-wrap gap-1 justify-center">
            {playersHere.map(p => (
               <div key={p.id} className={`w-4 h-4 rounded-full ${p.color} border-2 border-white shadow-lg animate-pulse-glow flex items-center justify-center transform hover:scale-150 transition-transform cursor-help z-50`} title={p.name}>
                  {/* Tiny dot for player */}
               </div>
            ))}
         </div>

         {/* Bottom Label */}
         <div className="text-center">
            <div className={`text-[9px] font-bold uppercase tracking-wider truncate ${hasImage ? 'text-white text-shadow' : 'text-slate-300'}`}>{space.name}</div>
            {(space.price && !space.owner) && <div className="text-[8px] text-cyan-300/80">{space.price}kr</div>}
         </div>
      </div>

      {/* Hover Info Card */}
      {hover && (
         <div className="absolute inset-0 z-20 bg-slate-900/95 backdrop-blur-md p-2 flex flex-col justify-center text-center animate-fade-in border border-cyan-500/30">
            <p className="text-[10px] text-cyan-200 font-serif italic leading-tight">{space.description || space.name}</p>
            {space.rent && <p className="text-[9px] text-slate-400 mt-1">Leiga: {space.rent}kr</p>}
         </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);