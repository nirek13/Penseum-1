import React, { useState } from 'react';
import './StartScreen.css';

interface StartScreenProps {
  onStart: (playerName: string) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  const [playerName, setPlayerName] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);

  const handleStart = () => {
    if (playerName.trim()) onStart(playerName.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && playerName.trim()) handleStart();
  };

  return (
    <div className="start-screen arcade-bg">
      <div className="start-content arcade-glow">
        <h1 className="game-title arcade-title">
          <span className="title-main">Educational</span>
          <span className="title-sub">Platformer</span>
        </h1>

        <div className="subtitle arcade-subtitle">Jump your way to knowledge!</div>

        <div className="player-input arcade-input">
          <input
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyDown={handleKeyPress}
            className="name-input arcade-text"
            maxLength={20}
          />
          <button
            onClick={handleStart}
            disabled={!playerName.trim()}
            className="start-button arcade-button"
          >
            START GAME
          </button>
        </div>

        <div className="game-info arcade-info">
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="instructions-toggle arcade-button-small"
          >
            {showInstructions ? 'Hide Instructions' : 'Show Instructions'}
          </button>

          {showInstructions && (
            <div className="instructions arcade-instructions">
              <h3>How to Play</h3>
              <ul>
                <li>Move with <strong>A/D</strong> or <strong>←/→</strong></li>
                <li>Jump with <strong>Space</strong> or <strong>↑</strong></li>
                <li>Land on the correct answer to climb higher</li>
                <li>Wrong answers cost you a life</li>
                <li>Collect power-ups for boosts</li>
              </ul>

              <h3>Power-ups</h3>
              <ul>
                <li>🛡️ Shield – Blocks one wrong answer</li>
                <li>⚡ Double Boost – Extra jump height</li>
                <li>🔥 Invincibility – Temporary immunity</li>
                <li>×2 Score Multiplier – Double points</li>
                <li>❤️ Extra Life – Gain a new chance</li>
              </ul>
            </div>
          )}
        </div>

        <div className="game-features arcade-features">
          <div className="feature arcade-feature">
            <span className="feature-icon">🧠</span>
            <span>Educational Content</span>
          </div>
          <div className="feature arcade-feature">
            <span className="feature-icon">⚡</span>
            <span>Fast-Paced Action</span>
          </div>
          <div className="feature arcade-feature">
            <span className="feature-icon">🏆</span>
            <span>Compete & Score</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartScreen;
