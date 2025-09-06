import React, { useState, useEffect } from 'react';
import './GameOverScreen.css';
import { ScoreData } from '../types/GameTypes';
import { saveScore, getLeaderboard } from '../utils/api';

interface GameOverScreenProps {
  score: number;
  playerName: string;
  onRestart: () => void;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ 
  score, 
  playerName, 
  onRestart 
}) => {
  const [isScoreSaved, setIsScoreSaved] = useState(false);
  const [leaderboard, setLeaderboard] = useState<ScoreData[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    handleSaveScore();
    loadLeaderboard();
  }, []);

  const handleSaveScore = async () => {
    try {
      setIsLoading(true);
      const scoreData = {
        playerName,
        score,
        questionsAnswered: 0,
        correctAnswers: 0,
        lives: 0,
        powerUpsUsed: 0,
        gameMode: 'standard',
        difficulty: 'mixed'
      };
      
      await saveScore(scoreData);
      setIsScoreSaved(true);
    } catch (error) {
      console.error('Error saving score:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const data = await getLeaderboard(10);
      setLeaderboard(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };

  const getScoreMessage = () => {
    if (score >= 5000) return { text: "LEGENDARY!", emoji: "👑", color: "#ffd700" };
    if (score >= 3000) return { text: "EXCELLENT!", emoji: "🌟", color: "#ff6b6b" };
    if (score >= 2000) return { text: "GREAT JOB!", emoji: "🎉", color: "#4ecdc4" };
    if (score >= 1000) return { text: "WELL DONE!", emoji: "👏", color: "#6bcf7f" };
    if (score >= 500) return { text: "GOOD EFFORT!", emoji: "👍", color: "#ffd93d" };
    return { text: "KEEP TRYING!", emoji: "💪", color: "#ff9f43" };
  };

  const scoreMessage = getScoreMessage();

  return (
    <div className="game-over-screen">
      <div className="game-over-content">
        <div className="score-section">
          <div className="game-over-title">GAME OVER</div>
          
          <div className="player-info">
            <div className="player-name">👤 {playerName}</div>
          </div>

          <div className="final-score">
            <div className="score-label">FINAL SCORE</div>
            <div className="score-value" style={{color: scoreMessage.color}}>
              {score.toLocaleString()}
            </div>
          </div>

          <div className="score-message" style={{color: scoreMessage.color}}>
            <span className="message-emoji">{scoreMessage.emoji}</span>
            <span className="message-text">{scoreMessage.text}</span>
          </div>

          {isLoading && (
            <div className="saving-indicator">
              <div className="spinner"></div>
              <span>Saving score...</span>
            </div>
          )}

          {isScoreSaved && !isLoading && (
            <div className="score-saved">
              ✅ Score saved to leaderboard!
            </div>
          )}
        </div>

        <div className="action-buttons">
          <button 
            onClick={onRestart}
            className="play-again-button"
          >
            🎮 PLAY AGAIN
          </button>
          
          <button 
            onClick={() => setShowLeaderboard(!showLeaderboard)}
            className="leaderboard-button"
          >
            🏆 {showLeaderboard ? 'HIDE' : 'SHOW'} LEADERBOARD
          </button>
        </div>

        {showLeaderboard && (
          <div className="leaderboard-section">
            <h3>🏆 TOP PLAYERS</h3>
            <div className="leaderboard">
              {leaderboard.length > 0 ? (
                leaderboard.map((entry, index) => {
                  const isCurrentPlayer = entry.playerName === playerName && 
                    entry.score === score;
                  
                  return (
                    <div 
                      key={entry.id} 
                      className={`leaderboard-entry ${
                        isCurrentPlayer ? 'current-player' : ''
                      }`}
                    >
                      <div className="rank">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </div>
                      <div className="player-name">{entry.playerName}</div>
                      <div className="player-score">{entry.score.toLocaleString()}</div>
                      <div className="accuracy">{entry.accuracy}%</div>
                    </div>
                  );
                })
              ) : (
                <div className="no-scores">No scores yet! Be the first to play!</div>
              )}
            </div>
          </div>
        )}

        <div className="game-stats">
          <div className="tip">
            💡 <strong>Tip:</strong> Jump on correct answers for higher scores!
            Collect power-ups to boost your performance!
          </div>
        </div>
      </div>
      
      <div className="background-particles">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i} 
            className="particle" 
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          >
            {['⭐', '💎', '🚀', '🎯', '💫'][Math.floor(Math.random() * 5)]}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameOverScreen;