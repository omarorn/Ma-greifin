import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";
import { Ship, Anchor, Fish, Utensils, Skull, Dice5, Coins, User, Waves, MapPin, Sailboat, LifeBuoy, TrendingUp, TrendingDown, Settings, Bot, Play, Info } from 'lucide-react';

// --- Constants & Types ---

const BOARD_SIZE = 16;
const START_MONEY = 1000;
const START_HUNGER = 0;
const MAX_HUNGER = 10;

type SpaceType = 'START' | 'BOAT' | 'RESTAURANT' | 'CHANCE' | 'STORM' | 'JAIL';
type BoatType = 'TRAWLER' | 'SAILBOAT' | 'DINGHY' | 'YACHT';

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
  text: string;
  type: 'info' | 'alert' | 'success';
}

interface MarketState {
  fishPrice: number;
  meatPrice: number;
  trend: 'STABLE' | 'BOOM' | 'CRASH';
}

const INITIAL_BOARD: BoardSpace[] = [
  { id: 0, name: "Reykjavík Harbor", type: 'START', description: "Start here. Collect 200kr." },
  { id: 1, name: "Jón Páll", type: 'BOAT', price: 100, rent: 20, description: "Sturdy little boat." },
  { id: 2, name: "Sjómannalífið", type: 'CHANCE', description: "Fate of the sea." },
  { id: 3, name: "Kjallarinn", type: 'RESTAURANT', price: 150, rent: 30, description: "Smells like mutton." },
  { id: 4, name: "Gunnvör", type: 'BOAT', price: 180, rent: 35, description: "Fastest in the Westfjords." },
  { id: 5, name: "Stormur", type: 'STORM', description: "Hold onto your hats." },
  { id: 6, name: "Humarvagninn", type: 'RESTAURANT', price: 200, rent: 40, description: "Langoustine dreams." },
  { id: 7, name: "Sæbjörg", type: 'BOAT', price: 220, rent: 45, description: "Old school charm." },
  { id: 8, name: "Grandagarður", type: 'START', description: "A quiet pier." },
  { id: 9, name: "Harpa", type: 'BOAT', price: 240, rent: 50, description: "Modern and sleek." },
  { id: 10, name: "Sjómannalífið", type: 'CHANCE', description: "Fate of the sea." },
  { id: 11, name: "Sægreifinn", type: 'RESTAURANT', price: 350, rent: 70, description: "The Sea Baron waits." },
  { id: 12, name: "Sjóli", type: 'BOAT', price: 260, rent: 55, description: "Reliable trawler." },
  { id: 13, name: "Sea Jail", type: 'JAIL', description: "Tangled in seaweed." },
  { id: 14, name: "Moby Dick", type: 'BOAT', price: 300, rent: 60, description: "Looking for Ahab." },
  { id: 15, name: "Bryggjan", type: 'RESTAURANT', price: 280, rent: 60, description: "Brew and bites." },
];

const DEFAULT_PLAYERS: Player[] = [
  { id: 0, name: "Skipper One", color: "bg-orange-500", position: 0, money: START_MONEY, hunger: START_HUNGER, isJailed: false, inventory: [], isAi: false, boatType: 'TRAWLER' },
  { id: 1, name: "AI Baron", color: "bg-cyan-400", position: 0, money: START_MONEY, hunger: START_HUNGER, isJailed: false, inventory: [], isAi: true, boatType: 'DINGHY' },
];

// --- Helpers ---

const getAi = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Components ---

function App() {
  const [view, setView] = useState<'LOBBY' | 'GAME'>('LOBBY');
  const [players, setPlayers] = useState<Player[]>(DEFAULT_PLAYERS);
  const [board, setBoard] = useState<BoardSpace[]>(INITIAL_BOARD);
  
  const [turn, setTurn] = useState(0);
  const [round, setRound] = useState(1);
  const [gameState, setGameState] = useState<'IDLE' | 'MOVING' | 'EVENT' | 'GAME_OVER' | 'AI_THINKING'>('IDLE');
  const [logs, setLogs] = useState<GameLog[]>([]);
  const [currentEvent, setCurrentEvent] = useState<{ title: string, text: string, image?: string, effect?: number } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [market, setMarket] = useState<MarketState>({ fishPrice: 1.0, meatPrice: 1.0, trend: 'STABLE' });

  const logsEndRef = useRef<HTMLDivElement>(null);
  const currentPlayer = players[turn];

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    if (turn === 0 && round > 1) {
      updateMarket();
    }
  }, [round]);

  useEffect(() => {
    if (view === 'GAME' && currentPlayer.isAi && gameState === 'IDLE') {
      const runAiTurn = async () => {
        setGameState('AI_THINKING');
        await new Promise(r => setTimeout(r, 1200));
        handleRoll(true);
      };
      runAiTurn();
    }
  }, [turn, view, gameState]);

  const addLog = (text: string, type: 'info' | 'alert' | 'success' = 'info') => {
    setLogs(prev => [...prev, { text: String(text), type }]);
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
      addLog("Market BOOM! High demand for Icelandic proteins!", 'success');
    } else if (r < 0.15) {
      trend = 'CRASH';
      newFish = 0.5;
      newMeat = 0.6;
      addLog("Market CRASH! The ships stay in port.", 'alert');
    } else {
      newFish = 0.8 + Math.random() * 0.4;
      newMeat = 0.8 + Math.random() * 0.4;
    }

    setMarket({ fishPrice: Number(newFish.toFixed(2)), meatPrice: Number(newMeat.toFixed(2)), trend });
  };

  const generatePropertyImage = async (spaceId: number, name: string, type: string) => {
    try {
      addLog(`Capturing the essence of ${name}...`, 'info');
      const ai = getAi();
      
      const imagePromise = ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: `A gritty, colorful, oil painting of an Icelandic ${type.toLowerCase()} named "${name}" in a foggy harbor. Muted teal, rusty orange, thick oil paint texture.` }]
        },
        config: { imageConfig: { aspectRatio: "1:1", imageSize: "1K" } }
      });

      const textPromise = ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Write a 1-sentence witty atmospheric description in Icelandic for a board game space named "${name}" which is a ${type === 'BOAT' ? 'boat' : 'restaurant'}. Keep it very short.`
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
      addLog(`${name} updated with visual logs.`, 'success');
    } catch (e) {
      console.error(e);
      addLog(`Failed to draw ${name}.`, 'alert');
    }
  };

  const triggerChanceEvent = async () => {
    setAiLoading(true);
    setGameState('EVENT');
    const ai = getAi();
    
    try {
      const textResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Write a short, funny random event for an Icelandic fishing game. Return JSON: {title: string, description: string, effect: number}.",
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
          parts: [{ text: `An artistic illustration of: ${eventData.description}. Icelandic moody style.` }]
        },
        config: { imageConfig: { aspectRatio: "1:1", imageSize: "1K" } }
      });

      let imageUrl = "";
      for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) imageUrl = `data:image/png;base64,${part.inlineData.data}`;
      }

      setCurrentEvent({
        title: String(eventData.title || "Sea Mystery"),
        text: String(eventData.description || "A strange fog rolls in..."),
        image: imageUrl,
        effect: Number(eventData.effect || 0)
      });
    } catch (e) {
      console.error(e);
      setCurrentEvent({ title: "Calm Seas", text: "Nothing happened this time.", effect: 0 });
    } finally {
      setAiLoading(false);
    }
  };

  const handleRoll = async (isAi = false) => {
    if (gameState !== 'IDLE' && gameState !== 'AI_THINKING') return;
    setGameState('MOVING');

    const roll = Math.floor(Math.random() * 6) + 1;
    addLog(`${currentPlayer.name} rolled a ${roll}.`);
    await new Promise(r => setTimeout(r, 600));

    let newPos = (currentPlayer.position + roll) % BOARD_SIZE;
    
    if (newPos < currentPlayer.position) {
      addLog(`${currentPlayer.name} passed Harbor. +200kr`, 'success');
      updatePlayer(turn, { money: currentPlayer.money + 200, hunger: Math.max(0, currentPlayer.hunger - 1) });
      if (turn === players.length - 1) setRound(r => r + 1);
    }

    updatePlayer(turn, { position: newPos, hunger: currentPlayer.hunger + 1 });
    
    if (currentPlayer.hunger + 1 >= MAX_HUNGER) {
      addLog(`${currentPlayer.name} passed out from hunger!`, 'alert');
      updatePlayer(turn, { position: 0, money: Math.max(0, currentPlayer.money - 50), hunger: 0 });
      newPos = 0;
    }

    const space = board[newPos];
    handleLandOnSpace(space, newPos, isAi);
  };

  const handleLandOnSpace = async (space: BoardSpace, pos: number, isAi: boolean) => {
    if ((space.type === 'BOAT' || space.type === 'RESTAURANT') && !space.imageUrl && !space.isGenerated) {
       generatePropertyImage(space.id, space.name, space.type);
    }

    if (space.type === 'CHANCE') {
      await triggerChanceEvent();
      if (isAi) setTimeout(() => resolveEvent(true), 2500);
    } else if (space.type === 'STORM') {
      addLog("Caught in a storm! -50kr", 'alert');
      updatePlayer(turn, { money: Math.max(0, currentPlayer.money - 50), hunger: currentPlayer.hunger + 1 });
      endTurn(isAi);
    } else if (space.type === 'JAIL') {
      addLog("Grounded at the pier.", 'alert');
      endTurn(isAi);
    } else if (space.type === 'BOAT' || space.type === 'RESTAURANT') {
      if (space.owner === undefined || space.owner === null) {
        if (isAi) {
           const price = space.price || 0;
           if (currentPlayer.money > (price + 250) && Math.random() > 0.4) {
             setTimeout(() => buyProperty(true), 800);
           } else {
             setTimeout(() => endTurn(true), 800);
           }
        } else {
           setGameState('IDLE');
           addLog(`${space.name} is available for ${space.price}kr.`);
        }
      } else if (space.owner !== turn) {
        const owner = players[space.owner];
        const baseRent = space.rent || 0;
        let finalRent = Math.floor(baseRent * (space.type === 'BOAT' ? market.fishPrice : market.meatPrice));
        
        addLog(`Paid ${owner.name} ${finalRent}kr in port fees.`, 'alert');
        
        let newHunger = currentPlayer.hunger;
        if (space.type === 'RESTAURANT') {
          addLog("Hunger satisfied. -2 hunger.", 'success');
          newHunger = Math.max(0, newHunger - 2);
        }

        updatePlayer(turn, { money: Math.max(0, currentPlayer.money - finalRent), hunger: newHunger });
        updatePlayer(space.owner, { money: owner.money + finalRent });
        endTurn(isAi);
      } else {
         addLog(`Relaxing at your own ${space.name}.`);
         if (space.type === 'RESTAURANT') updatePlayer(turn, { hunger: Math.max(0, currentPlayer.hunger - 2) });
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
      addLog(`${players[turn].name} acquired ${space.name}!`, 'success');
      endTurn(isAi);
    } else if (!isAi) {
      addLog("Insufficient króna.", 'alert');
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
    }, isAi ? 1000 : 0);
  };

  const updatePlayer = (idx: number, updates: Partial<Player>) => {
    setPlayers(prev => prev.map((p, i) => i === idx ? { ...p, ...updates } : p));
  };

  const startGame = () => setView('GAME');

  const updateLobbyPlayer = (id: number, field: keyof Player, value: any) => {
     setPlayers(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const addPlayer = () => {
    const newId = players.length;
    if (newId >= 4) return;
    setPlayers([...players, { ...DEFAULT_PLAYERS[1], id: newId, name: `Skipper ${newId + 1}`, isAi: true }]);
  };

  const removePlayer = (id: number) => {
    if (players.length <= 2) return;
    setPlayers(players.filter(p => p.id !== id));
  };

  if (view === 'LOBBY') {
    return (
      <div className="min-h-screen bg-[#2d5a68] flex items-center justify-center p-4">
        <div className="bg-[#e8dac0] p-8 rounded-xl shadow-2xl max-w-2xl w-full border-4 border-[#c17c5b]">
          <h1 className="text-5xl font-serif font-bold text-[#2d5a68] text-center mb-8">Maígreifinn</h1>
          <div className="space-y-4 mb-8">
            {players.map((p) => (
              <div key={p.id} className="bg-white/50 p-4 rounded-lg flex items-center gap-4 border border-[#2d5a68]/20">
                <div className={`w-12 h-12 rounded-full ${p.color} flex items-center justify-center text-white shadow`}>
                   <BoatIcon type={p.boatType} />
                </div>
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <input className="bg-white border p-1 rounded text-sm" value={p.name} onChange={(e) => updateLobbyPlayer(p.id, 'name', e.target.value)} />
                  <select className="bg-white border p-1 rounded text-sm" value={p.isAi ? 'AI' : 'HUMAN'} onChange={(e) => updateLobbyPlayer(p.id, 'isAi', e.target.value === 'AI')}>
                    <option value="HUMAN">Human</option>
                    <option value="AI">AI</option>
                  </select>
                </div>
                {players.length > 2 && <button onClick={() => removePlayer(p.id)} className="text-red-500"><Skull size={18} /></button>}
              </div>
            ))}
          </div>
          <div className="flex gap-4">
            <button onClick={addPlayer} className="flex-1 py-3 border-2 border-[#2d5a68] rounded font-bold">Add Skipper</button>
            <button onClick={startGame} className="flex-[2] py-3 bg-[#c17c5b] text-white rounded font-bold shadow-lg">Set Sail</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#2d5a68] text-[#1a3c46] font-sans p-4 flex flex-col items-center">
      <header className="w-full max-w-6xl flex justify-between items-center mb-6 bg-[#e8dac0] px-6 py-4 rounded-lg shadow-lg border-b-4 border-[#c17c5b]">
        <div className="flex items-center gap-2">
          <Anchor className="text-[#2d5a68]" size={28} />
          <h1 className="text-2xl font-serif font-bold text-[#2d5a68]">Maígreifinn</h1>
        </div>
        <div className="flex gap-4 items-center bg-white/40 px-3 py-1 rounded-full text-xs font-mono">
           <div className="flex items-center gap-1"><Fish size={14}/> {Math.round(market.fishPrice * 100)}%</div>
           <div className="flex items-center gap-1"><Utensils size={14}/> {Math.round(market.meatPrice * 100)}%</div>
           <span className={market.trend === 'BOOM' ? 'text-green-700 font-bold' : market.trend === 'CRASH' ? 'text-red-700 font-bold' : ''}>{market.trend}</span>
        </div>
        <div className="flex gap-1">
          {players.map((p, i) => (
            <div key={p.id} className={`p-1 px-2 rounded-full border-2 transition-all ${turn === i ? 'border-[#c17c5b] bg-white scale-105 shadow' : 'border-transparent opacity-60'}`}>
              <div className={`w-3 h-3 rounded-full ${p.color}`} />
            </div>
          ))}
        </div>
      </header>

      <main className="w-full max-w-7xl flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <RenderBoard board={board} players={players} />
        </div>
        <div className="w-full lg:w-80 flex flex-col gap-4">
          <div className="bg-[#e8dac0] p-4 rounded-xl shadow border-2 border-[#c17c5b]">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-6 h-6 rounded-full ${currentPlayer.color} flex items-center justify-center text-white`}>
                <BoatIcon type={currentPlayer.boatType} />
              </div>
              <span className="font-bold">{String(currentPlayer.name)}</span>
            </div>
            <div className="text-xs space-y-1 mb-4">
              <div className="flex justify-between"><span>Wallet:</span> <span className="font-bold">{currentPlayer.money}kr</span></div>
              <div className="flex justify-between"><span>Hunger:</span> <span className="font-bold">{currentPlayer.hunger}/{MAX_HUNGER}</span></div>
            </div>
            {gameState === 'IDLE' && !currentPlayer.isAi && (
              <div className="space-y-2">
                {board[currentPlayer.position].owner === null && board[currentPlayer.position].price ? (
                  <div className="flex gap-2">
                    <button onClick={() => buyProperty(false)} disabled={currentPlayer.money < (board[currentPlayer.position].price || 0)} className="flex-1 bg-[#2d5a68] text-white py-2 rounded text-sm disabled:opacity-50">Buy</button>
                    <button onClick={() => endTurn(false)} className="flex-1 border border-[#2d5a68] py-2 rounded text-sm">Pass</button>
                  </div>
                ) : (
                  <button onClick={() => handleRoll(false)} className="w-full bg-[#c17c5b] text-white py-3 rounded font-bold flex items-center justify-center gap-2">
                    <Dice5 size={20} /> Roll
                  </button>
                )}
              </div>
            )}
            {currentPlayer.isAi && <div className="text-center text-xs italic animate-pulse">Skipper is plotting...</div>}
          </div>
          <div className="bg-white/80 p-3 rounded shadow flex-1 overflow-hidden flex flex-col min-h-[250px]">
            <h3 className="text-xs font-bold uppercase border-b mb-2">Logs</h3>
            <div className="overflow-y-auto space-y-1 flex-1 pr-1">
              {logs.map((log, i) => (
                <div key={i} className={`text-[10px] p-1.5 rounded ${log.type === 'alert' ? 'bg-red-100 text-red-700' : log.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                  {String(log.text)}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>
      </main>

      {(currentEvent || aiLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-[#e8dac0] rounded-lg shadow-2xl max-w-sm w-full border-2 border-[#c17c5b] overflow-hidden">
            {aiLoading ? (
              <div className="p-8 flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#c17c5b]"></div>
                <p className="text-sm italic">Gazing into the deep...</p>
              </div>
            ) : (
              <div>
                <div className="h-40 bg-[#2d5a68] flex items-center justify-center">
                  {currentEvent?.image ? <img src={currentEvent.image} className="w-full h-full object-cover" /> : <Waves size={40} className="text-white/20"/>}
                </div>
                <div className="p-4">
                  <h3 className="font-bold mb-2">{String(currentEvent?.title)}</h3>
                  <p className="text-sm mb-4 leading-snug">{String(currentEvent?.text)}</p>
                  {currentEvent?.effect !== 0 && <div className={`text-center font-bold mb-4 ${currentEvent?.effect! > 0 ? 'text-green-600' : 'text-red-600'}`}>{currentEvent?.effect! > 0 ? '+' : ''}{currentEvent?.effect} kr</div>}
                  {!currentPlayer.isAi && <button onClick={() => resolveEvent(false)} className="w-full bg-[#2d5a68] text-white py-2 rounded">Understood</button>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const BoatIcon = ({ type }: { type: BoatType }) => {
  if (type === 'SAILBOAT') return <Sailboat size={18} />;
  if (type === 'DINGHY') return <LifeBuoy size={18} />;
  if (type === 'YACHT') return <Anchor size={18} />;
  return <Ship size={18} />;
};

const RenderBoard = ({ board, players }: { board: BoardSpace[], players: Player[] }) => {
    const top = board.slice(0, 5);
    const right = board.slice(5, 8);
    const bottom = [...board.slice(8, 13)].reverse();
    const left = [...board.slice(13, 16)].reverse();

    return (
      <div className="relative bg-[#e8dac0] p-3 rounded-lg shadow-xl border-4 border-[#2d5a68] max-w-3xl mx-auto aspect-square flex flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-5">
          <Anchor size={200} />
        </div>
        <div className="flex justify-between gap-1 z-10">{top.map(s => <Space key={s.id} space={s} players={players} />)}</div>
        <div className="flex justify-between flex-1 py-1 z-10">
          <div className="flex flex-col justify-between gap-1">{left.map(s => <Space key={s.id} space={s} players={players} vertical />)}</div>
          <div className="flex flex-col justify-between gap-1">{right.map(s => <Space key={s.id} space={s} players={players} vertical />)}</div>
        </div>
        <div className="flex justify-between gap-1 z-10">{bottom.map(s => <Space key={s.id} space={s} players={players} />)}</div>
      </div>
    );
};

// Removed 'key' from prop types
const Space = ({ space, players, vertical = false }: { space: BoardSpace, players: Player[], vertical?: boolean }) => {
  const [show, setShow] = useState(false);
  const playersHere = players.filter(p => p.position === space.id);
  
  return (
    <div className={`relative flex-1 bg-white border border-[#2d5a68]/20 rounded p-1 flex flex-col justify-between items-center text-center overflow-hidden transition-transform hover:scale-105 hover:z-20 ${vertical ? 'min-h-[60px]' : 'min-w-[60px]'}`}>
      {space.imageUrl && <img src={space.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none" />}
      <div className="relative z-10 text-[8px] font-bold uppercase truncate w-full">{String(space.name)}</div>
      
      <div className="relative z-10">
         {space.type === 'BOAT' && <Ship size={14} className="text-blue-700" />}
         {space.type === 'RESTAURANT' && <Utensils size={14} className="text-orange-700" />}
         {space.type === 'CHANCE' && <div className="text-purple-700 font-bold">?</div>}
         {space.type === 'START' && <Anchor size={14} className="text-green-700" />}
         {space.type === 'JAIL' && <Skull size={14} className="text-red-700" />}
         {space.type === 'STORM' && <Waves size={14} className="text-blue-400" />}
      </div>

      <div className="relative z-10 flex gap-0.5 flex-wrap justify-center min-h-[10px]">
        {playersHere.map(p => <div key={p.id} className={`w-2.5 h-2.5 rounded-full ${p.color} border border-white shadow-sm animate-bounce`} />)}
      </div>

      {(space.type === 'BOAT' || space.type === 'RESTAURANT') && (
        <button onClick={() => setShow(!show)} className="absolute bottom-0 right-0 p-0.5 bg-black/10 hover:bg-black/20 z-20">
          <Info size={10} />
        </button>
      )}

      {show && (
        <div onClick={() => setShow(false)} className="absolute inset-0 z-30 bg-[#2d5a68] p-1 flex items-center justify-center text-[8px] text-white italic overflow-hidden">
          {String(space.description || "Lýsing vantar.")}
        </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);