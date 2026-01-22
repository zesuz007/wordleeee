
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { WORD_LENGTH, MAX_ROWS, WORDS } from './constants';
import { GameState, TileState, Status, WordInfo } from './types';
import Tile from './components/Tile';
import Keyboard from './components/Keyboard';
import { fetchDailyWord, getWordDetails, getHint } from './services/geminiService';

const FloatingHearts: React.FC = () => {
  const hearts = useMemo(() => Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 5}s`,
    duration: `${3 + Math.random() * 4}s`,
    size: `${1 + Math.random() * 2}rem`
  })), []);

  return (
    <>
      {hearts.map(heart => (
        <i 
          key={heart.id}
          className="fa-solid fa-heart floating-heart"
          style={{
            left: heart.left,
            animationDelay: heart.delay,
            animationDuration: heart.duration,
            fontSize: heart.size,
            bottom: '-50px'
          }}
        />
      ))}
    </>
  );
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(() => ({
    board: Array(MAX_ROWS).fill(null).map(() => 
      Array(WORD_LENGTH).fill(null).map(() => ({ letter: '', status: 'empty' }))
    ),
    currentRow: 0,
    targetWord: 'GOSSIP',
    status: 'playing',
    message: '',
  }));

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [hint, setHint] = useState<string | null>("Something we do; something we watch");
  const [requestingHint, setRequestingHint] = useState(false);

  // Initialize game
  const initGame = useCallback(async () => {
    setLoading(true);
    setHint("Something we do; something we watch");
    const word = "GOSSIP"; 
    setGameState({
      board: Array(MAX_ROWS).fill(null).map(() => 
        Array(WORD_LENGTH).fill(null).map(() => ({ letter: '', status: 'empty' }))
      ),
      currentRow: 0,
      targetWord: word,
      status: 'playing',
      message: '',
    });
    setInput('');
    setLoading(false);
  }, []);

  const letterStatuses = useMemo(() => {
    const statuses: Record<string, Status> = {};
    gameState.board.forEach((row, rowIndex) => {
      if (rowIndex < gameState.currentRow || gameState.status !== 'playing') {
        row.forEach((tile) => {
          if (!statuses[tile.letter] || (statuses[tile.letter] !== 'correct' && tile.status === 'correct')) {
            statuses[tile.letter] = tile.status;
          } else if (!statuses[tile.letter] || (statuses[tile.letter] === 'empty' && tile.status !== 'empty')) {
            statuses[tile.letter] = tile.status;
          }
        });
      }
    });
    return statuses;
  }, [gameState]);

  const handleKeyPress = useCallback((key: string) => {
    if (gameState.status !== 'playing' || loading) return;

    if (key === 'ENTER') {
      submitGuess();
    } else if (key === 'DEL' || key === 'BACKSPACE') {
      setInput(prev => prev.slice(0, -1));
    } else if (/^[A-Z]$/.test(key.toUpperCase()) && input.length < WORD_LENGTH) {
      setInput(prev => prev + key.toUpperCase());
    }
  }, [input, gameState.status, loading]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      handleKeyPress(e.key.toUpperCase());
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleKeyPress]);

  const submitGuess = async () => {
    if (input.length !== WORD_LENGTH) {
      triggerShake("Not enough letters");
      return;
    }

    const currentGuess = input.toUpperCase();
    const newBoard = [...gameState.board];
    const targetArr = gameState.targetWord.split('');
    const guessArr = currentGuess.split('');
    const rowStatus: Status[] = Array(WORD_LENGTH).fill('absent');
    const targetCharCount: Record<string, number> = {};

    targetArr.forEach(char => targetCharCount[char] = (targetCharCount[char] || 0) + 1);

    guessArr.forEach((char, i) => {
      if (char === targetArr[i]) {
        rowStatus[i] = 'correct';
        targetCharCount[char]--;
      }
    });

    guessArr.forEach((char, i) => {
      if (rowStatus[i] !== 'correct' && targetCharCount[char] > 0) {
        rowStatus[i] = 'present';
        targetCharCount[char]--;
      }
    });

    newBoard[gameState.currentRow] = guessArr.map((letter, i) => ({
      letter,
      status: rowStatus[i]
    }));

    const isWin = currentGuess === gameState.targetWord;
    const isGameOver = isWin || gameState.currentRow === MAX_ROWS - 1;

    setGameState(prev => ({
      ...prev,
      board: newBoard,
      currentRow: prev.currentRow + 1,
      status: isWin ? 'won' : (isGameOver ? 'lost' : 'playing'),
      message: isWin ? 'YAYYYY SMART BABYGIRL' : (isGameOver ? `The word was ${prev.targetWord}` : ''),
    }));

    setInput('');
  };

  const triggerShake = (msg: string) => {
    setGameState(prev => ({ ...prev, message: msg }));
    setIsShaking(true);
    setTimeout(() => {
      setIsShaking(false);
      setGameState(prev => ({ ...prev, message: '' }));
    }, 1000);
  };

  const handleGetHint = async () => {
    if (requestingHint) return;
    setRequestingHint(true);
    const guesses = gameState.board
      .slice(0, gameState.currentRow)
      .map(row => row.map(t => t.letter).join(''));
    
    const h = await getHint(gameState.targetWord, guesses);
    setHint(h);
    setRequestingHint(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-8 bg-[#0f172a] text-slate-100 relative overflow-hidden">
      {/* Background Hearts */}
      <FloatingHearts />
      
      <header className="w-full max-w-xl flex items-center justify-between px-6 mb-8 border-b border-slate-800 pb-4 z-10">
        <div className="flex items-center gap-2">
           <div className="w-10 h-10 bg-pink-600 rounded-lg flex items-center justify-center shadow-lg shadow-pink-500/20">
             <i className="fa-solid fa-heart text-white"></i>
           </div>
           <h1 className="text-2xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-indigo-400">
             ANNIVERSWORDLARY
           </h1>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={initGame} 
            className="text-slate-400 hover:text-white transition-colors"
            title="New Game"
          >
            <i className="fa-solid fa-rotate-right text-xl"></i>
          </button>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center w-full max-w-md px-4 z-10">
        <div className="grid grid-rows-6 gap-2 mb-8">
          {gameState.board.map((row, rowIndex) => (
            <div 
              key={rowIndex} 
              className={`flex gap-2 ${rowIndex === gameState.currentRow && isShaking ? 'shake' : ''}`}
            >
              {row.map((tile, colIndex) => {
                let displayLetter = tile.letter;
                let displayStatus = tile.status;
                if (rowIndex === gameState.currentRow && colIndex < input.length) {
                  displayLetter = input[colIndex];
                  displayStatus = 'tbd';
                }
                return (
                  <Tile 
                    key={colIndex} 
                    letter={displayLetter} 
                    status={displayStatus} 
                    delay={gameState.status !== 'playing' || rowIndex < gameState.currentRow - 1 ? colIndex * 100 : 0}
                  />
                );
              })}
            </div>
          ))}
        </div>

        <div className="h-12 flex items-center justify-center mb-4 text-center">
          {gameState.message && (
            <div className="bg-white text-slate-900 px-6 py-2 rounded-full font-bold shadow-2xl animate-bounce border-2 border-pink-500">
              {gameState.message}
            </div>
          )}
        </div>

        {gameState.status === 'playing' && !loading && (
          <div className="w-full mb-4 px-4">
            {hint ? (
              <div className="bg-pink-900/40 border border-pink-500/40 rounded-2xl p-4 text-sm text-pink-100 flex gap-3 items-center animate-fade-in shadow-xl backdrop-blur-md">
                <i className="fa-solid fa-heart text-pink-400 text-lg"></i>
                <p className="font-semibold italic">"{hint}"</p>
              </div>
            ) : (
              <button 
                onClick={handleGetHint}
                disabled={requestingHint}
                className="w-full flex items-center justify-center gap-2 text-sm text-pink-400 hover:text-pink-300 transition-colors py-2 group"
              >
                {requestingHint ? (
                   <i className="fa-solid fa-spinner fa-spin"></i>
                ) : (
                   <i className="fa-solid fa-heart group-hover:animate-pulse"></i>
                )}
                <span>Ask Gemini for a hint</span>
              </button>
            )}
          </div>
        )}

        <Keyboard 
          onKeyPress={handleKeyPress} 
          letterStatuses={letterStatuses} 
        />

        {(gameState.status === 'won' || gameState.status === 'lost') && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
             <FloatingHearts />
            <div className="bg-slate-900 border-2 border-pink-500/50 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-[0_0_50px_rgba(236,72,153,0.3)]">
              <div className={`p-10 text-center ${gameState.status === 'won' ? 'bg-gradient-to-b from-pink-500/20 to-transparent' : 'bg-rose-500/10'}`}>
                <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 ${gameState.status === 'won' ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/50' : 'bg-rose-500 text-white'}`}>
                  {gameState.status === 'won' ? (
                    <span className="text-2xl font-black uppercase tracking-widest animate-pulse">xoxo</span>
                  ) : (
                    <i className="fa-solid fa-xmark text-4xl"></i>
                  )}
                </div>
                
                {gameState.status === 'won' ? (
                  <>
                    <h2 className="text-4xl font-black mb-4 uppercase tracking-tighter text-pink-400 animate-bounce">
                      YAYYYY SMART BABYGIRL
                    </h2>
                    <p className="cursive text-4xl text-white mb-6">
                      Happy Anniversary Bebudubu♥️
                    </p>
                    <div className="flex justify-center gap-2 mb-6">
                       <i className="fa-solid fa-heart text-pink-500"></i>
                       <i className="fa-solid fa-heart text-pink-400"></i>
                       <i className="fa-solid fa-heart text-pink-300"></i>
                       <i className="fa-solid fa-heart text-pink-400"></i>
                       <i className="fa-solid fa-heart text-pink-500"></i>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="text-3xl font-black mb-1 uppercase tracking-tighter">
                      Next time, my love!
                    </h2>
                    <p className="text-slate-400 font-medium mb-6">The word was <span className="text-white font-mono tracking-widest uppercase">{gameState.targetWord}</span></p>
                  </>
                )}

                <button 
                  onClick={initGame}
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-pink-500/30 active:scale-[0.98] text-xl tracking-widest"
                >
                  PLAY AGAIN ❤️
                </button>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-pink-300 font-bold tracking-widest animate-pulse">SETTING THE MOOD...</p>
            </div>
          </div>
        )}
      </main>

      <footer className="w-full max-w-xl text-center p-6 text-slate-600 text-xs uppercase tracking-[0.2em] z-10">
        Anniverswordlary • Made By Sujal for his baby • xoxo
      </footer>
    </div>
  );
};

export default App;
