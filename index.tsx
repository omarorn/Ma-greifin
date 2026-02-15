import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { 
    Save, Trash2, Play, Sparkles, Loader2, User, Bot, Smartphone, Ship, 
    Anchor, Fish, Utensils, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, 
    Coins, Waves, Sailboat, LifeBuoy, AlertTriangle, X, Camera, RefreshCw, 
    QrCode, MessageSquare, Wifi, WifiOff, Heart, ChevronLeft, ChevronRight, 
    Clapperboard, ScrollText, Volume2, Users, Vibrate, TrendingUp, 
    CloudLightning, Sun, Cloud, Snowflake, Trophy, MapPin, Clock, 
    Maximize2, Minimize2, Skull, Crown, Lock
} from 'lucide-react';

// --- Constants & Types ---

const BOARD_SIZE = 16;
const START_MONEY = 1500;
const MAX_HUNGER = 12;
const SAVE_KEY = 'maigreifinn_save_v2';
const BAIL_PRICE = 50;

// Faster AI Timings
const AI_THINK_TIME = 800;
const AI_ACTION_DELAY = 600;

type SpaceType = 'START' | 'BOAT' | 'RESTAURANT' | 'CHANCE' | 'STORM' | 'JAIL' | 'GO_TO_JAIL' | 'FREE_PARKING';
type BoatType = 'TRAWLER' | 'SAILBOAT' | 'DINGHY' | 'YACHT';
type Lang = 'IS' | 'EN';
type WeatherType = 'SUNNY' | 'STORM' | 'AURORA' | 'FOG';

const PREMADE_IMAGES = {
  START: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&h=400&fit=crop&q=80",
  BOAT: "https://images.unsplash.com/photo-1544979590-2c00a307c433?w=400&h=400&fit=crop&q=80",
  RESTAURANT: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=400&fit=crop&q=80",
  STORM: "https://images.unsplash.com/photo-1454789476662-53eb23ba5907?w=400&h=400&fit=crop&q=80",
  CHANCE: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=400&h=400&fit=crop&q=80",
  JAIL: "https://images.unsplash.com/photo-1503751071777-d2918b21bbd9?w=400&h=400&fit=crop&q=80"
};

const ADS = [
    "Hampiðjan - Traust net síðan 1934",
    "66° Norður - Klæddu þig vel í brælunni",
    "Sjóvá - Trygging fyrir trillukarla",
    "Kaffivagninn - Besta kaffið á bryggjunni",
    "Olís - Olía á bátinn, pylsa í magann",
    "Ísbjörninn - Ferskur fiskur alla daga",
    "Bónus - Ekki vera svangur á sjó"
];

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
  isGeneratedImage?: boolean;
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
    clickToRoll: "HRISTU SÍMANN EÐA SMELLTU!",
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

// --- Initial Data ---

const INITIAL_BOARD: BoardSpace[] = [
  { id: 0, name: "Reykjavíkurhöfn", type: 'START', description: "Safe haven.", imageUrl: PREMADE_IMAGES.START },
  { id: 1, name: "Jón Páll", type: 'BOAT', price: 100, rent: 20, imageUrl: PREMADE_IMAGES.BOAT },
  { id: 2, name: "Sjómannalífið", type: 'CHANCE', imageUrl: PREMADE_IMAGES.CHANCE },
  { id: 3, name: "Kjallarinn", type: 'RESTAURANT', price: 150, rent: 30, imageUrl: PREMADE_IMAGES.RESTAURANT },
  { id: 4, name: "Gunnvör", type: 'BOAT', price: 180, rent: 35, imageUrl: PREMADE_IMAGES.BOAT },
  { id: 5, name: "Landhelgisgæslan", type: 'GO_TO_JAIL', imageUrl: PREMADE_IMAGES.STORM }, // Corner 1
  { id: 6, name: "Humarvagninn", type: 'RESTAURANT', price: 200, rent: 40, imageUrl: PREMADE_IMAGES.RESTAURANT },
  { id: 7, name: "Sæbjörg", type: 'BOAT', price: 220, rent: 45, imageUrl: PREMADE_IMAGES.BOAT },
  { id: 8, name: "Kaffistofan", type: 'FREE_PARKING', imageUrl: PREMADE_IMAGES.START }, // Corner 2
  { id: 9, name: "Harpa", type: 'BOAT', price: 240, rent: 50, imageUrl: PREMADE_IMAGES.BOAT },
  { id: 10, name: "Sjómannalífið", type: 'CHANCE', imageUrl: PREMADE_IMAGES.CHANCE },
  { id: 11, name: "Sægreifinn", type: 'RESTAURANT', price: 350, rent: 70, imageUrl: PREMADE_IMAGES.RESTAURANT },
  { id: 12, name: "Sjóli", type: 'BOAT', price: 260, rent: 55, imageUrl: PREMADE_IMAGES.BOAT },
  { id: 13, name: "Sjófangelsið", type: 'JAIL', imageUrl: PREMADE_IMAGES.JAIL }, // Corner 3
  { id: 14, name: "Moby Dick", type: 'BOAT', price: 300, rent: 60, imageUrl: PREMADE_IMAGES.BOAT },
  { id: 15, name: "Bryggjan", type: 'RESTAURANT', price: 280, rent: 60, imageUrl: PREMADE_IMAGES.RESTAURANT },
];

const DEFAULT_PLAYERS: Player[] = [
  { id: 0, name: "Human Captain", color: "bg-amber-500", position: 0, money: START_MONEY, hunger: 0, karma: 0, isJailed: false, isBankrupt: false, inventory: [], isAi: false, boatType: 'TRAWLER' },
  { id: 1, name: "AI Rival", color: "bg-cyan-500", position: 0, money: START_MONEY, hunger: 0, karma: 0, isJailed: false, isBankrupt: false, inventory: [], isAi: true, boatType: 'YACHT' },
];

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

// --- Main App Component ---

function App() {
  const [view, setView] = useState<'LOBBY' | 'GAME'>('LOBBY');
  const [players, setPlayers] = useState<Player[]>(DEFAULT_PLAYERS);
  const [board, setBoard] = useState<BoardSpace[]>(INITIAL_BOARD);
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
  
  // Dice Animation State
  const [isDiceRolling, setIsDiceRolling] = useState(false);
  const [diceDisplay, setDiceDisplay] = useState(5);

  // Weather & Map State
  const [weather, setWeather] = useState<WeatherType>('SUNNY');
  const [icelandMapUrl, setIcelandMapUrl] = useState<string | null>(null);
  
  // Video/Story State
  const [voyagePlaylist, setVoyagePlaylist] = useState<VoyageChapter[]>([]);
  const [viewingChapter, setViewingChapter] = useState(-1);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [hasSave, setHasSave] = useState(false);

  // Refs
  const gameStateRef = useRef(gameState);
  const turnRef = useRef(turn);
  const playersRef = useRef(players);
  const viewRef = useRef(view);
  const generatingDescriptions = useRef(new Set<number>());

  // Sync refs
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { turnRef.current = turn; }, [turn]);
  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { viewRef.current = view; }, [view]);

  const currentPlayer = players[turn];
  const t = T.IS;

  // Load BG
  useEffect(() => {
    const loadBg = async () => {
        try {
            const ai = getAi();
            const res = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: "Cinematic dark moody icelandic ocean storm, northern lights, wide angle, matte painting style" }] }
            }));
            const imgData = res.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (imgData) setBgImage(`data:image/png;base64,${imgData}`);
        } catch(e) { console.error("BG Gen failed", e); }
    };
    if (!bgImage && view === 'GAME') loadBg();
    
    // Initial Map Gen if missing
    if (!icelandMapUrl && view === 'GAME') updateIcelandMap('SUNNY');
  }, [view]);

  // Update Map on Weather Change
  useEffect(() => {
     if (view === 'GAME') updateIcelandMap(weather);
  }, [weather, view]);

  const updateIcelandMap = async (w: WeatherType) => {
      try {
          const ai = getAi();
          const weatherPrompts = {
              'SUNNY': 'sunny, clear skies, green land',
              'STORM': 'heavy storm, dark clouds, rough seas, rain',
              'AURORA': 'night time, northern lights, aurora borealis, stars',
              'FOG': 'thick fog, misty, mysterious'
          };
          
          const prompt = `A top-down stylized board game map of Iceland in the center, ${weatherPrompts[w]}, surrounded by ocean. High detail, fantasy map style, neutral background.`;
          
          const res = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
              model: 'gemini-2.5-flash-image',
              contents: { parts: [{ text: prompt }] }
          }));
          const imgData = res.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (imgData) setIcelandMapUrl(`data:image/png;base64,${imgData}`);
      } catch (e) {
          console.error("Map Gen failed", e);
      }
  };

  // Check for save file
  useEffect(() => {
      try {
          const saved = localStorage.getItem(SAVE_KEY);
          if (saved) setHasSave(true);
      } catch (e) { console.error("Error reading save", e); }
  }, []);

  // --- OPTIMIZED AUTOSAVE ---
  useEffect(() => {
      if (view === 'GAME' && gameState !== 'GAME_OVER') {
          const timer = setTimeout(() => {
              try {
                  const optimizedBoard = board.map(b => ({
                      ...b,
                      imageUrl: b.isGeneratedImage ? undefined : b.imageUrl,
                      isGeneratedImage: b.isGeneratedImage ? false : false
                  }));
                  const optimizedPlaylist = voyagePlaylist.map(c => ({ ...c, url: '' }));
                  const optimizedPlayers = players.map(p => ({
                       ...p,
                       portraitUrl: p.portraitUrl && p.portraitUrl.startsWith('data:') ? undefined : p.portraitUrl
                  }));

                  const state = {
                      players: optimizedPlayers, 
                      board: optimizedBoard, 
                      turn, 
                      round, 
                      totalTurns, 
                      market, 
                      logs: logs.slice(0, 50),
                      voyagePlaylist: optimizedPlaylist, 
                      weather 
                  };
                  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
              } catch (e) { console.error("Autosave failed", e); }
          }, 2000);
          return () => clearTimeout(timer);
      }
  }, [players, board, turn, round, totalTurns, market, logs, voyagePlaylist, view, weather, gameState]);


  // Log helper
  const addLog = (text: string, type: GameLog['type'] = 'info') => {
    const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    setLogs(prev => [{ id: Date.now(), text, type, timestamp: time }, ...prev].slice(50));
  };

  const checkVictory = useCallback(() => {
      const activePlayers = players.filter(p => !p.isBankrupt);
      if (activePlayers.length === 1 && players.length > 1) {
          setWinner(activePlayers[0]);
          setGameState('GAME_OVER');
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
              if (data.totalTurns !== undefined) setTotalTurns(data.totalTurns);
              if (data.market) setMarket(data.market);
              if (data.logs) setLogs(data.logs);
              if (data.voyagePlaylist) setVoyagePlaylist(data.voyagePlaylist);
              if (data.weather) setWeather(data.weather);
              
              setView('GAME');
              addLog("Voyage Resumed. Visuals reset to save space.", 'notification');
          }
      } catch(e) {
          console.error("Failed to resume", e);
          addLog("Failed to load save file.", 'alert');
      }
  };

  const handleNewGame = () => {
      localStorage.removeItem(SAVE_KEY);
      setHasSave(false);
      setPlayers(prev => prev.map(p => ({...p, isBankrupt: false, money: START_MONEY, inventory: [], position: 0})));
      setBoard(INITIAL_BOARD);
      setView('GAME');
      setWinner(null);
      setGameState('IDLE');
      addLog("New Voyage Started.", 'success');
  };

  const handleClearSave = () => {
      localStorage.removeItem(SAVE_KEY);
      setHasSave(false);
  }

  // --- Slideshow & Interactions ---
  
  const handlePrevSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (voyagePlaylist.length === 0) return;
    const current = viewingChapter === -1 ? 0 : viewingChapter;
    if (current < voyagePlaylist.length - 1) {
        const newIndex = current + 1;
        setViewingChapter(newIndex);
        if (voyagePlaylist[newIndex]?.url) setBgImage(voyagePlaylist[newIndex].url);
    }
  };

  const handleNextSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (voyagePlaylist.length === 0) return;
    const current = viewingChapter === -1 ? 0 : viewingChapter;
    if (current > 0) {
        const newIndex = current - 1;
        setViewingChapter(newIndex);
        if (voyagePlaylist[newIndex]?.url) setBgImage(voyagePlaylist[newIndex].url);
    }
  };

  const handleSpeak = (text: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        const voices = window.speechSynthesis.getVoices();
        const isVoice = voices.find(v => v.lang.includes('is'));
        if (isVoice) utterance.voice = isVoice;
        window.speechSynthesis.speak(utterance);
    }
  };

  // --- Dice Logic ---
  
  const triggerDiceRoll = () => {
      if (isDiceRolling || gameStateRef.current !== 'IDLE') return;
      setIsDiceRolling(true);
      
      let count = 0;
      const maxCount = 10;
      const interval = setInterval(() => {
          setDiceDisplay(Math.floor(Math.random() * 6) + 1);
          count++;
          if (count >= maxCount) {
              clearInterval(interval);
              setIsDiceRolling(false);
              handleRoll(false);
          }
      }, 80);
  };

  // Shake
  useEffect(() => {
      let lastShake = 0;
      const handleMotion = (event: DeviceMotionEvent) => {
          if (viewRef.current !== 'GAME') return;
          const now = Date.now();
          if (now - lastShake < 1000) return;
          const accel = event.accelerationIncludingGravity;
          if (!accel || !accel.x || !accel.y || !accel.z) return;
          const acceleration = Math.sqrt(accel.x*accel.x + accel.y*accel.y + accel.z*accel.z);
          if (acceleration > 20) {
              const currentP = playersRef.current[turnRef.current];
              const isHuman = !currentP.isAi;
              if (gameStateRef.current === 'IDLE' && isHuman && !isDiceRolling && !currentP.isJailed) {
                  lastShake = now;
                  addLog(t.shake, 'info');
                  if (navigator.vibrate) navigator.vibrate(200);
                  triggerDiceRoll();
              }
          }
      };
      if (typeof window !== 'undefined' && window.DeviceMotionEvent) {
          window.addEventListener('devicemotion', handleMotion);
      }
      return () => {
          if (typeof window !== 'undefined' && window.DeviceMotionEvent) {
              window.removeEventListener('devicemotion', handleMotion);
          }
      };
  }, [isDiceRolling]);

  // AI Logic
  useEffect(() => {
    if (view === 'GAME' && gameState === 'IDLE') {
        const isAi = currentPlayer.isAi;
        if (isAi && !currentPlayer.isBankrupt) {
            const timer = setTimeout(() => {
                if (currentPlayer.isJailed) {
                    if (currentPlayer.money >= BAIL_PRICE && Math.random() > 0.3) {
                         payBail(true);
                    } else {
                         handleRoll(true);
                    }
                } else {
                    handleRoll(true);
                }
            }, AI_THINK_TIME);
            return () => clearTimeout(timer);
        } else if (currentPlayer.isBankrupt) {
             // Skip bankrupt player
             endTurn(true);
        }
    }
  }, [turn, view, gameState, currentPlayer]);

  // --- Game Mechanics ---

  const handleRoll = useCallback(async (isAuto = false) => {
    if (gameStateRef.current !== 'IDLE') return;
    setGameState(isAuto ? 'AI_THINKING' : 'MOVING');
    
    if (!isAuto) await new Promise(r => setTimeout(r, 600));
    else await new Promise(r => setTimeout(r, 300));

    const roll = Math.floor(Math.random() * 6) + 1;
    const currentP = playersRef.current[turnRef.current];

    if (currentP.isJailed) {
        if (roll === 6) {
            addLog(`${currentP.name} kastaði 6 og slapp úr fangelsi!`, 'success');
             setPlayers(prev => prev.map(p => p.id === currentP.id ? { ...p, isJailed: false } : p));
        } else {
             addLog(`${currentP.name} kastaði ${roll} og situr fastur.`, 'alert');
             setTimeout(() => endTurn(isAuto), AI_ACTION_DELAY);
             return;
        }
    }
    
    setPlayers(prevPlayers => {
        const p = prevPlayers[turnRef.current];
        let newPos = (p.position + roll) % BOARD_SIZE;
        let newMoney = p.money;
        let newHunger = p.hunger + 1;
        let didPassGo = false;
        
        if (newPos < p.position) {
           didPassGo = true;
           newMoney += 200;
           newHunger = Math.max(0, newHunger - 1);
        }
        
        if (didPassGo) {
             addLog(`${p.name} fer yfir byrjunarreit. +200kr`, 'success');
             setRound(r => r + 1);
             const weathers: WeatherType[] = ['SUNNY', 'STORM', 'AURORA', 'FOG'];
             setWeather(weathers[Math.floor(Math.random() * weathers.length)]);
             if (Math.random() > 0.6) {
                const boom = Math.random() > 0.5;
                setMarket({
                   fishPrice: boom ? 1.5 : 0.6,
                   meatPrice: boom ? 1.4 : 0.7,
                   trend: boom ? 'BOOM' : 'CRASH'
                });
                addLog(boom ? "MARKAÐURINN BLÓMSTRAR!" : "MARKAÐSHRUN!", boom ? 'success' : 'alert');
             }
        }
        
        if (newHunger >= MAX_HUNGER) {
           addLog(`${p.name} féll í yfirlið vegna hungurs! (-100kr, Byrjunarreitur)`, 'alert');
           newPos = 0;
           newMoney = Math.max(0, newMoney - 100);
           newHunger = 0;
        }

        const updated = [...prevPlayers];
        updated[turnRef.current] = {
            ...p,
            position: newPos,
            money: newMoney,
            hunger: newHunger,
            isJailed: false // Ensure reset if they escaped
        };
        return updated;
    });

    const calculatedPos = (currentP.position + roll) % BOARD_SIZE;
    
    setTimeout(() => {
        const space = board[calculatedPos];
        handleLand(space, isAuto, calculatedPos);
    }, 100);

  }, [board, players]);

  const handleLand = async (space: BoardSpace, isAuto: boolean, pos: number) => {
    if (!space.isGenerated && !generatingDescriptions.current.has(space.id)) {
        generateDescription(space);
    }
    if (!space.isGeneratedImage) {
        generateSpaceImage(space);
    } else if (space.imageUrl) {
        setBgImage(space.imageUrl);
    }

    if (space.type === 'CHANCE') {
        setGameState('CHOOSING_FATE');
        const options: FateOption[] = [
            { text: "Stormurinn", description: "Þú siglir í gegnum storm.", type: "RISKY", effect: { money: -50, hunger: 2, karma: 1 } },
            { text: "Góður Afli", description: "Netin eru full.", type: "SAFE", effect: { money: 100, hunger: 0, karma: 0 } },
            { text: "Björgun", description: "Þú bjargar bát í vanda.", type: "MORAL", effect: { money: -20, hunger: 1, karma: 5 } }
        ];
        setFateOptions(options);
        
        if (isAuto) {
            setTimeout(() => resolveFate(options[Math.floor(Math.random() * options.length)], true), AI_ACTION_DELAY);
        }
    } 
    else if (space.type === 'BOAT' || space.type === 'RESTAURANT') {
        const currentPName = playersRef.current[turnRef.current].name;
        const currentPMoney = playersRef.current[turnRef.current].money;

        if (space.owner === null || space.owner === undefined) {
            if (isAuto) {
                const canAfford = currentPMoney >= (space.price || 0);
                const shouldBuy = canAfford && (currentPMoney > ((space.price || 0) + 200));
                
                if (shouldBuy) {
                    addLog(`${currentPName} ákveður að kaupa ${space.name}.`);
                    setTimeout(() => buyProperty(true), AI_ACTION_DELAY);
                } else {
                    addLog(`${currentPName} siglir framhjá ${space.name}.`);
                    setTimeout(() => endTurn(true), AI_ACTION_DELAY);
                }
            } else {
                setGameState('IDLE');
            }
        } else if (space.owner !== turnRef.current) {
            const rent = Math.floor((space.rent || 0) * (space.type === 'BOAT' ? market.fishPrice : market.meatPrice));
            addLog(`${currentPName} borgar ${rent}kr í leigu til ${playersRef.current[space.owner].name}`, 'alert');
            
            setPlayers(prev => {
                const copy = [...prev];
                const payer = copy[turnRef.current];
                const receiver = copy[space.owner!];
                
                if (payer.money < rent) {
                    addLog(`${payer.name} getur ekki borgað og er gjaldþrota!`, 'alert');
                    payer.money = 0;
                    payer.isBankrupt = true;
                } else {
                    payer.money -= rent;
                    receiver.money += rent;
                }
                
                if (space.type === 'RESTAURANT') {
                    payer.hunger = Math.max(0, payer.hunger - 3);
                }
                return copy;
            });
            setTimeout(() => endTurn(isAuto), AI_ACTION_DELAY + 400);
        } else {
            addLog(`${currentPName} hvílir sig í eign sinni.`);
             if (space.type === 'RESTAURANT') {
                setPlayers(prev => {
                    const copy = [...prev];
                    copy[turnRef.current].hunger = Math.max(0, copy[turnRef.current].hunger - 3);
                    return copy;
                });
            }
            setTimeout(() => endTurn(isAuto), AI_ACTION_DELAY);
        }
    } else {
        if (space.type === 'STORM') {
            setPlayers(prev => {
                const copy = [...prev];
                copy[turnRef.current].money = Math.max(0, copy[turnRef.current].money - 50);
                return copy;
            });
            addLog("Stormur! Skemmdir á bátnum. -50kr", 'alert');
            generateVoyageVideo("Boat struggling in heavy storm waves, cinematic");
        } else if (space.type === 'JAIL' || space.type === 'GO_TO_JAIL') {
             if (space.type === 'GO_TO_JAIL') {
                 addLog("Landhelgisgæslan tók þig! Farðu í Sjófangelsið.", 'alert');
                 setPlayers(prev => {
                    const copy = [...prev];
                    copy[turnRef.current].position = 13;
                    copy[turnRef.current].isJailed = true;
                    return copy;
                 });
             } else {
                 addLog("Sjófangelsið! Þú ert fastur í neti.", 'alert');
             }
             generateVoyageVideo("Gloomy prison cell in a boat hull, cinematic");
        } else if (space.type === 'FREE_PARKING') {
             addLog("Kaffistofan - Frítt kaffi og engar áhyggjur.", 'success');
             generateVoyageVideo("Cozy captains coffee house interior, warm lighting, cinematic");
        }
        setTimeout(() => endTurn(isAuto), AI_ACTION_DELAY);
    }
  };

  const buyProperty = (isAuto: boolean) => {
      const currentP = playersRef.current[turnRef.current];
      const space = board[currentP.position];
      if (space.price && currentP.money >= space.price) {
          const updatedP = { ...currentP, money: currentP.money - space.price, inventory: [...currentP.inventory, space.id] };
          setPlayers(prev => prev.map(p => p.id === currentP.id ? updatedP : p));
          setBoard(prev => prev.map(s => s.id === space.id ? { ...s, owner: turnRef.current } : s));
          addLog(`${currentP.name} keypti ${space.name}!`, 'success');
          generateVoyageVideo(`A proud captain buying the ${space.name} ${space.type.toLowerCase()}, cinematic`);
          setTimeout(() => endTurn(isAuto), AI_ACTION_DELAY);
      }
  };

  const payBail = (isAuto: boolean) => {
      setPlayers(prev => {
          const copy = [...prev];
          const p = copy[turnRef.current];
          if (p.money >= BAIL_PRICE) {
              p.money -= BAIL_PRICE;
              p.isJailed = false;
              addLog(`${p.name} borgaði sekt og er laus.`, 'info');
              // Free to move next turn
              return copy;
          }
          return copy;
      });
      setTimeout(() => endTurn(isAuto), AI_ACTION_DELAY);
  };

  const resolveFate = (option: FateOption, isAuto: boolean) => {
      const currentP = playersRef.current[turnRef.current];
      const updatedP = { 
          ...currentP, 
          money: currentP.money + option.effect.money,
          hunger: currentP.hunger + option.effect.hunger,
          karma: currentP.karma + option.effect.karma
      };
      setPlayers(prev => prev.map(p => p.id === currentP.id ? updatedP : p));
      addLog(`${currentP.name} valdi: ${option.text}`, 'info');
      setFateOptions([]);
      setGameState('IDLE');
      generateVoyageVideo(`${option.text} event at sea, icelandic style, dramatic lighting`);
      setTimeout(() => endTurn(isAuto), AI_ACTION_DELAY);
  };

  const endTurn = (isAuto: boolean) => {
      checkVictory();
      if (gameStateRef.current === 'GAME_OVER') return;

      let nextTurn = (turn + 1) % players.length;
      // Skip bankrupt players
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

  const generateDescription = async (space: BoardSpace) => {
      generatingDescriptions.current.add(space.id);
      try {
          const ai = getAi();
          const res = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: `Write a 1 sentence description of a ${space.type} named ${space.name} in Iceland.`
          }));
          setBoard(prev => prev.map(s => s.id === space.id ? { ...s, description: res.text, isGenerated: true } : s));
      } catch(e) {
          generatingDescriptions.current.delete(space.id);
      }
  };

  const generateSpaceImage = async (space: BoardSpace) => {
    if (space.isGeneratedImage || generatingDescriptions.current.has(space.id * 100)) return; 
    generatingDescriptions.current.add(space.id * 100);
    try {
        const ai = getAi();
        const prompt = `Cinematic photo of a ${space.type.toLowerCase()} named ${space.name} in Iceland. Dark moody atmosphere, northern lights, highly detailed, 8k.`;
        const res = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
             model: 'gemini-2.5-flash-image',
             contents: { parts: [{ text: prompt }] }
        }));
        const imgData = res.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (imgData) {
             const url = `data:image/png;base64,${imgData}`;
             setBoard(prev => prev.map(s => s.id === space.id ? { ...s, imageUrl: url, isGeneratedImage: true } : s));
             setBgImage(url);
        }
    } catch(e) { console.error("Space Image Gen failed", e); }
  };

  const generateVoyageVideo = async (prompt: string) => {
      if (isGeneratingVideo) return;
      setIsGeneratingVideo(true);
      try {
          const ai = getAi();
          const res = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
              model: 'gemini-2.5-flash-image', 
              contents: { parts: [{ text: prompt + ", cinematic, icelandic style, photorealistic, 8k" }] }
          }));
          const imgData = res.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (imgData) {
              const url = `data:image/png;base64,${imgData}`;
              const chapter: VoyageChapter = {
                  id: Date.now().toString(),
                  url: url,
                  description: prompt,
                  round: round,
                  turnName: playersRef.current[turnRef.current].name
              };
              setVoyagePlaylist(prev => [chapter, ...prev]); 
              setViewingChapter(0);
              setBgImage(url);
          }
      } catch (e) { console.error("Video gen failed", e); }
      finally { setIsGeneratingVideo(false); }
  };

  // --- Render ---

  if (view === 'LOBBY') {
      return (
          <Lobby 
              players={players} 
              setPlayers={setPlayers} 
              onStart={handleNewGame} 
              onResume={handleResume} 
              hasSave={hasSave}
              onClearSave={handleClearSave}
          />
      );
  }

  const viewingChapterData = voyagePlaylist[viewingChapter !== -1 ? viewingChapter : 0];
  const currentChapterIndex = viewingChapter === -1 ? 0 : viewingChapter;
  const totalChapters = voyagePlaylist.length;
  const DiceIcon = [null, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6][diceDisplay] || Dice5;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden relative selection:bg-cyan-500/30 flex flex-col">
        <div className="absolute inset-0 z-0 transition-all duration-1000 ease-in-out" style={{
            backgroundImage: bgImage ? `url(${bgImage})` : `linear-gradient(to bottom, #0f172a, #1e293b)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.6 
        }}>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/50 to-slate-950/30"></div>
        </div>

        {/* HUD */}
        <div className="relative z-10 flex-1 p-4 md:p-6 flex gap-4 md:gap-6 overflow-hidden">
            <div className="hidden md:flex w-1/4 flex-col gap-6">
                <div className="glass-panel rounded-2xl p-4 flex-1 overflow-y-auto">
                    <h2 className="flex items-center justify-between font-serif font-bold text-cyan-400 mb-4 sticky top-0 bg-slate-900/50 p-2 rounded backdrop-blur-md z-10">
                        <span className="flex items-center gap-2"><Trophy size={18}/> {t.players}</span>
                        <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400 flex items-center gap-1"><Clock size={10}/> {t.turn} {totalTurns}</span>
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

            {/* CENTER */}
            <div className={`flex-1 flex flex-col gap-4 ${isFullscreen ? 'fixed inset-0 z-50 p-0 gap-0 bg-black' : ''}`}>
                <div className={`${isFullscreen ? 'h-full w-full rounded-none' : 'flex-1 rounded-2xl'} glass-panel relative overflow-hidden group border border-white/10 shadow-2xl flex items-center justify-center bg-black/40 min-h-0 transition-all duration-500`}>
                    {winner ? (
                        <div className="text-center animate-bounce">
                            <Crown size={96} className="mx-auto text-yellow-400 mb-4"/>
                            <h1 className="text-6xl font-serif text-yellow-400 font-bold mb-4">{t.winner}</h1>
                            <div className="text-3xl text-white">{winner.name}</div>
                            <button onClick={handleNewGame} className="mt-8 px-8 py-3 bg-cyan-600 rounded-xl font-bold hover:bg-cyan-500">Play Again</button>
                        </div>
                    ) : viewingChapterData ? (
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
                        <div className="flex-1 rounded-xl relative overflow-hidden flex items-center justify-center p-2"><CentralHub weather={weather} mapUrl={icelandMapUrl} market={market} round={round}/></div>
                        <div className="flex flex-col w-1/5 gap-2">{board.slice(5, 8).map(s => <BoardCell key={s.id} space={s} players={players} />)}</div>
                    </div>
                    <div className="flex gap-2 h-1/5">{[...board.slice(8, 13)].reverse().map(s => <BoardCell key={s.id} space={s} players={players} />)}</div>
                </div>
            </div>

            {/* CONTROLLER */}
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
        {!isFullscreen && <NewsTicker market={market} />}
        <style>{`@keyframes width { 0% { width: 0%; } 100% { width: 100%; } } .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; } @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .animate-spin-slow { animation: spin-slow 20s linear infinite; }`}</style>
    </div>
  );
}

// --- Sub-Components ---

const NewsTicker = ({ market }: { market: MarketState }) => (
    <div className="h-8 bg-slate-900 border-t border-slate-700 flex items-center overflow-hidden relative z-50">
        <div className="whitespace-nowrap animate-[scroll_30s_linear_infinite] flex gap-8 text-xs font-mono">
            {[...Array(3)].map((_, i) => (
                <React.Fragment key={i}>
                    <span className="text-green-400 font-bold">VÍSITALA SJÁVARÚTVEGS ▲ 2.4%</span><span className="text-slate-400">|</span>
                    <span className={market.trend === 'BOOM' ? 'text-green-400' : 'text-red-400'}>FISKUR: {(market.fishPrice * 100).toFixed(0)}% ({market.trend})</span><span className="text-slate-400">|</span>
                    <span className="text-amber-400">AUG: {ADS[0]}</span><span className="text-slate-400">|</span>
                </React.Fragment>
            ))}
        </div>
        <style>{`@keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-33.33%); } }`}</style>
    </div>
);

const CentralHub = ({ weather, mapUrl, market, round }: { weather: WeatherType, mapUrl: string | null, market: MarketState, round: number }) => (
    <div className="relative w-full h-full rounded-full flex items-center justify-center group">
        <div className="absolute inset-0 rounded-full border-[12px] border-slate-800/80 z-10"></div>
        <div className="absolute inset-2 rounded-full border-2 border-dashed border-white/20 animate-spin-slow z-20"></div>
        <div className="absolute inset-4 rounded-full overflow-hidden bg-slate-900 border border-white/20 z-0">
             {mapUrl ? <img src={mapUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" /> : <div className="w-full h-full flex items-center justify-center text-xs text-slate-600">Loading Map...</div>}
        </div>
        <div className="relative z-30 flex flex-col items-center justify-center text-center bg-black/40 p-2 rounded-xl backdrop-blur-sm border border-white/10">
            <h3 className="font-serif font-bold text-xs sm:text-xl text-white drop-shadow-md">ÍSLAND</h3>
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
                <img src={space.imageUrl || PREMADE_IMAGES.START} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" onError={(e) => { (e.target as HTMLImageElement).src = PREMADE_IMAGES.START; }}/>
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
            const prompt = `Hyper-realistic close-up portrait of a gritty Icelandic sea captain named ${player.name}, sitting in a dark ${player.boatType} cabin. Weather-beaten face, intense eyes, traditional wool sweater (lopapeysa), rain droplets on face. Cinematic lighting, Rembrandt style, 8k resolution, highly detailed texture.`;
            const res = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [{ text: prompt }] } }));
            const imgData = res.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (imgData) setPlayers(prev => prev.map(p => p.id === player.id ? { ...p, portraitUrl: `data:image/png;base64,${imgData}` } : p));
        } catch (e) { console.error("Portrait gen failed", e); } 
        finally { setGeneratingIds(prev => prev.filter(id => id !== player.id)); }
    };

    const generateAllPortraits = async () => {
        const humanPlayers = players.filter(p => !p.isAi);
        for (const p of humanPlayers) { await generatePortrait(p); await new Promise(r => setTimeout(r, 500)); }
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
                <div className="flex justify-end mb-4"><button onClick={generateAllPortraits} disabled={generatingIds.length > 0} className="px-4 py-2 bg-cyan-900/30 hover:bg-cyan-900/50 text-cyan-300 text-xs rounded-lg border border-cyan-800 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><Sparkles size={14} /> Generate All Human Portraits</button></div>
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
                <div className="flex flex-col gap-3"><button onClick={onStart} className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl font-bold text-white text-xl tracking-[0.2em] shadow-lg shadow-cyan-900/50 transition-all flex items-center justify-center gap-2 group"><Ship size={24} className="group-hover:animate-bounce"/>{T.IS.new_game}</button>{hasSave && <div className="text-center text-xs text-slate-500">Starting a new game will overwrite existing save data.</div>}</div>
            </div>
        </div>
    );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);