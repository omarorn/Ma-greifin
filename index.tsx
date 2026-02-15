import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { 
    Save, Trash2, Play, Sparkles, Loader2, User, Bot, Smartphone, Ship, 
    Anchor, Fish, Utensils, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, 
    Coins, Waves, Sailboat, LifeBuoy, AlertTriangle, X, Camera, RefreshCw, 
    QrCode, MessageSquare, Wifi, WifiOff, Heart, ChevronLeft, ChevronRight, 
    Clapperboard, ScrollText, Volume2, Users, Vibrate, TrendingUp, 
    CloudLightning, Sun, Cloud, Snowflake, Trophy, MapPin, Clock, 
    Maximize2, Minimize2, Skull, Crown, Lock, Globe, Paintbrush
} from 'lucide-react';

// --- Constants & Types ---

const BOARD_SIZE = 16;
const START_MONEY = 1500;
const MAX_HUNGER = 12;
const SAVE_KEY = 'maigreifinn_save_v4';
const BAIL_PRICE = 50;

const AI_THINK_TIME = 800;
const AI_ACTION_DELAY = 600;

type SpaceType = 'START' | 'BOAT' | 'RESTAURANT' | 'CHANCE' | 'STORM' | 'JAIL' | 'GO_TO_JAIL' | 'FREE_PARKING';
type BoatType = 'TRAWLER' | 'SAILBOAT' | 'DINGHY' | 'YACHT';
type WeatherType = 'SUNNY' | 'STORM' | 'AURORA' | 'FOG';

// Fallbacks only used if generation fails
const PREMADE_IMAGES = {
  START: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&h=400&fit=crop&q=80",
  BOAT: "https://images.unsplash.com/photo-1544979590-2c00a307c433?w=400&h=400&fit=crop&q=80",
  RESTAURANT: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=400&fit=crop&q=80",
  STORM: "https://images.unsplash.com/photo-1454789476662-53eb23ba5907?w=400&h=400&fit=crop&q=80",
  CHANCE: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=400&h=400&fit=crop&q=80",
  JAIL: "https://images.unsplash.com/photo-1503751071777-d2918b21bbd9?w=400&h=400&fit=crop&q=80"
};

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

interface FateOption {
  text: string;
  description: string;
  effect: {
    money: number;
    hunger: number;
    karma: number;
  };
  type: 'SAFE' | 'RISKY' | 'MORAL';
}

interface Player {
  id: number;
  name: string;
  color: string;
  position: number;
  money: number;
  hunger: number;
  karma: number;
  isJailed: boolean;
  isBankrupt: boolean;
  inventory: number[];
  isAi: boolean;
  boatType: BoatType;
  portraitUrl?: string;
}

interface GameLog {
  id: number;
  text: string;
  type: 'info' | 'alert' | 'success' | 'notification' | 'karma';
  timestamp: string;
}

interface MarketState {
  fishPrice: number;
  meatPrice: number;
  trend: 'STABLE' | 'BOOM' | 'CRASH';
}

interface VoyageChapter {
  id: string;
  url: string;
  description: string;
  round: number;
  turnName: string;
}

const T = {
  IS: {
    title: "MAÍGREIFINN",
    roll: "KASTA",
    buy: "KAUPA",
    pass: "SLEPPA",
    price: "Verð",
    rent: "Leiga",
    hunger: "Hungur",
    money: "Peningar",
    feed: "FRÉTTIR ÚR FYRSTU HENDI",
    players: "STIGATAFLA",
    fate: "ÖRLÖGIN",
    ai_thinking: "Gervigreindin er að pæla...",
    shake: "Hristingur fannst!",
    saved: "Vistaður leikur",
    reset_save: "Eyða vistun",
    resume: "Halda áfram",
    new_game: "Nýr leiðangur",
    turn: "UMFERÐ",
    net_worth: "Eignir",
    jail_title: "Sjófangelsið",
    pay_bail: "Borga sekt (50kr)",
    roll_escape: "Reyna að flýja (Kasta 6)",
    bankrupt: "GJALDÞROTA",
    winner: "SIGURVEGARI!",
  }
};

// --- Helpers ---

const getAi = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0) {
       await new Promise(resolve => setTimeout(resolve, delay));
       return withRetry(fn, retries - 1, delay * 1.5);
    }
    throw error;
  }
}

const getNetWorth = (player: Player, board: BoardSpace[]) => {
    const propertyValue = player.inventory.reduce((total, spaceId) => {
        const space = board.find(s => s.id === spaceId);
        return total + (space?.price || 0);
    }, 0);
    return player.money + propertyValue;
};

const DEFAULT_PLAYERS: Player[] = [
  { id: 0, name: "Kapteinn", color: "bg-amber-500", position: 0, money: START_MONEY, hunger: 0, karma: 0, isJailed: false, isBankrupt: false, inventory: [], isAi: false, boatType: 'TRAWLER' },
  { id: 1, name: "Rival AI", color: "bg-cyan-500", position: 0, money: START_MONEY, hunger: 0, karma: 0, isJailed: false, isBankrupt: false, inventory: [], isAi: true, boatType: 'YACHT' },
];

// --- Main App Component ---

function App() {
  const [view, setView] = useState<'LOBBY' | 'MAKER' | 'GAME' | 'VICTORY'>('LOBBY');
  const [players, setPlayers] = useState<Player[]>(DEFAULT_PLAYERS);
  const [board, setBoard] = useState<BoardSpace[]>([]);
  const [turn, setTurn] = useState(0);
  const [round, setRound] = useState(1);
  const [totalTurns, setTotalTurns] = useState(0);
  const [market, setMarket] = useState<MarketState>({ fishPrice: 1.0, meatPrice: 1.0, trend: 'STABLE' });
  const [logs, setLogs] = useState<GameLog[]>([]);
  const [gameState, setGameState] = useState<'IDLE' | 'MOVING' | 'CHOOSING_FATE' | 'GAME_OVER' | 'AI_THINKING'>('IDLE');
  const [fateOptions, setFateOptions] = useState<FateOption[]>([]);
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [winner, setWinner] = useState<Player | null>(null);
  const [gameTheme, setGameTheme] = useState("Icelandic Fishing Industry");
  
  const [isDiceRolling, setIsDiceRolling] = useState(false);
  const [diceDisplay, setDiceDisplay] = useState(5);
  const [weather, setWeather] = useState<WeatherType>('SUNNY');
  const [icelandMapUrl, setIcelandMapUrl] = useState<string | null>(null);
  
  const [voyagePlaylist, setVoyagePlaylist] = useState<VoyageChapter[]>([]);
  const [viewingChapter, setViewingChapter] = useState(-1);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [hasSave, setHasSave] = useState(false);

  // Refs for access inside callbacks
  const gameStateRef = useRef(gameState);
  const turnRef = useRef(turn);
  const playersRef = useRef(players);
  const viewRef = useRef(view);
  const generatingDescriptions = useRef(new Set<number>());

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { turnRef.current = turn; }, [turn]);
  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { viewRef.current = view; }, [view]);

  const currentPlayer = players[turn];
  const t = T.IS;

  // Initial Check for Save
  useEffect(() => {
      try { const saved = localStorage.getItem(SAVE_KEY); if (saved) setHasSave(true); } catch (e) {}
  }, []);

  // Autosave
  useEffect(() => {
      if (view === 'GAME' && gameState !== 'GAME_OVER') {
          const timer = setTimeout(() => {
              try {
                  const optimizedBoard = board.map(b => ({ ...b, imageUrl: b.imageUrl?.startsWith('data:') ? undefined : b.imageUrl }));
                  const optimizedPlaylist = voyagePlaylist.map(c => ({ ...c, url: '' }));
                  const optimizedPlayers = players.map(p => ({ ...p, portraitUrl: p.portraitUrl?.startsWith('data:') ? undefined : p.portraitUrl }));
                  const state = {
                      players: optimizedPlayers, board: optimizedBoard, turn, round, totalTurns, 
                      market, logs: logs.slice(0, 30), voyagePlaylist: optimizedPlaylist, weather, gameTheme 
                  };
                  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
              } catch (e) { console.error("Autosave failed", e); }
          }, 2000);
          return () => clearTimeout(timer);
      }
  }, [players, board, turn, round, totalTurns, market, logs, voyagePlaylist, view, weather, gameState]);

  const addLog = (text: string, type: GameLog['type'] = 'info') => {
    const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    setLogs(prev => [{ id: Date.now(), text, type, timestamp: time }, ...prev].slice(50));
  };

  const checkVictory = useCallback(() => {
      const activePlayers = players.filter(p => !p.isBankrupt);
      if (activePlayers.length === 1 && players.length > 1) {
          setWinner(activePlayers[0]);
          setGameState('GAME_OVER');
          setView('VICTORY');
          addLog(`${activePlayers[0].name} has won the game!`, 'success');
      }
  }, [players]);

  const handleResume = () => {
      try {
          const saved = localStorage.getItem(SAVE_KEY);
          if (saved) {
              const data = JSON.parse(saved);
              if (data.players) setPlayers(data.players);
              if (data.board) setBoard(data.board);
              if (data.turn !== undefined) setTurn(data.turn);
              if (data.round !== undefined) setRound(data.round);
              if (data.market) setMarket(data.market);
              if (data.logs) setLogs(data.logs);
              if (data.gameTheme) setGameTheme(data.gameTheme);
              setView('GAME');
          }
      } catch(e) { addLog("Failed to load save file.", 'alert'); }
  };

  const handleStartMaker = () => {
      setView('MAKER');
  }

  const handleNewGame = (generatedBoard: BoardSpace[]) => {
      setBoard(generatedBoard);
      setPlayers(prev => prev.map(p => ({...p, isBankrupt: false, money: START_MONEY, inventory: [], position: 0})));
      setView('GAME');
      setWinner(null);
      setGameState('IDLE');
      addLog("The Voyage Begins!", 'success');
  };

  const handleClearSave = () => { localStorage.removeItem(SAVE_KEY); setHasSave(false); };

  // --- Slideshow Helpers ---
  const handlePrevSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (voyagePlaylist.length === 0) return;
    const current = viewingChapter === -1 ? 0 : viewingChapter;
    if (current < voyagePlaylist.length - 1) {
        setViewingChapter(current + 1);
        if (voyagePlaylist[current + 1]?.url) setBgImage(voyagePlaylist[current + 1].url);
    }
  };

  const handleNextSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (voyagePlaylist.length === 0) return;
    const current = viewingChapter === -1 ? 0 : viewingChapter;
    if (current > 0) {
        setViewingChapter(current - 1);
        if (voyagePlaylist[current - 1]?.url) setBgImage(voyagePlaylist[current - 1].url);
    }
  };

  const handleSpeak = (text: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    }
  };

  // --- Game Loop ---

  const triggerDiceRoll = () => {
      if (isDiceRolling || gameStateRef.current !== 'IDLE') return;
      setIsDiceRolling(true);
      let count = 0;
      const interval = setInterval(() => {
          setDiceDisplay(Math.floor(Math.random() * 6) + 1);
          if (++count >= 8) {
              clearInterval(interval);
              setIsDiceRolling(false);
              handleRoll(false);
          }
      }, 80);
  };

  // AI Turn Logic
  useEffect(() => {
    if (view === 'GAME' && gameState === 'IDLE') {
        const isAi = currentPlayer.isAi;
        if (isAi && !currentPlayer.isBankrupt) {
            setTimeout(() => {
                if (currentPlayer.isJailed) {
                    if (currentPlayer.money >= BAIL_PRICE && Math.random() > 0.3) payBail(true);
                    else handleRoll(true);
                } else handleRoll(true);
            }, AI_THINK_TIME);
        } else if (currentPlayer.isBankrupt) endTurn(true);
    }
  }, [turn, view, gameState, currentPlayer]);

  const handleRoll = useCallback(async (isAuto = false) => {
    if (gameStateRef.current !== 'IDLE') return;
    setGameState(isAuto ? 'AI_THINKING' : 'MOVING');
    
    // Quick delay for feel
    await new Promise(r => setTimeout(r, 400));

    const roll = Math.floor(Math.random() * 6) + 1;
    const currentP = playersRef.current[turnRef.current];

    if (currentP.isJailed) {
        if (roll === 6) {
            addLog(`${currentP.name} rolls a 6 and escapes jail!`, 'success');
            setPlayers(prev => prev.map(p => p.id === currentP.id ? { ...p, isJailed: false } : p));
        } else {
            addLog(`${currentP.name} rolls ${roll} and stays in jail.`, 'alert');
            setTimeout(() => endTurn(isAuto), AI_ACTION_DELAY);
            return;
        }
    }
    
    setPlayers(prevPlayers => {
        const p = prevPlayers[turnRef.current];
        let newPos = (p.position + roll) % BOARD_SIZE;
        let newMoney = p.money;
        let newHunger = p.hunger + 1;
        
        if (newPos < p.position) {
           newMoney += 200;
           newHunger = Math.max(0, newHunger - 1);
           addLog(`${p.name} passes Start. +200kr`, 'success');
           setRound(r => r + 1);
           const weathers: WeatherType[] = ['SUNNY', 'STORM', 'AURORA', 'FOG'];
           setWeather(weathers[Math.floor(Math.random() * weathers.length)]);
           // Market flux
           if (Math.random() > 0.6) {
               const boom = Math.random() > 0.5;
               setMarket({
                   fishPrice: boom ? 1.5 : 0.6,
                   meatPrice: boom ? 1.4 : 0.7,
                   trend: boom ? 'BOOM' : 'CRASH'
               });
               addLog(boom ? "MARKET BOOM!" : "MARKET CRASH!", boom ? 'success' : 'alert');
           }
        }
        
        if (newHunger >= MAX_HUNGER) {
           addLog(`${p.name} fainted from hunger! (-100kr, Sent to Start)`, 'alert');
           newPos = 0; newMoney = Math.max(0, newMoney - 100); newHunger = 0;
        }

        const updated = [...prevPlayers];
        updated[turnRef.current] = { ...p, position: newPos, money: newMoney, hunger: newHunger, isJailed: false };
        return updated;
    });

    const calculatedPos = (currentP.position + roll) % BOARD_SIZE;
    setTimeout(() => handleLand(board[calculatedPos], isAuto, calculatedPos), 200);
  }, [board, players]);

  const handleLand = async (space: BoardSpace, isAuto: boolean, pos: number) => {
    // Generate description if missing (should be rare with World Maker)
    if (!space.description) {
        const ai = getAi();
        ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: `Short description of ${space.name} (${space.type}) in ${gameTheme}.`})
        .then(res => setBoard(prev => prev.map(s => s.id === space.id ? { ...s, description: res.text } : s)));
    }

    if (space.type === 'CHANCE') {
        setGameState('CHOOSING_FATE');
        const options: FateOption[] = [
            { text: "High Risk", description: "Brave the storm.", type: "RISKY", effect: { money: -50, hunger: 2, karma: 1 } },
            { text: "Safe Bet", description: "Play it safe.", type: "SAFE", effect: { money: 100, hunger: 0, karma: 0 } },
            { text: "Charity", description: "Help another.", type: "MORAL", effect: { money: -20, hunger: 1, karma: 5 } }
        ];
        setFateOptions(options);
        if (isAuto) setTimeout(() => resolveFate(options[Math.floor(Math.random() * options.length)], true), AI_ACTION_DELAY);
    } 
    else if (space.type === 'BOAT' || space.type === 'RESTAURANT') {
        const curP = playersRef.current[turnRef.current];
        if (space.owner === null || space.owner === undefined) {
            if (isAuto) {
                if (curP.money >= (space.price || 0) + 100) setTimeout(() => buyProperty(true), AI_ACTION_DELAY);
                else setTimeout(() => endTurn(true), AI_ACTION_DELAY);
            } else setGameState('IDLE');
        } else if (space.owner !== turnRef.current) {
            const rent = Math.floor((space.rent || 0) * (space.type === 'BOAT' ? market.fishPrice : market.meatPrice));
            addLog(`${curP.name} pays ${rent}kr rent to ${playersRef.current[space.owner].name}`, 'alert');
            setPlayers(prev => {
                const copy = [...prev];
                const p = copy[turnRef.current];
                if (p.money < rent) { p.money = 0; p.isBankrupt = true; }
                else { p.money -= rent; copy[space.owner!].money += rent; }
                if (space.type === 'RESTAURANT') p.hunger = Math.max(0, p.hunger - 3);
                return copy;
            });
            setTimeout(() => endTurn(isAuto), AI_ACTION_DELAY + 400);
        } else {
            // Own property
            if (space.type === 'RESTAURANT') setPlayers(prev => {
                const copy = [...prev]; copy[turnRef.current].hunger = Math.max(0, copy[turnRef.current].hunger - 3); return copy;
            });
            addLog(`${curP.name} rests at their property.`);
            setTimeout(() => endTurn(isAuto), AI_ACTION_DELAY);
        }
    } else {
        if (space.type === 'GO_TO_JAIL') {
            addLog(`ARRESTED! Going to ${board[13].name || 'Jail'}.`, 'alert');
            setPlayers(prev => {
                const copy = [...prev]; copy[turnRef.current].position = 13; copy[turnRef.current].isJailed = true; return copy;
            });
            generateVoyageVideo(`Arrested at ${space.name} in style of ${gameTheme}`);
        } else if (space.type === 'STORM') {
            addLog("Storm Damage! -50kr", 'alert');
             setPlayers(prev => {
                const copy = [...prev]; copy[turnRef.current].money -= 50; return copy;
            });
        }
        setTimeout(() => endTurn(isAuto), AI_ACTION_DELAY);
    }
  };

  const buyProperty = (isAuto: boolean) => {
      const curP = playersRef.current[turnRef.current];
      const space = board[curP.position];
      if (space.price && curP.money >= space.price) {
          setPlayers(prev => prev.map(p => p.id === curP.id ? { ...p, money: p.money - space.price!, inventory: [...p.inventory, space.id] } : p));
          setBoard(prev => prev.map(s => s.id === space.id ? { ...s, owner: turnRef.current } : s));
          addLog(`${curP.name} bought ${space.name}!`, 'success');
          generateVoyageVideo(`Buying ${space.name} (${space.type}) in ${gameTheme} style`);
          setTimeout(() => endTurn(isAuto), AI_ACTION_DELAY);
      }
  };

  const payBail = (isAuto: boolean) => {
      setPlayers(prev => {
          const copy = [...prev]; const p = copy[turnRef.current];
          if (p.money >= BAIL_PRICE) { p.money -= BAIL_PRICE; p.isJailed = false; }
          return copy;
      });
      setTimeout(() => endTurn(isAuto), AI_ACTION_DELAY);
  };

  const resolveFate = (opt: FateOption, isAuto: boolean) => {
      setPlayers(prev => prev.map(p => p.id === playersRef.current[turnRef.current].id ? { ...p, money: p.money + opt.effect.money, hunger: p.hunger + opt.effect.hunger, karma: p.karma + opt.effect.karma } : p));
      setFateOptions([]); setGameState('IDLE');
      generateVoyageVideo(`Fate event: ${opt.text}, ${gameTheme}`);
      setTimeout(() => endTurn(isAuto), AI_ACTION_DELAY);
  };

  const endTurn = (isAuto: boolean) => {
      checkVictory();
      if (gameStateRef.current === 'GAME_OVER') return;
      let nextTurn = (turn + 1) % players.length;
      let attempts = 0;
      while (players[nextTurn].isBankrupt && attempts < players.length) {
          nextTurn = (nextTurn + 1) % players.length;
          attempts++;
      }
      setTotalTurns(t => t + 1);
      setGameState('IDLE');
      setTurn(nextTurn);
  };

  // --- Generation ---

  const generateVoyageVideo = async (prompt: string) => {
      if (isGeneratingVideo) return;
      setIsGeneratingVideo(true);
      try {
          const ai = getAi();
          const res = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
              model: 'gemini-2.5-flash-image', 
              contents: { parts: [{ text: prompt + ", cinematic, masterpiece, 8k" }] }
          }));
          const imgData = res.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (imgData) {
              const url = `data:image/png;base64,${imgData}`;
              const chapter: VoyageChapter = {
                  id: Date.now().toString(), url, description: prompt, round, turnName: playersRef.current[turnRef.current].name
              };
              setVoyagePlaylist(prev => [chapter, ...prev]); 
              setViewingChapter(0);
          }
      } catch (e) { console.error("Video gen failed", e); }
      finally { setIsGeneratingVideo(false); }
  };

  // --- Views ---

  if (view === 'LOBBY') {
      return (
          <Lobby players={players} setPlayers={setPlayers} onStart={handleStartMaker} onResume={handleResume} hasSave={hasSave} onClearSave={handleClearSave} />
      );
  }

  if (view === 'MAKER') {
      return <WorldMaker theme={gameTheme} setTheme={setGameTheme} onComplete={handleNewGame} />;
  }

  if (view === 'VICTORY') {
      return <VictoryStage winner={winner} playlist={voyagePlaylist} onRestart={() => setView('LOBBY')} />;
  }

  const viewingChapterData = voyagePlaylist[viewingChapter !== -1 ? viewingChapter : 0];
  const totalChapters = voyagePlaylist.length;
  const DiceIcon = [null, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6][diceDisplay] || Dice5;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden relative selection:bg-cyan-500/30 flex flex-col">
        {/* Background Layer */}
        <div className="absolute inset-0 z-0 transition-all duration-1000 ease-in-out" style={{
            backgroundImage: bgImage ? `url(${bgImage})` : `linear-gradient(to bottom, #0f172a, #1e293b)`,
            backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.6 
        }}>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/50 to-slate-950/30"></div>
        </div>

        {/* HUD Area */}
        <div className="relative z-10 flex-1 p-2 md:p-6 flex gap-4 md:gap-6 overflow-hidden">
            {/* Left Column (Leaderboard & Logs) */}
            <div className="hidden md:flex w-1/4 flex-col gap-6">
                <div className="glass-panel rounded-2xl p-4 flex-1 overflow-y-auto">
                    <h2 className="flex items-center justify-between font-serif font-bold text-cyan-400 mb-4 sticky top-0 bg-slate-900/50 p-2 rounded backdrop-blur-md z-10">
                        <span className="flex items-center gap-2"><Trophy size={18}/> {t.players}</span>
                        <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400 flex items-center gap-1"><Clock size={10}/> T{totalTurns}</span>
                    </h2>
                    <div className="space-y-3">
                        {[...players].sort((a, b) => getNetWorth(b, board) - getNetWorth(a, board)).map((p, idx) => {
                            const actualIdx = players.indexOf(p);
                            const netWorth = getNetWorth(p, board);
                            return (
                                <div key={p.id} className={`p-3 rounded-xl border transition-all ${turn === actualIdx ? 'bg-white/10 border-cyan-400' : 'bg-white/5 border-transparent opacity-80'} ${p.isBankrupt ? 'grayscale opacity-50' : ''}`}>
                                    <div className="flex items-center gap-3">
                                        <div className="text-xl font-serif font-bold text-slate-500 w-6">#{idx + 1}</div>
                                        <div className={`w-12 h-12 rounded-full ${p.color} border-2 border-white flex items-center justify-center overflow-hidden shrink-0`}>
                                            {p.portraitUrl ? <img src={p.portraitUrl} className="w-full h-full object-cover"/> : <User size={24}/>}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="font-bold text-sm truncate flex justify-between">
                                                <span>{p.name}</span>
                                                {turn === actualIdx && <span className="text-[10px] text-cyan-400 animate-pulse">ACTIVE</span>}
                                                {p.isBankrupt && <span className="text-[10px] text-red-500 font-bold"><Skull size={10} className="inline"/> RIP</span>}
                                            </div>
                                            <div className="flex flex-col gap-1 mt-1">
                                                <div className="flex items-center gap-2 text-[10px] text-slate-300">
                                                    <span className="flex items-center text-green-300 font-bold"><TrendingUp size={10} className="mr-1"/>{netWorth}</span>
                                                    <span className="flex items-center text-amber-300"><Coins size={10} className="mr-1"/>{p.money}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="glass-panel rounded-2xl p-4 h-1/2 flex flex-col">
                    <h2 className="flex items-center gap-2 font-serif font-bold text-amber-400 mb-2"><ScrollText size={18}/> {t.feed}</h2>
                    <div className="flex-1 overflow-y-auto space-y-2 text-xs font-mono pr-2">
                        {logs.map((log) => (
                            <div key={log.id} className="animate-fade-in mb-2 pb-2 border-b border-white/5 last:border-0">
                                <span className="text-slate-500 mr-2 text-[10px]">[{log.timestamp}]</span>
                                <span className={log.type === 'alert' ? 'text-red-300' : log.type === 'success' ? 'text-green-300' : 'text-slate-200'}>{log.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Center Column (Visuals & Board) */}
            <div className={`flex-1 flex flex-col gap-4 ${isFullscreen ? 'fixed inset-0 z-50 p-0 gap-0 bg-black' : ''}`}>
                <div className={`${isFullscreen ? 'h-full w-full rounded-none' : 'flex-1 rounded-2xl'} glass-panel relative overflow-hidden group border border-white/10 shadow-2xl flex items-center justify-center bg-black/40 min-h-0 transition-all duration-500`}>
                    {viewingChapterData ? (
                        <div key={viewingChapterData.id} className="absolute inset-0 animate-fade-in">
                            <img src={viewingChapterData.url || bgImage || PREMADE_IMAGES.START} className="w-full h-full object-cover" />
                            {totalChapters > 1 && (
                                <>
                                    <button onClick={handleNextSlide} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-sm transition-all z-20"><ChevronLeft size={32} /></button>
                                    <button onClick={handlePrevSlide} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-sm transition-all z-20"><ChevronRight size={32} /></button>
                                </>
                            )}
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/70 to-transparent p-6 pt-24 pb-8 z-10 pointer-events-none">
                                <div className="flex justify-between items-end max-w-4xl mx-auto w-full pointer-events-auto">
                                    <div className="flex-1">
                                        <h3 className="font-serif text-3xl md:text-5xl text-white text-shadow drop-shadow-2xl mb-2">{viewingChapterData.turnName}</h3>
                                        <p className="text-slate-100 text-shadow text-lg md:text-2xl drop-shadow-xl font-medium leading-relaxed max-w-2xl">{viewingChapterData.description}</p>
                                    </div>
                                    <button onClick={(e) => handleSpeak(viewingChapterData.description, e)} className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md"><Volume2 size={24}/></button>
                                </div>
                            </div>
                        </div>
                    ) : (
                         <div className="text-center opacity-30"><Clapperboard size={64} className="mx-auto mb-4"/><div className="font-serif tracking-widest">AWAITING VOYAGE DATA</div></div>
                    )}
                     <div className="absolute top-4 right-4 z-30"><button onClick={() => setIsFullscreen(!isFullscreen)} className="bg-black/50 p-2 rounded-full text-white">{isFullscreen ? <Minimize2 size={20}/> : <Maximize2 size={20}/>}</button></div>
                </div>

                <div className={`${isFullscreen ? 'hidden' : 'h-[35%]'} glass-panel rounded-2xl p-2 sm:p-4 relative flex flex-col justify-between shrink-0 transition-all duration-300`}>
                    <div className="flex gap-2 h-1/5">{board.slice(0, 5).map(s => <BoardCell key={s.id} space={s} players={players} />)}</div>
                    <div className="flex flex-1 py-2 gap-2">
                        <div className="flex flex-col w-1/5 gap-2">{[...board.slice(13, 16)].reverse().map(s => <BoardCell key={s.id} space={s} players={players} />)}</div>
                        <div className="flex-1 rounded-xl relative overflow-hidden flex items-center justify-center p-2"><CentralHub weather={weather} mapUrl={icelandMapUrl} market={market} round={round} theme={gameTheme}/></div>
                        <div className="flex flex-col w-1/5 gap-2">{board.slice(5, 8).map(s => <BoardCell key={s.id} space={s} players={players} />)}</div>
                    </div>
                    <div className="flex gap-2 h-1/5">{[...board.slice(8, 13)].reverse().map(s => <BoardCell key={s.id} space={s} players={players} />)}</div>
                </div>
            </div>

            {/* Right Column (Controls) */}
            <div className={`w-1/4 max-w-sm flex flex-col relative z-20 ${isFullscreen ? 'hidden' : ''}`}>
                <div className="glass-panel rounded-[3rem] border-4 border-slate-700 bg-slate-900 p-2 shadow-2xl h-full flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-xl z-30"></div>
                    <div className="flex-1 rounded-[2.5rem] overflow-hidden bg-slate-900 relative flex flex-col">
                        <div className="bg-slate-800/50 p-4 pt-8 flex justify-between items-center text-[10px] text-slate-400">
                             <span>{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                             <div className="flex gap-2"><Wifi size={12}/><div className="w-4 h-2 bg-green-500 rounded-sm"></div></div>
                        </div>
                        <div className="p-6 text-center">
                            <div className={`w-24 h-24 mx-auto rounded-full ${currentPlayer.color} border-4 border-slate-800 shadow-lg mb-3 overflow-hidden`}>
                                {currentPlayer.portraitUrl ? <img src={currentPlayer.portraitUrl} className="w-full h-full object-cover" /> : <User size={32} className="m-auto mt-6 text-white"/>}
                            </div>
                            <h2 className="text-xl font-bold text-white flex items-center justify-center gap-2">
                                {currentPlayer.name}
                                {currentPlayer.isJailed && <Lock size={16} className="text-red-400"/>}
                            </h2>
                            <div className="flex justify-center gap-4 mt-2 text-xs">
                                <span className="bg-amber-500/20 text-amber-300 px-2 py-1 rounded flex items-center gap-1"><Coins size={10}/> {currentPlayer.money}</span>
                                <span className="bg-red-500/20 text-red-300 px-2 py-1 rounded flex items-center gap-1"><Heart size={10}/> {currentPlayer.hunger}</span>
                            </div>
                        </div>
                        <div className="flex-1 p-6 flex flex-col justify-center">
                            {currentPlayer.isBankrupt ? (
                                <div className="text-center text-red-500 font-bold">{t.bankrupt}</div>
                            ) : currentPlayer.isAi ? (
                                <div className="text-center animate-pulse">
                                    <Bot size={48} className="mx-auto text-cyan-500 mb-4"/>
                                    <h3 className="text-cyan-300 font-bold mb-2">{t.ai_thinking}</h3>
                                </div>
                            ) : gameState === 'CHOOSING_FATE' ? (
                                <div className="space-y-3">
                                    <h3 className="text-center font-serif text-purple-400 mb-4">{t.fate}</h3>
                                    {fateOptions.map((opt, i) => (
                                        <button key={i} onClick={() => resolveFate(opt, false)} className="w-full text-left p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-400 transition-all">
                                            <div className="font-bold text-sm">{opt.text}</div>
                                            <div className="text-[10px] text-slate-400">{opt.description}</div>
                                        </button>
                                    ))}
                                </div>
                            ) : gameState === 'IDLE' ? (
                                currentPlayer.isJailed ? (
                                    <div className="space-y-3">
                                        <div className="text-center text-red-300 mb-2 font-bold">{t.jail_title}</div>
                                        <button onClick={() => payBail(false)} disabled={currentPlayer.money < BAIL_PRICE} className="w-full py-3 bg-amber-600 hover:bg-amber-500 rounded-xl font-bold text-white transition-all disabled:opacity-50">{t.pay_bail}</button>
                                        <button onClick={triggerDiceRoll} className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-bold text-white transition-all">{t.roll_escape}</button>
                                    </div>
                                ) : board[currentPlayer.position].owner === null && board[currentPlayer.position].price ? (
                                    <div className="space-y-3 animate-fade-in">
                                        <div className="text-center text-sm mb-4">
                                            <div className="text-xs text-slate-400">Location</div>
                                            <div className="font-bold text-lg">{board[currentPlayer.position].name}</div>
                                            <div className="text-amber-300 font-mono mt-1">{board[currentPlayer.position].price} kr</div>
                                        </div>
                                        <button onClick={() => buyProperty(false)} disabled={currentPlayer.money < (board[currentPlayer.position].price || 0)} className="w-full py-4 bg-green-600 rounded-xl font-bold text-white hover:bg-green-500 transition-all disabled:opacity-50">{t.buy}</button>
                                        <button onClick={() => endTurn(false)} className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 transition-all">{t.pass}</button>
                                    </div>
                                ) : (
                                    <button onClick={triggerDiceRoll} disabled={isDiceRolling} className={`group w-full aspect-square rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0_0_40px_rgba(6,182,212,0.4)] flex flex-col items-center justify-center transition-all transform ${isDiceRolling ? 'scale-90' : 'hover:scale-105 active:scale-95'} border-4 border-slate-900/50`}>
                                        <div className={`${isDiceRolling ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500 mb-2`}><DiceIcon size={48} className="text-white"/></div>
                                        <span className="font-bold text-white tracking-widest">{isDiceRolling ? 'ROLLING...' : t.roll}</span>
                                    </button>
                                )
                            ) : (
                                <div className="text-center text-slate-500 animate-pulse"><Ship size={32} className="mx-auto mb-2"/>Sailing...</div>
                            )}
                        </div>
                        <div className="h-1 bg-slate-800 mx-auto w-1/3 mb-2 rounded-full"></div>
                    </div>
                </div>
            </div>
            {!isFullscreen && <div className="absolute bottom-4 left-4 z-50 text-[10px] text-slate-500 bg-black/50 px-2 py-1 rounded flex items-center gap-1"><Save size={10} /> Auto-save active</div>}
        </div>
        {!isFullscreen && <div className="h-8 bg-slate-900 border-t border-slate-700 flex items-center overflow-hidden relative z-50">
             <div className="whitespace-nowrap animate-[scroll_30s_linear_infinite] flex gap-8 text-xs font-mono">
                {[...Array(3)].map((_, i) => (
                    <React.Fragment key={i}>
                        <span className="text-green-400 font-bold">MARKET INDEX ▲ 2.4%</span><span className="text-slate-400">|</span>
                        <span className={market.trend === 'BOOM' ? 'text-green-400' : 'text-red-400'}>FISH: {(market.fishPrice * 100).toFixed(0)}% ({market.trend})</span><span className="text-slate-400">|</span>
                        <span className="text-amber-400">MEAT: {(market.meatPrice * 100).toFixed(0)}%</span><span className="text-slate-400">|</span>
                    </React.Fragment>
                ))}
             </div>
        </div>}
        <style>{`@keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-33.33%); } } .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; } @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .animate-spin-slow { animation: spin-slow 20s linear infinite; }`}</style>
    </div>
  );
}

// --- Components ---

const CentralHub = ({ weather, mapUrl, market, round, theme }: { weather: WeatherType, mapUrl: string | null, market: MarketState, round: number, theme: string }) => (
    <div className="relative w-full h-full rounded-full flex items-center justify-center group">
        <div className="absolute inset-0 rounded-full border-[12px] border-slate-800/80 z-10"></div>
        <div className="absolute inset-2 rounded-full border-2 border-dashed border-white/20 animate-spin-slow z-20"></div>
        <div className="absolute inset-4 rounded-full overflow-hidden bg-slate-900 border border-white/20 z-0">
             {mapUrl ? <img src={mapUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" /> : <div className="w-full h-full flex items-center justify-center text-xs text-slate-600">Loading Map...</div>}
        </div>
        <div className="relative z-30 flex flex-col items-center justify-center text-center bg-black/40 p-2 rounded-xl backdrop-blur-sm border border-white/10">
            <h3 className="font-serif font-bold text-xs sm:text-lg text-white drop-shadow-md uppercase max-w-[120px] truncate">{theme}</h3>
            <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-sm mt-1">
                {weather === 'SUNNY' && <Sun size={12} className="text-yellow-400"/>}
                {weather === 'STORM' && <CloudLightning size={12} className="text-slate-400"/>}
                {weather === 'FOG' && <Cloud size={12} className="text-gray-400"/>}
                {weather === 'AURORA' && <Sparkles size={12} className="text-green-400"/>}
                <span className="text-slate-200 hidden sm:inline">{weather}</span>
            </div>
        </div>
    </div>
);

const BoardCell: React.FC<{ space: BoardSpace, players: Player[] }> = ({ space, players }) => {
    const playersHere = players.filter(p => p.position === space.id);
    const isCorner = ['START', 'JAIL', 'GO_TO_JAIL', 'FREE_PARKING'].includes(space.type);
    const cornerStyle = isCorner ? "border-2 border-white/30 bg-white/5" : "border border-white/10 bg-black/40";
    
    return (
        <div className={`relative flex-1 rounded-lg ${cornerStyle} backdrop-blur-sm overflow-hidden group`}>
            <div className="absolute inset-0 opacity-50 group-hover:opacity-100 transition-opacity duration-500">
                {space.imageUrl ? 
                    <img src={space.imageUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" /> 
                    : <div className="w-full h-full bg-slate-800 flex items-center justify-center"><Loader2 className="animate-spin text-slate-600"/></div>
                }
                <div className={`absolute inset-0 bg-gradient-to-t ${isCorner ? 'from-slate-900/80 via-transparent' : 'from-slate-950 via-slate-950/20 to-transparent'}`}></div>
            </div>
            <div className="relative z-10 h-full p-2 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/60 backdrop-blur ${space.type === 'BOAT' ? 'text-cyan-300' : space.type === 'RESTAURANT' ? 'text-amber-300' : isCorner ? 'text-white' : 'text-slate-300'}`}>{space.name}</span>
                    {space.owner !== undefined && space.owner !== null && <div className={`w-3 h-3 rounded-full ${players[space.owner].color} border border-white shadow`}></div>}
                </div>
                {isCorner && <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">{space.type === 'START' && <Anchor size={32}/>}{space.type === 'JAIL' && <AlertTriangle size={32}/>}{space.type === 'FREE_PARKING' && <Waves size={32}/>}</div>}
                <div className="flex flex-wrap gap-1 justify-center items-end min-h-[1.5rem] mt-auto pointer-events-none">
                    {playersHere.map(p => (
                        <div key={p.id} className={`w-8 h-8 rounded-full ${p.color} border-2 border-white shadow-[0_0_10px_rgba(255,255,255,0.5)] flex items-center justify-center transform hover:scale-125 transition-transform z-20 relative -ml-2 first:ml-0 overflow-hidden`}>
                            {p.portraitUrl ? <img src={p.portraitUrl} className="w-full h-full object-cover" /> : <span className="font-bold text-[10px] text-white/90 drop-shadow-md">{p.name.substring(0,2).toUpperCase()}</span>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- World Maker ---

const WorldMaker = ({ theme, setTheme, onComplete }: { theme: string, setTheme: (s: string) => void, onComplete: (b: BoardSpace[]) => void }) => {
    const [status, setStatus] = useState("Waiting for captain...");
    const [progress, setProgress] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);
    const [previewBoard, setPreviewBoard] = useState<BoardSpace[]>([]);

    const generateBoardData = async () => {
        setIsGenerating(true);
        setStatus("Consulting the charts...");
        try {
            const ai = getAi();
            // 1. Generate Data
            const prompt = `Generate 16 monopoly-style board spaces for a game themed: "${theme}". 
            STRICT RULES:
            - Return ONLY valid JSON.
            - Array of objects with keys: name (string), type (string), price (number).
            - Corner indices MUST be: 0:START, 5:GO_TO_JAIL, 8:FREE_PARKING, 13:JAIL.
            - Other types must be BOAT, RESTAURANT, CHANCE, or STORM.
            - BOAT rent is approx 20-60. RESTAURANT rent is approx 30-70.
            - Do not markdown wrap.`;
            
            const res = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt
            }));
            
            let cleanJson = res.text?.replace(/```json/g, '').replace(/```/g, '').trim();
            let spaces = JSON.parse(cleanJson || "[]") as any[];
            
            // Fix corners if AI messed up
            const fixedSpaces: BoardSpace[] = spaces.map((s, i) => ({
                id: i,
                name: s.name,
                type: [0].includes(i) ? 'START' : [5].includes(i) ? 'GO_TO_JAIL' : [8].includes(i) ? 'FREE_PARKING' : [13].includes(i) ? 'JAIL' : s.type as SpaceType,
                price: s.price || (i * 20),
                rent: Math.floor((s.price || 100) * 0.2)
            }));
            setPreviewBoard(fixedSpaces);
            setProgress(20);

            // 2. Generate Images in Batches
            setStatus("Painting the world...");
            const BATCH_SIZE = 4;
            const updatedBoard = [...fixedSpaces];
            
            for (let i = 0; i < fixedSpaces.length; i += BATCH_SIZE) {
                const batch = fixedSpaces.slice(i, i + BATCH_SIZE);
                await Promise.all(batch.map(async (space) => {
                    try {
                        const imgRes = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
                            model: 'gemini-2.5-flash-image',
                            contents: { parts: [{ text: `Iconic card art for board game space: ${space.name}, type: ${space.type}, theme: ${theme}. Minimalist, stylized, high contrast.` }] }
                        }));
                        const data = imgRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                        if (data) {
                            updatedBoard[space.id].imageUrl = `data:image/png;base64,${data}`;
                            updatedBoard[space.id].isGenerated = true;
                        }
                    } catch (e) { console.error("Img gen error", e); }
                }));
                setPreviewBoard([...updatedBoard]);
                setProgress(20 + ((i + BATCH_SIZE) / 16) * 80);
            }
            
            setStatus("Ready to sail!");
            setTimeout(() => onComplete(updatedBoard), 1000);

        } catch (e) {
            console.error(e);
            setStatus("Generation failed. Using emergency maps.");
            setTimeout(() => onComplete(PREMADE_BOARD), 2000); // Fallback
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 relative overflow-hidden">
             <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542359649-31e03cd4d909?w=1200')] bg-cover opacity-20 animate-pulse-glow"></div>
             <div className="glass-panel p-8 rounded-3xl max-w-2xl w-full z-10 text-center">
                 <h1 className="text-3xl font-serif text-cyan-400 mb-2">WORLD MAKER</h1>
                 <p className="text-slate-400 mb-8">Define the era and theme of your voyage.</p>
                 
                 {!isGenerating ? (
                     <div className="space-y-6">
                         <div className="bg-white/5 p-2 rounded-xl border border-white/10 flex items-center gap-4">
                            <Paintbrush className="text-cyan-500 ml-2" />
                            <input 
                                value={theme} 
                                onChange={(e) => setTheme(e.target.value)}
                                className="bg-transparent border-none outline-none text-xl w-full text-white placeholder-slate-600"
                                placeholder="e.g. Cyberpunk Vikings"
                            />
                         </div>
                         <button onClick={generateBoardData} className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl font-bold text-xl hover:scale-105 transition-transform shadow-lg shadow-cyan-500/30">
                             GENERATE WORLD
                         </button>
                         <div className="grid grid-cols-4 gap-2 mt-4 opacity-50">
                             {Array(4).fill(0).map((_,i) => <div key={i} className="h-16 bg-white/5 rounded-lg border border-white/5 border-dashed"></div>)}
                         </div>
                     </div>
                 ) : (
                     <div className="space-y-6">
                         <div className="text-2xl font-bold text-white animate-pulse">{status}</div>
                         <div className="h-4 bg-slate-800 rounded-full overflow-hidden">
                             <div className="h-full bg-cyan-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                         </div>
                         <div className="grid grid-cols-4 md:grid-cols-8 gap-2 mt-8">
                             {previewBoard.map((s, i) => (
                                 <div key={i} className="aspect-square rounded-lg bg-slate-800 border border-white/10 overflow-hidden relative">
                                     {s.imageUrl ? <img src={s.imageUrl} className="w-full h-full object-cover animate-fade-in" /> : <div className="w-full h-full flex items-center justify-center text-slate-600 text-[10px]">{s.name ? '...' : ''}</div>}
                                 </div>
                             ))}
                             {Array(16 - previewBoard.length).fill(0).map((_,i) => <div key={i} className="aspect-square rounded-lg bg-white/5 animate-pulse"></div>)}
                         </div>
                     </div>
                 )}
             </div>
        </div>
    )
}

// --- Victory Stage ---

const VictoryStage = ({ winner, playlist, onRestart }: { winner: Player | null, playlist: VoyageChapter[], onRestart: () => void }) => {
    const [showCredits, setShowCredits] = useState(false);

    useEffect(() => { setTimeout(() => setShowCredits(true), 3000); }, []);

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
             {/* Background Slideshow of Journey */}
             <div className="absolute inset-0 z-0 opacity-40">
                 {playlist.length > 0 && <img src={playlist[0].url} className="w-full h-full object-cover animate-pulse-glow" />}
             </div>
             
             <div className="z-10 text-center space-y-8 p-8 max-w-4xl">
                 <div className="animate-[float_6s_infinite]">
                     <Crown size={120} className="text-yellow-400 mx-auto drop-shadow-[0_0_30px_rgba(250,204,21,0.6)]" />
                 </div>
                 <h1 className="text-7xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-600 drop-shadow-sm">
                     {winner?.name}
                 </h1>
                 <p className="text-2xl text-slate-300 font-serif tracking-widest uppercase border-t border-b border-white/20 py-4">
                     Master of the {playlist.length > 0 ? 'High Seas' : 'Board'}
                 </p>

                 {showCredits && (
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                         {playlist.slice(0, 3).map((chapter, i) => (
                             <div key={i} className="bg-white/10 p-2 rounded-xl backdrop-blur-md border border-white/10 transform hover:scale-105 transition-transform">
                                 <img src={chapter.url} className="w-full aspect-video object-cover rounded-lg mb-2"/>
                                 <p className="text-[10px] text-slate-300 line-clamp-2">{chapter.description}</p>
                             </div>
                         ))}
                     </div>
                 )}
                 
                 <div className="pt-12">
                     <button onClick={onRestart} className="px-12 py-4 bg-white text-black font-bold rounded-full hover:scale-110 transition-transform shadow-[0_0_50px_rgba(255,255,255,0.3)]">
                         BEGIN NEW LEGACY
                     </button>
                 </div>
             </div>
        </div>
    )
}

// --- Lobby ---

const Lobby = ({ players, setPlayers, onStart, onResume, hasSave, onClearSave }: { players: Player[], setPlayers: React.Dispatch<React.SetStateAction<Player[]>>, onStart: () => void, onResume: () => void, hasSave: boolean, onClearSave: () => void }) => {
    const [generatingIds, setGeneratingIds] = useState<number[]>([]);
    
    const addPlayer = () => {
        if (players.length >= 4) return;
        setPlayers([...players, { id: players.length, name: `Player ${players.length + 1}`, color: ["bg-green-500", "bg-purple-500", "bg-pink-500"][players.length - 2] || "bg-slate-500", position: 0, money: START_MONEY, hunger: 0, karma: 0, isJailed: false, isBankrupt: false, inventory: [], isAi: true, boatType: 'DINGHY' }]);
    };

    const generatePortrait = async (player: Player) => {
        if (generatingIds.includes(player.id)) return;
        setGeneratingIds(prev => [...prev, player.id]);
        try {
            const ai = getAi();
            const prompt = `Hyper-realistic close-up portrait of a character named ${player.name}, captain of a ${player.boatType}. Cinematic lighting, detailed texture.`;
            const res = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [{ text: prompt }] } }));
            const imgData = res.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (imgData) setPlayers(prev => prev.map(p => p.id === player.id ? { ...p, portraitUrl: `data:image/png;base64,${imgData}` } : p));
        } catch (e) { console.error("Portrait gen failed", e); } 
        finally { setGeneratingIds(prev => prev.filter(id => id !== player.id)); }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 relative overflow-hidden">
             <div className="absolute inset-0 z-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1464660439080-b79116909ce7?w=1200')] bg-cover bg-center"></div>
            <div className="glass-panel p-8 rounded-3xl max-w-4xl w-full relative z-10">
                <h1 className="text-4xl font-serif text-cyan-400 mb-8 text-center tracking-widest">MAÍGREIFINN LOBBY</h1>
                {hasSave && (
                    <div className="mb-6 p-4 bg-amber-900/30 border border-amber-500/30 rounded-xl flex items-center justify-between">
                         <div className="flex items-center gap-3"><Save className="text-amber-400" size={20}/><div><div className="font-bold text-amber-200">Vistaður leikur</div><div className="text-xs text-amber-400/70">Previous voyage data found</div></div></div>
                         <div className="flex gap-2"><button onClick={onClearSave} className="px-3 py-2 text-xs hover:bg-red-500/20 text-red-300 rounded-lg flex items-center gap-1 transition-colors"><Trash2 size={14}/> Eyða</button><button onClick={onResume} className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg shadow-lg shadow-amber-900/50 flex items-center gap-2 transition-transform hover:scale-105"><Play size={16} fill="currentColor"/> Halda áfram</button></div>
                    </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {players.map((p, i) => (
                        <div key={i} className="bg-white/5 p-4 rounded-xl flex items-center gap-4 border border-white/10 relative group hover:border-cyan-500/30 transition-all">
                            <div className="relative">
                                <div className={`w-16 h-16 rounded-full ${p.color} flex items-center justify-center overflow-hidden border-2 border-white/20 shadow-lg`}>{generatingIds.includes(p.id) ? <Loader2 className="animate-spin text-white" size={24}/> : p.portraitUrl ? <img src={p.portraitUrl} className="w-full h-full object-cover" /> : <User size={28} className="text-white/50"/>}</div>
                                <button onClick={() => generatePortrait(p)} disabled={generatingIds.includes(p.id)} className="absolute -bottom-1 -right-1 bg-cyan-500 hover:bg-cyan-400 text-white p-1.5 rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95 disabled:opacity-50"><Sparkles size={12} fill="currentColor" /></button>
                            </div>
                            <div className="flex-1">
                                <input value={p.name} onChange={(e) => setPlayers(prev => prev.map(pl => pl.id === p.id ? { ...pl, name: e.target.value } : pl))} className="bg-transparent border-b border-white/20 w-full text-lg focus:outline-none focus:border-cyan-400 font-bold tracking-wide"/>
                                <div className="flex items-center gap-2 mt-2">
                                    <button onClick={() => setPlayers(prev => prev.map(pl => pl.id === p.id ? { ...pl, isAi: !pl.isAi } : pl))} className={`text-xs px-2 py-1 rounded border ${p.isAi ? 'bg-cyan-900/50 border-cyan-500 text-cyan-200' : 'bg-slate-800 border-slate-600 text-slate-400'} flex items-center gap-1 transition-all`}>{p.isAi ? <Bot size={12}/> : <Smartphone size={12}/>}{p.isAi ? "AI AUTOPILOT" : "HUMAN"}</button>
                                    <select value={p.boatType} onChange={(e) => setPlayers(prev => prev.map(pl => pl.id === p.id ? { ...pl, boatType: e.target.value as BoatType } : pl))} className="bg-slate-800 text-xs px-2 py-1 rounded border border-slate-600 text-slate-300 outline-none"><option value="TRAWLER">TRAWLER</option><option value="SAILBOAT">SAILBOAT</option><option value="DINGHY">DINGHY</option><option value="YACHT">YACHT</option></select>
                                </div>
                            </div>
                        </div>
                    ))}
                    {players.length < 4 && <button onClick={addPlayer} className="border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center text-slate-500 hover:text-white hover:border-white/30 transition-all p-4 min-h-[100px]">+ Add Captain</button>}
                </div>
                <div className="flex flex-col gap-3"><button onClick={onStart} className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl font-bold text-white text-xl tracking-[0.2em] shadow-lg shadow-cyan-900/50 transition-all flex items-center justify-center gap-2 group"><Globe size={24} className="group-hover:animate-spin-slow"/>ENTER WORLD MAKER</button>{hasSave && <div className="text-center text-xs text-slate-500">Starting a new game will overwrite existing save data.</div>}</div>
            </div>
        </div>
    );
};

// Fallback Board
const PREMADE_BOARD: BoardSpace[] = [
  { id: 0, name: "Start", type: 'START', imageUrl: PREMADE_IMAGES.START },
  { id: 1, name: "Old Boat", type: 'BOAT', price: 100, imageUrl: PREMADE_IMAGES.BOAT },
  { id: 2, name: "Chance", type: 'CHANCE', imageUrl: PREMADE_IMAGES.CHANCE },
  { id: 3, name: "Diner", type: 'RESTAURANT', price: 150, imageUrl: PREMADE_IMAGES.RESTAURANT },
  { id: 4, name: "Trawler", type: 'BOAT', price: 180, imageUrl: PREMADE_IMAGES.BOAT },
  { id: 5, name: "Go To Jail", type: 'GO_TO_JAIL', imageUrl: PREMADE_IMAGES.STORM },
  { id: 6, name: "Bistro", type: 'RESTAURANT', price: 200, imageUrl: PREMADE_IMAGES.RESTAURANT },
  { id: 7, name: "Yacht", type: 'BOAT', price: 220, imageUrl: PREMADE_IMAGES.BOAT },
  { id: 8, name: "Parking", type: 'FREE_PARKING', imageUrl: PREMADE_IMAGES.START },
  { id: 9, name: "Cruiser", type: 'BOAT', price: 240, imageUrl: PREMADE_IMAGES.BOAT },
  { id: 10, name: "Chance", type: 'CHANCE', imageUrl: PREMADE_IMAGES.CHANCE },
  { id: 11, name: "Fine Dining", type: 'RESTAURANT', price: 350, imageUrl: PREMADE_IMAGES.RESTAURANT },
  { id: 12, name: "Speedboat", type: 'BOAT', price: 260, imageUrl: PREMADE_IMAGES.BOAT },
  { id: 13, name: "Jail", type: 'JAIL', imageUrl: PREMADE_IMAGES.JAIL },
  { id: 14, name: "Mega Yacht", type: 'BOAT', price: 300, imageUrl: PREMADE_IMAGES.BOAT },
  { id: 15, name: "The Dock", type: 'RESTAURANT', price: 280, imageUrl: PREMADE_IMAGES.RESTAURANT },
];

const root = createRoot(document.getElementById('root')!);
root.render(<App />);