import React, { useState } from 'react';
import './App.css';
import Game from './components/Game';
import StartScreen from './components/StartScreen';
import GameOverScreen from './components/GameOverScreen';
import { GameState } from './types/GameTypes';

function App() {
  const [gameState, setGameState] = useState<GameState>('start');
  const [score, setScore] = useState(0);
  const [playerName, setPlayerName] = useState('');

  const handleGameStart = (name: string) => {
    setPlayerName(name);
    setGameState('playing');
  };

  const handleGameOver = (finalScore: number) => {
    setScore(finalScore);
    setGameState('gameOver');
  };

  const handleRestart = () => {
    setScore(0);
    setGameState('start');
  };

  return (
    <div className="App">
      {gameState === 'start' && (
        <StartScreen onStart={handleGameStart} />
      )}
      {gameState === 'playing' && (
        <Game 
          playerName={playerName}
          onGameOver={handleGameOver}
        />
      )}
      {gameState === 'gameOver' && (
        <GameOverScreen 
          score={score}
          playerName={playerName}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}

export default App;
