import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Ship, Anchor, Fish, Coins, User, Waves, Bot, Play, Sparkles, AlertTriangle, X, ScrollText, Save, Trash2, ArrowRight, ShoppingCart, Map as MapIcon, DollarSign, Search, Calendar, Briefcase, FileText, Wrench, Clock, Battery, TrendingUp, TrendingDown, Minus, Dice5, Newspaper, Users, Medal, Navigation, Loader2, ExternalLink } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// --- Configuration ---

const START_MONEY = 500000;
const DEPTH_METER_COST = 5000;
const SAVE_KEY = 'maigreifinn_board_v3';
const SEASONS = ["Vor", "Sumar", "Haust", "Vetur"];

// Expanded Names for 1960s Theme
const COMPANY_NAMES = [
  "Brimverzlun hf.", "Hafdráttur h/f", "Togglarinn ehf.", "Sjómannafélagið Víkingur",
  "Útgerðarfélag Akureyrar", "Fiskvinnslan Alda", "Norðurljósavinnslan", "Vestfjarða-Skel hf.",
  "Ísbjörninn hf.", "Skeljungur Útgerð", "IceFresh Seafood", "Arctic Catch",
  "Hraðfrystihús Keflavíkur", "Síldarvinnslan h/f", "Útgerðarfélag Reykjavíkur", "Vinnslustöðin hf.",
  "Hafnarfjarðarútgerðin", "Granda-Félagið", "Bæjarútgerðin", "Fiskimjölsverksmiðjan"
];

const WEEKLY_NEWS = [
  "Síldarævintýri á Siglufirði eykur tekjur!",
  "Verkfall sjómanna yfirvofandi - markaðurinn titrar.",
  "Nýr togari kemur til landsins - mikil fagnaðarlæti.",
  "Gengi krónunnar fellur - útflutningur dýrari.",
  "Aflabrestur á Vestfjörðum - verð hækkar.",
  "Ríkisstjórnin setur ný lög um kvóta.",
  "Eldgos truflar siglingar við suðurströndina.",
  "Metveiði á loðnu í ár!",
];

const CAPTAIN_FIRST_NAMES = ["Siggi", "Gvendur", "Jón", "Einar", "Magnús", "Stefán", "Óli", "Björn", "Gunnar", "Ari", "Kalli", "Bensi"];
const CAPTAIN_LAST_NAMES = ["Sjóari", "Jaki", "Skipstjóri", "Sterki", "Gamli", "Veiðikóngur", "Hákarl", "Togaramaður", "Íslandsvinur", "Stormur"];

// --- Types ---

type GameView = 'SPLIT' | 'TITLE' | 'BOARD' | 'FISHING' | 'MANAGE';
type Era = '1920' | '2020';
type SpaceType = 'START' | 'PROPERTY' | 'CHANCE' | 'TAX' | 'FISHING' | 'REST';

interface Captain {
  id: string;
  name: string;
  skill: number; // 1-10, increases rent
  cost: number;  // Hiring cost
  salary: number; // Weekly salary (optional complexity, sticking to hiring cost for now)
  trait: string;
}

interface BoardSpace {
  id: number;
  type: SpaceType;
  name: string;
  price?: number;
  rent?: number;
  ownerId?: string | null; // null if bank owned
  color?: string;
  icon?: React.ReactNode;
  captain?: Captain; // Assigned captain
}

interface Player {
  id: string;
  name: string;
  isAI: boolean;
  money: number;
  position: number; // Index on board
  color: string;
  karma: number; // 0-100, affects luck
  strategy: 'AGGRESSIVE' | 'CONSERVATIVE' | 'BALANCED' | 'AFK';
  properties: number[]; // IDs of owned spaces
}

interface LogEntry {
  id: number;
  timestamp: string;
  text: string;
  type: 'INFO' | 'MONEY' | 'ALERT' | 'EVENT';
}

interface FishingTile {
  id: number;
  status: 'HIDDEN' | 'REVEALED';
  content: 'FISH' | 'EMPTY' | 'DANGER' | 'BIG_CATCH';
  value: number;
}

interface NewsItem {
  headline: string;
  body: string;
  sources?: { title: string, uri: string }[];
}

// --- Helper Components ---

const GameWrapper = ({ children, era }: { children?: React.ReactNode; era: Era }) => {
  const themeClass = era === '2020' ? 'theme-modern' : 'theme-vintage';
  return (
      <div className={themeClass}>
          {children}
      </div>
  );
};

// --- Main Component ---

function App() {
  // --- State ---
  const [view, setView] = useState<GameView>('SPLIT');
  const [era, setEra] = useState<Era>('1920');
  
  // Game State
  const [turn, setTurn] = useState(1);
  const [year, setYear] = useState(1920);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [board, setBoard] = useState<BoardSpace[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [marketTrend, setMarketTrend] = useState<'BULL' | 'BEAR' | 'STABLE'>('STABLE');
  const [currentNews, setCurrentNews] = useState("");
  
  // News AI State
  const [showNewspaper, setShowNewspaper] = useState(false);
  const [aiNews, setAiNews] = useState<NewsItem | null>(null);
  const [isNewsLoading, setIsNewsLoading] = useState(false);
  
  // UI State
  const [diceRoll, setDiceRoll] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState<BoardSpace | null>(null);
  const [hiringForSpaceId, setHiringForSpaceId] = useState<number | null>(null);
  const [captainCandidates, setCaptainCandidates] = useState<Captain[]>([]);

  // Fishing Mini-game State
  const [fishingGrid, setFishingGrid] = useState<FishingTile[]>([]);
  const [currentCatch, setCurrentCatch] = useState(0);
  const [activeFishingPlayerId, setActiveFishingPlayerId] = useState<string | null>(null);

  // Initialize Board
  useEffect(() => {
    const spaces: BoardSpace[] = [];
    // Generate a simple loop board (20 spaces)
    for (let i = 0; i < 20; i++) {
      let type: SpaceType = 'PROPERTY';
      let name = COMPANY_NAMES[i % COMPANY_NAMES.length];
      let price = 50000 + (i * 10000);
      let rent = price * 0.1;
      let icon = <Ship size={16}/>;

      if (i === 0) { type = 'START'; name = "Ræsing"; price=0; rent=0; icon=<Play size={16}/>; }
      else if (i === 5) { type = 'CHANCE'; name = "Áhætta"; price=0; rent=0; icon=<Sparkles size={16}/>; }
      else if (i === 10) { type = 'FISHING'; name = "Veiðislóð"; price=0; rent=0; icon=<Waves size={16}/>; }
      else if (i === 15) { type = 'TAX'; name = "Skattur"; price=0; rent=0; icon=<Coins size={16}/>; }
      
      spaces.push({
        id: i,
        type,
        name,
        price: type === 'PROPERTY' ? price : 0,
        rent: type === 'PROPERTY' ? rent : 0,
        ownerId: null,
        icon
      });
    }
    setBoard(spaces);
    setCurrentNews(WEEKLY_NEWS[0]);
  }, []);

  // --- Logic ---

  const addLog = (text: string, type: LogEntry['type'] = 'INFO') => {
      setLogs(prev => [{
          id: Date.now(),
          timestamp: `Vika ${turn}, ${year}`,
          text,
          type
      }, ...prev]);
  };

  const fetchAiNews = async (targetYear: number) => {
    setIsNewsLoading(true);
    setAiNews(null);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `
            You are a newspaper editor for an Icelandic fishing industry newspaper.
            Current Game Year: ${targetYear}.
            
            Task: Use Google Search to find a REAL historical event relevant to Iceland, the ocean, economy, or fishing industry that happened in or around ${targetYear}.
            If ${targetYear} is in the future (relative to real time), invent a plausible futuristic scenario involving the ocean/fishing based on current trends.
            
            Generate a JSON response with:
            1. "headline": A sensational headline in Icelandic.
            2. "body": A short 2-3 sentence summary of the event in Icelandic.
            
            Style: ${era === '1920' ? 'Old fashioned 1920s Icelandic journalism' : 'Modern, snappy Icelandic news'}.
            
            Return strictly valid JSON.
        `;
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview', // Using Pro for better reasoning/search
            contents: prompt,
            config: { 
                responseMimeType: 'application/json',
                tools: [{googleSearch: {}}] 
            }
        });
        
        const text = response.text;
        if (text) {
           const json = JSON.parse(text);
           
           // Extract sources from grounding metadata
           const sources: { title: string, uri: string }[] = [];
           const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
           if (chunks) {
               chunks.forEach((chunk: any) => {
                   if (chunk.web?.uri && chunk.web?.title) {
                       sources.push({ title: chunk.web.title, uri: chunk.web.uri });
                   }
               });
           }

           // De-duplicate sources
           const uniqueSources = Array.from(new Map(sources.map(item => [item.uri, item])).values());

           setAiNews({ ...json, sources: uniqueSources });
           setCurrentNews(json.headline);
        }
    } catch (e) {
        console.error("AI News Generation Failed", e);
        const fallback = WEEKLY_NEWS[Math.floor(Math.random() * WEEKLY_NEWS.length)];
        setAiNews({ 
            headline: "Fréttir Vikunnar", 
            body: fallback
        });
        setCurrentNews(fallback);
    } finally {
        setIsNewsLoading(false);
    }
  };

  const initGame = (playerName: string) => {
    const human: Player = {
      id: 'p1', name: playerName || "Útgerðarmaður", isAI: false, money: START_MONEY, position: 0, color: 'blue',
      karma: 50, strategy: 'BALANCED', properties: []
    };
    
    const ai1: Player = {
      id: 'ai1', name: "Gunnar (AI)", isAI: true, money: START_MONEY, position: 0, color: 'red',
      karma: 30, strategy: 'AGGRESSIVE', properties: []
    };
    
    const ai2: Player = {
      id: 'ai2', name: "Ólafur (AI)", isAI: true, money: START_MONEY, position: 0, color: 'green',
      karma: 80, strategy: 'CONSERVATIVE', properties: []
    };

    const ai3: Player = {
      id: 'ai3', name: "Sofandi (AI)", isAI: true, money: START_MONEY, position: 0, color: 'gray',
      karma: 50, strategy: 'AFK', properties: []
    };

    setPlayers([human, ai1, ai2, ai3]);
    setYear(parseInt(era));
    setView('BOARD');
    addLog(`Leikur hafinn. ${era === '1920' ? 'Gangi þér vel!' : 'Góða skemmtun!'}`);
    
    // Initial News
    setShowNewspaper(true);
    fetchAiNews(parseInt(era));
  };

  const generateCaptains = () => {
      return Array(3).fill(null).map(() => {
          const name = `${CAPTAIN_FIRST_NAMES[Math.floor(Math.random() * CAPTAIN_FIRST_NAMES.length)]} ${CAPTAIN_LAST_NAMES[Math.floor(Math.random() * CAPTAIN_LAST_NAMES.length)]}`;
          const skill = Math.floor(Math.random() * 10) + 1;
          const cost = skill * 5000 + 2000;
          const trait = skill > 7 ? "Reyndur" : skill > 4 ? "Duglegur" : "Nýgræðingur";
          return { id: Math.random().toString(), name, skill, cost, trait, salary: 0 };
      });
  };

  const hireCaptain = (player: Player, spaceId: number, captain: Captain) => {
      if (player.money >= captain.cost) {
          updateMoney(player.id, -captain.cost);
          setBoard(prev => prev.map(s => s.id === spaceId ? { ...s, captain } : s));
          setHiringForSpaceId(null);
          addLog(`${player.name} réði ${captain.name} á ${board[spaceId].name}.`, 'INFO');
      }
  };

  const nextTurn = () => {
    let nextIdx = currentPlayerIdx + 1;
    
    if (nextIdx >= players.length) {
      // --- NEW ROUND ---
      nextIdx = 0;
      setTurn(t => t + 1);
      
      let nextYear = year;
      if (turn % 4 === 0) {
          nextYear = year + 1;
          setYear(nextYear);
      }
      
      setMarketTrend(Math.random() > 0.5 ? 'BULL' : 'BEAR');
      
      // Trigger Newspaper
      setShowNewspaper(true);
      fetchAiNews(nextYear);
    }
    
    setCurrentPlayerIdx(nextIdx);
    setDiceRoll(null);

    // If AI, trigger turn automatically (if not blocked by newspaper)
    // Note: Since Player 0 is human, execution pauses naturally until human action.
    // If Player 0 was AI, we would need to wait for the newspaper to close.
    if (players[nextIdx].isAI) {
      setTimeout(() => rollDice(nextIdx), 1500);
    }
  };

  const rollDice = (playerIdx: number) => {
    setIsRolling(true);
    setTimeout(() => {
      const roll = Math.floor(Math.random() * 6) + 1;
      setDiceRoll(roll);
      setIsRolling(false);
      movePlayer(playerIdx, roll);
    }, 1000);
  };

  const movePlayer = (playerIdx: number, steps: number) => {
    setPlayers(prev => {
      const newPlayers = [...prev];
      const player = newPlayers[playerIdx];
      let newPos = player.position + steps;
      
      if (newPos >= board.length) {
        newPos -= board.length;
        player.money += 20000; // Pass Go
        addLog(`${player.name} fór yfir Ræsingu. +20.000 kr.`, 'MONEY');
      }
      player.position = newPos;
      
      setTimeout(() => handleLandOnSpace(player, board[newPos]), 500);
      
      return newPlayers;
    });
  };

  const evaluateAIPurchase = (player: Player, space: BoardSpace): boolean => {
    if (!space.price) return false;
    
    if (player.strategy === 'AFK') {
      if (Math.random() < 0.8) {
        addLog(`${player.name} (AFK) svaf á verðinum og keypti ekki ${space.name}.`);
        return false; 
      }
    }

    const affordability = player.money / space.price;
    if (affordability < 1) return false;

    const projectedRent = space.rent || 0;
    const roi = projectedRent / space.price; 
    let marketMultiplier = marketTrend === 'BULL' ? 1.2 : 0.8;
    let riskTolerance = player.strategy === 'AGGRESSIVE' ? 1.05 : player.strategy === 'CONSERVATIVE' ? 2.0 : 1.5;

    const karmaBonus = (player.karma - 50) / 200;
    const adjustedAffordability = affordability + karmaBonus;
    return (adjustedAffordability >= riskTolerance) && (roi * marketMultiplier > 0.05);
  };

  const handleLandOnSpace = (player: Player, space: BoardSpace) => {
    addLog(`${player.name} lenti á: ${space.name} (${space.type})`);

    if (space.type === 'PROPERTY') {
      if (space.ownerId === null) {
        if (player.isAI) {
           if (evaluateAIPurchase(player, space)) {
             buyProperty(player, space);
           } else {
             nextTurn();
           }
        } else {
           setShowPurchaseModal(space);
        }
      } else if (space.ownerId !== player.id) {
        const owner = players.find(p => p.id === space.ownerId);
        if (owner && space.rent) {
           // Captain Boost
           let rentAmount = space.rent;
           if (space.captain) {
             const boost = 1 + (space.captain.skill * 0.1);
             rentAmount = Math.floor(rentAmount * boost);
             addLog(`Skipstjóri ${space.captain.name} hækkaði leigu!`, 'ALERT');
           }
           payRent(player, owner, rentAmount);
        }
        nextTurn();
      } else {
        addLog(`${player.name} á þennan reit.`, 'INFO');
        nextTurn();
      }
    } else if (space.type === 'FISHING') {
      if (!player.isAI) {
         setActiveFishingPlayerId(player.id);
         startFishing();
      } else {
         const catchAmount = Math.floor(Math.random() * 50000);
         updateMoney(player.id, catchAmount);
         addLog(`${player.name} veiddi fyrir ${catchAmount.toLocaleString()} kr.`);
         nextTurn();
      }
    } else if (space.type === 'TAX') {
      const tax = 10000;
      updateMoney(player.id, -tax);
      addLog(`${player.name} greiddi ${tax} kr. í skatt.`, 'ALERT');
      nextTurn();
    } else {
      nextTurn();
    }
  };

  const buyProperty = (player: Player, space: BoardSpace) => {
    if (!space.price) return;
    if (player.money >= space.price) {
       updateMoney(player.id, -space.price);
       setBoard(prev => prev.map(s => s.id === space.id ? { ...s, ownerId: player.id } : s));
       setPlayers(prev => prev.map(p => p.id === player.id ? { ...p, properties: [...p.properties, space.id] } : p));
       addLog(`${player.name} keypti ${space.name} fyrir ${space.price.toLocaleString()} kr.`, 'MONEY');
    }
    if (player.id === showPurchaseModal?.ownerId || !player.isAI) {
      setShowPurchaseModal(null);
      if (!player.isAI) nextTurn();
    }
  };

  const payRent = (payer: Player, recipient: Player, amount: number) => {
    updateMoney(payer.id, -amount);
    updateMoney(recipient.id, amount);
    addLog(`${payer.name} greiddi ${recipient.name} ${amount.toLocaleString()} kr. í leigu.`, 'MONEY');
  };

  const updateMoney = (playerId: string, amount: number) => {
    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, money: p.money + amount } : p));
  };

  // --- Fishing Mini-Game Logic ---
  
  const startFishing = () => {
      const newGrid: FishingTile[] = Array(9).fill(null).map((_, i) => {
          const rand = Math.random();
          let content: FishingTile['content'] = 'EMPTY';
          let value = 0;
          if (rand > 0.6) { content = 'FISH'; value = 25000; }
          else if (rand > 0.9) { content = 'BIG_CATCH'; value = 100000; }
          else if (rand < 0.2) { content = 'DANGER'; value = -5000; }
          return { id: i, status: 'HIDDEN', content, value };
      });
      setFishingGrid(newGrid);
      setCurrentCatch(0);
      setView('FISHING');
  };

  const fishTile = (tile: FishingTile) => {
      if (tile.status === 'REVEALED') return;
      const updatedGrid = fishingGrid.map(t => t.id === tile.id ? { ...t, status: 'REVEALED' as const } : t);
      setFishingGrid(updatedGrid);
      if (tile.content !== 'EMPTY') setCurrentCatch(c => c + tile.value);
  };

  const endFishing = () => {
      const pid = activeFishingPlayerId || players[0].id; // Fallback to P1 if accessing via menu
      updateMoney(pid, currentCatch);
      addLog(`Löndun: ${currentCatch.toLocaleString()} kr.`, 'MONEY');
      setActiveFishingPlayerId(null);
      
      // If triggered from board, next turn. If manual menu, just go back.
      if (activeFishingPlayerId) {
          setView('BOARD');
          nextTurn();
      } else {
          setView('BOARD');
      }
  };

  // --- Navigation Component ---
  const GameSelector = () => (
      <div className="fixed bottom-0 left-0 right-0 bg-header border-t-4 border-[#5d4037] p-2 flex justify-center gap-4 z-50 shadow-2xl">
          <button onClick={() => setView('BOARD')} className={`btn-paper flex items-center gap-2 px-6 py-2 ${view === 'BOARD' ? 'bg-[#d7ccc8]' : ''}`}>
              <MapIcon size={18}/> <span className="hidden sm:inline">Spilaborð</span>
          </button>
          <button onClick={() => setView('MANAGE')} className={`btn-paper flex items-center gap-2 px-6 py-2 ${view === 'MANAGE' ? 'bg-[#d7ccc8]' : ''}`}>
              <Briefcase size={18}/> <span className="hidden sm:inline">Rekstur</span>
          </button>
          <button onClick={() => { setActiveFishingPlayerId(null); startFishing(); }} className={`btn-paper flex items-center gap-2 px-6 py-2 ${view === 'FISHING' ? 'bg-[#d7ccc8]' : ''}`}>
              <Waves size={18}/> <span className="hidden sm:inline">Veiða</span>
          </button>
      </div>
  );

  // --- Views ---

  if (view === 'SPLIT') {
       return (
          <div className="flex h-screen w-full overflow-hidden">
              <div 
                  className="w-1/2 h-full bg-[#f6f1e1] text-[#2c1810] flex flex-col items-center justify-center p-8 relative cursor-pointer hover:bg-[#eaddcf] transition-colors group border-r-4 border-[#3e2723]"
                  onClick={() => { setEra('1920'); setView('TITLE'); }}
                  style={{ fontFamily: "'Playfair Display', serif" }}
              >
                  <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]"></div>
                  <h1 className="text-6xl mb-4 font-bold tracking-widest group-hover:scale-110 transition-transform">1920</h1>
                  <h2 className="text-2xl italic mb-8">Upphaf Útgerðar</h2>
                  <Anchor size={64} className="text-[#3e2723] opacity-80" />
                  <div className="mt-8 text-sm uppercase tracking-widest border-t border-b border-[#3e2723] py-2">Smelltu til að velja</div>
              </div>
              <div 
                  className="w-1/2 h-full bg-[#0f172a] text-white flex flex-col items-center justify-center p-8 relative cursor-pointer hover:bg-[#1e293b] transition-colors group"
                  onClick={() => { setEra('2020'); setView('TITLE'); }}
                  style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
              >
                  <h1 className="text-6xl mb-4 font-extrabold tracking-tight text-blue-400 group-hover:scale-110 transition-transform">2020</h1>
                  <h2 className="text-2xl font-light mb-8 text-slate-300">Nútíma Tækni</h2>
                  <Bot size={64} className="text-blue-500 opacity-80" />
                  <div className="mt-8 text-sm uppercase tracking-widest text-slate-400 border-t border-b border-slate-700 py-2">Smelltu til að velja</div>
              </div>
          </div>
      );
  }

  if (view === 'TITLE') {
     return (
        <GameWrapper era={era}>
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <h1 className="text-6xl font-header mb-8">MAÍ GREIFINN</h1>
                <div className="text-2xl mb-8 font-typewriter">Útvegsspilið {era}</div>
                <button onClick={() => initGame("Ég")} className="btn-paper px-8 py-4 text-xl flex items-center gap-2">
                   <Play size={24}/> Hefja Leik
                </button>
            </div>
        </GameWrapper>
     );
  }

  const currentPlayer = players[currentPlayerIdx];

  // Common Layout Wrapper for Game Views
  const GameLayout = ({ children }: { children: React.ReactNode }) => (
      <GameWrapper era={era}>
           <div className="min-h-screen flex flex-col pb-20"> {/* pb-20 for nav bar */}
              {/* Header Info */}
              <div className="bg-header p-4 shadow-md flex justify-between items-center z-10 sticky top-0">
                  <div>
                      <h2 className="font-header text-xl">{players[0].name}</h2>
                      <div className="text-money font-typewriter font-bold">{players[0].money.toLocaleString()} kr.</div>
                  </div>
                  <div className="hidden sm:flex flex-col items-center">
                       <div className="font-header text-lg">Vika {turn} - Ár {year}</div>
                       <div className="flex items-center gap-2 text-xs opacity-70">
                          {marketTrend === 'BULL' ? <TrendingUp className="text-green-600"/> : marketTrend === 'BEAR' ? <TrendingDown className="text-red-600"/> : <Minus/>}
                          Markaður
                       </div>
                  </div>
                  <div className="w-64 hidden sm:block">
                      <div className="flex items-center gap-2 mb-1 text-xs opacity-60 uppercase tracking-widest">
                          <Newspaper size={12}/> Fréttir Vikunnar
                      </div>
                      <div className="text-xs italic truncate animate-pulse">{currentNews}</div>
                  </div>
              </div>

              {children}

              {/* Weekly Newspaper Modal */}
              {showNewspaper && (
                  <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
                      <div className={`
                         max-w-2xl w-full p-8 shadow-2xl relative animate-[fadeIn_0.5s]
                         ${era === '1920' 
                             ? 'bg-[#f0e6d2] text-[#2c1810] border-8 border-double border-[#3e2723]' 
                             : 'bg-white text-slate-900 border border-slate-200 rounded-xl'}
                      `}>
                          {isNewsLoading ? (
                              <div className="text-center py-20 space-y-4">
                                  <Loader2 size={48} className="animate-spin mx-auto opacity-50"/>
                                  <div className="font-typewriter text-xl animate-pulse">Prentvélar snúast...</div>
                              </div>
                          ) : (
                              <>
                                  <div className="text-center border-b-2 border-current pb-4 mb-6">
                                      <div className="text-xs uppercase tracking-[0.2em] mb-1 opacity-60">Morgunblaðið - {year}</div>
                                      <h2 className="font-header text-4xl sm:text-5xl font-black leading-tight">
                                          {aiNews?.headline || "FRÉTTIR DAGSINS"}
                                      </h2>
                                  </div>

                                  <div className="font-typewriter text-lg sm:text-xl leading-relaxed text-justify mb-8 opacity-90 columns-1 sm:columns-2 gap-8">
                                      {aiNews?.body || "Engar markverðar fréttir bárust í dag."}
                                  </div>

                                  {aiNews?.sources && aiNews.sources.length > 0 && (
                                      <div className="mb-6 pt-4 border-t border-current/20">
                                          <div className="text-xs uppercase tracking-widest opacity-60 mb-2">Heimildir</div>
                                          <div className="space-y-1">
                                              {aiNews.sources.map((source, idx) => (
                                                  <div key={idx} className="flex items-center gap-2 text-xs truncate opacity-70 hover:opacity-100">
                                                      <ExternalLink size={10}/>
                                                      <a href={source.uri} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                          {source.title}
                                                      </a>
                                                  </div>
                                              ))}
                                          </div>
                                      </div>
                                  )}

                                  <button 
                                      onClick={() => setShowNewspaper(false)}
                                      className={`
                                         w-full py-4 text-xl font-bold uppercase tracking-widest hover:scale-[1.02] transition-transform
                                         ${era === '1920' 
                                             ? 'bg-[#3e2723] text-[#f6f1e1] border-2 border-[#2c1810]' 
                                             : 'bg-blue-600 text-white rounded-lg shadow-lg'}
                                      `}
                                  >
                                      Halda Áfram
                                  </button>
                              </>
                          )}
                      </div>
                  </div>
              )}
              
              <GameSelector />
           </div>
      </GameWrapper>
  );

  // MANAGE VIEW
  if (view === 'MANAGE') {
      const ownedProperties = board.filter(s => s.ownerId === players[0].id);

      return (
          <GameLayout>
              <div className="max-w-4xl mx-auto w-full p-6">
                  <h2 className="font-header text-3xl mb-6 flex items-center gap-3">
                      <Briefcase className="text-accent"/> Rekstur Útgerðar
                  </h2>
                  
                  {ownedProperties.length === 0 ? (
                      <div className="paper-card p-12 text-center">
                          <AlertTriangle size={48} className="mx-auto text-accent mb-4 opacity-50"/>
                          <h3 className="font-header text-xl">Engar eignir fundust</h3>
                          <p className="font-typewriter mt-2 opacity-70">Þú verður að kaupa fyrirtæki á spilaborðinu til að reka þau.</p>
                          <button onClick={() => setView('BOARD')} className="btn-paper mt-6 inline-flex items-center gap-2">
                              <MapIcon size={16}/> Fara á borð
                          </button>
                      </div>
                  ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {ownedProperties.map(space => (
                              <div key={space.id} className="paper-card p-6 relative">
                                  <div className="flex justify-between items-start mb-4 border-b border-black/10 pb-4">
                                      <div>
                                          <div className="text-[10px] uppercase tracking-widest opacity-50">Eign</div>
                                          <h3 className="font-header text-xl font-bold">{space.name}</h3>
                                      </div>
                                      <div className="text-right">
                                           <div className="text-[10px] uppercase tracking-widest opacity-50">Leigutekjur</div>
                                           <div className="font-typewriter font-bold text-money">
                                               {space.captain 
                                                 ? Math.floor((space.rent || 0) * (1 + space.captain.skill * 0.1)).toLocaleString() 
                                                 : space.rent?.toLocaleString()} kr.
                                           </div>
                                      </div>
                                  </div>

                                  <div className="bg-black/5 p-4 rounded mb-4">
                                      <div className="flex justify-between items-center mb-2">
                                          <span className="text-xs uppercase font-bold flex items-center gap-2"><User size={14}/> Skipstjóri</span>
                                          {space.captain && <span className="text-[10px] bg-green-100 text-green-800 px-2 rounded-full">Ráðinn</span>}
                                      </div>
                                      
                                      {space.captain ? (
                                          <div className="flex items-center gap-4">
                                              <div className="w-12 h-12 bg-white rounded-full border border-black/10 flex items-center justify-center">
                                                  <User size={24} className="opacity-50"/>
                                              </div>
                                              <div>
                                                  <div className="font-header font-bold">{space.captain.name}</div>
                                                  <div className="text-xs font-typewriter opacity-70">
                                                      Hæfni: {space.captain.skill}/10 | {space.captain.trait}
                                                  </div>
                                              </div>
                                          </div>
                                      ) : (
                                          <div className="text-center py-4 opacity-50 text-sm italic">
                                              Enginn skipstjóri ráðinn.
                                          </div>
                                      )}
                                  </div>

                                  {!space.captain && (
                                      <button 
                                          onClick={() => {
                                              setHiringForSpaceId(space.id);
                                              setCaptainCandidates(generateCaptains());
                                          }}
                                          className="btn-paper w-full py-2 flex items-center justify-center gap-2 text-sm"
                                      >
                                          <Users size={16}/> Ráða Skipstjóra
                                      </button>
                                  )}
                              </div>
                          ))}
                      </div>
                  )}

                  {/* Hiring Modal */}
                  {hiringForSpaceId !== null && (
                      <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
                          <div className="paper-card max-w-2xl w-full p-8 relative">
                              <button onClick={() => setHiringForSpaceId(null)} className="absolute top-4 right-4 opacity-50 hover:opacity-100">
                                  <X size={24}/>
                              </button>
                              
                              <h2 className="font-header text-2xl mb-2">Ráða Skipstjóra</h2>
                              <p className="font-typewriter text-sm opacity-70 mb-6">Veldu skipstjóra fyrir {board[hiringForSpaceId].name}. Betri hæfni eykur tekjur.</p>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                  {captainCandidates.map(cap => (
                                      <div key={cap.id} className="border-2 border-dashed border-black/20 p-4 hover:bg-black/5 transition-colors text-center">
                                          <div className="w-16 h-16 bg-white mx-auto rounded-full mb-3 flex items-center justify-center border border-black/10">
                                              <User size={32} className="opacity-60"/>
                                          </div>
                                          <h4 className="font-bold mb-1">{cap.name}</h4>
                                          <div className="text-xs uppercase tracking-wider opacity-60 mb-2">{cap.trait}</div>
                                          
                                          <div className="space-y-1 text-sm font-typewriter mb-4">
                                              <div>Hæfni: <span className="font-bold">{cap.skill}/10</span></div>
                                              <div>Launakrafa: <span className="font-bold text-red-700">{cap.cost.toLocaleString()} kr.</span></div>
                                          </div>

                                          <button 
                                              onClick={() => hireCaptain(players[0], hiringForSpaceId!, cap)}
                                              disabled={players[0].money < cap.cost}
                                              className="btn-paper w-full py-2 text-xs disabled:opacity-50"
                                          >
                                              Ráða
                                          </button>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </div>
                  )}
              </div>
          </GameLayout>
      );
  }

  // BOARD VIEW
  if (view === 'BOARD') {
     return (
        <GameLayout>
              <div className="flex-1 flex overflow-hidden">
                  
                  {/* Sidebar - Players */}
                  <div className="w-64 bg-black/5 p-4 border-r border-black/10 overflow-y-auto hidden md:block">
                      <h3 className="font-header text-lg mb-4 opacity-70">Spilarar</h3>
                      <div className="space-y-4">
                          {players.map((p, idx) => (
                              <div key={p.id} className={`p-3 rounded border ${idx === currentPlayerIdx ? 'bg-white shadow-md border-current scale-105' : 'bg-transparent border-transparent opacity-70'} transition-all`}>
                                  <div className="flex justify-between items-center mb-1">
                                      <div className="font-bold">{p.name}</div>
                                      {idx === currentPlayerIdx && <div className="w-2 h-2 rounded-full bg-red-500 animate-ping"></div>}
                                  </div>
                                  <div className="text-xs font-typewriter opacity-80">{p.money.toLocaleString()} kr.</div>
                                  <div className="flex flex-wrap gap-1 mt-2">
                                      {p.properties.map(pid => (
                                          <div key={pid} className="w-2 h-2 rounded-sm bg-current opacity-50"></div>
                                      ))}
                                  </div>
                                  <div className="text-[10px] mt-1 opacity-50 uppercase">{p.strategy}</div>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Main Board Area */}
                  <div className="flex-1 p-8 overflow-y-auto relative flex flex-col items-center">
                      
                      {/* Controls Layer */}
                      <div className="sticky top-0 mb-8 z-20">
                          {currentPlayerIdx === 0 && !isRolling && !showPurchaseModal && !showNewspaper && (
                              <button onClick={() => rollDice(0)} className="btn-paper px-8 py-4 text-xl shadow-xl hover:scale-105 transition-transform flex items-center gap-3">
                                  <Dice5 size={24}/> Kasta Tening
                              </button>
                          )}
                          {isRolling && <div className="text-2xl font-typewriter animate-bounce">Kastar...</div>}
                          {diceRoll && !isRolling && <div className="text-4xl font-header p-4 bg-white shadow-lg rounded border border-current">{diceRoll}</div>}
                      </div>

                      {/* The Board Loop */}
                      <div className="grid grid-cols-5 gap-3 max-w-4xl mx-auto w-full">
                          {board.map((space) => {
                             const isCurrentPos = space.id === currentPlayer.position;
                             const owner = players.find(p => p.id === space.ownerId);
                             
                             return (
                                 <div key={space.id} 
                                      className={`
                                        aspect-square p-2 border relative flex flex-col items-center justify-between text-center transition-all
                                        ${isCurrentPos ? 'scale-110 z-10 shadow-xl bg-white ring-2 ring-blue-500' : 'bg-white/50 opacity-90'}
                                        ${owner ? `border-[${owner.color}]` : 'border-black/10'}
                                      `}
                                      style={{ borderColor: owner ? owner.color : undefined, borderWidth: owner ? 2 : 1 }}
                                 >
                                     <div className="text-[10px] opacity-50 uppercase tracking-widest flex justify-between w-full">
                                         <span>{space.type.slice(0,4)}</span>
                                         {space.captain && <Medal size={10} className="text-yellow-600"/>}
                                     </div>
                                     <div className="flex-1 flex flex-col items-center justify-center">
                                         <div className="mb-1 opacity-70">{space.icon}</div>
                                         <div className="text-xs font-bold leading-tight line-clamp-2">{space.name}</div>
                                     </div>
                                     
                                     {/* Players on this space */}
                                     <div className="flex gap-1 absolute top-1 right-1">
                                         {players.filter(p => p.position === space.id).map(p => (
                                             <div key={p.id} className="w-3 h-3 rounded-full border border-white shadow-sm" style={{ backgroundColor: p.color }} title={p.name}></div>
                                         ))}
                                     </div>

                                     {/* Price/Rent */}
                                     {space.type === 'PROPERTY' && (
                                         <div className="text-[10px] font-typewriter w-full bg-black/5 rounded px-1">
                                             {owner ? `Leiga: ${space.captain ? Math.floor((space.rent||0)*(1+space.captain.skill*0.1)) : space.rent}` : `${space.price}`}
                                         </div>
                                     )}
                                 </div>
                             );
                          })}
                      </div>
                  </div>
              
                  {/* Logs Sidebar */}
                  <div className="w-64 bg-white/50 border-l border-black/10 p-4 hidden lg:block overflow-y-auto">
                       <h3 className="font-header text-lg mb-4 opacity-70 flex items-center gap-2"><ScrollText size={16}/> Dagbók</h3>
                       <div className="space-y-2 text-xs font-typewriter">
                           {logs.map(log => (
                               <div key={log.id} className="pb-2 border-b border-black/5 last:border-0">
                                   <span className={`font-bold ${log.type === 'MONEY' ? 'text-green-700' : log.type === 'ALERT' ? 'text-red-700' : ''}`}>{log.text}</span>
                               </div>
                           ))}
                       </div>
                  </div>

              </div>

              {/* Purchase Modal */}
              {showPurchaseModal && (
                  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                      <div className="paper-card p-8 max-w-md w-full shadow-2xl animate-[fadeIn_0.2s]">
                          <h2 className="text-2xl font-header mb-2">{showPurchaseModal.name}</h2>
                          <div className="text-sm opacity-70 font-typewriter mb-6">Til sölu fyrir {showPurchaseModal.price?.toLocaleString()} kr.</div>
                          
                          <div className="flex gap-4">
                              <button onClick={() => buyProperty(players[0], showPurchaseModal)} disabled={players[0].money < (showPurchaseModal.price || 0)} className="flex-1 btn-paper py-3 bg-green-600 text-white border-none hover:bg-green-700 disabled:opacity-50">
                                  Kaupa
                              </button>
                              <button onClick={() => { setShowPurchaseModal(null); nextTurn(); }} className="flex-1 btn-paper py-3 bg-red-100 text-red-900 border-red-200 hover:bg-red-200">
                                  Sleppa
                              </button>
                          </div>
                      </div>
                  </div>
              )}
        </GameLayout>
     );
  }

  // FISHING VIEW (Mini Game)
  if (view === 'FISHING') {
     return (
        <GameLayout>
             <div className="flex-1 flex items-center justify-center relative overflow-hidden">
                 <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/nautical-leather.png')] pointer-events-none"></div>
                 <div className="relative z-10 w-full max-w-lg p-8">
                     <h2 className="text-3xl font-header text-center mb-2">Veiðislóð</h2>
                     <p className="text-center opacity-60 mb-8">Veldu reit til að kasta netinu</p>
                     
                     <div className="grid grid-cols-3 gap-4 aspect-square mb-8">
                         {fishingGrid.map(tile => (
                             <button 
                                key={tile.id}
                                onClick={() => fishTile(tile)}
                                disabled={tile.status === 'REVEALED'}
                                className={`
                                   rounded-lg border-2 transition-all duration-300 relative overflow-hidden
                                   ${tile.status === 'HIDDEN' ? (era==='2020'?'bg-blue-600 border-blue-500 hover:scale-105':'bg-[#3e2723] border-[#5d4037] hover:bg-[#4e342e]') : 'bg-transparent border-current opacity-50'}
                                `}
                             >
                                 {tile.status === 'REVEALED' && (
                                     <div className="absolute inset-0 flex items-center justify-center animate-[fadeIn_0.3s]">
                                         {tile.content === 'FISH' && <Fish size={32} className="text-green-600"/>}
                                         {tile.content === 'BIG_CATCH' && <div className="text-yellow-600"><Fish size={40}/><Sparkles size={16} className="absolute top-2 right-2"/></div>}
                                         {tile.content === 'DANGER' && <AlertTriangle size={32} className="text-red-600"/>}
                                         {tile.content === 'EMPTY' && <span className="text-xs opacity-50">Tómt</span>}
                                         {tile.value !== 0 && <div className="absolute bottom-1 text-xs font-bold">{tile.value > 0 ? '+' : ''}{tile.value/1000}k</div>}
                                     </div>
                                 )}
                             </button>
                         ))}
                     </div>
                     
                     <div className="text-center">
                         <div className="text-2xl font-typewriter text-money mb-4">{currentCatch.toLocaleString()} kr.</div>
                         <button onClick={endFishing} className="btn-paper px-8 py-3 bg-yellow-100 border-yellow-800 text-yellow-900">
                             Landa & Halda Áfram
                         </button>
                     </div>
                 </div>
             </div>
        </GameLayout>
     );
  }

  return null;
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);