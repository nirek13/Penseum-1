import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import MainGameScene from '../game/scenes/MainGameScene';
import { fetchRandomQuestions } from '../utils/api';
//nirek
interface GameProps {
  playerName: string;
  onGameOver: (score: number) => void;
}

const Game: React.FC<GameProps> = ({ playerName, onGameOver }) => {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (gameRef.current) {
      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: window.innerWidth,
        height: window.innerHeight,
        parent: gameRef.current,
        backgroundColor: '#FFFFFF',
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { x: 0, y: 300 },
            debug: false,
          },
        },
        scene: [MainGameScene],
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width: '100%',
          height: '100%',
        },
        render: {
          antialias: true,
          pixelArt: false,
        },
      };

      phaserGameRef.current = new Phaser.Game(config);

      phaserGameRef.current.scene.start('MainGameScene', {
        playerName,
        onGameOver,
        fetchQuestions: fetchRandomQuestions,
      });

      return () => {
        if (phaserGameRef.current) {
          phaserGameRef.current.destroy(true);
          phaserGameRef.current = null;
        }
      };
    }
  }, [playerName, onGameOver]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: '#FFFFFF'
    }}>
      <div 
        ref={gameRef} 
        style={{
          width: '100%',
          height: '100%'
        }}
      />
      {/* <div style={{
        position: 'absolute',
        top: '56px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#FFFFFF',
        borderRadius: '12px',
        padding: '1rem 2rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        border: '1px solid #E5E7EB',
        zIndex: 1000,
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
      }}>
        <div style={{
          display: 'flex',
          gap: '2rem',
          color: '#000000',
          fontSize: '0.875rem',
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: 'center',
          fontWeight: '500'
        }}>
          <span><strong style={{ color: '#7C3AED' }}>Move:</strong> A/D or ←/→</span>
          <span><strong style={{ color: '#7C3AED' }}>Jump:</strong> SPACE or ↑</span>
          <span><strong style={{ color: '#7C3AED' }}>Player:</strong> {playerName}</span>
        </div>
      </div> */}
    </div>
  );
};

export default Game;