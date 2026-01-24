import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";
import { Ship, Anchor, Fish, Utensils, Skull, Dice5, Coins, User, Waves, MapPin } from 'lucide-react';

// --- Constants & Types ---

const BOARD_SIZE = 16;
const START_MONEY = 1000;
const START_HUNGER = 0;
const MAX_HUNGER = 10;

type SpaceType = 'START' | 'BOAT' | 'RESTAURANT' | 'CHANCE' | 'STORM' | 'JAIL';

interface BoardSpace {
  id: number;
  name: string;
  type: SpaceType;
  price?: number;
  rent?: number; // Or cost to eat
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
}

interface GameLog {
  text: string;
  type: 'info' | 'alert' | 'success';
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
  { id: 8, name: "Free Parking", type: 'START', description: "Just a pier to rest." }, // Using START type for safe zones visually
  { id: 9, name: "Harpa", type: 'BOAT', price: 240, rent: 50, description: "Shiny and new." },
  { id: 10, name: "Sjómannalífið", type: 'CHANCE', description: "Fate of the sea." },
  { id: 11, name: "Sægreifinn", type: 'RESTAURANT', price: 350, rent: 70, description: "The legend itself." },
  { id: 12, name: "Sjóli", type: 'BOAT', price: 260, rent: 55, description: "Fast trawler." },
  { id: 13, name: "Sea Jail", type: 'JAIL', description: "Stuck in a net." },
  { id: 14, name: "Moby Dick", type: 'BOAT', price: 300, rent: 60, description: "The white whale hunter." },
  { id: 15, name: "Bryggjan", type: 'RESTAURANT', price: 280, rent: 60, description: "Coffee and cakes." },
];

const DEFAULT_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 800 600'%3E%3Crect fill='%232d5a68' width='800' height='600'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2368a6b5' font-family='serif' font-size='40'%3EMaígreifinn%3C/text%3E%3C/svg%3E";

// --- Components ---

function App() {
  const [players, setPlayers] = useState<Player[]>([
    { id: 0, name: "Skipper 1", color: "bg-orange-500", position: 0, money: START_MONEY, hunger: START_HUNGER, isJailed: false, inventory: [] },
    { id: 1, name: "Skipper 2", color: "bg-cyan-400", position: 0, money: START_MONEY, hunger: START_HUNGER, isJailed: false, inventory: [] },
  ]);
  const [turn, setTurn] = useState(0); // Player index
  const [board, setBoard] = useState<BoardSpace[]>(INITIAL_BOARD);
  const [logs, setLogs] = useState<GameLog[]>([]);
  const [gameState, setGameState] = useState<'IDLE' | 'MOVING' | 'EVENT' | 'GAME_OVER'>('IDLE');
  const [currentEvent, setCurrentEvent] = useState<{ title: string, text: string, image?: string, effect?: number } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const currentPlayer = players[turn];

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (text: string, type: 'info' | 'alert' | 'success' = 'info') => {
    setLogs(prev => [...prev, { text, type }]);
  };

  // --- AI Generation Functions ---

  const generatePropertyImage = async (spaceId: number, name: string, type: string) => {
    try {
      addLog(`Generating visual for ${name}...`, 'info');
      
      const response = await ai.models.generateContent({
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

      let imageUrl = "";
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        }
      }

      if (imageUrl) {
        setBoard(prev => prev.map(s => s.id === spaceId ? { ...s, imageUrl, isGenerated: true } : s));
        addLog(`Visual generated for ${name}!`, 'success');
      }
    } catch (e) {
      console.error("AI Error", e);
      addLog("Failed to generate image. The sea is foggy.", 'alert');
    }
  };

  const triggerChanceEvent = async () => {
    setAiLoading(true);
    setGameState('EVENT');
    
    try {
      // 1. Generate Text Scenario
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
      
      // 2. Generate Image for Scenario
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

  const handleRoll = async () => {
    if (gameState !== 'IDLE') return;
    setGameState('MOVING');

    const roll = Math.floor(Math.random() * 6) + 1;
    addLog(`${currentPlayer.name} rolled a ${roll}.`);

    // Animate move (simple timeout)
    await new Promise(r => setTimeout(r, 500));

    let newPos = (currentPlayer.position + roll) % BOARD_SIZE;
    
    // Check passing start
    if (newPos < currentPlayer.position) {
      addLog(`${currentPlayer.name} passed Harbor. +200kr`, 'success');
      updatePlayer(turn, { money: currentPlayer.money + 200, hunger: Math.max(0, currentPlayer.hunger - 2) });
    }

    updatePlayer(turn, { position: newPos, hunger: currentPlayer.hunger + 1 });
    
    // Check hunger death
    if (currentPlayer.hunger + 1 >= MAX_HUNGER) {
      addLog(`${currentPlayer.name} passed out from hunger! Lose 50kr and go to harbor.`, 'alert');
      updatePlayer(turn, { position: 0, money: currentPlayer.money - 50, hunger: 0 });
      newPos = 0;
    }

    // Resolve Space
    const space = board[newPos];
    await handleLandOnSpace(space, newPos);
  };

  const handleLandOnSpace = async (space: BoardSpace, pos: number) => {
    // Generate image if missing and is a property
    if ((space.type === 'BOAT' || space.type === 'RESTAURANT') && !space.imageUrl && !space.isGenerated) {
       // We don't await this to keep game flowing, but it updates state eventually
       generatePropertyImage(space.id, space.name, space.type);
    }

    if (space.type === 'CHANCE') {
      await triggerChanceEvent();
      return; // Game state handled in triggerChanceEvent
    } else if (space.type === 'STORM') {
      addLog("Caught in a storm! Lost 50kr and supplies.", 'alert');
      updatePlayer(turn, { money: currentPlayer.money - 50, hunger: currentPlayer.hunger + 2 });
      endTurn();
    } else if (space.type === 'JAIL') {
      addLog("Caught in the net! Miss a turn.", 'alert');
      // Simple logic: just end turn effectively
      endTurn();
    } else if (space.type === 'BOAT' || space.type === 'RESTAURANT') {
      if (space.owner === undefined || space.owner === null) {
        setGameState('IDLE'); // Allow buying
        addLog(`Landed on ${space.name}. For sale: ${space.price}kr.`);
      } else if (space.owner !== turn) {
        const ownerName = players[space.owner].name;
        const rent = space.rent || 0;
        addLog(`Owned by ${ownerName}. Pay ${rent}kr.`, 'alert');
        
        let newHunger = currentPlayer.hunger;
        if (space.type === 'RESTAURANT') {
          addLog("Food was delicious. Hunger -3.", 'success');
          newHunger = Math.max(0, newHunger - 3);
        }

        updatePlayer(turn, { money: currentPlayer.money - rent, hunger: newHunger });
        updatePlayer(space.owner, { money: players[space.owner].money + rent });
        endTurn();
      } else {
         addLog(`You are at your own property, ${space.name}.`);
         if (space.type === 'RESTAURANT') {
           updatePlayer(turn, { hunger: Math.max(0, currentPlayer.hunger - 3) });
           addLog("Had a free meal.", 'success');
         }
         endTurn();
      }
    } else {
      endTurn();
    }
  };

  const buyProperty = () => {
    const space = board[currentPlayer.position];
    if (space.price && currentPlayer.money >= space.price) {
      updatePlayer(turn, { 
        money: currentPlayer.money - space.price,
        inventory: [...currentPlayer.inventory, space.id]
      });
      setBoard(prev => prev.map(s => s.id === space.id ? { ...s, owner: turn } : s));
      addLog(`Bought ${space.name} for ${space.price}kr!`, 'success');
      endTurn();
    } else {
      addLog("Not enough money!", 'alert');
    }
  };

  const resolveEvent = () => {
    if (currentEvent) {
      addLog(`${currentEvent.title}: ${currentEvent.effect}kr`, currentEvent.effect >= 0 ? 'success' : 'alert');
      updatePlayer(turn, { money: currentPlayer.money + currentEvent.effect });
    }
    setCurrentEvent(null);
    setGameState('IDLE');
    endTurn();
  };

  const endTurn = () => {
    if (gameState === 'GAME_OVER') return;
    setGameState('IDLE');
    setTurn((turn + 1) % players.length);
  };

  const updatePlayer = (idx: number, updates: Partial<Player>) => {
    setPlayers(prev => prev.map((p, i) => i === idx ? { ...p, ...updates } : p));
  };

  // --- Rendering Helpers ---

  // Create a perimeter path for the board visual
  // 0-4 (Top), 5-7 (Right), 8-12 (Bottom), 13-15 (Left)
  const renderBoard = () => {
    const topRow = board.slice(0, 5);
    const rightCol = board.slice(5, 8);
    const bottomRow = board.slice(8, 13).reverse();
    const leftCol = board.slice(13, 16).reverse();

    return (
      <div className="relative bg-[#e8dac0] p-4 rounded-xl shadow-2xl border-4 border-[#2d5a68] max-w-4xl mx-auto aspect-square flex flex-col justify-between">
        
        {/* Center Area (Logo & Status) */}
        <div className="absolute inset-0 m-32 bg-[#2d5a68]/10 rounded-lg flex flex-col items-center justify-center pointer-events-none z-0 border-2 border-dashed border-[#2d5a68]/30">
          <div className="text-6xl font-serif text-[#2d5a68] opacity-20 transform -rotate-12 mb-4">Maígreifinn</div>
          <Anchor size={64} className="text-[#c17c5b] opacity-20" />
        </div>

        {/* Top Row */}
        <div className="flex justify-between gap-1 z-10">
          {topRow.map(s => <SpaceCard key={s.id} space={s} players={players} />)}
        </div>

        {/* Middle Section */}
        <div className="flex justify-between flex-1 py-1 z-10">
          <div className="flex flex-col justify-between gap-1">
            {leftCol.map(s => <SpaceCard key={s.id} space={s} players={players} vertical />)}
          </div>
          <div className="flex flex-col justify-between gap-1">
            {rightCol.map(s => <SpaceCard key={s.id} space={s} players={players} vertical />)}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="flex justify-between gap-1 z-10">
          {bottomRow.map(s => <SpaceCard key={s.id} space={s} players={players} />)}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#2d5a68] text-[#1a3c46] font-sans p-4 flex flex-col items-center">
      
      {/* Header */}
      <header className="w-full max-w-6xl flex justify-between items-center mb-6 bg-[#e8dac0] px-6 py-4 rounded-lg shadow-lg border-b-4 border-[#c17c5b]">
        <div className="flex items-center gap-3">
          <Anchor className="text-[#2d5a68]" size={32} />
          <h1 className="text-3xl font-serif font-bold text-[#2d5a68]">Maígreifinn</h1>
        </div>
        <div className="flex gap-4">
          {players.map((p, i) => (
            <div key={p.id} className={`flex items-center gap-3 px-4 py-2 rounded-full border-2 ${turn === i ? 'border-[#c17c5b] bg-white shadow-md scale-105 transition-transform' : 'border-transparent bg-white/50'}`}>
              <div className={`w-4 h-4 rounded-full ${p.color}`} />
              <div>
                <div className="font-bold text-sm">{p.name}</div>
                <div className="flex items-center gap-2 text-xs">
                   <span className="flex items-center text-green-700"><Coins size={12} className="mr-1"/> {p.money}kr</span>
                   <span className="flex items-center text-red-700"><Utensils size={12} className="mr-1"/> {p.hunger}/10</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </header>

      <main className="w-full max-w-7xl flex flex-col lg:flex-row gap-8">
        
        {/* Game Board */}
        <div className="flex-1">
          {renderBoard()}
        </div>

        {/* Sidebar Controls */}
        <div className="w-full lg:w-96 flex flex-col gap-4">
          
          {/* Action Panel */}
          <div className="bg-[#e8dac0] p-6 rounded-xl shadow-lg border-2 border-[#c17c5b]">
            <h2 className="text-xl font-serif font-bold mb-4 flex items-center gap-2">
              <User size={20}/> {currentPlayer.name}'s Turn
            </h2>
            
            <div className="space-y-4">
              <div className="text-sm italic text-gray-600">
                {gameState === 'IDLE' && "Ready to roll..."}
                {gameState === 'MOVING' && "Sailing..."}
                {gameState === 'EVENT' && "Encountering event..."}
              </div>

              {gameState === 'IDLE' && board[currentPlayer.position].owner !== undefined && board[currentPlayer.position].owner === null && (
                 <div className="bg-white/50 p-3 rounded border border-[#2d5a68]/20">
                    <p className="font-bold mb-2">{board[currentPlayer.position].name}</p>
                    <p className="text-sm mb-2">Price: {board[currentPlayer.position].price}kr</p>
                    <button 
                      onClick={buyProperty}
                      disabled={currentPlayer.money < (board[currentPlayer.position].price || 0)}
                      className="w-full bg-[#2d5a68] text-white py-2 rounded hover:bg-[#1a3c46] disabled:opacity-50 transition-colors"
                    >
                      Buy Property
                    </button>
                    <button 
                      onClick={endTurn}
                      className="w-full mt-2 bg-transparent text-[#2d5a68] border border-[#2d5a68] py-1 rounded hover:bg-[#2d5a68]/10 transition-colors"
                    >
                      Pass
                    </button>
                 </div>
              )}

              {gameState === 'IDLE' && board[currentPlayer.position].owner === undefined && (
                 <button 
                  onClick={handleRoll}
                  className="w-full bg-[#c17c5b] text-white py-4 rounded-lg text-lg font-bold shadow hover:bg-[#a66a4d] transition-colors flex items-center justify-center gap-2"
                >
                  <Dice5 /> Roll Dice
                </button>
              )}
               {/* Show Roll button even if owned property logic handled in effect, 
                   but strictly 'IDLE' means ready for start of turn or mid-turn decision. 
                   We simplified logic: HandleRoll -> Moves -> Lands -> If Unowned, stays IDLE to buy/pass. If Owned/Event, auto-resolves or shows modal.
                   So if we are IDLE and NOT on an unowned property, we must be at start of turn.
               */}
               {gameState === 'IDLE' && (board[currentPlayer.position].owner !== null || board[currentPlayer.position].type === 'START') && (
                  <button 
                    onClick={handleRoll}
                    className="w-full bg-[#c17c5b] text-white py-4 rounded-lg text-lg font-bold shadow hover:bg-[#a66a4d] transition-colors flex items-center justify-center gap-2"
                  >
                    <Dice5 /> Roll Dice
                  </button>
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
          <div className="bg-[#e8dac0] rounded-xl shadow-2xl max-w-md w-full border-4 border-[#c17c5b] overflow-hidden">
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
                  <button 
                    onClick={resolveEvent}
                    className="w-full bg-[#2d5a68] text-white py-3 rounded font-bold hover:bg-[#1a3c46] transition-colors"
                  >
                    Accept Fate
                  </button>
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

interface SpaceCardProps {
  space: BoardSpace;
  players: Player[];
  vertical?: boolean;
}

const SpaceCard: React.FC<SpaceCardProps> = ({ space, players, vertical = false }) => {
  const playersHere = players.filter(p => p.position === space.id);
  
  // Dynamic sizing based on grid position intent
  const baseClasses = `relative flex-1 bg-white border border-[#2d5a68]/30 rounded shadow-sm p-2 transition-all hover:z-10 hover:scale-105 overflow-hidden group`;
  
  return (
    <div className={`${baseClasses} ${vertical ? 'min-h-[80px]' : 'min-w-[80px]'}`} style={{ flexBasis: '100%' }}>
      
      {/* Background Image / Color */}
      {space.imageUrl ? (
         <img src={space.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-opacity" alt={space.name} />
      ) : (
         <div className={`absolute inset-0 opacity-10 ${space.type === 'BOAT' ? 'bg-blue-500' : space.type === 'RESTAURANT' ? 'bg-orange-500' : 'bg-gray-400'}`}></div>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full justify-between items-center text-center">
        
        {/* Header Icon */}
        <div className="text-[#2d5a68]">
           {space.type === 'BOAT' && <Ship size={16} />}
           {space.type === 'RESTAURANT' && <Utensils size={16} />}
           {space.type === 'CHANCE' && <HelpIcon />}
           {space.type === 'START' && <Anchor size={16} />}
           {space.type === 'JAIL' && <Skull size={16} />}
           {space.type === 'STORM' && <Waves size={16} />}
        </div>
        
        {/* Name */}
        <div className="text-[10px] sm:text-xs font-bold leading-tight my-1 uppercase tracking-wide">{space.name}</div>
        
        {/* Price/Rent */}
        {(space.type === 'BOAT' || space.type === 'RESTAURANT') && (
           <div className="text-[10px] font-mono text-gray-600 bg-white/80 px-1 rounded">
              {space.owner !== undefined && space.owner !== null ? 
                 <span className={`font-bold ${players[space.owner].color.replace('bg-', 'text-')}`}>OWNED</span> : 
                 `${space.price}kr`
              }
           </div>
        )}

        {/* Players Tokens */}
        <div className="flex gap-1 mt-1 flex-wrap justify-center min-h-[12px]">
          {playersHere.map(p => (
            <div key={p.id} className={`w-3 h-3 rounded-full ${p.color} border border-white shadow-sm animate-bounce`} title={p.name} />
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