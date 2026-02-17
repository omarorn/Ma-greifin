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
    Maximize2, Minimize2, Skull, Crown, Lock, Globe, Paintbrush, 
    Briefcase, Activity, Navigation, Compass, Wind, Thermometer,
    Hammer, Target
} from 'lucide-react';

// --- Constants & Types ---

const BOARD_SIZE = 16;
const START_CAPITAL = 5000; 
const SAVE_KEY = 'maigreifinn_saga_v2';
const BAIL_PRICE = 200;

const AI_THINK_TIME = 1500;
const AI_ACTION_DELAY = 1000;

// Game Phases
type GameView = 'CAREER_START' | 'MAKER' | 'BOARD' | 'VOYAGE' | 'SHIPYARD' | 'VICTORY';
type SpaceType = 'START' | 'FISHING_GROUND' | 'HARBOR' | 'MARKET' | 'STORM' | 'INSPECTION' | 'SHIPYARD' | 'OPEN_SEA';
type WeatherType = 'CALM' | 'ROUGH' | 'STORM' | 'HURRICANE';
type Rank = 'DECKHAND' | 'SKIPPER' | 'CAPTAIN' | 'MAGNATE';

interface BoatStats {
    id: string;
    name: string;
    type: 'DINGHY' | 'SMALL_BOAT' | 'TRAWLER' | 'FACTORY_SHIP';
    maxFuel: number;
    maxHold: number;
    resilience: number; // 0-1, chance to ignore storm damage
    speed: number; // Moves bonus? Or fishing speed
    price: number;
    imageUrl?: string;
}

const BOATS_CATALOG: BoatStats[] = [
    { id: 'b_dinghy', name: 'Leaky Dinghy', type: 'DINGHY', maxFuel: 40, maxHold: 100, resilience: 0.1, speed: 1, price: 500, imageUrl: "https://images.unsplash.com/photo-1544979590-2c00a307c433?w=400" },
    { id: 'b_small', name: 'Coastal Cutter', type: 'SMALL_BOAT', maxFuel: 80, maxHold: 300, resilience: 0.4, speed: 2, price: 2500, imageUrl: "https://images.unsplash.com/photo-1520633842340-0c0343a41e97?w=400" },
    { id: 'b_trawler', name: 'Iron Trawler', type: 'TRAWLER', maxFuel: 200, maxHold: 1000, resilience: 0.7, speed: 3, price: 10000, imageUrl: "https://images.unsplash.com/photo-1505072046830-4e14eb023761?w=400" },
    { id: 'b_factory', name: 'Ocean Titan', type: 'FACTORY_SHIP', maxFuel: 500, maxHold: 5000, resilience: 0.9, speed: 4, price: 50000, imageUrl: "https://images.unsplash.com/photo-1605218439401-d57b51b3a6cd?w=400" },
];

interface BoardSpace {
  id: number;
  name: string;
  type: SpaceType;
  price?: number;     
  rent?: number;      
  owner?: number | null; // Player Index
  imageUrl?: string;
  description?: string;
  isGenerated?: boolean;
}

interface Player {
  id: number;
  name: string;
  color: string;
  position: number;
  money: number; // Personal wealth / Salary
  rank: Rank;
  xp: number;
  isJailed: boolean; 
  isBankrupt: boolean;
  inventory: number[]; // Owned spaces
  isAi: boolean;
  currentBoatId: string;
  ownedBoats: string[]; // List of Boat IDs
  fuel: number;
  fishHold: number;
  portraitUrl?: string;
  companyId: string;
}

interface Company {
    id: string;
    name: string;
    balance: number; // Shared capital for boats/maintenance
    reputation: number;
}

interface VoyageState {
    active: boolean;
    spaceId: number;
    fishCaught: { cod: number, haddock: number, redfish: number };
    events: string[];
    turnCount: number;
    mission?: { targetFish: 'cod'|'haddock'|'redfish', targetAmount: number, reward: number };
}

interface MarketState {
  codPrice: number;
  haddockPrice: number;
  redfishPrice: number;
  trend: 'STABLE' | 'BOOM' | 'CRASH';
}

interface VoyageChapter {
  id: string;
  url: string;
  description: string;
  round: number;
  turnName: string;
  type: 'EVENT' | 'CATCH' | 'DISASTER';
}

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

const getBoat = (id: string) => BOATS_CATALOG.find(b => b.id === id) || BOATS_CATALOG[0];

const PREMADE_IMAGES = {
  START: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&h=400&fit=crop&q=80",
  FISHING_GROUND: "https://images.unsplash.com/photo-1544979590-2c00a307c433?w=400&h=400&fit=crop&q=80",
  HARBOR: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=400&fit=crop&q=80",
  STORM: "https://images.unsplash.com/photo-1454789476662-53eb23ba5907?w=400&h=400&fit=crop&q=80",
  MARKET: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=400&h=400&fit=crop&q=80",
  INSPECTION: "https://images.unsplash.com/photo-1503751071777-d2918b21bbd9?w=400&h=400&fit=crop&q=80",
  SHIPYARD: "https://images.unsplash.com/photo-1569263979104-865ab7dd8d3d?w=400&h=400&fit=crop&q=80"
};

// --- Main App Component ---

function App() {
  const [view, setView] = useState<GameView>('CAREER_START');
  const [players, setPlayers] = useState<Player[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [board, setBoard] = useState<BoardSpace[]>([]);
  const [turn, setTurn] = useState(0);
  const [round, setRound] = useState(1);
  const [market, setMarket] = useState<MarketState>({ codPrice: 1.5, haddockPrice: 1.2, redfishPrice: 2.0, trend: 'STABLE' });
  const [logs, setLogs] = useState<{id: number, text: string, type: string, timestamp: string}[]>([]);
  const [gameState, setGameState] = useState<'IDLE' | 'MOVING' | 'DECIDING' | 'GAME_OVER' | 'AI_THINKING'>('IDLE');
  
  // Voyage Mini-game State
  const [voyage, setVoyage] = useState<VoyageState>({ active: false, spaceId: -1, fishCaught: { cod:0, haddock:0, redfish:0 }, events: [], turnCount: 0 });
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [winner, setWinner] = useState<Player | null>(null);
  const [gameTheme, setGameTheme] = useState("Icelandic Fishing 1980s");
  
  const [isDiceRolling, setIsDiceRolling] = useState(false);
  const [diceDisplay, setDiceDisplay] = useState(5);
  const [weather, setWeather] = useState<WeatherType>('CALM');
  
  const [voyagePlaylist, setVoyagePlaylist] = useState<VoyageChapter[]>([]);
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [hasSave, setHasSave] = useState(false);

  // Refs
  const gameStateRef = useRef(gameState);
  const turnRef = useRef(turn);
  const playersRef = useRef(players);
  const companiesRef = useRef(companies);

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { turnRef.current = turn; }, [turn]);
  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { companiesRef.current = companies; }, [companies]);

  const currentPlayer = players[turn];
  const currentCompany = currentPlayer ? companies.find(c => c.id === currentPlayer.companyId) : undefined;

  // Initial Check for Save
  useEffect(() => {
    try { const saved = localStorage.getItem(SAVE_KEY); if (saved) setHasSave(true); } catch (e) {}
  }, []);

  // Autosave
  useEffect(() => {
      if (view === 'BOARD' && gameState !== 'GAME_OVER') {
          const timer = setTimeout(() => {
              try {
                  const optimizedBoard = board.map(b => ({ ...b, imageUrl: b.imageUrl?.startsWith('data:') ? undefined : b.imageUrl }));
                  const optimizedPlayers = players.map(p => ({ ...p, portraitUrl: p.portraitUrl?.startsWith('data:') ? undefined : p.portraitUrl }));
                  const state = {
                      players: optimizedPlayers, companies, board: optimizedBoard, turn, round, 
                      market, logs: logs.slice(0, 30), weather, gameTheme 
                  };
                  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
              } catch (e) { console.error("Autosave failed", e); }
          }, 3000);
          return () => clearTimeout(timer);
      }
  }, [players, companies, board, turn, round, market, logs, view, weather, gameState]);

  const addLog = (text: string, type: 'info'|'alert'|'success'|'loot' = 'info') => {
    const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    setLogs(prev => [{ id: Date.now(), text, type, timestamp: time }, ...prev].slice(50));
  };

  const handleResume = () => {
    try {
        const saved = localStorage.getItem(SAVE_KEY);
        if (saved) {
            const data = JSON.parse(saved);
            if (data.players) setPlayers(data.players);
            if (data.companies) setCompanies(data.companies);
            if (data.board) setBoard(data.board);
            if (data.turn !== undefined) setTurn(data.turn);
            if (data.round !== undefined) setRound(data.round);
            if (data.market) setMarket(data.market);
            if (data.logs) setLogs(data.logs);
            if (data.gameTheme) setGameTheme(data.gameTheme);
            setView('BOARD');
        }
    } catch(e) { addLog("Failed to load save file.", 'alert'); }
  };

  const handleClearSave = () => { localStorage.removeItem(SAVE_KEY); setHasSave(false); };

  // --- Logic: Movement & Board ---

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

  const handleRoll = useCallback(async (isAuto = false) => {
    if (gameStateRef.current !== 'IDLE') return;
    setGameState(isAuto ? 'AI_THINKING' : 'MOVING');
    await new Promise(r => setTimeout(r, 400));

    const roll = Math.floor(Math.random() * 6) + 1;
    const currentP = playersRef.current[turnRef.current];
    const boat = getBoat(currentP.currentBoatId);

    if (currentP.isJailed) {
        if (roll === 6) {
            addLog(`${currentP.name} bribed the inspector with a 6!`, 'success');
            setPlayers(prev => prev.map(p => p.id === currentP.id ? { ...p, isJailed: false } : p));
        } else {
            addLog(`${currentP.name} failed inspection. Stays in dock.`, 'alert');
            setTimeout(() => endTurn(isAuto), AI_ACTION_DELAY);
            return;
        }
    }
    
    setPlayers(prevPlayers => {
        const p = prevPlayers[turnRef.current];
        // Boat Speed Bonus logic could go here, for now simpler
        let newPos = (p.position + roll) % BOARD_SIZE;
        let fuel = Math.max(0, p.fuel - 5); 
        
        if (newPos < p.position) {
           // Salary / Company Dividends
           const salary = p.rank === 'DECKHAND' ? 200 : p.rank === 'SKIPPER' ? 500 : 1000;
           addLog(`${p.name} passes HQ. +${salary}kr salary.`, 'success');
           
           setRound(r => r + 1);
           const weathers: WeatherType[] = ['CALM', 'ROUGH', 'STORM', 'HURRICANE'];
           setWeather(weathers[Math.floor(Math.random() * weathers.length)]);
           // Market Fluctuation
           setMarket(prev => ({
             codPrice: Math.max(0.5, prev.codPrice + (Math.random() - 0.5)),
             haddockPrice: Math.max(0.5, prev.haddockPrice + (Math.random() - 0.5)),
             redfishPrice: Math.max(0.5, prev.redfishPrice + (Math.random() - 0.5)),
             trend: Math.random() > 0.5 ? 'BOOM' : 'STABLE'
           }));
           // Update money
           return prevPlayers.map(pl => pl.id === p.id ? { ...pl, money: pl.money + salary } : pl);
        }
        
        if (fuel <= 0 && p.rank !== 'DECKHAND') {
            addLog("OUT OF FUEL! Towed to Harbor (-200kr)", 'alert');
            newPos = 8; // Free Parking / Harbor
            // Pay from company if possible
            updateCompanyBalance(p.companyId, -200);
            fuel = boat.maxFuel;
        }

        const updated = [...prevPlayers];
        updated[turnRef.current] = { ...p, position: newPos, fuel, isJailed: false };
        return updated;
    });

    const calculatedPos = (currentP.position + roll) % BOARD_SIZE;
    setTimeout(() => handleLand(board[calculatedPos], isAuto), 300);
  }, [board, players]);

  const handleLand = (space: BoardSpace, isAuto: boolean) => {
      setGameState('DECIDING');
      const player = playersRef.current[turnRef.current];
      
      if (!space.description) {
         const ai = getAi();
         ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: `One sentence gritty description of ${space.name} (${space.type}) in ${gameTheme}.`})
         .then(res => setBoard(prev => prev.map(s => s.id === space.id ? { ...s, description: res.text } : s)));
      }

      if (space.type === 'FISHING_GROUND') {
          if (isAuto && player.isAi) {
             if (space.owner === null && updateCompanyBalance(player.companyId, -(space.price || 0), true)) buyProperty(true);
             else if (space.owner !== player.id) {
                 // Try to fish if possible? AI simplified
                 endTurn(true);
             }
          }
      } else if (space.type === 'HARBOR' || space.type === 'MARKET') {
          if (player.fishHold > 0) {
              const value = Math.floor(player.fishHold * market.codPrice); 
              addLog(`Sold ${player.fishHold}kg of fish for ${value}kr!`, 'success');
              
              // Revenue split based on Rank
              let companyCut = 0;
              let playerCut = 0;
              if (player.rank === 'DECKHAND') { companyCut = value * 0.9; playerCut = value * 0.1; }
              else if (player.rank === 'SKIPPER') { companyCut = value * 0.5; playerCut = value * 0.5; }
              else { companyCut = value; playerCut = 0; } // As owner/magnate, it goes to company, player takes salary

              updateCompanyBalance(player.companyId, companyCut);
              setPlayers(prev => prev.map(p => p.id === player.id ? { ...p, money: p.money + playerCut, fishHold: 0, fuel: getBoat(p.currentBoatId).maxFuel, xp: p.xp + 50 } : p));
              checkRankUp(player.id);
              generateVoyageImage(`Selling catch at ${space.name} market`, 'CATCH');
          } else {
              setPlayers(prev => prev.map(p => p.id === player.id ? { ...p, fuel: getBoat(p.currentBoatId).maxFuel } : p));
              addLog("Refueled at Harbor.", 'info');
          }
          if (isAuto) setTimeout(() => endTurn(true), AI_ACTION_DELAY);
          else setGameState('IDLE');
      } else if (space.type === 'SHIPYARD') {
          // AI Logic could buy boat here
          if (isAuto) setTimeout(() => endTurn(true), AI_ACTION_DELAY);
          else setGameState('IDLE'); // Player can click button
      } else if (space.type === 'INSPECTION') {
          setPlayers(prev => prev.map(p => p.id === player.id ? { ...p, isJailed: true, position: 13 } : p));
          addLog("Caught by Coast Guard! Sent to Inspection.", 'alert');
          setTimeout(() => endTurn(isAuto), AI_ACTION_DELAY);
      } else {
          setTimeout(() => endTurn(isAuto), AI_ACTION_DELAY);
      }
  };

  const updateCompanyBalance = (companyId: string, amount: number, checkOnly = false): boolean => {
      const comp = companiesRef.current.find(c => c.id === companyId);
      if (!comp) return false;
      if (comp.balance + amount < 0) return false;
      
      if (!checkOnly) {
          setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, balance: c.balance + amount } : c));
      }
      return true;
  };

  const checkRankUp = (playerId: number) => {
      setPlayers(prev => prev.map(p => {
          if (p.id !== playerId) return p;
          if (p.rank === 'DECKHAND' && p.xp > 500) { addLog(`${p.name} promoted to SKIPPER!`, 'success'); return { ...p, rank: 'SKIPPER' }; }
          if (p.rank === 'SKIPPER' && p.xp > 2000) { addLog(`${p.name} promoted to CAPTAIN!`, 'success'); return { ...p, rank: 'CAPTAIN' }; }
          if (p.rank === 'CAPTAIN' && p.xp > 10000) { addLog(`${p.name} is now a MAGNATE!`, 'success'); return { ...p, rank: 'MAGNATE' }; }
          return p;
      }));
  };

  const startVoyage = () => {
      const space = board[currentPlayer.position];
      const boat = getBoat(currentPlayer.currentBoatId);
      
      // Generate Mission
      const fishTypes: ('cod'|'haddock'|'redfish')[] = ['cod', 'haddock', 'redfish'];
      const targetFish = fishTypes[Math.floor(Math.random() * fishTypes.length)];
      const targetAmount = Math.floor(Math.random() * (boat.maxHold / 2)) + 50;
      const reward = Math.floor(targetAmount * 3);

      setVoyage({
          active: true,
          spaceId: space.id,
          fishCaught: { cod: 0, haddock: 0, redfish: 0 },
          events: [`Arrived at ${space.name}. Seas are ${weather}.`, `Mission: Catch ${targetAmount}kg ${targetFish}.`],
          turnCount: 0,
          mission: { targetFish, targetAmount, reward }
      });
      setView('VOYAGE');
  };

  const buyProperty = (isAuto: boolean) => {
      const curP = playersRef.current[turnRef.current];
      const space = board[curP.position];
      if (space.price && updateCompanyBalance(curP.companyId, -space.price)) {
          // Ownership goes to player but paid by company (Co-op logic simplified)
          setPlayers(prev => prev.map(p => p.id === curP.id ? { ...p, inventory: [...p.inventory, space.id] } : p));
          setBoard(prev => prev.map(s => s.id === space.id ? { ...s, owner: turnRef.current } : s));
          addLog(`${curP.name} bought quota for ${space.name}!`, 'success');
          setTimeout(() => endTurn(isAuto), AI_ACTION_DELAY);
      } else {
          addLog("Company funds insufficient.", 'alert');
      }
  };

  const purchaseBoat = (boatId: string) => {
      const boat = getBoat(boatId);
      const curP = playersRef.current[turnRef.current];
      if (updateCompanyBalance(curP.companyId, -boat.price)) {
          setPlayers(prev => prev.map(p => p.id === curP.id ? { 
              ...p, 
              ownedBoats: [...p.ownedBoats, boat.id],
              currentBoatId: boat.id, // Switch immediately
              fuel: boat.maxFuel,
              rank: p.rank === 'DECKHAND' ? 'SKIPPER' : p.rank // Auto promotion if buying boat
          } : p));
          addLog(`Purchased ${boat.name}!`, 'success');
          setView('BOARD');
      } else {
          addLog("Insufficient Company Funds", 'alert');
      }
  };

  const endTurn = (isAuto: boolean) => {
      let nextTurn = (turn + 1) % players.length;
      setGameState('IDLE');
      setTurn(nextTurn);
  };

  // --- Voyage Mini-Game Logic ---

  const handleVoyageAction = async (action: 'FISH' | 'WAIT' | 'RETURN') => {
      if (action === 'RETURN') {
          setView('BOARD');
          addLog(`${currentPlayer.name} returned with ${voyage.fishCaught.cod + voyage.fishCaught.haddock}kg fish.`, 'success');
          setPlayers(prev => prev.map(p => p.id === currentPlayer.id ? { ...p, fishHold: p.fishHold + voyage.fishCaught.cod + voyage.fishCaught.haddock + voyage.fishCaught.redfish } : p));
          endTurn(false);
          return;
      }

      // Fishing Logic
      let eventText = "";
      let catchAmount = 0;
      let fishType: 'cod'|'haddock'|'redfish' = 'cod';
      const boat = getBoat(currentPlayer.currentBoatId);
      
      // RNG based on weather and rank and boat
      const luck = Math.random();
      const rankBonus = currentPlayer.rank === 'CAPTAIN' ? 1.5 : 1.0;
      const boatBonus = boat.type === 'FACTORY_SHIP' ? 2.0 : 1.0;
      
      if (action === 'FISH') {
          if (luck > (weather === 'STORM' ? 0.6 : 0.3)) {
             catchAmount = Math.floor(Math.random() * 80 * rankBonus * boatBonus);
             const r = Math.random();
             fishType = r > 0.6 ? 'cod' : r > 0.3 ? 'haddock' : 'redfish';
             eventText = `Hauled ${catchAmount}kg of ${fishType}!`;
          } else {
             eventText = "Nets came up empty.";
          }
      }

      // Mission Check
      if (voyage.mission && fishType === voyage.mission.targetFish) {
          // Bonus logic could go here
      }

      // Visuals
      if (catchAmount > 50) generateVoyageImage(`Fishing boat deck overflowing with ${fishType}, huge catch, stormy north atlantic ocean`, 'CATCH');

      setVoyage(prev => ({
          ...prev,
          fishCaught: { ...prev.fishCaught, [fishType]: (prev.fishCaught as any)[fishType] + catchAmount },
          events: [eventText, ...prev.events],
          turnCount: prev.turnCount + 1
      }));
  };

  // --- Generation ---

  const generateVoyageImage = async (prompt: string, type: VoyageChapter['type']) => {
      if (isGeneratingVideo) return;
      setIsGeneratingVideo(true);
      try {
          const ai = getAi();
          const res = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
              model: 'gemini-2.5-flash-image', 
              contents: { parts: [{ text: prompt + ", cinematic, masterpiece, 8k, moody lighting, icelandic seascape" }] }
          }));
          const imgData = res.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (imgData) {
              const url = `data:image/png;base64,${imgData}`;
              const chapter: VoyageChapter = {
                  id: Date.now().toString(), url, description: prompt, round, turnName: currentPlayer.name, type
              };
              setVoyagePlaylist(prev => [chapter, ...prev]); 
              setBgImage(url);
          }
      } catch (e) { console.error("Img gen failed", e); }
      finally { setIsGeneratingVideo(false); }
  };

  const generateWorld = async (theme: string) => {
        const ai = getAi();
        const prompt = `Generate 16 unique names for a Monopoly board based on '${theme}'.
        Indices: 0=START, 4=SHIPYARD, 8=HARBOR, 12=SHIPYARD. 
        Others should be Fishing Grounds (e.g. Grand Bank) or Markets.
        Return JSON array of objects: { name, type, price }.`;
        
        try {
            const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
            const jsonStr = res.text?.replace(/```json/g, '').replace(/```/g, '').trim();
            const data = JSON.parse(jsonStr || "[]");
            
            const newBoard: BoardSpace[] = data.map((d:any, i:number) => ({
                id: i,
                name: d.name,
                type: [0].includes(i) ? 'START' : [4, 12].includes(i) ? 'SHIPYARD' : [8].includes(i) ? 'HARBOR' : d.type === 'MARKET' ? 'MARKET' : 'FISHING_GROUND',
                price: d.price || (i * 100),
                rent: (d.price || 100) * 0.1,
                imageUrl: [4, 12].includes(i) ? PREMADE_IMAGES.SHIPYARD : PREMADE_IMAGES.FISHING_GROUND 
            }));
            setBoard(newBoard);
            setView('BOARD');
            addLog("The Sea Awaits!", 'success');
        } catch(e) {
            console.error("World gen failed", e);
            setBoard(PREMADE_BOARD);
            setView('BOARD');
        }
  };

  // --- Render ---

  if (view === 'CAREER_START') {
      return <CareerSetup onComplete={(p, c, theme) => { setPlayers(p); setCompanies(c); setGameTheme(theme); setView('MAKER'); }} onResume={hasSave ? handleResume : undefined} />;
  }
  
  if (view === 'MAKER') {
      return (
          <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-center">
              <Loader2 size={64} className="text-cyan-400 animate-spin mb-8"/>
              <h1 className="text-3xl font-serif text-white">Charting the Waters...</h1>
              <p className="text-slate-400 mt-2">Generating {gameTheme}</p>
              <button onClick={() => generateWorld(gameTheme)} className="mt-8 px-8 py-3 bg-cyan-600 rounded-lg font-bold text-white hover:bg-cyan-500">Launch Expedition</button>
          </div>
      );
  }

  if (view === 'VOYAGE') {
      return <VoyageView voyage={voyage} player={currentPlayer} boat={getBoat(currentPlayer.currentBoatId)} onAction={handleVoyageAction} />;
  }

  if (view === 'SHIPYARD') {
      return (
          <div className="min-h-screen bg-slate-950 p-8 flex flex-col items-center justify-center">
              <h1 className="text-4xl font-serif text-white mb-8">SHIPYARD</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl w-full">
                  {BOATS_CATALOG.map(b => (
                      <div key={b.id} className="glass-panel p-4 rounded-xl flex flex-col">
                          <img src={b.imageUrl} className="w-full h-32 object-cover rounded-lg mb-4"/>
                          <h3 className="font-bold text-lg text-cyan-400">{b.name}</h3>
                          <div className="text-xs text-slate-400 mb-4 font-mono">
                              <div>Fuel: {b.maxFuel}L</div>
                              <div>Hold: {b.maxHold}kg</div>
                              <div>Speed: {b.speed}kt</div>
                          </div>
                          <div className="mt-auto">
                              <div className="text-xl font-bold text-amber-400 mb-2">{b.price}kr</div>
                              <button onClick={() => purchaseBoat(b.id)} disabled={currentCompany!.balance < b.price} className="w-full py-2 bg-green-700 disabled:bg-slate-700 rounded font-bold">PURCHASE</button>
                          </div>
                      </div>
                  ))}
              </div>
              <button onClick={() => setView('BOARD')} className="mt-8 px-8 py-3 bg-slate-700 rounded-lg text-white">Back to Port</button>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden relative flex flex-col">
        {/* Cinematic Background */}
        <div className="absolute inset-0 z-0 transition-opacity duration-1000" style={{
            backgroundImage: bgImage ? `url(${bgImage})` : `url(${PREMADE_IMAGES.START})`,
            backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.4
        }}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-slate-950/40 z-0"></div>

        {/* Top Bar */}
        <div className="relative z-10 h-14 border-b border-white/10 flex items-center justify-between px-4 bg-slate-900/50 backdrop-blur-md">
            <div className="flex items-center gap-4">
                <h1 className="font-serif font-bold text-xl text-cyan-400 tracking-widest hidden md:block">MAÍGREIFINN</h1>
                <div className="flex gap-4 text-xs font-mono text-slate-400">
                    <span className="flex items-center gap-1"><Sun size={12}/> {weather}</span>
                    <span className="flex items-center gap-1"><Clock size={12}/> T{turn}</span>
                    <span className="flex items-center gap-1 text-amber-400 font-bold"><Briefcase size={12}/> {currentCompany?.name}: {currentCompany?.balance}kr</span>
                </div>
            </div>
            <div className="flex gap-4 text-xs font-bold">
                 <div className="flex items-center gap-1 text-green-400"><TrendingUp size={12}/> COD: {market.codPrice.toFixed(2)}</div>
                 <button onClick={handleClearSave} className="text-red-400 flex items-center gap-1 hover:text-red-300"><Trash2 size={12}/> Reset</button>
            </div>
        </div>

        {/* Main Game Area */}
        <div className="relative z-10 flex-1 p-2 md:p-6 flex gap-4 overflow-hidden">
            
            {/* Left: Players */}
            <div className="hidden md:flex w-1/4 flex-col gap-4">
                <div className="glass-panel rounded-xl p-4 flex-1 overflow-y-auto space-y-3">
                    <h3 className="font-serif text-slate-400 text-xs border-b border-white/10 pb-2 mb-2">CREW ROSTER</h3>
                    {players.map((p, idx) => (
                        <div key={p.id} className={`p-3 rounded-lg border ${turn === idx ? 'bg-white/10 border-cyan-500' : 'bg-transparent border-white/5'} transition-all`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full ${p.color} flex items-center justify-center font-serif font-bold text-white shadow`}>
                                    {p.name.substring(0,1)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-sm truncate">{p.name}</span>
                                        {p.isJailed && <Lock size={12} className="text-red-400"/>}
                                    </div>
                                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                                        <span className="text-green-300">Pers: {p.money}kr</span>
                                        <span className="text-blue-300">{p.fuel}% Fuel</span>
                                    </div>
                                    <div className="w-full bg-slate-800 h-1 mt-2 rounded-full overflow-hidden">
                                        <div className="h-full bg-cyan-500" style={{width: `${(p.xp % 1000) / 10}%`}}></div>
                                    </div>
                                    <div className="text-[9px] text-right text-cyan-600 mt-0.5">{p.rank}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="glass-panel rounded-xl p-4 h-1/3 flex flex-col">
                    <h3 className="font-serif text-slate-400 text-xs mb-2">LOGBOOK</h3>
                    <div className="flex-1 overflow-y-auto text-[10px] font-mono space-y-1.5 text-slate-300">
                        {logs.map(l => (
                            <div key={l.id} className={`${l.type === 'alert' ? 'text-red-300' : l.type === 'success' ? 'text-green-300' : ''}`}>
                                <span className="opacity-50 mr-2">[{l.timestamp}]</span>{l.text}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Center: Board */}
            <div className="flex-1 glass-panel rounded-xl relative p-4 flex flex-col justify-between overflow-hidden">
                {/* Top Row */}
                <div className="flex gap-2 h-1/5">
                    {board.slice(0, 5).map(s => <BoardSpaceCell key={s.id} space={s} players={players} />)}
                </div>
                {/* Middle */}
                <div className="flex flex-1 gap-2 my-2">
                    <div className="flex flex-col w-1/5 gap-2">{[...board.slice(13, 16)].reverse().map(s => <BoardSpaceCell key={s.id} space={s} players={players} />)}</div>
                    <div className="flex-1 relative bg-slate-900/50 rounded-lg flex flex-col items-center justify-center">
                        <div className="absolute inset-0 opacity-20 bg-[url('https://upload.wikimedia.org/wikipedia/commons/c/c9/Iceland_relief_map.jpg')] bg-cover bg-center mix-blend-overlay"></div>
                        <div className="z-10 text-center">
                             <h2 className="text-2xl font-serif text-white/80">{gameTheme}</h2>
                             {voyagePlaylist.length > 0 && <div className="mt-4 w-48 h-28 mx-auto bg-black rounded-lg border border-white/20 overflow-hidden relative group cursor-pointer hover:scale-105 transition-transform">
                                 <img src={voyagePlaylist[0].url} className="w-full h-full object-cover"/>
                             </div>}
                        </div>
                    </div>
                    <div className="flex flex-col w-1/5 gap-2">{board.slice(5, 8).map(s => <BoardSpaceCell key={s.id} space={s} players={players} />)}</div>
                </div>
                {/* Bottom Row */}
                <div className="flex gap-2 h-1/5">
                    {[...board.slice(8, 13)].reverse().map(s => <BoardSpaceCell key={s.id} space={s} players={players} />)}
                </div>
            </div>

            {/* Right: Controls */}
            <div className="w-1/4 max-w-sm flex flex-col">
                <div className="glass-panel rounded-xl p-6 flex flex-col h-full bg-slate-900/80">
                    <div className="flex-1 text-center flex flex-col items-center justify-center">
                         <div className={`w-24 h-24 rounded-full border-4 border-slate-700 shadow-xl mb-4 overflow-hidden bg-slate-800`}>
                             {currentPlayer.portraitUrl ? <img src={currentPlayer.portraitUrl} className="w-full h-full object-cover"/> : <User size={48} className="m-auto mt-6 text-slate-600"/>}
                         </div>
                         <h2 className="text-xl font-bold text-white mb-1">{currentPlayer.name}</h2>
                         <div className="text-cyan-400 text-xs tracking-widest mb-2">{currentPlayer.rank}</div>
                         <div className="bg-slate-800 px-3 py-1 rounded text-xs text-slate-400 mb-6">Boat: {getBoat(currentPlayer.currentBoatId).name}</div>

                         {gameState === 'IDLE' ? (
                             <div className="w-full space-y-3">
                                 {board[currentPlayer.position].type === 'FISHING_GROUND' && (
                                     <>
                                        {/* If not owned, or owned by us, we can fish. If owned by other, poaching (not imp yet) */}
                                        <button onClick={startVoyage} className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold flex items-center justify-center gap-2"><Anchor size={16}/> START VOYAGE</button>
                                        {!board[currentPlayer.position].owner && (
                                            <button onClick={() => buyProperty(false)} disabled={currentCompany!.balance < (board[currentPlayer.position].price || 0)} className="w-full py-3 bg-green-700 hover:bg-green-600 rounded-lg font-bold disabled:opacity-50">BUY QUOTA ({board[currentPlayer.position].price}kr)</button>
                                        )}
                                        <button onClick={() => endTurn(false)} className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-slate-400">PASS</button>
                                     </>
                                 )}
                                 {board[currentPlayer.position].type === 'SHIPYARD' && (
                                     <>
                                        <button onClick={() => setView('SHIPYARD')} className="w-full py-4 bg-amber-600 hover:bg-amber-500 rounded-lg font-bold text-lg flex items-center justify-center gap-2">
                                             <Hammer size={20}/> OPEN SHIPYARD
                                        </button>
                                        <button onClick={() => endTurn(false)} className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-slate-400">PASS</button>
                                     </>
                                 )}
                                 {board[currentPlayer.position].type !== 'FISHING_GROUND' && board[currentPlayer.position].type !== 'SHIPYARD' && (
                                     <button onClick={triggerDiceRoll} disabled={isDiceRolling} className="w-full py-4 bg-amber-600 hover:bg-amber-500 rounded-lg font-bold text-lg shadow-lg shadow-amber-900/50 flex items-center justify-center gap-2 group">
                                         <Dice5 className={isDiceRolling ? "animate-spin" : "group-hover:rotate-12"}/> {isDiceRolling ? 'ROLLING...' : 'ROLL'}
                                     </button>
                                 )}
                             </div>
                         ) : (
                             <div className="text-slate-500 animate-pulse text-sm">Waiting for action...</div>
                         )}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}

// --- Sub-Components ---

const CareerSetup = ({ onComplete, onResume }: { onComplete: (players: Player[], companies: Company[], theme: string) => void, onResume?: () => void }) => {
    const [companyName, setCompanyName] = useState("");
    const [theme, setTheme] = useState("Icelandic Fishing 1980s");
    const [captainName, setCaptainName] = useState("Captain Jón");
    const [mateName, setMateName] = useState("Mate Siggi");
    const [isCoop, setIsCoop] = useState(true); // Default to Co-op

    const handleStart = () => {
        const compId = 'comp_' + Date.now();
        const company: Company = { id: compId, name: companyName || "North Sea Inc", balance: START_CAPITAL, reputation: 0 };
        
        const newPlayers: Player[] = [];
        
        // Captain
        newPlayers.push({
            id: 0, name: captainName, color: "bg-amber-500", position: 0, money: 500, fuel: 40, fishHold: 0, 
            rank: 'DECKHAND', xp: 0, isJailed: false, isBankrupt: false, inventory: [], isAi: false, 
            currentBoatId: 'b_dinghy', ownedBoats: ['b_dinghy'], companyId: compId
        });

        // Mate (Human Co-op)
        if (isCoop) {
            newPlayers.push({
                id: 1, name: mateName, color: "bg-cyan-500", position: 0, money: 500, fuel: 40, fishHold: 0, 
                rank: 'DECKHAND', xp: 0, isJailed: false, isBankrupt: false, inventory: [], isAi: false, 
                currentBoatId: 'b_dinghy', ownedBoats: ['b_dinghy'], companyId: compId
            });
        }

        onComplete(newPlayers, [company], theme);
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 bg-[url('https://images.unsplash.com/photo-1516216628259-22b93466152a?w=1600')] bg-cover bg-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
            <div className="relative z-10 glass-panel p-8 rounded-2xl max-w-lg w-full border border-white/10 shadow-2xl">
                <div className="text-center mb-8">
                    <Ship size={48} className="mx-auto text-cyan-400 mb-2"/>
                    <h1 className="text-3xl font-serif font-bold text-white">MAÍGREIFINN</h1>
                    <p className="text-cyan-200/60 text-sm tracking-widest uppercase">Nordic Sea Saga</p>
                </div>
                
                {onResume && (
                    <div className="mb-6">
                        <button onClick={onResume} className="w-full py-3 bg-amber-600/20 border border-amber-500/50 text-amber-300 rounded-lg hover:bg-amber-600/30 flex items-center justify-center gap-2">
                            <Save size={16}/> RESUME CAREER
                        </button>
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-slate-400 font-bold ml-1">COMPANY NAME</label>
                        <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. Arctic Catch Ltd." className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-3 text-white focus:border-cyan-500 outline-none"/>
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 font-bold ml-1">ERA / THEME</label>
                        <select value={theme} onChange={e => setTheme(e.target.value)} className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-3 text-white outline-none">
                            <option value="Icelandic Fishing 1980s">Icelandic Fishing 1980s (The Quota Era)</option>
                            <option value="Viking Age Navigation">Viking Age Navigation</option>
                            <option value="Cyberpunk Ocean 2099">Cyberpunk Ocean 2099</option>
                        </select>
                    </div>
                    
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-white/5">
                        <div className="flex items-center justify-between mb-2">
                             <label className="text-xs text-slate-400 font-bold">MODE</label>
                             <button onClick={() => setIsCoop(!isCoop)} className="text-xs text-cyan-400 hover:text-cyan-300">{isCoop ? "CO-OP (2 Players)" : "SOLO CAREER"}</button>
                        </div>
                        <input value={captainName} onChange={e => setCaptainName(e.target.value)} className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-2 text-white text-sm outline-none mb-2" placeholder="Captain Name"/>
                        {isCoop && <input value={mateName} onChange={e => setMateName(e.target.value)} className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-2 text-white text-sm outline-none" placeholder="First Mate Name"/>}
                    </div>
                </div>

                <button onClick={handleStart} className="w-full mt-8 py-4 bg-gradient-to-r from-cyan-700 to-blue-700 hover:from-cyan-600 hover:to-blue-600 rounded-xl font-bold text-white text-lg tracking-widest shadow-lg shadow-cyan-900/50 transition-all flex items-center justify-center gap-2">
                    <Anchor size={20}/> LAUNCH CAREER
                </button>
            </div>
        </div>
    );
};

const VoyageView = ({ voyage, player, boat, onAction }: { voyage: VoyageState, player: Player, boat: BoatStats, onAction: (a: 'FISH' | 'WAIT' | 'RETURN') => void }) => {
    return (
        <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
             {/* Viewport */}
             <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                 <div className="text-slate-600 animate-pulse font-mono tracking-widest">SONAR: ACTIVE</div>
             </div>
             
             {/* HUD Overlay */}
             <div className="absolute inset-0 z-10 flex flex-col justify-between p-6 bg-gradient-to-t from-black via-transparent to-black/50">
                 <div className="flex justify-between items-start">
                     <div>
                         <h2 className="text-4xl font-serif text-white drop-shadow-md">AT SEA</h2>
                         <div className="text-sm text-cyan-400 font-bold tracking-widest uppercase mb-4">{boat.name} ({boat.type})</div>
                         
                         {voyage.mission && (
                             <div className="bg-amber-900/40 border border-amber-500/40 p-3 rounded-lg backdrop-blur-sm max-w-xs">
                                 <div className="flex items-center gap-2 text-amber-300 font-bold text-xs mb-1"><Target size={14}/> CURRENT MISSION</div>
                                 <div className="text-white text-sm">Catch {voyage.mission.targetAmount}kg of {voyage.mission.targetFish.toUpperCase()}</div>
                                 <div className="text-amber-200/60 text-xs mt-1">Reward: {voyage.mission.reward}kr</div>
                             </div>
                         )}
                     </div>
                     <div className="bg-black/50 p-4 rounded-xl border border-white/10 text-right min-w-[150px]">
                         <div className="text-xs text-slate-400">CURRENT HAUL</div>
                         <div className="text-3xl font-bold text-green-400 font-mono">{(voyage.fishCaught.cod + voyage.fishCaught.haddock + voyage.fishCaught.redfish).toFixed(0)}<span className="text-sm text-green-600">kg</span></div>
                         <div className="w-full bg-slate-800 h-2 mt-2 rounded-full overflow-hidden">
                             <div className="h-full bg-green-500" style={{width: `${((voyage.fishCaught.cod + voyage.fishCaught.haddock + voyage.fishCaught.redfish)/boat.maxHold)*100}%`}}></div>
                         </div>
                         <div className="text-xs text-slate-500 mt-1">Hold: {boat.maxHold}kg</div>
                     </div>
                 </div>

                 <div className="flex gap-4 items-end">
                     <div className="flex-1 bg-black/60 backdrop-blur-md rounded-xl p-4 border border-white/10 h-40 overflow-y-auto font-mono text-xs space-y-2">
                         {voyage.events.map((e, i) => <div key={i} className="text-green-300/80 border-l-2 border-green-500/30 pl-2">{e}</div>)}
                     </div>
                     <div className="flex flex-col gap-2 w-48">
                         <button onClick={() => onAction('FISH')} className="py-4 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded-lg border border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:scale-105 transition-transform flex items-center justify-center gap-2"><Fish size={20}/> CAST NETS</button>
                         <button onClick={() => onAction('RETURN')} className="py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg border border-white/10 flex items-center justify-center gap-2"><Anchor size={16}/> RETURN PORT</button>
                     </div>
                 </div>
             </div>
        </div>
    );
};

const BoardSpaceCell = ({ space, players }: { space: BoardSpace, players: Player[] }) => {
    const playersHere = players.filter(p => p.position === space.id);
    const colorClass = 
        space.type === 'FISHING_GROUND' ? 'bg-blue-900/30 border-blue-500/30' : 
        space.type === 'HARBOR' ? 'bg-amber-900/30 border-amber-500/30' :
        space.type === 'START' ? 'bg-green-900/30 border-green-500/30' :
        space.type === 'SHIPYARD' ? 'bg-purple-900/30 border-purple-500/30' :
        'bg-slate-800/30 border-slate-600/30';

    return (
        <div className={`relative flex-1 rounded-md border ${colorClass} overflow-hidden group hover:border-white/50 transition-colors`}>
            {space.imageUrl && <img src={space.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity grayscale hover:grayscale-0"/>}
            <div className="relative z-10 p-1 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start">
                     <span className="text-[8px] font-bold bg-black/60 px-1 rounded text-white backdrop-blur-sm truncate max-w-full">{space.name}</span>
                     {space.owner !== undefined && space.owner !== null && <div className={`w-2 h-2 rounded-full ${players[space.owner].color} shadow-[0_0_5px_currentColor]`}></div>}
                </div>
                
                {space.type === 'SHIPYARD' && <div className="absolute inset-0 flex items-center justify-center opacity-30"><Hammer size={24}/></div>}
                
                <div className="flex justify-center -space-x-1">
                    {playersHere.map(p => (
                        <div key={p.id} className={`w-6 h-6 rounded-full ${p.color} border border-white flex items-center justify-center text-[8px] font-bold relative z-20`}>
                            {p.name.substring(0,1)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Fallback Board
const PREMADE_BOARD: BoardSpace[] = [
  { id: 0, name: "Reykjavík HQ", type: 'START', imageUrl: PREMADE_IMAGES.START },
  { id: 1, name: "Faxaflói", type: 'FISHING_GROUND', price: 100, imageUrl: PREMADE_IMAGES.FISHING_GROUND },
  { id: 2, name: "Breiðafjörður", type: 'FISHING_GROUND', price: 120, imageUrl: PREMADE_IMAGES.FISHING_GROUND },
  { id: 3, name: "Akranes", type: 'HARBOR', price: 150, imageUrl: PREMADE_IMAGES.HARBOR },
  { id: 4, name: "Slippurinn", type: 'SHIPYARD', imageUrl: PREMADE_IMAGES.SHIPYARD },
  { id: 5, name: "North Atlantic Storm", type: 'STORM', imageUrl: PREMADE_IMAGES.STORM },
  { id: 6, name: "Ísafjörður", type: 'HARBOR', price: 200, imageUrl: PREMADE_IMAGES.HARBOR },
  { id: 7, name: "Grímsey", type: 'FISHING_GROUND', price: 220, imageUrl: PREMADE_IMAGES.FISHING_GROUND },
  { id: 8, name: "Akureyri", type: 'HARBOR', imageUrl: PREMADE_IMAGES.HARBOR },
  { id: 9, name: "Húsavík", type: 'FISHING_GROUND', price: 240, imageUrl: PREMADE_IMAGES.FISHING_GROUND },
  { id: 10, name: "Fish Market", type: 'MARKET', imageUrl: PREMADE_IMAGES.MARKET },
  { id: 11, name: "Seyðisfjörður", type: 'HARBOR', price: 260, imageUrl: PREMADE_IMAGES.HARBOR },
  { id: 12, name: "Austfirðir", type: 'SHIPYARD', price: 280, imageUrl: PREMADE_IMAGES.SHIPYARD },
  { id: 13, name: "Coast Guard", type: 'INSPECTION', imageUrl: PREMADE_IMAGES.INSPECTION },
  { id: 14, name: "Vestmannaeyjar", type: 'FISHING_GROUND', price: 300, imageUrl: PREMADE_IMAGES.FISHING_GROUND },
  { id: 15, name: "Höfn", type: 'HARBOR', price: 320, imageUrl: PREMADE_IMAGES.HARBOR },
];

const root = createRoot(document.getElementById('root')!);
root.render(<App />);