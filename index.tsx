import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Ship, Anchor, Fish, Coins, User, Waves, Bot, Play, Sparkles, AlertTriangle, X, ScrollText, Save, Trash2, ArrowRight, ShoppingCart, Map, DollarSign, Search, Calendar, Briefcase, FileText, Wrench, Clock, Battery, TrendingUp, TrendingDown, Minus, Dice5, Newspaper, LayoutGrid, MapPinned } from 'lucide-react';

// --- Shared Configuration ---

const START_MONEY = 500000;
const SEASONS = ["Vor", "Sumar", "Haust", "Vetur"];

const COMPANY_NAMES = [
  "Brimverzlun hf.", "Hafdráttur h/f", "Togglarinn ehf.", "Sjómannafélagið Víkingur",
  "Útgerðarfélag Akureyrar", "Fiskvinnslan Alda", "Norðurljósavinnslan", "Vestfjarða-Skel hf.",
  "Ísbjörninn hf.", "Skeljungur Útgerð", "IceFresh Seafood", "Arctic Catch",
  "Hraðfrystihús Keflavíkur", "Síldarvinnslan h/f", "Útgerðarfélag Reykjavíkur", "Vinnslustöðin hf.",
  "Hafnarfjarðarútgerðin", "Granda-Félagið", "Bæjarútgerðin", "Fiskimjölsverksmiðjan"
];

const SHIP_NAMES = [
  "MS Brimrós", "MS Togglari", "MS Djúpvera", "Guðrún Björg", "Sæljónið", 
  "Haförninn", "Sjöstjarnan", "Kjölurinn", "Aldan", "Vonin", "Víkingur", "Stormur",
  "Jón Forseti", "Gulltoppur", "Bjarni Ben", "Hallveig Fróðadóttir", 
  "Sæbjörg", "Hafdís", "Ásbjörn", "Snorri Sturluson"
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

// --- Types ---

type Era = '1920' | '2020';
type GameMode = 'TYCOON' | 'BOARD';

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

// --- Helper Components ---

const GameWrapper = ({ children, era }: { children?: React.ReactNode; era: Era }) => {
  const themeClass = era === '2020' ? 'theme-modern' : 'theme-vintage';
  return (
      <div className={themeClass}>
          {children}
      </div>
  );
};

// ==========================================
// TYCOON MODE (Original Card/HQ Version)
// ==========================================

const MARKET_SHIPS = [
  { id: 1, name: "Trilla (Opinn)", type: 'TRILLA', price: 50000, capacity: 5, upkeep: 1000 },
  { id: 2, name: "Kvótakóngur", type: 'TRAWLER', price: 150000, capacity: 15, upkeep: 5000 },
  { id: 3, name: "MS Togglari", type: 'TRAWLER', price: 300000, capacity: 30, upkeep: 10000 },
  { id: 4, name: "Gullskipið", type: 'YACHT', price: 1000000, capacity: 50, upkeep: 25000 },
];

interface ShipItem {
  id: string; 
  modelId: number;
  name: string;
  type: string;
  condition: number;
  equipped: boolean;
}

function TycoonGame({ era, onExit }: { era: Era, onExit: () => void }) {
  const [view, setView] = useState<'HQ' | 'MARKET' | 'FISHING'>('HQ');
  const [money, setMoney] = useState(START_MONEY);
  const [ships, setShips] = useState<ShipItem[]>([]);
  const [year, setYear] = useState(parseInt(era));
  const [seasonIndex, setSeasonIndex] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  // Fishing
  const [fishingGrid, setFishingGrid] = useState<FishingTile[]>([]);
  const [selectedShipId, setSelectedShipId] = useState<string | null>(null);
  const [currentCatch, setCurrentCatch] = useState(0);

  const addLog = (text: string, type: LogEntry['type'] = 'INFO') => {
      setLogs(prev => [{ id: Date.now(), timestamp: `${SEASONS[seasonIndex]} ${year}`, text, type }, ...prev]);
  };

  const handleBuyShip = (model: typeof MARKET_SHIPS[0]) => {
      if (money >= model.price) {
          setMoney(m => m - model.price);
          const newShip: ShipItem = {
              id: Date.now().toString(),
              modelId: model.id,
              name: SHIP_NAMES[Math.floor(Math.random() * SHIP_NAMES.length)] + ` ${Math.floor(Math.random() * 100)}`,
              type: model.type,
              condition: 100,
              equipped: false
          };
          setShips(prev => [...prev, newShip]);
          addLog(`Keypti ${newShip.name}`, 'MONEY');
      }
  };

  const startFishing = (shipId: string) => {
      const ship = ships.find(s => s.id === shipId);
      if (ship && ship.condition < 20) {
          alert("Skip er í of slæmu ástandi!");
          return;
      }
      setSelectedShipId(shipId);
      const newGrid: FishingTile[] = Array(9).fill(null).map((_, i) => {
          const rand = Math.random();
          let content: FishingTile['content'] = 'EMPTY';
          let value = 0;
          if (rand > 0.7) { content = 'FISH'; value = 50000; }
          else if (rand > 0.9) { content = 'BIG_CATCH'; value = 150000; }
          else if (rand < 0.1) { content = 'DANGER'; value = -10000; }
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
    if (tile.content === 'DANGER') {
        setCurrentCatch(c => c - 5000);
        if (selectedShipId) setShips(prev => prev.map(s => s.id === selectedShipId ? { ...s, condition: Math.max(0, s.condition - 10) } : s));
    } else if (tile.content !== 'EMPTY') {
        setCurrentCatch(c => c + tile.value);
    }
  };

  const endFishing = () => {
    setMoney(m => m + currentCatch);
    addLog(`Veiðiferð lokið: ${currentCatch.toLocaleString()} kr.`, 'MONEY');
    if (selectedShipId) setShips(prev => prev.map(s => s.id === selectedShipId ? { ...s, condition: Math.max(0, s.condition - 5) } : s));
    
    // Advance Time
    setSeasonIndex(prev => {
        const next = prev + 1;
        if (next >= SEASONS.length) { setYear(y => y + 1); return 0; }
        return next;
    });
    setView('HQ');
  };

  // Header for Tycoon
  const TycoonHeader = () => (
    <div className="bg-header p-4 shadow-lg sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-4">
            <button onClick={onExit} className="btn-paper p-2 text-xs opacity-80 hover:opacity-100 flex items-center gap-1">
                <ArrowRight className="rotate-180" size={14}/> Hætta
            </button>
            <div>
                <h2 className="font-header text-xl">Útgerðarstjórn</h2>
                <div className="text-xs opacity-70 font-typewriter">{SEASONS[seasonIndex]} {year}</div>
            </div>
        </div>
        <div className="text-right">
             <div className="text-xs opacity-60 uppercase">Sjóður</div>
             <div className="font-typewriter text-xl text-money">{money.toLocaleString()} kr.</div>
        </div>
    </div>
  );

  if (view === 'HQ') {
    return (
        <div className="min-h-screen pb-12">
            <TycoonHeader />
            <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <div className="flex justify-between items-end border-b-2 border-current pb-2 mb-4 opacity-80">
                        <h3 className="font-header text-2xl flex items-center gap-2"><Ship className="text-accent"/> Flotinn</h3>
                        <button onClick={() => setView('MARKET')} className="btn-paper px-4 py-2 text-sm flex items-center gap-2">
                            <ShoppingCart size={14}/> Skipamarkaður
                        </button>
                    </div>
                    {ships.length === 0 ? (
                        <div className="paper-card p-8 text-center opacity-70 italic">Engin skip. Farðu á markaðinn!</div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {ships.map(ship => (
                                <div key={ship.id} className="paper-card relative group flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg">
                                    {era !== '2020' && (
                                        <div className="absolute top-2 right-2 w-16 h-16 border-4 border-red-900/10 rounded-full flex items-center justify-center transform rotate-12 pointer-events-none">
                                            <span className="text-[8px] font-bold text-red-900/20 uppercase text-center leading-none">Skráð<br/>Ísland</span>
                                        </div>
                                    )}
                                    <div className={`px-4 py-2 border-b border-black/10 flex justify-between items-center ${era === '2020' ? 'bg-slate-100/50' : 'bg-[#efebe0]'}`}>
                                        <div className="flex items-center gap-2">
                                            <Ship size={14} className="opacity-50"/>
                                            <span className="text-[10px] font-bold opacity-60 font-typewriter tracking-widest">{ship.id.slice(-4)}</span>
                                        </div>
                                        <div className={`text-[10px] px-2 py-0.5 rounded font-bold ${era === '2020' ? 'bg-blue-100 text-blue-800' : 'bg-[#d7ccc8] text-[#3e2723]'}`}>{ship.type}</div>
                                    </div>
                                    <div className="p-5 space-y-4">
                                        <div>
                                            <label className="text-[9px] uppercase tracking-wider opacity-50 block mb-1">Heiti Skips</label>
                                            <h4 className="font-header text-2xl font-bold leading-none">{ship.name}</h4>
                                        </div>
                                        <div className={`grid grid-cols-2 gap-px ${era === '2020' ? 'bg-slate-200' : 'bg-[#d7ccc8]'} border border-transparent opacity-80 rounded overflow-hidden`}>
                                            <div className={`${era === '2020' ? 'bg-white' : 'bg-[#fbf9f5]'} p-2`}>
                                                <span className="block text-[9px] opacity-50 uppercase">Ástand</span>
                                                <span className={`font-typewriter font-bold ${ship.condition < 50 ? 'text-red-600' : ''}`}>{ship.condition}%</span>
                                            </div>
                                            <div className={`${era === '2020' ? 'bg-white' : 'bg-[#fbf9f5]'} p-2`}>
                                                <span className="block text-[9px] opacity-50 uppercase">Búnaður</span>
                                                <span className="font-typewriter font-bold">{ship.equipped ? 'Sonar' : 'Enginn'}</span>
                                            </div>
                                        </div>
                                        <div className="pt-2 flex items-center justify-end gap-2 mt-2">
                                            <button onClick={() => startFishing(ship.id)} className="btn-paper px-4 py-2 text-xs flex items-center gap-2 hover:translate-y-[-1px]">
                                                <Waves size={14}/> <span>{era === '2020' ? 'Veiða' : 'Á Sjó'}</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b-2 border-current pb-2 opacity-80">
                        <h3 className="font-header text-xl flex items-center gap-2"><FileText className="text-accent"/> Dagbók</h3>
                    </div>
                    <div className="paper-card p-4 min-h-[400px] max-h-[600px] overflow-y-auto font-typewriter text-sm space-y-4">
                        {logs.map(log => (
                            <div key={log.id} className="border-b border-black/10 pb-2">
                                <div className="text-[10px] opacity-60 uppercase mb-1">{log.timestamp}</div>
                                <div className={log.type === 'MONEY' ? 'text-money font-bold' : ''}>{log.text}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
  }

  if (view === 'MARKET') {
     return (
        <div className="min-h-screen pb-12">
            <TycoonHeader />
            <main className="max-w-4xl mx-auto p-6">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => setView('HQ')} className="btn-paper p-2 rounded-full"><ArrowRight className="rotate-180" size={20}/></button>
                    <h2 className="font-header text-3xl text-accent">Skipamarkaður</h2>
                </div>
                <div className="space-y-4">
                    {MARKET_SHIPS.map(model => (
                        <div key={model.id} className="paper-card p-6 flex flex-col sm:flex-row items-center gap-6">
                            <div className="w-32 h-24 bg-black/5 border border-black/10 flex items-center justify-center text-accent"><Ship size={48} strokeWidth={1}/></div>
                            <div className="flex-1 text-center sm:text-left">
                                <h3 className="font-header text-xl font-bold">{model.name}</h3>
                                <div className="text-sm opacity-70 font-typewriter mt-1">Verð: {model.price.toLocaleString()} kr.</div>
                            </div>
                            <button onClick={() => handleBuyShip(model)} disabled={money < model.price} className="btn-paper py-2 px-6 disabled:opacity-50">Kaupa</button>
                        </div>
                    ))}
                </div>
            </main>
        </div>
     );
  }

  if (view === 'FISHING') {
    return (
        <div className={`min-h-screen relative text-white ${era === '2020' ? 'bg-slate-900' : 'bg-[#001020]'}`}>
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/nautical-leather.png')]"></div>
            <div className="relative z-10 max-w-2xl mx-auto p-6 flex flex-col h-screen justify-center">
                 <h2 className="text-3xl font-header text-center mb-4 text-yellow-100">Á Veiðum</h2>
                 <div className="grid grid-cols-3 gap-3 aspect-square mb-8">
                      {fishingGrid.map(tile => (
                          <button key={tile.id} onClick={() => fishTile(tile)} disabled={tile.status === 'REVEALED'}
                              className={`rounded-sm border-2 transition-all overflow-hidden relative ${tile.status === 'HIDDEN' ? 'bg-blue-600 border-blue-500' : 'bg-slate-800 border-slate-700'}`}>
                              {tile.status === 'REVEALED' && (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                      {tile.content === 'FISH' && <Fish size={32} className="text-green-400"/>}
                                      {tile.content === 'BIG_CATCH' && <div className="text-yellow-400"><Fish size={40}/><Sparkles size={16}/></div>}
                                      {tile.content === 'DANGER' && <AlertTriangle size={32} className="text-red-500"/>}
                                      {tile.value !== 0 && <div className="absolute bottom-1 text-xs font-bold">{tile.value > 0 ? '+' : ''}{tile.value}</div>}
                                  </div>
                              )}
                          </button>
                      ))}
                 </div>
                 <div className="text-center">
                     <div className="text-2xl font-typewriter text-green-400 mb-4">{currentCatch.toLocaleString()} kr.</div>
                     <button onClick={endFishing} className="btn-paper px-8 py-3 bg-yellow-600 text-white">Landa & Heim</button>
                 </div>
            </div>
        </div>
    );
  }

  return null;
}

// ==========================================
// BOARD GAME MODE (Monopoly Style)
// ==========================================

type SpaceType = 'START' | 'PROPERTY' | 'CHANCE' | 'TAX' | 'FISHING' | 'REST';

interface BoardSpace {
  id: number;
  type: SpaceType;
  name: string;
  price?: number;
  rent?: number;
  ownerId?: string | null;
  color?: string;
  icon?: React.ReactNode;
}

interface Player {
  id: string;
  name: string;
  isAI: boolean;
  money: number;
  position: number;
  color: string;
  karma: number;
  strategy: 'AGGRESSIVE' | 'CONSERVATIVE' | 'BALANCED' | 'AFK';
  properties: number[];
}

function BoardGame({ era, onExit }: { era: Era, onExit: () => void }) {
  const [board, setBoard] = useState<BoardSpace[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [turn, setTurn] = useState(1);
  const [year, setYear] = useState(parseInt(era));
  const [diceRoll, setDiceRoll] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showPurchaseModal, setShowPurchaseModal] = useState<BoardSpace | null>(null);
  const [marketTrend, setMarketTrend] = useState<'BULL'|'BEAR'|'STABLE'>('STABLE');
  const [currentNews, setCurrentNews] = useState(WEEKLY_NEWS[0]);
  
  // Fishing Minigame within Board
  const [isFishing, setIsFishing] = useState(false);
  const [fishingGrid, setFishingGrid] = useState<FishingTile[]>([]);
  const [currentCatch, setCurrentCatch] = useState(0);
  const [fishingPlayerId, setFishingPlayerId] = useState<string | null>(null);

  const addLog = (text: string, type: LogEntry['type'] = 'INFO') => {
      setLogs(prev => [{ id: Date.now(), timestamp: `Vika ${turn}`, text, type }, ...prev]);
  };

  useEffect(() => {
    // Init Board
    const spaces: BoardSpace[] = [];
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
        
        spaces.push({ id: i, type, name, price: type === 'PROPERTY' ? price : 0, rent: type === 'PROPERTY' ? rent : 0, ownerId: null, icon });
    }
    setBoard(spaces);

    // Init Players
    setPlayers([
        { id: 'p1', name: "Ég", isAI: false, money: START_MONEY, position: 0, color: 'blue', karma: 50, strategy: 'BALANCED', properties: [] },
        { id: 'ai1', name: "Gunnar", isAI: true, money: START_MONEY, position: 0, color: 'red', karma: 30, strategy: 'AGGRESSIVE', properties: [] },
        { id: 'ai2', name: "Ólafur", isAI: true, money: START_MONEY, position: 0, color: 'green', karma: 80, strategy: 'CONSERVATIVE', properties: [] },
        { id: 'ai3', name: "Sofandi", isAI: true, money: START_MONEY, position: 0, color: 'gray', karma: 50, strategy: 'AFK', properties: [] }
    ]);
  }, []);

  const nextTurn = () => {
    let nextIdx = currentPlayerIdx + 1;
    if (nextIdx >= players.length) {
        nextIdx = 0;
        setTurn(t => t + 1);
        if (turn % 4 === 0) {
             setYear(y => y + 1);
             setMarketTrend(Math.random() > 0.5 ? 'BULL' : 'BEAR');
             setCurrentNews(WEEKLY_NEWS[Math.floor(Math.random() * WEEKLY_NEWS.length)]);
        }
    }
    setCurrentPlayerIdx(nextIdx);
    setDiceRoll(null);
    if (players[nextIdx].isAI) setTimeout(() => rollDice(nextIdx), 1500);
  };

  const rollDice = (pIdx: number) => {
      setIsRolling(true);
      setTimeout(() => {
          const roll = Math.floor(Math.random() * 6) + 1;
          setDiceRoll(roll);
          setIsRolling(false);
          movePlayer(pIdx, roll);
      }, 1000);
  };

  const movePlayer = (pIdx: number, steps: number) => {
      setPlayers(prev => {
          const newPlayers = [...prev];
          const player = newPlayers[pIdx];
          let newPos = player.position + steps;
          if (newPos >= board.length) {
              newPos -= board.length;
              player.money += 20000;
              addLog(`${player.name} fór yfir Ræsingu (+20k).`, 'MONEY');
          }
          player.position = newPos;
          setTimeout(() => handleLand(player, board[newPos]), 500);
          return newPlayers;
      });
  };

  const handleLand = (player: Player, space: BoardSpace) => {
      addLog(`${player.name} lenti á ${space.name}`);
      if (space.type === 'PROPERTY') {
          if (!space.ownerId) {
              if (player.isAI) {
                  // AI Logic
                  if (player.strategy === 'AFK' && Math.random() < 0.8) {
                      addLog(`${player.name} (AFK) svaf á verðinum.`);
                      nextTurn();
                  } else if (player.money >= (space.price || 0)) {
                      buyProperty(player, space);
                  } else {
                      nextTurn();
                  }
              } else {
                  setShowPurchaseModal(space);
              }
          } else if (space.ownerId !== player.id) {
              // Rent
              const owner = players.find(p => p.id === space.ownerId);
              if (owner && space.rent) {
                  updateMoney(player.id, -space.rent);
                  updateMoney(owner.id, space.rent);
                  addLog(`${player.name} borgaði ${space.rent} í leigu.`, 'ALERT');
              }
              nextTurn();
          } else {
              nextTurn();
          }
      } else if (space.type === 'FISHING') {
          if (!player.isAI) {
              setFishingPlayerId(player.id);
              startFishing();
          } else {
              const catchAmt = Math.floor(Math.random() * 50000);
              updateMoney(player.id, catchAmt);
              addLog(`${player.name} veiddi fyrir ${catchAmt}.`, 'MONEY');
              nextTurn();
          }
      } else if (space.type === 'TAX') {
          updateMoney(player.id, -10000);
          addLog(`${player.name} borgaði skatt.`, 'ALERT');
          nextTurn();
      } else {
          nextTurn();
      }
  };

  const buyProperty = (player: Player, space: BoardSpace) => {
      if (!space.price) return;
      updateMoney(player.id, -space.price);
      setBoard(prev => prev.map(s => s.id === space.id ? { ...s, ownerId: player.id } : s));
      setPlayers(prev => prev.map(p => p.id === player.id ? { ...p, properties: [...p.properties, space.id] } : p));
      addLog(`${player.name} keypti ${space.name}.`, 'MONEY');
      if (!player.isAI) {
          setShowPurchaseModal(null);
          nextTurn();
      }
  };

  const updateMoney = (pid: string, amt: number) => {
      setPlayers(prev => prev.map(p => p.id === pid ? { ...p, money: p.money + amt } : p));
  };

  // Fishing Minigame
  const startFishing = () => {
      const grid: FishingTile[] = Array(9).fill(null).map((_, i) => ({
          id: i, status: 'HIDDEN',
          content: Math.random() > 0.6 ? 'FISH' : Math.random() < 0.1 ? 'DANGER' : 'EMPTY',
          value: Math.random() > 0.6 ? 25000 : -5000
      }));
      setFishingGrid(grid);
      setCurrentCatch(0);
      setIsFishing(true);
  };
  const fishTile = (tile: FishingTile) => {
      if (tile.status === 'REVEALED') return;
      setFishingGrid(g => g.map(t => t.id === tile.id ? { ...t, status: 'REVEALED' as const } : t));
      if (tile.content !== 'EMPTY') setCurrentCatch(c => c + tile.value);
  };
  const endFishing = () => {
      if (fishingPlayerId) updateMoney(fishingPlayerId, currentCatch);
      addLog(`Löndun: ${currentCatch}.`, 'MONEY');
      setIsFishing(false);
      nextTurn();
  };

  if (isFishing) {
      return (
        <div className="fixed inset-0 z-50 bg-slate-900 text-white flex items-center justify-center">
             <div className="max-w-lg w-full p-8">
                 <h2 className="text-3xl font-header text-center mb-8 text-yellow-100">Veiðislóð</h2>
                 <div className="grid grid-cols-3 gap-4 mb-8">
                     {fishingGrid.map(t => (
                         <button key={t.id} onClick={() => fishTile(t)} disabled={t.status === 'REVEALED'} className={`aspect-square border-2 rounded ${t.status === 'HIDDEN' ? 'bg-blue-600' : 'bg-slate-800'}`}>
                             {t.status === 'REVEALED' && (t.content === 'FISH' ? <Fish className="mx-auto text-green-400"/> : t.content === 'DANGER' ? <AlertTriangle className="mx-auto text-red-500"/> : null)}
                         </button>
                     ))}
                 </div>
                 <div className="text-center">
                     <div className="text-2xl font-typewriter mb-4">{currentCatch} kr.</div>
                     <button onClick={endFishing} className="btn-paper px-8 py-3 bg-yellow-600 text-white">Landa</button>
                 </div>
             </div>
        </div>
      );
  }

  // Board View Render
  return (
      <div className="min-h-screen flex flex-col">
          <div className="bg-header p-4 flex justify-between items-center shadow-md z-10">
              <div className="flex items-center gap-4">
                  <button onClick={onExit} className="btn-paper p-2 text-xs opacity-80 hover:opacity-100 flex items-center gap-1">
                        <ArrowRight className="rotate-180" size={14}/> Hætta
                  </button>
                  <div>
                    <div className="font-header text-xl">{players[0].name}</div>
                    <div className="text-money font-typewriter font-bold">{players[0].money.toLocaleString()} kr.</div>
                  </div>
              </div>
              <div className="flex flex-col items-center">
                  <div className="font-header">Vika {turn} - {year}</div>
                  <div className="text-xs opacity-70 flex gap-1">{marketTrend === 'BULL' ? <TrendingUp size={12}/> : <Minus/>} Markaður</div>
              </div>
              <div className="w-48 text-xs">
                  <div className="opacity-60 uppercase mb-1 flex items-center gap-1"><Newspaper size={10}/> Fréttir</div>
                  <div className="italic truncate">{currentNews}</div>
              </div>
          </div>
          
          <div className="flex-1 flex overflow-hidden">
              {/* Sidebar */}
              <div className="w-64 bg-black/5 p-4 border-r border-black/10 overflow-y-auto hidden md:block">
                  <h3 className="font-header mb-4 opacity-70">Spilarar</h3>
                  {players.map((p, i) => (
                      <div key={p.id} className={`p-3 rounded border mb-2 transition-all ${i === currentPlayerIdx ? 'bg-white shadow-md scale-105' : 'opacity-70 border-transparent'}`}>
                          <div className="flex justify-between font-bold mb-1">
                              {p.name} {i === currentPlayerIdx && <div className="w-2 h-2 rounded-full bg-red-500 animate-ping"/>}
                          </div>
                          <div className="text-xs font-typewriter">{p.money.toLocaleString()} kr.</div>
                      </div>
                  ))}
                  <div className="mt-8 border-t border-black/10 pt-4">
                      <h3 className="font-header mb-2 opacity-70">Dagbók</h3>
                      <div className="text-[10px] font-typewriter space-y-1 h-32 overflow-y-auto">
                          {logs.map(l => <div key={l.id} className={l.type === 'ALERT' ? 'text-red-700' : ''}>{l.text}</div>)}
                      </div>
                  </div>
              </div>

              {/* Main Board */}
              <div className="flex-1 p-8 overflow-y-auto flex flex-col items-center relative">
                   <div className="sticky top-0 mb-8 z-20">
                       {currentPlayerIdx === 0 && !isRolling && !showPurchaseModal && (
                           <button onClick={() => rollDice(0)} className="btn-paper px-8 py-4 text-xl shadow-xl hover:scale-105 transition-transform flex items-center gap-3">
                               <Dice5 size={24}/> Kasta
                           </button>
                       )}
                       {diceRoll && !isRolling && <div className="text-4xl font-header p-4 bg-white shadow rounded border border-current">{diceRoll}</div>}
                   </div>
                   
                   <div className="grid grid-cols-5 gap-3 max-w-4xl w-full">
                       {board.map(space => {
                           const isCurrent = space.id === players[currentPlayerIdx].position;
                           const owner = players.find(p => p.id === space.ownerId);
                           return (
                               <div key={space.id} className={`aspect-square p-2 border relative flex flex-col items-center justify-between text-center transition-all ${isCurrent ? 'scale-110 z-10 bg-white shadow-xl ring-2 ring-blue-500' : 'bg-white/50 opacity-90'}`} style={{ borderColor: owner ? owner.color : undefined, borderWidth: owner ? 2 : 1 }}>
                                   <div className="text-[10px] opacity-50">{space.type}</div>
                                   <div className="flex-1 flex flex-col justify-center items-center">
                                       <div className="mb-1 opacity-70">{space.icon}</div>
                                       <div className="text-xs font-bold leading-tight line-clamp-2">{space.name}</div>
                                   </div>
                                   <div className="flex gap-1 absolute top-1 right-1">
                                       {players.filter(p => p.position === space.id).map(p => (
                                           <div key={p.id} className="w-3 h-3 rounded-full border border-white shadow-sm" style={{ backgroundColor: p.color }}/>
                                       ))}
                                   </div>
                                   {space.type === 'PROPERTY' && <div className="text-[10px] w-full bg-black/5 rounded">{owner ? `L: ${space.rent}` : `${space.price}`}</div>}
                               </div>
                           );
                       })}
                   </div>
              </div>
          </div>
          
          {/* Purchase Modal */}
          {showPurchaseModal && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                  <div className="paper-card p-8 max-w-md w-full shadow-2xl">
                      <h2 className="text-2xl font-header mb-2">{showPurchaseModal.name}</h2>
                      <div className="text-sm opacity-70 font-typewriter mb-6">Til sölu fyrir {showPurchaseModal.price?.toLocaleString()} kr.</div>
                      <div className="flex gap-4">
                          <button onClick={() => buyProperty(players[0], showPurchaseModal)} disabled={players[0].money < (showPurchaseModal.price || 0)} className="flex-1 btn-paper py-3 bg-green-600 text-white border-none">Kaupa</button>
                          <button onClick={() => { setShowPurchaseModal(null); nextTurn(); }} className="flex-1 btn-paper py-3 bg-red-100 text-red-900 border-red-200">Sleppa</button>
                      </div>
                  </div>
              </div>
          )}
      </div>
  );
}


// --- Main App Switcher ---

function App() {
  const [view, setView] = useState<'SPLIT' | 'MODE_SELECT' | 'GAME'>('SPLIT');
  const [era, setEra] = useState<Era>('1920');
  const [gameMode, setGameMode] = useState<GameMode>('TYCOON');

  if (view === 'SPLIT') {
    return (
        <div className="flex h-screen w-full overflow-hidden">
            <div 
                className="w-1/2 h-full bg-[#f6f1e1] text-[#2c1810] flex flex-col items-center justify-center p-8 relative cursor-pointer hover:bg-[#eaddcf] transition-colors group border-r-4 border-[#3e2723]"
                onClick={() => { setEra('1920'); setView('MODE_SELECT'); }}
                style={{ fontFamily: "'Playfair Display', serif" }}
            >
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]"></div>
                <h1 className="text-6xl mb-4 font-bold tracking-widest group-hover:scale-110 transition-transform">1920</h1>
                <h2 className="text-2xl italic mb-8">Upphaf Útgerðar</h2>
                <Anchor size={64} className="text-[#3e2723] opacity-80" />
            </div>
            <div 
                className="w-1/2 h-full bg-[#0f172a] text-white flex flex-col items-center justify-center p-8 relative cursor-pointer hover:bg-[#1e293b] transition-colors group"
                onClick={() => { setEra('2020'); setView('MODE_SELECT'); }}
                style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
            >
                <h1 className="text-6xl mb-4 font-extrabold tracking-tight text-blue-400 group-hover:scale-110 transition-transform">2020</h1>
                <h2 className="text-2xl font-light mb-8 text-slate-300">Nútíma Tækni</h2>
                <Bot size={64} className="text-blue-500 opacity-80" />
            </div>
        </div>
    );
  }

  if (view === 'MODE_SELECT') {
      return (
          <GameWrapper era={era}>
              <div className="min-h-screen flex flex-col items-center justify-center p-8 relative">
                  <button onClick={() => setView('SPLIT')} className="absolute top-8 left-8 btn-paper px-4 py-2 flex items-center gap-2 text-xs">
                      <ArrowRight className="rotate-180" size={14}/> Til baka
                  </button>
                  
                  <h1 className="text-5xl font-header mb-12">Veldu Leikmáta</h1>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
                      <button 
                          onClick={() => { setGameMode('TYCOON'); setView('GAME'); }}
                          className="paper-card p-12 flex flex-col items-center text-center gap-6 hover:scale-105 transition-transform group"
                      >
                          <div className="w-24 h-24 bg-black/5 rounded-full flex items-center justify-center group-hover:bg-black/10 transition-colors">
                              <LayoutGrid size={48} className="text-accent"/>
                          </div>
                          <div>
                              <h2 className="text-3xl font-header mb-2">Útgerðarstjórn</h2>
                              <p className="opacity-70 font-typewriter">Stjórnaðu flotanum, keyptu skip, farðu á sjóinn og byggðu upp veldi.</p>
                          </div>
                          <div className="mt-4 px-4 py-1 bg-black/5 text-xs uppercase tracking-widest rounded-full">Upprunalega Útgáfan</div>
                      </button>

                      <button 
                          onClick={() => { setGameMode('BOARD'); setView('GAME'); }}
                          className="paper-card p-12 flex flex-col items-center text-center gap-6 hover:scale-105 transition-transform group"
                      >
                          <div className="w-24 h-24 bg-black/5 rounded-full flex items-center justify-center group-hover:bg-black/10 transition-colors">
                              <MapPinned size={48} className="text-accent"/>
                          </div>
                          <div>
                              <h2 className="text-3xl font-header mb-2">Spilaborð</h2>
                              <p className="opacity-70 font-typewriter">Kastaðu teningum, eignaðu þér reiti og sigraðu andstæðingana á borðinu.</p>
                          </div>
                          <div className="mt-4 px-4 py-1 bg-black/5 text-xs uppercase tracking-widest rounded-full">Nýja Útgáfan</div>
                      </button>
                  </div>
              </div>
          </GameWrapper>
      );
  }

  return (
      <GameWrapper era={era}>
          {gameMode === 'TYCOON' ? (
              <TycoonGame era={era} onExit={() => setView('MODE_SELECT')} />
          ) : (
              <BoardGame era={era} onExit={() => setView('MODE_SELECT')} />
          )}
      </GameWrapper>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);