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
  rent?: number; // Base rent
  owner?: number | null; // Player index
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
  inventory: number[]; // IDs of owned spaces
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
  { id: 1, name: "Jón Páll", type: 'BOAT', price: 100, rent: 20, description: "A sturdy dinghy." },
  { id: 2, name: "Sjómannalífið", type: 'CHANCE', description: "Fate of the sea." },
  { id: 3, name: "Kjallarinn", type: 'RESTAURANT', price: 150, rent: 30, description: "Dark but cozy." },
  { id: 4, name: "Gunnvör", type: 'BOAT', price: 180, rent: 35, description: "Known for big catches." },
  { id: 5, name: "Stormur", type: 'STORM', description: "Rough seas ahead." },
  { id: 6, name: "Humarvagninn", type: 'RESTAURANT', price: 200, rent: 40, description: "Best soup in town." },
  { id: 7, name: "Sæbjörg", type: 'BOAT', price: 220, rent: 45, description: "Old rescue boat." },
  { id: 8, name: "Free Parking", type: 'START', description: "Just a pier to rest." },
  { id: 9, name: "Harpa", type: 'BOAT', price: 240, rent: 50, description: "Shiny and new." },
  { id: 10, name: "Sjómannalífið", type: 'CHANCE', description: "Fate of the sea." },
  { id: 11, name: "Sægreifinn", type: 'RESTAURANT', price: 350, rent: 70, description: "The legend itself." },
  { id: 12, name: "Sjóli", type: 'BOAT', price: 260, rent: 55, description: "Fast trawler." },
  { id: 13, name: "Sea Jail", type: 'JAIL', description: "Stuck in a net." },
  { id: 14, name: "Moby Dick", type: 'BOAT', price: 300, rent: 60, description: "The white whale hunter." },
  { id: 15, name: "Bryggjan", type: 'RESTAURANT', price: 280, rent: 60, description: "Coffee and cakes." },
];

const DEFAULT_PLAYERS: Player[] = [
  { id: 0, name: "Skipper 1", color: "bg-orange-500", position: 0, money: START_MONEY, hunger: START_HUNGER, isJailed: false, inventory: [], isAi: false, boatType: 'TRAWLER' },
  { id: 1, name: "AI Rival", color: "bg-cyan-400", position: 0, money: START_MONEY, hunger: START_HUNGER, isJailed: false, inventory: [], isAi: true, boatType: 'DINGHY' },
];

// --- Components ---

function App() {
  const [view, setView] = useState<'LOBBY' | 'GAME'>('LOBBY');
  const [players, setPlayers] = useState<Player[]>(DEFAULT_PLAYERS);
  const [board, setBoard] = useState<BoardSpace[]>(INITIAL_BOARD);
  
  // Game State
  const [turn, setTurn] = useState(0);
  const [round, setRound] = useState(1);
  const [gameState, setGameState] = useState<'IDLE' | 'MOVING' | 'EVENT' | 'GAME_OVER' | 'AI_THINKING'>('IDLE');
  const [logs, setLogs] = useState<GameLog[]>([]);
  const [currentEvent, setCurrentEvent] = useState<{ title: string, text: string, image?: string, effect?: number } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [market, setMarket] = useState<MarketState>({ fishPrice: 1.0, meatPrice: 1.0, trend: 'STABLE' });

  const logsEndRef = useRef<HTMLDivElement>(null);
  const currentPlayer = players[turn];
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Market Dynamics
  useEffect(() => {
    // Update market every round (when turn 0 starts again)
    if (turn === 0 && round > 1) {
      updateMarket();
    }
  }, [round]);

  // AI Turn Handler
  useEffect(() => {
    if (view === 'GAME' && currentPlayer.isAi && gameState === 'IDLE') {
      const runAiTurn = async () => {
        setGameState('AI_THINKING');
        // Simulate thinking
        await new Promise(r => setTimeout(r, 1500));
        await handleRoll(true);
      };
      runAiTurn();
    }
  }, [turn, view, gameState]); // Removed currentPlayer dependency to avoid loops, rely on turn

  const addLog = (text: string, type: 'info' | 'alert' | 'success' = 'info') => {
    setLogs(prev => [...prev, { text, type }]);
  };

  const updateMarket = () => {
    const r = Math.random();
    let newFish = 1.0;
    let newMeat = 1.0;
    let trend: MarketState['trend'] = 'STABLE';

    if (r > 0.8) {
      trend = 'BOOM';
      newFish = 1.5;
      newMeat = 1.3;
      addLog("Market BOOM! Prices are sky high!", 'success');
    } else if (r < 0.2) {
      trend = 'CRASH';
      newFish = 0.6;
      newMeat = 0.7;
      addLog("Market CRASH! Prices plummeted.", 'alert');
    } else {
      newFish = 0.9 + Math.random() * 0.3;
      newMeat = 0.9 + Math.random() * 0.3;
    }

    setMarket({ fishPrice: parseFloat(newFish.toFixed(2)), meatPrice: parseFloat(newMeat.toFixed(2)), trend });
  };

  // --- AI Generation Functions ---

  const generatePropertyImage = async (spaceId: number, name: string, type: string) => {
    try {
      addLog(`Generating assets for ${name}...`, 'info');
      
      const imagePromise = ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { text: `Create a stylized, moody, oil-painting style image of a ${type.toLowerCase()} named "${name}" in an Icelandic harbor setting. Rustic, teal and orange color palette, thick brush strokes.` }
          ]
        },
        config: {
          imageConfig: { aspectRatio: "1:1", imageSize: "1K" }
        }
      });

      const textPromise = ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Write a very short (max 15 words), witty or atmospheric description in Icelandic for a board game space. The space is a ${type === 'BOAT' ? 'fishing boat' : 'harbor restaurant'} named "${name}".`
      });

      const [imageResponse, textResponse] = await Promise.all([imagePromise, textPromise]);

      let imageUrl = "";
      for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        }
      }

      const description = textResponse.text?.trim() || "";

      if (imageUrl || description) {
        setBoard(prev => prev.map(s => s.id === spaceId ? { 
          ...s, 
          imageUrl: imageUrl || s.imageUrl, 
          description: description || s.description, 
          isGenerated: true 
        } : s));
        addLog(`Assets generated for ${name}!`, 'success');
      }
    } catch (e) {
      console.error("AI Error", e);
      addLog("Failed to generate assets. The sea is foggy.", 'alert');
    }
  };

  const triggerChanceEvent = async () => {
    setAiLoading(true);
    setGameState('EVENT');
    
    try {
      const textResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Write a short, funny or slightly tragic random event for a board game about Icelandic fishermen. " +
                  "Return JSON with: 'title' (string), 'description' (string), 'effect' (number, between -100 and 100 representing money change).",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              effect: { type: Type.NUMBER }
            }
          }
        }
      });

      const eventData = JSON.parse(textResponse.text || "{}");
      
      const imageResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { text: `A surreal, artistic illustration of: ${eventData.description}. Icelandic style, seafoam green and rusty colors.` }
          ]
        },
        config: { imageConfig: { aspectRatio: "1:1", imageSize: "1K" } }
      });

      let imageUrl = "";
      for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        }
      }

      setCurrentEvent({
        title: eventData.title || "Sea Mystery",
        text: eventData.description || "Something happened at sea...",
        image: imageUrl,
        effect: eventData.effect || 0
      });

    } catch (e) {
      console.error("AI Event Error", e);
      setCurrentEvent({
        title: "Fog Roll In",
        text: "The API could not be reached. The sea is quiet.",
        effect: 0
      });
    } finally {
      setAiLoading(false);
    }
  };

  // --- Game Logic ---

  const handleRoll = async (isAi = false) => {
    // Only allow manual rolls if IDLE, allow AI override
    if (gameState !== 'IDLE' && gameState !== 'AI_THINKING') return;
    setGameState('MOVING');

    const roll = Math.floor(Math.random() * 6) + 1;
    addLog(`${currentPlayer.name} rolled a ${roll}.`);

    await new Promise(r => setTimeout(r, 500));

    let newPos = (currentPlayer.position + roll) % BOARD_SIZE;
    
    // Check passing start
    if (newPos < currentPlayer.position) {
      addLog(`${currentPlayer.name} passed Harbor. +200kr`, 'success');
      updatePlayer(turn, { money: currentPlayer.money + 200, hunger: Math.max(0, currentPlayer.hunger - 2) });
      if (turn === players.length - 1) setRound(r => r + 1);
    }

    updatePlayer(turn, { position: newPos, hunger: currentPlayer.hunger + 1 });
    
    if (currentPlayer.hunger + 1 >= MAX_HUNGER) {
      addLog(`${currentPlayer.name} passed out from hunger! Lose 50kr and go to harbor.`, 'alert');
      updatePlayer(turn, { position: 0, money: currentPlayer.money - 50, hunger: 0 });
      newPos = 0;
    }

    const space = board[newPos];
    await handleLandOnSpace(space, newPos, isAi);
  };

  const handleLandOnSpace = async (space: BoardSpace, pos: number, isAi: boolean) => {
    // Generate image if missing
    if ((space.type === 'BOAT' || space.type === 'RESTAURANT') && !space.imageUrl && !space.isGenerated) {
       generatePropertyImage(space.id, space.name, space.type);
    }

    if (space.type === 'CHANCE') {
      await triggerChanceEvent();
      // For AI, we auto-resolve event after a delay
      if (isAi) {
         setTimeout(() => resolveEvent(true), 3000);
      }
      return;
    } else if (space.type === 'STORM') {
      addLog("Caught in a storm! Lost 50kr and supplies.", 'alert');
      updatePlayer(turn, { money: currentPlayer.money - 50, hunger: currentPlayer.hunger + 2 });
      endTurn(isAi);
    } else if (space.type === 'JAIL') {
      addLog("Caught in the net! Miss a turn.", 'alert');
      endTurn(isAi);
    } else if (space.type === 'BOAT' || space.type === 'RESTAURANT') {
      if (space.owner === undefined || space.owner === null) {
        
        // Handling Unowned Property
        if (isAi) {
           // AI Decision
           const price = space.price || 0;
           const shouldBuy = currentPlayer.money > (price + 200) && Math.random() > 0.3;
           if (shouldBuy) {
             setTimeout(() => buyProperty(true), 1000);
           } else {
             addLog(`${currentPlayer.name} decided not to buy.`);
             setTimeout(() => endTurn(true), 1000);
           }
        } else {
           setGameState('IDLE'); // Allow player to choose
           addLog(`Landed on ${space.name}. For sale: ${space.price}kr.`);
        }

      } else if (space.owner !== turn) {
        // Handling Owned Property
        const owner = players[space.owner];
        const baseRent = space.rent || 0;
        let finalRent = Math.floor(baseRent * (space.type === 'BOAT' ? market.fishPrice : market.meatPrice));
        
        addLog(`Owned by ${owner.name}. Base: ${baseRent}kr. Adjusted: ${finalRent}kr`, 'alert');
        
        let newHunger = currentPlayer.hunger;
        if (space.type === 'RESTAURANT') {
          addLog("Food was delicious. Hunger -3.", 'success');
          newHunger = Math.max(0, newHunger - 3);
        }

        updatePlayer(turn, { money: currentPlayer.money - finalRent, hunger: newHunger });
        updatePlayer(space.owner, { money: owner.money + finalRent });
        endTurn(isAi);
      } else {
         addLog(`You are at your own property.`);
         if (space.type === 'RESTAURANT') {
           updatePlayer(turn, { hunger: Math.max(0, currentPlayer.hunger - 3) });
           addLog("Had a free meal.", 'success');
         }
         endTurn(isAi);
      }
    } else {
      endTurn(isAi);
    }
  };

  const buyProperty = (isAi = false) => {
    const space = board[players[turn].position]; // Use direct state access via turn, currentPlayer might be stale in closures if not careful, but component re-renders so OK.
    if (space.price && players[turn].money >= space.price) {
      updatePlayer(turn, { 
        money: players[turn].money - space.price,
        inventory: [...players[turn].inventory, space.id]
      });
      setBoard(prev => prev.map(s => s.id === space.id ? { ...s, owner: turn } : s));
      addLog(`${players[turn].name} bought ${space.name}!`, 'success');
      endTurn(isAi);
    } else if (!isAi) {
      addLog("Not enough money!", 'alert');
    }
  };

  const resolveEvent = (isAi = false) => {
    if (currentEvent) {
      addLog(`${currentEvent.title}: ${currentEvent.effect}kr`, currentEvent.effect >= 0 ? 'success' : 'alert');
      updatePlayer(turn, { money: players[turn].money + currentEvent.effect });
    }
    setCurrentEvent(null);
    endTurn(isAi);
  };

  const endTurn = (isAi = false) => {
    if (gameState === 'GAME_OVER') return;
    
    // Tiny delay before actually switching turn to let logs read
    const delay = isAi ? 1500 : 0;
    setTimeout(() => {
        setGameState('IDLE');
        setTurn((turn + 1) % players.length);
    }, delay);
  };

  const updatePlayer = (idx: number, updates: Partial<Player>) => {
    setPlayers(prev => prev.map((p, i) => i === idx ? { ...p, ...updates } : p));
  };

  // --- Lobby Functions ---
  const addPlayer = () => {
    const newId = players.length;
    setPlayers([...players, { 
      id: newId, 
      name: `Player ${newId + 1}`, 
      color: "bg-green-500", 
      position: 0, 
      money: START_MONEY, 
      hunger: START_HUNGER, 
      isJailed: false, 
      inventory: [], 
      isAi: true, 
      boatType: 'TRAWLER' 
    }]);
  };

  const removePlayer = (id: number) => {
    if (players.length <= 2) return;
    setPlayers(players.filter(p => p.id !== id));
  };

  const updateLobbyPlayer = (id: number, field: keyof Player, value: any) => {
     setPlayers(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const startGame = () => {
    setView('GAME');
    addLog("Welcome to Maígreifinn! The market is open.", 'success');
  };

  // --- Render ---

  if (view === 'LOBBY') {
    return (
      <div className="min-h-screen bg-[#2d5a68] flex items-center justify-center p-4">
        <div className="bg-[#e8dac0] p-8 rounded-xl shadow-2xl max-w-2xl w-full border-4 border-[#c17c5b]">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-serif font-bold text-[#2d5a68] mb-2">Maígreifinn</h1>
            <p className="text-[#1a3c46] italic">Customize your fleet and rivals</p>
          </div>

          <div className="space-y-4 mb-8">
            {players.map((p, i) => (
              <div key={p.id} className="bg-white/50 p-4 rounded-lg flex items-center gap-4 border border-[#2d5a68]/20">
                <div className={`w-12 h-12 rounded-full ${p.color} flex items-center justify-center text-white shadow`}>
                   <BoatIcon type={p.boatType} />
                </div>
                
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#2d5a68] uppercase">Name</label>
                    <input 
                      className="w-full bg-white border border-gray-300 rounded px-2 py-1"
                      value={p.name}
                      onChange={(e) => updateLobbyPlayer(p.id, 'name', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs font-bold text-[#2d5a68] uppercase">Type</label>
                    <div className="flex items-center gap-2">
                      <select 
                        className="flex-1 bg-white border border-gray-300 rounded px-2 py-1"
                        value={p.isAi ? 'AI' : 'HUMAN'}
                        onChange={(e) => updateLobbyPlayer(p.id, 'isAi', e.target.value === 'AI')}
                      >
                        <option value="HUMAN">Human</option>
                        <option value="AI">AI Skipper</option>
                      </select>
                    </div>
                  </div>

                  <div>
                     <label className="text-xs font-bold text-[#2d5a68] uppercase">Boat Class</label>
                     <select 
                        className="w-full bg-white border border-gray-300 rounded px-2 py-1"
                        value={p.boatType}
                        onChange={(e) => updateLobbyPlayer(p.id, 'boatType', e.target.value)}
                      >
                        <option value="TRAWLER">Trawler (Classic)</option>
                        <option value="SAILBOAT">Sailboat (Agile)</option>
                        <option value="DINGHY">Dinghy (Humble)</option>
                        <option value="YACHT">Yacht (Fancy)</option>
                      </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#2d5a68] uppercase">Color</label>
                    <select 
                        className="w-full bg-white border border-gray-300 rounded px-2 py-1"
                        value={p.color}
                        onChange={(e) => updateLobbyPlayer(p.id, 'color', e.target.value)}
                      >
                        <option value="bg-orange-500">Rusty Orange</option>
                        <option value="bg-cyan-400">Sea Foam</option>
                        <option value="bg-red-600">Beacon Red</option>
                        <option value="bg-purple-600">Deep Water</option>
                        <option value="bg-yellow-400">Yellow Raincoat</option>
                        <option value="bg-green-600">Algae Green</option>
                      </select>
                  </div>
                </div>

                {players.length > 2 && (
                  <button onClick={() => removePlayer(p.id)} className="text-red-500 hover:bg-red-100 p-2 rounded">
                    <Skull size={20} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-between gap-4">
            <button onClick={addPlayer} className="flex-1 py-3 border-2 border-[#2d5a68] text-[#2d5a68] rounded-lg font-bold hover:bg-[#2d5a68]/10 transition-colors flex items-center justify-center gap-2">
              <User size={20} /> Add Skipper
            </button>
            <button onClick={startGame} className="flex-[2] py-3 bg-[#c17c5b] text-white rounded-lg font-bold shadow-lg hover:bg-[#a66a4d] transition-colors flex items-center justify-center gap-2 text-xl">
              <Play size={24} /> Set Sail
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#2d5a68] text-[#1a3c46] font-sans p-4 flex flex-col items-center">
      
      {/* Header */}
      <header className="w-full max-w-6xl flex justify-between items-center mb-6 bg-[#e8dac0] px-6 py-4 rounded-lg shadow-lg border-b-4 border-[#c17c5b]">
        <div className="flex items-center gap-3">
          <Anchor className="text-[#2d5a68]" size={32} />
          <h1 className="text-3xl font-serif font-bold text-[#2d5a68] hidden sm:block">Maígreifinn</h1>
        </div>
        
        {/* Market Ticker */}
        <div className="flex items-center gap-4 bg-white/50 px-4 py-2 rounded-full border border-[#2d5a68]/20 text-sm font-mono">
           <div className="flex items-center gap-1">
             <Fish size={14} className="text-blue-600"/> 
             <span>{Math.round(market.fishPrice * 100)}%</span>
           </div>
           <div className="w-px h-4 bg-gray-400"/>
           <div className="flex items-center gap-1">
             <Utensils size={14} className="text-orange-600"/> 
             <span>{Math.round(market.meatPrice * 100)}%</span>
           </div>
           <div className="w-px h-4 bg-gray-400"/>
           {market.trend === 'STABLE' && <span className="text-gray-600">STABLE</span>}
           {market.trend === 'BOOM' && <span className="text-green-600 font-bold flex items-center"><TrendingUp size={14}/> BOOM</span>}
           {market.trend === 'CRASH' && <span className="text-red-600 font-bold flex items-center"><TrendingDown size={14}/> CRASH</span>}
        </div>

        <div className="flex gap-2">
          {players.map((p, i) => (
            <div key={p.id} className={`flex items-center gap-2 px-3 py-1 rounded-full border-2 transition-all ${turn === i ? 'border-[#c17c5b] bg-white shadow-md scale-105' : 'border-transparent bg-white/30 opacity-70'}`}>
              <div className={`w-3 h-3 rounded-full ${p.color}`} />
              {p.isAi && <Bot size={12} className="text-gray-600" />}
              <span className="font-bold text-sm hidden sm:inline">{p.name}</span>
            </div>
          ))}
        </div>
      </header>

      <main className="w-full max-w-7xl flex flex-col lg:flex-row gap-8">
        
        {/* Game Board */}
        <div className="flex-1">
          <RenderBoard board={board} players={players} />
        </div>

        {/* Sidebar Controls */}
        <div className="w-full lg:w-96 flex flex-col gap-4">
          
          {/* Action Panel */}
          <div className="bg-[#e8dac0] p-6 rounded-xl shadow-lg border-2 border-[#c17c5b]">
            <h2 className="text-xl font-serif font-bold mb-4 flex items-center gap-2">
               <div className={`w-8 h-8 rounded-full ${currentPlayer.color} flex items-center justify-center text-white`}>
                 <BoatIcon type={currentPlayer.boatType} />
               </div>
               {currentPlayer.name}
               {currentPlayer.isAi && <span className="text-xs bg-gray-700 text-white px-2 py-0.5 rounded-full ml-auto">AI</span>}
            </h2>

            <div className="flex justify-between mb-4 text-sm bg-white/50 p-2 rounded">
               <div className="flex items-center gap-1"><Coins size={14}/> {currentPlayer.money}kr</div>
               <div className="flex items-center gap-1"><Utensils size={14}/> {currentPlayer.hunger}/{MAX_HUNGER}</div>
               <div className="flex items-center gap-1"><MapPin size={14}/> {board[currentPlayer.position].name}</div>
            </div>
            
            <div className="space-y-4">
              <div className="text-sm italic text-gray-600">
                {gameState === 'IDLE' && !currentPlayer.isAi && "Your turn, Captain."}
                {gameState === 'IDLE' && currentPlayer.isAi && "AI is preparing..."}
                {gameState === 'AI_THINKING' && "AI is thinking..."}
                {gameState === 'MOVING' && "Sailing..."}
                {gameState === 'EVENT' && "Encountering event..."}
              </div>

              {gameState === 'IDLE' && !currentPlayer.isAi && board[currentPlayer.position].owner === null && board[currentPlayer.position].price && (
                 <div className="bg-white/50 p-3 rounded border border-[#2d5a68]/20 animate-fade-in">
                    <p className="font-bold mb-2">{board[currentPlayer.position].name}</p>
                    <p className="text-sm mb-2">Price: {board[currentPlayer.position].price}kr</p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => buyProperty(false)}
                        disabled={currentPlayer.money < (board[currentPlayer.position].price || 0)}
                        className="flex-1 bg-[#2d5a68] text-white py-2 rounded hover:bg-[#1a3c46] disabled:opacity-50 transition-colors"
                      >
                        Buy
                      </button>
                      <button 
                        onClick={() => endTurn(false)}
                        className="flex-1 bg-transparent text-[#2d5a68] border border-[#2d5a68] py-2 rounded hover:bg-[#2d5a68]/10 transition-colors"
                      >
                        Pass
                      </button>
                    </div>
                 </div>
              )}

              {/* Roll Button - only for human when IDLE and either moving from start or owned property or jail */}
              {gameState === 'IDLE' && !currentPlayer.isAi && (board[currentPlayer.position].owner !== null || board[currentPlayer.position].type === 'START' || board[currentPlayer.position].type === 'JAIL' || board[currentPlayer.position].type === 'STORM') && (
                  <button 
                    onClick={() => handleRoll(false)}
                    className="w-full bg-[#c17c5b] text-white py-4 rounded-lg text-lg font-bold shadow hover:bg-[#a66a4d] transition-colors flex items-center justify-center gap-2"
                  >
                    <Dice5 /> Roll Dice
                  </button>
               )}

              {currentPlayer.isAi && (
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                   <div className="h-full bg-[#2d5a68] animate-pulse w-full"></div>
                </div>
              )}

            </div>
          </div>

          {/* Game Log */}
          <div className="bg-white/90 p-4 rounded-xl shadow-lg border border-[#2d5a68]/20 flex-1 min-h-[300px] flex flex-col">
            <h3 className="font-bold text-[#2d5a68] mb-2 border-b pb-1">Captain's Log</h3>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 max-h-[400px]">
              {logs.map((log, i) => (
                <div key={i} className={`text-sm p-2 rounded ${
                  log.type === 'alert' ? 'bg-red-100 text-red-800' : 
                  log.type === 'success' ? 'bg-green-100 text-green-800' : 
                  'bg-blue-50 text-blue-800'
                }`}>
                  {log.text}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>

        </div>
      </main>

      {/* Event Modal */}
      {(currentEvent || aiLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#e8dac0] rounded-xl shadow-2xl max-w-md w-full border-4 border-[#c17c5b] overflow-hidden animate-pop-in">
            {aiLoading ? (
              <div className="p-12 flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c17c5b]"></div>
                <p className="font-serif italic text-lg text-[#2d5a68]">Consulting the sea spirits...</p>
              </div>
            ) : (
              <div>
                <div className="relative h-64 w-full bg-[#2d5a68]">
                  {currentEvent?.image ? (
                    <img src={currentEvent.image} alt="Event" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-white/50"><Waves size={48}/></div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                     <h3 className="text-2xl font-serif font-bold text-white">{currentEvent?.title}</h3>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-lg mb-6 leading-relaxed text-[#1a3c46] font-medium">{currentEvent?.text}</p>
                  {currentEvent?.effect !== 0 && (
                     <div className={`text-center font-bold mb-6 ${currentEvent?.effect! > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {currentEvent?.effect! > 0 ? '+' : ''}{currentEvent?.effect} kr
                     </div>
                  )}
                  {!currentPlayer.isAi && (
                    <button 
                      onClick={() => resolveEvent(false)}
                      className="w-full bg-[#2d5a68] text-white py-3 rounded font-bold hover:bg-[#1a3c46] transition-colors"
                    >
                      Accept Fate
                    </button>
                  )}
                  {currentPlayer.isAi && <p className="text-center text-sm italic">The AI contemplates its fate...</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

// --- Subcomponents ---

const BoatIcon = ({ type }: { type: BoatType }) => {
  switch (type) {
    case 'TRAWLER': return <Ship size={20} />;
    case 'SAILBOAT': return <Sailboat size={20} />;
    case 'DINGHY': return <LifeBuoy size={20} />;
    case 'YACHT': return <Anchor size={20} />;
    default: return <Ship size={20} />;
  }
};

const RenderBoard = ({ board, players }: { board: BoardSpace[], players: Player[] }) => {
    const topRow = board.slice(0, 5);
    const rightCol = board.slice(5, 8);
    const bottomRow = board.slice(8, 13).reverse();
    const leftCol = board.slice(13, 16).reverse();

    return (
      <div className="relative bg-[#e8dac0] p-4 rounded-xl shadow-2xl border-4 border-[#2d5a68] max-w-4xl mx-auto aspect-square flex flex-col justify-between">
        <div className="absolute inset-0 m-32 bg-[#2d5a68]/10 rounded-lg flex flex-col items-center justify-center pointer-events-none z-0 border-2 border-dashed border-[#2d5a68]/30">
          <div className="text-6xl font-serif text-[#2d5a68] opacity-20 transform -rotate-12 mb-4">Maígreifinn</div>
          <Anchor size={64} className="text-[#c17c5b] opacity-20" />
        </div>

        <div className="flex justify-between gap-1 z-10">
          {topRow.map(s => <SpaceCard key={s.id} space={s} players={players} />)}
        </div>

        <div className="flex justify-between flex-1 py-1 z-10">
          <div className="flex flex-col justify-between gap-1">
            {leftCol.map(s => <SpaceCard key={s.id} space={s} players={players} vertical />)}
          </div>
          <div className="flex flex-col justify-between gap-1">
            {rightCol.map(s => <SpaceCard key={s.id} space={s} players={players} vertical />)}
          </div>
        </div>

        <div className="flex justify-between gap-1 z-10">
          {bottomRow.map(s => <SpaceCard key={s.id} space={s} players={players} />)}
        </div>
      </div>
    );
};

interface SpaceCardProps {
  space: BoardSpace;
  players: Player[];
  vertical?: boolean;
}

const SpaceCard: React.FC<SpaceCardProps> = ({ space, players, vertical = false }) => {
  const [showInfo, setShowInfo] = useState(false);
  const playersHere = players.filter(p => p.position === space.id);
  
  const baseClasses = `relative flex-1 bg-white border border-[#2d5a68]/30 rounded shadow-sm p-2 transition-all hover:z-10 hover:scale-105 overflow-hidden group`;
  
  return (
    <div className={`${baseClasses} ${vertical ? 'min-h-[80px]' : 'min-w-[80px]'}`} style={{ flexBasis: '100%' }}>
      
      {space.imageUrl ? (
         <img src={space.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-opacity" alt={space.name} />
      ) : (
         <div className={`absolute inset-0 opacity-10 ${space.type === 'BOAT' ? 'bg-blue-500' : space.type === 'RESTAURANT' ? 'bg-orange-500' : 'bg-gray-400'}`}></div>
      )}

      {/* Info Button */}
      {(space.type === 'BOAT' || space.type === 'RESTAURANT') && (
        <button 
          onClick={(e) => { e.stopPropagation(); setShowInfo(!showInfo); }}
          className="absolute top-1 right-1 z-20 bg-white/80 p-1 rounded-full text-[#2d5a68] hover:bg-white hover:scale-110 transition-all shadow-sm"
        >
          <Info size={12} />
        </button>
      )}

      {/* Info Overlay */}
      {showInfo && (
        <div 
          className="absolute inset-0 z-30 bg-[#2d5a68]/95 p-2 flex flex-col items-center justify-center text-center animate-fade-in"
          onClick={(e) => { e.stopPropagation(); setShowInfo(false); }}
        >
          <p className="text-white text-[10px] leading-tight font-serif italic">{space.description || "Engin lýsing."}</p>
        </div>
      )}

      <div className="relative z-10 flex flex-col h-full justify-between items-center text-center pointer-events-none">
        
        <div className="text-[#2d5a68]">
           {space.type === 'BOAT' && <Ship size={16} />}
           {space.type === 'RESTAURANT' && <Utensils size={16} />}
           {space.type === 'CHANCE' && <HelpIcon />}
           {space.type === 'START' && <Anchor size={16} />}
           {space.type === 'JAIL' && <Skull size={16} />}
           {space.type === 'STORM' && <Waves size={16} />}
        </div>
        
        <div className="text-[10px] sm:text-xs font-bold leading-tight my-1 uppercase tracking-wide">{space.name}</div>
        
        {(space.type === 'BOAT' || space.type === 'RESTAURANT') && (
           <div className="text-[10px] font-mono text-gray-600 bg-white/80 px-1 rounded">
              {space.owner !== undefined && space.owner !== null ? 
                 <span className={`font-bold ${players[space.owner].color.replace('bg-', 'text-')}`}>OWNED</span> : 
                 `${space.price}kr`
              }
           </div>
        )}

        <div className="flex gap-1 mt-1 flex-wrap justify-center min-h-[12px]">
          {playersHere.map(p => (
            <div key={p.id} className={`w-3 h-3 rounded-full ${p.color} border border-white shadow-sm animate-bounce flex items-center justify-center text-white`} title={p.name}>
               <div style={{ transform: 'scale(0.5)' }}>
                  <BoatIcon type={p.boatType} />
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const HelpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

const root = createRoot(document.getElementById('root')!);
root.render(<App />);