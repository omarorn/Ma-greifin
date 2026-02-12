import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Ship, Anchor, Fish, Coins, User, Waves, Bot, Play, Sparkles, AlertTriangle, X, ScrollText, Save, Trash2, ArrowRight, ShoppingCart, Map, DollarSign, Search, Calendar, Briefcase, FileText, Wrench, Clock, Battery } from 'lucide-react';

// --- Configuration ---

const START_MONEY = 500000;
const DEPTH_METER_COST = 5000;
const SAVE_KEY = 'maigreifinn_split_v1';
const SEASONS = ["Vor", "Sumar", "Haust", "Vetur"];

// Parody Names & Data
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

type EventType = {
  id: string;
  title: string;
  text: string;
  type: 'BAD' | 'GOOD';
  effect: {
    money: number;
    rep: number;
    conditionDamage?: number; // Damage to the active ship
  }
};

const EVENTS: EventType[] = [
  { id: 'investigation', title: "Rannsóknarnefnd", text: "☠️ Hættuspil! Rannsóknarnefnd sjávarútvegsins mætir á svæðið.", effect: { money: 0, rep: -3 }, type: 'BAD' },
  { id: 'bank', title: "Bankinn hringir", text: "🏦 Útvegsspils-andi svífur yfir vötnum. Bankastjórinn vill sitt.", effect: { money: -25000, rep: 0 }, type: 'BAD' },
  { id: 'tire', title: "Rallýspil", text: "🏁 Rallýspil! Dekkið springur á bryggjubílnum og varahlutir tefjast. Skipið fær slæma meðferð.", effect: { money: 0, rep: 0, conditionDamage: 10 }, type: 'BAD' },
  { id: 'play', title: "Aktjóneri", text: "🎭 Leikritið í höfninni slær í gegn. Allir kátir.", effect: { money: 5000, rep: 2 }, type: 'GOOD' },
  { id: 'omar', title: "Ómar-style", text: "📻 „Þetta reddast“. Bjartsýni skilar sér í kassan.", effect: { money: 15000, rep: 1 }, type: 'GOOD' }
];

const MARKET_SHIPS = [
  { id: 1, name: "Trilla (Opinn)", type: 'TRILLA', price: 50000, capacity: 5, upkeep: 1000 },
  { id: 2, name: "Kvótakóngur", type: 'TRAWLER', price: 150000, capacity: 15, upkeep: 5000 },
  { id: 3, name: "MS Togglari", type: 'TRAWLER', price: 300000, capacity: 30, upkeep: 10000 },
  { id: 4, name: "Gullskipið", type: 'YACHT', price: 1000000, capacity: 50, upkeep: 25000 },
];

// --- Types ---

type GameView = 'SPLIT' | 'TITLE' | 'HQ' | 'MARKET' | 'FISHING';
type Era = '1920' | '2020';

interface ShipItem {
  id: string; // Unique ID
  modelId: number;
  name: string;
  type: string;
  condition: number; // 0-100%
  equipped: boolean; // Has depth meter?
}

interface LogEntry {
  id: number;
  timestamp: string; // "Vor 1955"
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

// --- Main Component ---

function App() {
  // State
  const [view, setView] = useState<GameView>('SPLIT');
  const [era, setEra] = useState<Era>('1920');
  const [companyName, setCompanyName] = useState("");
  const [money, setMoney] = useState(START_MONEY);
  const [ships, setShips] = useState<ShipItem[]>([]);
  
  // Time System
  const [year, setYear] = useState(1920);
  const [seasonIndex, setSeasonIndex] = useState(0); // 0=Vor, 1=Sumar, 2=Haust, 3=Vetur

  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  // Fishing State
  const [fishingGrid, setFishingGrid] = useState<FishingTile[]>([]);
  const [selectedShipId, setSelectedShipId] = useState<string | null>(null);
  const [currentCatch, setCurrentCatch] = useState(0);
  
  // UI State
  const [randomHint, setRandomHint] = useState("");

  // Initialize
  useEffect(() => {
    setRandomHint(COMPANY_NAMES[Math.floor(Math.random() * COMPANY_NAMES.length)]);

    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.companyName) {
            setCompanyName(data.companyName);
            setMoney(data.money);
            setShips(data.ships);
            setYear(data.year);
            setSeasonIndex(data.seasonIndex || 0);
            setLogs(data.logs);
            setEra(data.era || '1920');
            setView('HQ');
        }
      } catch(e) {}
    }
  }, []);

  // Autosave
  useEffect(() => {
    if (view !== 'SPLIT' && view !== 'TITLE') {
       const timer = setTimeout(() => {
          localStorage.setItem(SAVE_KEY, JSON.stringify({ companyName, money, ships, year, seasonIndex, logs, era }));
       }, 1000);
       return () => clearTimeout(timer);
    }
  }, [companyName, money, ships, year, seasonIndex, logs, view, era]);

  const getCurrentTimestamp = () => `${SEASONS[seasonIndex]} ${year}`;

  const addLog = (text: string, type: LogEntry['type'] = 'INFO') => {
      setLogs(prev => [{
          id: Date.now(),
          timestamp: getCurrentTimestamp(),
          text,
          type
      }, ...prev]);
  };

  const advanceTime = () => {
      setSeasonIndex(prev => {
          const next = prev + 1;
          if (next >= SEASONS.length) {
              setYear(y => y + 1);
              return 0;
          }
          return next;
      });
  };

  const handleSelectEra = (selectedEra: Era) => {
      setEra(selectedEra);
      setYear(parseInt(selectedEra));
      setView('TITLE');
  };

  const handleStartGame = () => {
      const finalName = companyName || randomHint;
      setCompanyName(finalName);
      addLog(`Útgerðin ${finalName} stofnuð (${era}).`, 'INFO');
      setView('HQ');
  };

  const handleBuyShip = (shipModel: typeof MARKET_SHIPS[0]) => {
      if (money >= shipModel.price) {
          setMoney(m => m - shipModel.price);
          const newShip: ShipItem = {
              id: Date.now().toString(),
              modelId: shipModel.id,
              name: SHIP_NAMES[Math.floor(Math.random() * SHIP_NAMES.length)] + ` ${Math.floor(Math.random() * 100)}`,
              type: shipModel.type,
              condition: 100,
              equipped: false
          };
          setShips(prev => [...prev, newShip]);
          addLog(`Keypti ${newShip.name} (${shipModel.name}) fyrir ${shipModel.price.toLocaleString()} kr.`, 'MONEY');
      }
  };

  const repairShip = (shipId: string) => {
      const ship = ships.find(s => s.id === shipId);
      if (!ship || ship.condition >= 100) return;
      
      const cost = Math.floor((100 - ship.condition) * 500); // 500kr per 1%
      if (money >= cost) {
          setMoney(m => m - cost);
          setShips(prev => prev.map(s => s.id === shipId ? { ...s, condition: 100 } : s));
          addLog(`Gerði við ${ship.name} fyrir ${cost.toLocaleString()} kr.`, 'MONEY');
      }
  };

  const startFishing = (shipId: string) => {
      const ship = ships.find(s => s.id === shipId);
      if (ship && ship.condition < 20) {
          alert("Skip er í of slæmu ástandi til að fara á sjó! Gerðu við það fyrst.");
          return;
      }

      setSelectedShipId(shipId);
      // Generate Grid
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
      addLog(`Hélt til veiða á ${ship?.name}.`, 'INFO');
  };

  const useDepthMeter = () => {
      if (money >= DEPTH_METER_COST) {
          setMoney(m => m - DEPTH_METER_COST);
          // Find unrevealed tiles
          const hidden = fishingGrid.filter(t => t.status === 'HIDDEN');
          if (hidden.length > 0) {
              const target = hidden[Math.floor(Math.random() * hidden.length)];
              setFishingGrid(prev => prev.map(t => t.id === target.id ? { ...t, status: 'REVEALED' } : t));
          }
      }
  };

  const fishTile = (tile: FishingTile) => {
      if (tile.status === 'REVEALED' && (tile.content === 'EMPTY' || tile.content === 'DANGER')) {
         // Fishing revealed bad tiles is allowed but usually has no gain or is bad
      }
      
      const updatedGrid = fishingGrid.map(t => t.id === tile.id ? { ...t, status: 'REVEALED' as const } : t);
      setFishingGrid(updatedGrid);

      if (tile.content === 'DANGER') {
          addLog("Hætta! Netin festust eða veður versnaði.", 'ALERT');
          setCurrentCatch(c => c - 5000);
          // Small immediate damage on danger tiles
          if (selectedShipId) {
             setShips(prev => prev.map(s => s.id === selectedShipId ? { ...s, condition: Math.max(0, s.condition - 5) } : s));
          }
      } else if (tile.content === 'FISH' || tile.content === 'BIG_CATCH') {
          setCurrentCatch(c => c + tile.value);
      }
  };

  const endFishing = () => {
      // Payout
      setMoney(m => m + currentCatch);
      addLog(`Löndun: ${currentCatch.toLocaleString()} kr. komu í kassann.`, 'MONEY');
      
      // Wear and tear (normal)
      if (selectedShipId) {
          setShips(prev => prev.map(s => s.id === selectedShipId ? { ...s, condition: Math.max(0, s.condition - 2) } : s));
      }

      // 20% Chance of Event
      if (Math.random() < 0.2) {
          const event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
          addLog(`${event.title}: ${event.text}`, 'EVENT');
          
          // Apply Money Effect
          if (event.effect.money !== 0) {
              setMoney(m => m + event.effect.money);
          }
          
          // Apply Condition Damage (Rallýspil)
          if (event.effect.conditionDamage && selectedShipId) {
              setShips(prev => prev.map(s => s.id === selectedShipId ? { 
                  ...s, 
                  condition: Math.max(0, s.condition - event.effect.conditionDamage!) 
              } : s));
          }
      }

      advanceTime();
      setView('HQ');
  };

  // --- Views ---

  if (view === 'SPLIT') {
      return (
          <div className="flex h-screen w-full overflow-hidden">
              {/* 1920 Side */}
              <div 
                  className="w-1/2 h-full bg-[#f6f1e1] text-[#2c1810] flex flex-col items-center justify-center p-8 relative cursor-pointer hover:bg-[#eaddcf] transition-colors group border-r-4 border-[#3e2723]"
                  onClick={() => handleSelectEra('1920')}
                  style={{ fontFamily: "'Playfair Display', serif" }}
              >
                  <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]"></div>
                  <h1 className="text-6xl mb-4 font-bold tracking-widest group-hover:scale-110 transition-transform">1920</h1>
                  <h2 className="text-2xl italic mb-8">Upphaf Útgerðar</h2>
                  <Anchor size={64} className="text-[#3e2723] opacity-80" />
                  <div className="mt-8 text-sm uppercase tracking-widest border-t border-b border-[#3e2723] py-2">Smelltu til að velja</div>
              </div>

              {/* 2020 Side */}
              <div 
                  className="w-1/2 h-full bg-[#0f172a] text-white flex flex-col items-center justify-center p-8 relative cursor-pointer hover:bg-[#1e293b] transition-colors group"
                  onClick={() => handleSelectEra('2020')}
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
              <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
                  <div className="absolute inset-0 opacity-5 pointer-events-none bg-current"></div>
                  
                  <div className="max-w-lg w-full text-center space-y-8 relative z-10">
                      <div className="space-y-2">
                          <h1 className="text-6xl font-header tracking-widest drop-shadow-sm">MAÍ GREIFINN</h1>
                          <div className="text-xl font-serif italic opacity-75">- Útvegsspilið {era} -</div>
                      </div>

                      <div className="paper-card p-8 rounded-sm transform rotate-1">
                          <label className="block text-left font-bold mb-2 font-header opacity-80">NAFN ÚTGERÐAR</label>
                          <input 
                              type="text" 
                              value={companyName}
                              onChange={(e) => setCompanyName(e.target.value)}
                              placeholder={`t.d. ${randomHint}`}
                              className="w-full bg-transparent border-b-2 border-current p-2 font-typewriter text-xl focus:outline-none placeholder-opacity-50"
                          />
                          <div className="text-left mt-2 text-xs opacity-60 font-serif italic">
                              Ábending: Prófaðu nöfn eins og „{randomHint}“.
                          </div>
                      </div>

                      <button 
                          onClick={handleStartGame}
                          className="btn-paper px-8 py-4 text-xl w-full hover:scale-[1.02] transition-transform flex items-center justify-center gap-3"
                      >
                          <Anchor size={24}/> Hefja Útgerð
                      </button>
                      
                      <button 
                          onClick={() => setView('SPLIT')}
                          className="text-xs uppercase tracking-widest opacity-50 hover:opacity-100 hover:underline"
                      >
                          ← Breyta Tímabili
                      </button>
                  </div>
              </div>
          </GameWrapper>
      );
  }

  // HEADER COMPONENT (Shared)
  const Header = () => (
      <header className="bg-header p-4 shadow-lg sticky top-0 z-50 flex justify-between items-center transition-colors duration-300">
          <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center border-2 border-current">
                  <Anchor size={24}/>
              </div>
              <div>
                  <h2 className="font-header text-xl tracking-wide leading-none">{companyName}</h2>
                  <div className="text-xs opacity-70 font-typewriter mt-1">Stofnað {era}</div>
              </div>
          </div>
          <div className="flex items-center gap-6">
              <div className="text-right">
                  <div className="text-xs opacity-60 uppercase">Sjóður</div>
                  <div className="font-typewriter text-xl text-money">{money.toLocaleString()} kr.</div>
              </div>
              <div className="text-right hidden sm:block">
                  <div className="text-xs opacity-60 uppercase">Tími</div>
                  <div className="font-header text-xl capitalize">{getCurrentTimestamp()}</div>
              </div>
          </div>
      </header>
  );

  if (view === 'HQ') {
      return (
          <GameWrapper era={era}>
              <div className="min-h-screen pb-12">
                  <Header />
                  
                  <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Left Column: Fleet */}
                      <div className="md:col-span-2 space-y-6">
                          <div className="flex justify-between items-end border-b-2 border-current pb-2 mb-4 opacity-80">
                              <h3 className="font-header text-2xl flex items-center gap-2">
                                  <Ship className="text-accent"/> Flotinn
                              </h3>
                              <button onClick={() => setView('MARKET')} className="btn-paper px-4 py-2 text-sm flex items-center gap-2">
                                  <ShoppingCart size={14}/> Skipamarkaður
                              </button>
                          </div>

                          {ships.length === 0 ? (
                              <div className="paper-card p-8 text-center opacity-70 italic">
                                  Engin skip í flota. Farðu á markaðinn til að hefja rekstur.
                              </div>
                          ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  {ships.map(ship => (
                                      <div key={ship.id} className="paper-card relative group flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg">
                                          {/* Decorative 'Hole Punch' or Stamp for vintage feel */}
                                          {era !== '2020' && (
                                              <div className="absolute top-2 right-2 w-16 h-16 border-4 border-red-900/10 rounded-full flex items-center justify-center transform rotate-12 pointer-events-none">
                                                  <span className="text-[8px] font-bold text-red-900/20 uppercase text-center leading-none">Skráð<br/>Ísland</span>
                                              </div>
                                          )}

                                          {/* Header Strip */}
                                          <div className={`px-4 py-2 border-b border-black/10 flex justify-between items-center ${era === '2020' ? 'bg-slate-100/50' : 'bg-[#efebe0]'}`}>
                                              <div className="flex items-center gap-2">
                                                  <Ship size={14} className="opacity-50"/>
                                                  <span className="text-[10px] font-bold opacity-60 font-typewriter tracking-widest">
                                                      {era === '2020' ? 'ID:' : 'NR:'} {ship.id.slice(-4)}
                                                  </span>
                                              </div>
                                              <div className={`text-[10px] px-2 py-0.5 rounded font-bold ${era === '2020' ? 'bg-blue-100 text-blue-800' : 'bg-[#d7ccc8] text-[#3e2723]'}`}>
                                                  {ship.type}
                                              </div>
                                          </div>

                                          <div className="p-5 space-y-4">
                                              {/* Name */}
                                              <div>
                                                  <label className="text-[9px] uppercase tracking-wider opacity-50 block mb-1">
                                                      {era === '2020' ? 'Vessel Name' : 'Heiti Skips'}
                                                  </label>
                                                  <h4 className="font-header text-2xl font-bold leading-none">{ship.name}</h4>
                                              </div>

                                              {/* Data Table */}
                                              <div className={`grid grid-cols-2 gap-px ${era === '2020' ? 'bg-slate-200' : 'bg-[#d7ccc8]'} border border-transparent opacity-80 rounded overflow-hidden`}>
                                                   <div className={`${era === '2020' ? 'bg-white' : 'bg-[#fbf9f5]'} p-2`}>
                                                       <span className="block text-[9px] opacity-50 uppercase">Ástand</span>
                                                       <span className={`font-typewriter font-bold ${ship.condition < 50 ? 'text-red-600' : ''}`}>{ship.condition}%</span>
                                                   </div>
                                                   <div className={`${era === '2020' ? 'bg-white' : 'bg-[#fbf9f5]'} p-2`}>
                                                       <span className="block text-[9px] opacity-50 uppercase">Tæknibúnaður</span>
                                                       <span className="font-typewriter font-bold">{era === '2020' ? (ship.equipped ? 'Sonar' : 'Enginn') : (ship.equipped ? 'Dýptarm.' : 'Enginn')}</span>
                                                   </div>
                                              </div>

                                              {/* Action Area */}
                                              <div className="pt-2 flex items-center justify-end gap-2 mt-2">
                                                  {ship.condition < 100 && (
                                                      <button 
                                                          onClick={() => repairShip(ship.id)} 
                                                          className="text-xs underline decoration-dotted text-blue-600 hover:text-blue-800 flex items-center gap-1 mr-auto"
                                                      >
                                                          <Wrench size={12} /> <span className="hidden sm:inline">Viðgerð</span>
                                                      </button>
                                                  )}
                                                  
                                                  <button 
                                                      onClick={() => startFishing(ship.id)}
                                                      className="btn-paper px-4 py-2 text-xs flex items-center gap-2 hover:translate-y-[-1px]"
                                                  >
                                                      <Waves size={14}/> 
                                                      <span>{era === '2020' ? 'Veiða' : 'Á Sjó'}</span>
                                                  </button>
                                              </div>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          )}
                      </div>

                      {/* Right Column: Logbook */}
                      <div className="space-y-4">
                           <div className="flex items-center justify-between border-b-2 border-current pb-2 opacity-80">
                              <h3 className="font-header text-xl flex items-center gap-2">
                                  <FileText className="text-accent"/> Dagbók
                              </h3>
                           </div>
                           
                           <div className="paper-card p-4 min-h-[400px] max-h-[600px] overflow-y-auto font-typewriter text-sm space-y-4">
                               {logs.length === 0 && <div className="text-center opacity-50 italic pt-10">Bókin er auð...</div>}
                               {logs.map(log => (
                                   <div key={log.id} className="border-b border-black/10 pb-2 last:border-0">
                                       <div className="text-[10px] opacity-60 uppercase tracking-wider mb-1 flex items-center gap-2">
                                           <span>{log.timestamp}</span>
                                           <div className="h-px flex-1 bg-current opacity-20"></div>
                                       </div>
                                       <div className={`${
                                           log.type === 'MONEY' ? 'text-money font-bold' : 
                                           log.type === 'ALERT' ? 'text-red-600 font-bold' : 
                                           log.type === 'EVENT' ? 'text-orange-600 font-bold' : ''
                                       }`}>
                                           {log.text}
                                       </div>
                                   </div>
                               ))}
                           </div>
                      </div>

                  </main>
              </div>
          </GameWrapper>
      );
  }

  if (view === 'MARKET') {
      return (
          <GameWrapper era={era}>
              <div className="min-h-screen pb-12">
                  <Header />
                  <main className="max-w-4xl mx-auto p-6">
                      <div className="flex items-center gap-4 mb-6">
                          <button onClick={() => setView('HQ')} className="btn-paper p-2 rounded-full">
                              <ArrowRight className="rotate-180" size={20}/>
                          </button>
                          <h2 className="font-header text-3xl text-accent">SKIPAMARKAÐUR</h2>
                      </div>

                      <div className="space-y-4">
                          {MARKET_SHIPS.map(model => (
                              <div key={model.id} className="paper-card p-6 flex flex-col sm:flex-row items-center gap-6">
                                  <div className="w-32 h-24 bg-black/5 border border-black/10 flex items-center justify-center text-accent">
                                      <Ship size={48} strokeWidth={1}/>
                                  </div>
                                  <div className="flex-1 text-center sm:text-left">
                                      <h3 className="font-header text-xl font-bold">{model.name}</h3>
                                      <div className="text-sm opacity-70 font-typewriter mt-1">
                                          Burðargeta: {model.capacity} tonn | Viðhald: {model.upkeep} kr/ár
                                      </div>
                                  </div>
                                  <div className="text-right">
                                      <div className="font-header text-2xl mb-2">{model.price.toLocaleString()} kr.</div>
                                      <button 
                                          onClick={() => handleBuyShip(model)}
                                          disabled={money < model.price}
                                          className="btn-paper w-full py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                          KAUPA
                                      </button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </main>
              </div>
          </GameWrapper>
      );
  }

  if (view === 'FISHING') {
      return (
          <GameWrapper era={era}>
            <div className={`min-h-screen relative text-white ${era === '2020' ? 'bg-slate-900' : 'bg-[#001020]'}`}>
                  <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/nautical-leather.png')]"></div>
                  
                  <div className="relative z-10 max-w-2xl mx-auto p-6 flex flex-col h-screen">
                      
                      {/* Fishing Header */}
                      <div className="flex justify-between items-center mb-8 bg-black/40 backdrop-blur p-4 border border-white/20 rounded-sm shadow-xl">
                          <div>
                              <h2 className="font-header text-xl text-yellow-100">Á VEIÐUM</h2>
                              <div className="text-xs text-white/70">{ships.find(s => s.id === selectedShipId)?.name}</div>
                          </div>
                          <div className="text-right">
                              <div className="text-xs text-white/70">Afli í lest</div>
                              <div className="font-typewriter text-2xl text-green-400">{currentCatch.toLocaleString()} kr.</div>
                          </div>
                      </div>

                      {/* Grid */}
                      <div className="flex-1 flex items-center justify-center">
                          <div className="grid grid-cols-3 gap-3 w-full max-w-md aspect-square">
                              {fishingGrid.map((tile) => (
                                  <button
                                      key={tile.id}
                                      onClick={() => fishTile(tile)}
                                      disabled={tile.status === 'REVEALED'}
                                      className={`relative rounded-sm border-2 transition-all duration-500 overflow-hidden ${
                                          tile.status === 'HIDDEN' 
                                          ? (era === '2020' ? 'bg-blue-600 border-blue-500 hover:bg-blue-500' : 'bg-[#0d47a1] border-[#1565c0] hover:bg-[#1565c0]') 
                                          : 'bg-[#f6f1e1] border-[#8d6e63]'
                                      }`}
                                  >
                                      {tile.status === 'HIDDEN' ? (
                                          <div className="absolute inset-0 flex items-center justify-center opacity-20">
                                              <Waves size={32} className="text-white animate-pulse"/>
                                          </div>
                                      ) : (
                                          <div className="flex flex-col items-center justify-center h-full animate-[fadeIn_0.5s] text-slate-900">
                                              {tile.content === 'EMPTY' && <div className="text-[#a1887f] font-typewriter text-xs">Tómt</div>}
                                              {tile.content === 'FISH' && <Fish size={32} className="text-[#1b5e20] mb-1"/>}
                                              {tile.content === 'BIG_CATCH' && <div className="text-[#f57f17]"><Fish size={40}/><Sparkles size={16} className="absolute top-2 right-2"/></div>}
                                              {tile.content === 'DANGER' && <AlertTriangle size={32} className="text-[#b71c1c]"/>}
                                              
                                              {tile.value !== 0 && (
                                                  <div className={`text-xs font-bold mt-1 ${tile.value > 0 ? 'text-[#1b5e20]' : 'text-[#b71c1c]'}`}>
                                                      {tile.value > 0 ? '+' : ''}{tile.value.toLocaleString()}
                                                  </div>
                                              )}
                                          </div>
                                      )}
                                  </button>
                              ))}
                          </div>
                      </div>

                      {/* Controls */}
                      <div className="mt-8 space-y-4">
                          <div className="flex gap-4">
                              <button 
                                  onClick={useDepthMeter}
                                  disabled={money < DEPTH_METER_COST}
                                  className="flex-1 btn-paper py-4 bg-slate-800 border-slate-700 text-slate-200 flex flex-col items-center justify-center gap-1 hover:bg-slate-700 disabled:opacity-50"
                              >
                                  <div className="flex items-center gap-2">
                                      <Search size={18} /> {era === '2020' ? 'SONAR SKANNI' : 'DÝPTARMÆLIR'}
                                  </div>
                                  <div className="text-[10px] text-slate-400">-5.000 kr. / notkun</div>
                              </button>
                              
                              <button 
                                  onClick={endFishing}
                                  className="flex-1 btn-paper py-4 bg-green-900 border-green-800 text-white flex flex-col items-center justify-center gap-1 hover:bg-green-800"
                              >
                                  <div className="flex items-center gap-2">
                                      <Anchor size={18} /> LANDA & HEIM
                                  </div>
                                  <div className="text-[10px] text-green-300">Ljúka veiðiferð</div>
                              </button>
                          </div>
                      </div>

                  </div>
              </div>
          </GameWrapper>
      );
  }

  return null;
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);