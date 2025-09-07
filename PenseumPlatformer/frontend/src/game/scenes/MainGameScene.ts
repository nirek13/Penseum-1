import Phaser from 'phaser';
import { Question, Platform, PowerUp } from '../../types/GameTypes';
import PlayerEntity from '../entities/PlayerEntity';
import PlatformSystem from '../systems/PlatformSystem';
import PowerUpSystem from '../systems/PowerUpSystem';
import ParticleSystem from '../systems/ParticleSystem';
import UISystem from '../systems/UISystem';
import EnemySystem from '../systems/EnemySystem';
import ProjectileSystem, { ProjectileConfig } from '../systems/ProjectileSystem';
import FallingObjectsSystem from '../systems/FallingObjectsSystem';
import ScreenEffectsSystem from '../systems/ScreenEffectsSystem';
import EnvironmentSystem from '../systems/EnvironmentSystem';
import { GameConfig } from '../config/GameConfig';

interface SceneData {
  playerName: string;
  onGameOver: (score: number) => void;
  fetchQuestions: (count: number) => Promise<Question[]>;
}

export default class MainGameScene extends Phaser.Scene {
  private player!: PlayerEntity;
  private platformSystem!: PlatformSystem;
  private powerUpSystem!: PowerUpSystem;
  private particleSystem!: ParticleSystem;
  private uiSystem!: UISystem;
  private enemySystem!: EnemySystem;
  private projectileSystem!: ProjectileSystem;
  private fallingObjectsSystem!: FallingObjectsSystem;
  private screenEffectsSystem!: ScreenEffectsSystem;
  private environmentSystem!: EnvironmentSystem;

  private questions: Question[] = [];
  private currentQuestionIndex = 0;
  private gameData!: SceneData;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: any;
  private previousWKeyState: boolean = false;

  private gameStats = {
    score: 0,
    lives: 3,
    questionsAnswered: 0,
    correctAnswers: 0,
    hasShield: false,
    powerUpsUsed: 0,
    multiplier: 1,
    isInvincible: false,
    invincibilityTimer: 0,
    enemiesKilled: 0,
    timeBonus: 0,
    accuracyBonus: 0,
    streakBonus: 0,
    currentStreak: 0,
    maxStreak: 0,
    startTime: 0
  };

  // Height-based question tracking for infinite platformer
  private questionHeightTracker = {
    lastQuestionHeight: 0,        // Y position where last question was triggered
    nextQuestionTriggerHeight: 0, // Y position to trigger next question
    heightPerQuestion: 20000,      // Estimated height climbed in ~45 seconds
    hasActiveQuestion: false      // Whether a question UI is currently shown
  };

  constructor() {
    super({ key: 'MainGameScene' });
  }

  init(data: SceneData) {
    this.gameData = data;
  }

  async preload() {
    this.createLoadingScreen();

    this.createPlayerSprites();
    this.createPlatformSprites();
    this.createPowerUpSprites();
    this.createUISprites();
    this.createEnemySprites();
    this.createProjectileSprites();
    this.createFallingObjectSprites();

    try {
      this.questions = await this.gameData.fetchQuestions(20);
    } catch (error) {
      console.error('Failed to load questions:', error);
      this.questions = this.getDefaultQuestions();
    }

    if (this.questions.length === 0) {
      this.questions = this.getDefaultQuestions();
    }
  }

  create() {
    this.createBackground();
    this.createInputHandlers();

    this.player = new PlayerEntity(this, this.cameras.main.width / 2, this.cameras.main.height - 150);
    this.platformSystem = new PlatformSystem(this);
    this.powerUpSystem = new PowerUpSystem(this);
    this.particleSystem = new ParticleSystem(this);
    this.uiSystem = new UISystem(this);
    this.enemySystem = new EnemySystem(this);
    this.projectileSystem = new ProjectileSystem(this);
    this.fallingObjectsSystem = new FallingObjectsSystem(this);
    this.screenEffectsSystem = new ScreenEffectsSystem(this);
    this.environmentSystem = new EnvironmentSystem(this);

    this.setupPhysics();
    this.setupCamera();
    this.setupInfinitePlatformer();
    
    // Setup collisions AFTER platforms are created
    this.setupCollisions();
    
    // Record start time for time bonus calculation
    this.gameStats.startTime = this.time.now;

    this.events.on('answer-selected', this.handleAnswerSelected, this);
    this.events.on('power-up-collected', this.handlePowerUpCollected, this);
    this.events.on('question-answered', this.handleQuestionAnswered, this);
    this.events.on('enemy-attack', this.handleEnemyAttack, this);
    this.events.on('enemy-died', this.handleEnemyDied, this);
    this.events.on('player-damaged', this.handlePlayerDamaged, this);
    this.events.on('projectile-hit', this.handleProjectileHit, this);
    this.events.on('enemy-shoot', this.handleEnemyShoot, this);
    this.events.on('enemy-jumped-on', this.handleEnemyJumpedOn, this);
    this.events.on('spawn-patrol-enemy', this.handleSpawnPatrolEnemy, this);
  }

  private setupCollisions() {
    const playerSprite = this.player.getSprite();
    
    if (playerSprite && playerSprite.body) {
      this.platformSystem.setupPlayerCollision(playerSprite);
      this.powerUpSystem.setupPlayerCollision(playerSprite);
      this.enemySystem.setupPlayerCollision(playerSprite);
      this.projectileSystem.setupPlayerCollision(playerSprite);
      this.fallingObjectsSystem.setupPlayerCollision(playerSprite);
      this.fallingObjectsSystem.setupPlatformCollision(this.platformSystem.getPlatforms());
      
      // Connect systems
      this.enemySystem.setProjectileSystem(this.projectileSystem);
      this.enemySystem.setPlatforms(this.platformSystem.getPlatforms());
    }
  }

  update(time: number, delta: number) {
    this.player.update(time, delta);
    this.platformSystem.update(time, delta);
    this.powerUpSystem.update(time, delta);
    this.particleSystem.update(time, delta);
    this.uiSystem.update(this.gameStats);
    this.enemySystem.update(time, delta, this.player.getSprite());
    this.projectileSystem.update(time, delta);
    this.fallingObjectsSystem.update(time, delta);

    this.handleInput();
    this.updateGameLogic(time, delta);
    this.checkGameBounds();
  }

  private createLoadingScreen() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    const bg = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x2D1B69);
    bg.setOrigin(0, 0);

    const loadingText = this.add.text(centerX, centerY, 'Loading Questions...', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    const progressBar = this.add.rectangle(centerX, centerY + 50, 200, 20, 0x333333);
    const progressFill = this.add.rectangle(centerX - 100, centerY + 50, 0, 16, 0x6F47EB);
    progressFill.setOrigin(0, 0.5);

    let progress = 0;
    const progressTimer = this.time.addEvent({
      delay: 50,
      repeat: 20,
      callback: () => {
        progress += 10;
        progressFill.width = Math.min(200, progress);
        if (progress >= 200) {
          loadingText.setText('Ready!');
          this.time.delayedCall(500, () => {
            loadingText.destroy();
            progressBar.destroy();
            progressFill.destroy();
            bg.destroy();
          });
        }
      }
    });
  }

  private createPlayerSprites() {
    // Enhanced player sprite with gradient and depth
    const playerGraphics = this.add.graphics();
    
    // Shadow
    playerGraphics.fillStyle(0x000000, 0.3);
    playerGraphics.fillRoundedRect(2, 2, 32, 32, 8);
    
    // Base gradient (simulate with layers)
    playerGraphics.fillStyle(0x4C1D95); // Darker purple base
    playerGraphics.fillRoundedRect(0, 0, 32, 32, 8);
    
    playerGraphics.fillStyle(0x6F47EB); // Main purple
    playerGraphics.fillRoundedRect(2, 2, 28, 28, 6);
    
    // Highlight gradient
    playerGraphics.fillStyle(0x8B5CF6, 0.8); // Lighter purple
    playerGraphics.fillRoundedRect(4, 4, 24, 16, 4);
    
    playerGraphics.fillStyle(0xA78BFA, 0.6); // Even lighter
    playerGraphics.fillRoundedRect(6, 6, 20, 10, 3);
    
    // Inner glow
    playerGraphics.fillStyle(0xFFFFFF, 0.3);
    playerGraphics.fillRoundedRect(8, 8, 16, 8, 2);
    
    // Enhanced border with glow
    playerGraphics.lineStyle(3, 0xFFFFFF, 0.9);
    playerGraphics.strokeRoundedRect(0, 0, 32, 32, 8);
    
    playerGraphics.lineStyle(1.5, 0xE0E7FF, 1);
    playerGraphics.strokeRoundedRect(1, 1, 30, 30, 7);
    
    playerGraphics.generateTexture('player', 36, 36);
    playerGraphics.destroy();

    // Enhanced player with shield
    const playerShieldGraphics = this.add.graphics();
    
    // Shield glow layers
    playerShieldGraphics.fillStyle(0x6F47EB, 0.1);
    playerShieldGraphics.fillCircle(22, 22, 22);
    
    playerShieldGraphics.fillStyle(0x6F47EB, 0.2);
    playerShieldGraphics.fillCircle(22, 22, 20);
    
    // Player base (same as above but centered)
    playerShieldGraphics.fillStyle(0x000000, 0.2);
    playerShieldGraphics.fillRoundedRect(8, 8, 28, 28, 6);
    
    playerShieldGraphics.fillStyle(0x4C1D95);
    playerShieldGraphics.fillRoundedRect(6, 6, 28, 28, 6);
    
    playerShieldGraphics.fillStyle(0x6F47EB);
    playerShieldGraphics.fillRoundedRect(8, 8, 24, 24, 5);
    
    playerShieldGraphics.fillStyle(0x8B5CF6, 0.8);
    playerShieldGraphics.fillRoundedRect(10, 10, 20, 14, 3);
    
    playerShieldGraphics.fillStyle(0xFFFFFF, 0.3);
    playerShieldGraphics.fillRoundedRect(12, 12, 16, 8, 2);
    
    // Shield energy rings
    playerShieldGraphics.lineStyle(4, 0xFFFFFF, 0.8);
    playerShieldGraphics.strokeCircle(22, 22, 18);
    
    playerShieldGraphics.lineStyle(2, 0xE0E7FF, 0.6);
    playerShieldGraphics.strokeCircle(22, 22, 16);
    
    playerShieldGraphics.lineStyle(1, 0xFFFFFF, 1);
    playerShieldGraphics.strokeCircle(22, 22, 14);
    
    playerShieldGraphics.generateTexture('player-shield', 48, 48);
    playerShieldGraphics.destroy();
  }

  private createPlatformSprites() {
    const platformConfigs = {
      correct: { base: 0x6F47EB, secondary: 0x8B5CF6, border: 0xFFFFFF, glow: 0x6F47EB },
      incorrect: { base: 0xF8FAFC, secondary: 0xE2E8F0, border: 0x6F47EB, glow: 0xFF6B6B },
      neutral: { base: 0xF8FAFC, secondary: 0xE2E8F0, border: 0x6F47EB, glow: 0x6F47EB },
      breaking: { base: 0xFEF3C7, secondary: 0xFDE68A, border: 0xF59E0B, glow: 0xF59E0B },
      trampoline: { base: 0x6F47EB, secondary: 0x8B5CF6, border: 0xFFFFFF, glow: 0x10B981 },
      cracked: { base: 0xFEE2E2, secondary: 0xFCACAC, border: 0xEF4444, glow: 0xEF4444 }
    };

    Object.entries(platformConfigs).forEach(([type, colors]) => {
      const graphics = this.add.graphics();
      
      // Shadow layer
      graphics.fillStyle(0x000000, 0.15);
      graphics.fillRoundedRect(3, 3, 150, 40, 8);
      
      // Base layer (darker)
      const darkerColor = Phaser.Display.Color.IntegerToRGB(colors.base);
      graphics.fillStyle(Phaser.Display.Color.GetColor32(Math.floor(darkerColor.r * 0.7), Math.floor(darkerColor.g * 0.7), Math.floor(darkerColor.b * 0.7), 255));
      graphics.fillRoundedRect(0, 0, 150, 40, 8);
      
      // Main platform surface
      graphics.fillStyle(colors.base);
      graphics.fillRoundedRect(2, 2, 146, 36, 6);
      
      // Gradient highlight
      graphics.fillStyle(colors.secondary, 0.7);
      graphics.fillRoundedRect(4, 4, 142, 18, 4);
      
      // Inner glow/highlight
      graphics.fillStyle(0xFFFFFF, 0.3);
      graphics.fillRoundedRect(6, 6, 138, 12, 3);
      
      // Special type indicators
      if (type === 'trampoline') {
        // Spring coils
        for (let i = 20; i < 130; i += 25) {
          graphics.lineStyle(3, 0xFFFFFF, 0.8);
          graphics.strokeCircle(i, 20, 6);
          graphics.lineStyle(1.5, colors.glow, 1);
          graphics.strokeCircle(i, 20, 4);
        }
      } else if (type === 'breaking') {
        // Crack lines
        graphics.lineStyle(2, 0xF59E0B, 0.6);
        graphics.moveTo(30, 8);
        graphics.lineTo(45, 32);
        graphics.moveTo(75, 6);
        graphics.lineTo(90, 28);
        graphics.moveTo(110, 10);
        graphics.lineTo(125, 30);
        graphics.strokePath();
      } else if (type === 'cracked') {
        // Deep cracks
        graphics.lineStyle(3, 0xEF4444, 0.8);
        graphics.moveTo(25, 4);
        graphics.lineTo(40, 36);
        graphics.moveTo(75, 2);
        graphics.lineTo(95, 38);
        graphics.moveTo(110, 6);
        graphics.lineTo(130, 34);
        graphics.strokePath();
      }
      
      // Enhanced border with glow effect
      graphics.lineStyle(4, colors.glow, 0.3);
      graphics.strokeRoundedRect(-1, -1, 152, 42, 9);
      
      graphics.lineStyle(2, colors.border, 0.9);
      graphics.strokeRoundedRect(0, 0, 150, 40, 8);
      
      graphics.lineStyle(1, 0xFFFFFF, 0.6);
      graphics.strokeRoundedRect(1, 1, 148, 38, 7);
      
      graphics.generateTexture(`platform-${type}`, 154, 44);
      graphics.destroy();
    });
  }

  private createPowerUpSprites() {
    const powerUps = [
      { key: 'shield', colors: { base: 0x6F47EB, highlight: 0x8B5CF6, glow: 0xC4B5FD } },
      { key: 'boost', colors: { base: 0x10B981, highlight: 0x34D399, glow: 0x6EE7B7 } },
      { key: 'invincibility', colors: { base: 0xF59E0B, highlight: 0xFBBF24, glow: 0xFDE047 } },
      { key: 'multiplier', colors: { base: 0xEF4444, highlight: 0xF87171, glow: 0xFCA5A5 } },
      { key: 'life', colors: { base: 0xEC4899, highlight: 0xF472B6, glow: 0xF9A8D4 } },
      { key: 'jetpack', colors: { base: 0x8B5A2B, highlight: 0xA16207, glow: 0xD97706 } },
      { key: 'trampoline', colors: { base: 0x059669, highlight: 0x10B981, glow: 0x34D399 } },
      { key: 'doubleJump', colors: { base: 0x7C3AED, highlight: 0x8B5CF6, glow: 0xA78BFA } }
    ];

    powerUps.forEach(({ key, colors }) => {
      const graphics = this.add.graphics();
      
      // Outer glow
      graphics.fillStyle(colors.glow, 0.4);
      graphics.fillRoundedRect(-2, -2, 36, 36, 12);
      
      // Shadow
      graphics.fillStyle(0x000000, 0.3);
      graphics.fillRoundedRect(2, 2, 28, 28, 8);
      
      // Base container
      graphics.fillStyle(colors.base);
      graphics.fillRoundedRect(0, 0, 32, 32, 10);
      
      // Gradient highlight
      graphics.fillStyle(colors.highlight, 0.8);
      graphics.fillRoundedRect(2, 2, 28, 16, 8);
      
      // Inner glow
      graphics.fillStyle(0xFFFFFF, 0.5);
      graphics.fillRoundedRect(4, 4, 24, 10, 6);
      
      // Icon-specific decorations
      graphics.fillStyle(0xFFFFFF, 0.9);
      switch(key) {
        case 'shield':
          // Shield shape
          graphics.fillEllipse(16, 12, 12, 8);
          graphics.fillTriangle(16, 20, 10, 26, 22, 26);
          break;
        case 'boost':
          // Lightning bolt
          graphics.fillTriangle(12, 8, 16, 16, 14, 16);
          graphics.fillTriangle(20, 16, 16, 24, 18, 16);
          break;
        case 'invincibility':
          // Star shape
          for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const x = 16 + Math.cos(angle) * 6;
            const y = 16 + Math.sin(angle) * 6;
            graphics.fillCircle(x, y, 2);
          }
          break;
        case 'multiplier':
          // X2 indicator
          graphics.fillRoundedRect(8, 12, 4, 8, 1);
          graphics.fillRoundedRect(20, 12, 4, 8, 1);
          graphics.fillRoundedRect(12, 8, 8, 4, 1);
          break;
        case 'life':
          // Heart shape
          graphics.fillCircle(12, 14, 4);
          graphics.fillCircle(20, 14, 4);
          graphics.fillTriangle(16, 18, 8, 24, 24, 24);
          break;
        case 'jetpack':
          // Jetpack flames
          graphics.fillRoundedRect(10, 18, 4, 8, 2);
          graphics.fillRoundedRect(18, 18, 4, 8, 2);
          graphics.fillRoundedRect(14, 8, 4, 12, 2);
          break;
        case 'trampoline':
          // Spring coils
          graphics.strokeCircle(12, 16, 3);
          graphics.strokeCircle(20, 16, 3);
          graphics.fillRoundedRect(8, 20, 16, 4, 2);
          break;
        case 'doubleJump':
          // Jump arcs
          graphics.lineStyle(3, 0xFFFFFF, 0.9);
          graphics.strokeEllipse(16, 16, 8, 4);
          graphics.strokeEllipse(16, 18, 12, 6);
          break;
      }
      
      // Enhanced border
      graphics.lineStyle(3, 0xFFFFFF, 0.8);
      graphics.strokeRoundedRect(0, 0, 32, 32, 10);
      
      graphics.lineStyle(1, colors.glow, 1);
      graphics.strokeRoundedRect(1, 1, 30, 30, 9);
      
      graphics.generateTexture(`powerup-${key}`, 36, 36);
      graphics.destroy();
    });
  }

  private createUISprites() {
    // Enhanced heart with gradient and glow
    const heartGraphics = this.add.graphics();
    
    // Outer glow
    heartGraphics.fillStyle(0xF472B6, 0.3);
    heartGraphics.fillCircle(10, 12, 8);
    heartGraphics.fillCircle(18, 12, 8);
    heartGraphics.fillTriangle(14, 20, 4, 28, 24, 28);
    
    // Shadow
    heartGraphics.fillStyle(0x000000, 0.2);
    heartGraphics.fillCircle(11, 13, 6);
    heartGraphics.fillCircle(19, 13, 6);
    heartGraphics.fillTriangle(15, 19, 7, 26, 23, 26);
    
    // Base heart - deep red
    heartGraphics.fillStyle(0xDC2626);
    heartGraphics.fillCircle(10, 12, 6);
    heartGraphics.fillCircle(18, 12, 6);
    heartGraphics.fillTriangle(14, 18, 6, 25, 22, 25);
    
    // Gradient highlight - pink
    heartGraphics.fillStyle(0xF472B6);
    heartGraphics.fillCircle(10, 10, 4);
    heartGraphics.fillCircle(18, 10, 4);
    heartGraphics.fillTriangle(14, 15, 8, 20, 20, 20);
    
    // Inner highlight - light pink
    heartGraphics.fillStyle(0xFCE7F3);
    heartGraphics.fillCircle(10, 9, 2.5);
    heartGraphics.fillCircle(18, 9, 2.5);
    heartGraphics.fillTriangle(14, 13, 10, 16, 18, 16);
    
    // Sparkle effect
    heartGraphics.fillStyle(0xFFFFFF, 0.9);
    heartGraphics.fillCircle(8, 8, 1);
    heartGraphics.fillCircle(20, 8, 1);
    heartGraphics.fillCircle(14, 12, 1);
    
    // Enhanced border
    heartGraphics.lineStyle(2.5, 0xFFFFFF, 0.9);
    heartGraphics.strokeCircle(10, 12, 6);
    heartGraphics.strokeCircle(18, 12, 6);
    
    heartGraphics.lineStyle(1, 0xFDE2E7, 1);
    heartGraphics.strokeCircle(10, 12, 5);
    heartGraphics.strokeCircle(18, 12, 5);
    
    heartGraphics.generateTexture('heart', 32, 32);
    heartGraphics.destroy();
  }

  private createEnemySprites() {
    // Enhanced shooter enemy - menacing triangle with gradients
    const shooterGraphics = this.add.graphics();
    
    // Shadow
    shooterGraphics.fillStyle(0x000000, 0.3);
    shooterGraphics.fillTriangle(17, 5, 5, 29, 29, 29);
    
    // Base - dark red/orange
    shooterGraphics.fillStyle(0xDC2626);
    shooterGraphics.fillTriangle(16, 4, 4, 28, 28, 28);
    
    // Gradient highlight
    shooterGraphics.fillStyle(0xF87171, 0.8);
    shooterGraphics.fillTriangle(16, 8, 8, 22, 24, 22);
    
    // Inner glow
    shooterGraphics.fillStyle(0xFCA5A5, 0.6);
    shooterGraphics.fillTriangle(16, 10, 10, 18, 22, 18);
    
    // Weapon barrel highlight
    shooterGraphics.fillStyle(0xFFFFFF, 0.9);
    shooterGraphics.fillRoundedRect(14, 4, 4, 8, 1);
    
    // Enhanced border with glow
    shooterGraphics.lineStyle(3, 0xFF6B6B, 0.6);
    shooterGraphics.strokeTriangle(16, 3, 3, 29, 29, 29);
    
    shooterGraphics.lineStyle(2, 0xFFFFFF, 0.9);
    shooterGraphics.strokeTriangle(16, 4, 4, 28, 28, 28);
    
    shooterGraphics.generateTexture('enemy-shooter', 36, 36);
    shooterGraphics.destroy();

    // Enhanced melee enemy - aggressive angular design
    const meleeGraphics = this.add.graphics();
    
    // Shadow
    meleeGraphics.fillStyle(0x000000, 0.3);
    meleeGraphics.fillRoundedRect(5, 5, 24, 24, 4);
    
    // Base - dark purple
    meleeGraphics.fillStyle(0x4C1D95);
    meleeGraphics.fillRoundedRect(4, 4, 24, 24, 4);
    
    // Main body
    meleeGraphics.fillStyle(0x6F47EB);
    meleeGraphics.fillRoundedRect(6, 6, 20, 20, 3);
    
    // Gradient highlight
    meleeGraphics.fillStyle(0x8B5CF6, 0.8);
    meleeGraphics.fillRoundedRect(8, 8, 16, 10, 2);
    
    // Inner core glow
    meleeGraphics.fillStyle(0xFFFFFF, 0.4);
    meleeGraphics.fillRoundedRect(10, 10, 12, 6, 1);
    
    // Spikes/claws
    meleeGraphics.fillStyle(0xFFFFFF, 0.9);
    meleeGraphics.fillTriangle(6, 8, 2, 12, 6, 16);
    meleeGraphics.fillTriangle(26, 8, 30, 12, 26, 16);
    
    // Enhanced border
    meleeGraphics.lineStyle(3, 0x8B5CF6, 0.6);
    meleeGraphics.strokeRoundedRect(3, 3, 26, 26, 5);
    
    meleeGraphics.lineStyle(2, 0xFFFFFF, 0.9);
    meleeGraphics.strokeRoundedRect(4, 4, 24, 24, 4);
    
    meleeGraphics.generateTexture('enemy-melee', 36, 36);
    meleeGraphics.destroy();

    // Enhanced bomber enemy - pulsing with energy
    const bomberGraphics = this.add.graphics();
    
    // Outer energy field
    bomberGraphics.fillStyle(0xF59E0B, 0.3);
    bomberGraphics.fillCircle(16, 16, 16);
    
    // Shadow
    bomberGraphics.fillStyle(0x000000, 0.2);
    bomberGraphics.fillCircle(17, 17, 12);
    
    // Base body - warning orange
    bomberGraphics.fillStyle(0xD97706);
    bomberGraphics.fillCircle(16, 16, 12);
    
    // Inner explosive core
    bomberGraphics.fillStyle(0xF59E0B);
    bomberGraphics.fillCircle(16, 16, 9);
    
    // Highlight gradient
    bomberGraphics.fillStyle(0xFBBF24, 0.8);
    bomberGraphics.fillCircle(16, 14, 6);
    
    // Core glow
    bomberGraphics.fillStyle(0xFFFFFF, 0.6);
    bomberGraphics.fillCircle(16, 13, 3);
    
    // Warning indicators
    bomberGraphics.fillStyle(0xFF0000, 0.8);
    bomberGraphics.fillCircle(12, 12, 2);
    bomberGraphics.fillCircle(20, 12, 2);
    bomberGraphics.fillCircle(12, 20, 2);
    bomberGraphics.fillCircle(20, 20, 2);
    
    // Energy ring
    bomberGraphics.lineStyle(3, 0xFDE047, 0.8);
    bomberGraphics.strokeCircle(16, 16, 14);
    
    // Enhanced border
    bomberGraphics.lineStyle(2, 0xFFFFFF, 0.9);
    bomberGraphics.strokeCircle(16, 16, 12);
    
    bomberGraphics.generateTexture('enemy-bomber', 36, 36);
    bomberGraphics.destroy();

    // Enhanced walker enemy - sturdy and mechanical
    const walkerGraphics = this.add.graphics();
    
    // Shadow
    walkerGraphics.fillStyle(0x000000, 0.3);
    walkerGraphics.fillRoundedRect(5, 5, 24, 24, 4);
    
    // Base body - steel blue
    walkerGraphics.fillStyle(0x1E40AF);
    walkerGraphics.fillRoundedRect(4, 4, 24, 24, 4);
    
    // Main chassis
    walkerGraphics.fillStyle(0x3B82F6);
    walkerGraphics.fillRoundedRect(6, 6, 20, 20, 3);
    
    // Gradient highlight
    walkerGraphics.fillStyle(0x60A5FA, 0.8);
    walkerGraphics.fillRoundedRect(8, 8, 16, 10, 2);
    
    // Core unit
    walkerGraphics.fillStyle(0xFFFFFF, 0.4);
    walkerGraphics.fillRoundedRect(10, 10, 12, 6, 1);
    
    // Mechanical legs/treads
    walkerGraphics.fillStyle(0x374151);
    walkerGraphics.fillRoundedRect(2, 22, 28, 6, 2);
    walkerGraphics.fillRoundedRect(2, 4, 28, 6, 2);
    
    // Leg details
    walkerGraphics.fillStyle(0x6B7280);
    for (let i = 6; i < 26; i += 4) {
      walkerGraphics.fillCircle(i, 25, 1.5);
      walkerGraphics.fillCircle(i, 7, 1.5);
    }
    
    // Enhanced border
    walkerGraphics.lineStyle(3, 0x60A5FA, 0.6);
    walkerGraphics.strokeRoundedRect(3, 3, 26, 26, 5);
    
    walkerGraphics.lineStyle(2, 0xFFFFFF, 0.9);
    walkerGraphics.strokeRoundedRect(4, 4, 24, 24, 4);
    
    walkerGraphics.generateTexture('enemy-walker', 36, 36);
    walkerGraphics.destroy();

    // Enhanced generic enemy - mysterious and threatening
    const enemyGraphics = this.add.graphics();
    
    // Outer aura
    enemyGraphics.fillStyle(0x6F47EB, 0.2);
    enemyGraphics.fillRoundedRect(2, 2, 28, 28, 8);
    
    // Shadow
    enemyGraphics.fillStyle(0x000000, 0.3);
    enemyGraphics.fillRoundedRect(5, 5, 24, 24, 6);
    
    // Base body - deep purple
    enemyGraphics.fillStyle(0x4C1D95);
    enemyGraphics.fillRoundedRect(4, 4, 24, 24, 6);
    
    // Main surface
    enemyGraphics.fillStyle(0x6F47EB);
    enemyGraphics.fillRoundedRect(6, 6, 20, 20, 4);
    
    // Gradient highlight
    enemyGraphics.fillStyle(0x8B5CF6, 0.7);
    enemyGraphics.fillRoundedRect(8, 8, 16, 12, 3);
    
    // Inner glow
    enemyGraphics.fillStyle(0xC4B5FD, 0.5);
    enemyGraphics.fillRoundedRect(10, 10, 12, 8, 2);
    
    // Core energy
    enemyGraphics.fillStyle(0xFFFFFF, 0.6);
    enemyGraphics.fillRoundedRect(12, 12, 8, 4, 1);
    
    // Energy patterns
    enemyGraphics.lineStyle(2, 0xC4B5FD, 0.8);
    enemyGraphics.strokeRoundedRect(8, 8, 16, 16, 3);
    
    // Enhanced border with double ring
    enemyGraphics.lineStyle(3, 0x8B5CF6, 0.5);
    enemyGraphics.strokeRoundedRect(3, 3, 26, 26, 7);
    
    enemyGraphics.lineStyle(2, 0xFFFFFF, 0.9);
    enemyGraphics.strokeRoundedRect(4, 4, 24, 24, 6);
    
    enemyGraphics.lineStyle(1, 0xE0E7FF, 1);
    enemyGraphics.strokeRoundedRect(5, 5, 22, 22, 5);
    
    enemyGraphics.generateTexture('enemy', 36, 36);
    enemyGraphics.destroy();
  }

  private createProjectileSprites() {
    // Simple enemy projectile - white circle with purple border
    const enemyProjectileGraphics = this.add.graphics();
    enemyProjectileGraphics.fillStyle(0xFFFFFF);
    enemyProjectileGraphics.fillCircle(4, 4, 4);
    enemyProjectileGraphics.lineStyle(1, 0x6F47EB, 1);
    enemyProjectileGraphics.strokeCircle(4, 4, 4);
    enemyProjectileGraphics.generateTexture('projectile-enemy', 8, 8);
    enemyProjectileGraphics.destroy();

    // Simple player projectile - purple circle with white border
    const playerProjectileGraphics = this.add.graphics();
    playerProjectileGraphics.fillStyle(0x6F47EB);
    playerProjectileGraphics.fillCircle(4, 4, 4);
    playerProjectileGraphics.lineStyle(1, 0xFFFFFF, 1);
    playerProjectileGraphics.strokeCircle(4, 4, 4);
    playerProjectileGraphics.generateTexture('projectile-player', 8, 8);
    playerProjectileGraphics.destroy();

    // Simple generic projectile sprite - white with purple border
    const projectileGraphics = this.add.graphics();
    projectileGraphics.fillStyle(0xFFFFFF);
    projectileGraphics.fillCircle(4, 4, 4);
    projectileGraphics.lineStyle(1, 0x6F47EB, 1);
    projectileGraphics.strokeCircle(4, 4, 4);
    projectileGraphics.generateTexture('projectile', 8, 8);
    projectileGraphics.destroy();
  }

  private createFallingObjectSprites() {
    // Simple rock - white with purple border
    const rockGraphics = this.add.graphics();
    rockGraphics.fillStyle(0xFFFFFF);
    rockGraphics.fillRoundedRect(0, 0, 24, 24, 6);
    rockGraphics.lineStyle(2, 0x6F47EB, 1);
    rockGraphics.strokeRoundedRect(0, 0, 24, 24, 6);
    rockGraphics.generateTexture('falling-rock', 24, 24);
    rockGraphics.destroy();

    // Simple spike - purple with white border
    const spikeGraphics = this.add.graphics();
    spikeGraphics.fillStyle(0x6F47EB);
    spikeGraphics.fillTriangle(12, 0, 0, 24, 24, 24);
    spikeGraphics.lineStyle(2, 0xFFFFFF, 1);
    spikeGraphics.strokeTriangle(12, 0, 0, 24, 24, 24);
    spikeGraphics.generateTexture('falling-spike', 24, 24);
    spikeGraphics.destroy();

    // Simple bomb - white with purple border
    const bombGraphics = this.add.graphics();
    bombGraphics.fillStyle(0xFFFFFF);
    bombGraphics.fillCircle(12, 12, 10);
    bombGraphics.lineStyle(2, 0x6F47EB, 1);
    bombGraphics.strokeCircle(12, 12, 10);
    bombGraphics.generateTexture('falling-bomb', 24, 24);
    bombGraphics.destroy();

    // Simple ice - purple with white border
    const iceGraphics = this.add.graphics();
    iceGraphics.fillStyle(0x6F47EB);
    iceGraphics.fillRoundedRect(2, 2, 20, 20, 4);
    iceGraphics.lineStyle(2, 0xFFFFFF, 1);
    iceGraphics.strokeRoundedRect(2, 2, 20, 20, 4);
    iceGraphics.generateTexture('falling-ice', 24, 24);
    iceGraphics.destroy();

    // Simple acid - white with purple border
    const acidGraphics = this.add.graphics();
    acidGraphics.fillStyle(0xFFFFFF);
    acidGraphics.fillCircle(12, 12, 10);
    acidGraphics.lineStyle(2, 0x6F47EB, 1);
    acidGraphics.strokeCircle(12, 12, 10);
    acidGraphics.generateTexture('falling-acid', 24, 24);
    acidGraphics.destroy();
  }

  private createBackground() {
    const bg = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x2D1B69);
    bg.setOrigin(0, 0);

    for (let i = 0; i < 50; i++) {
      const star = this.add.circle(
        Phaser.Math.Between(0, this.cameras.main.width),
        Phaser.Math.Between(0, this.cameras.main.height),
        Phaser.Math.Between(1, 3),
        0xffffff,
        Phaser.Math.FloatBetween(0.3, 0.8)
      );

      this.tweens.add({
        targets: star,
        alpha: Phaser.Math.FloatBetween(0.2, 1),
        duration: Phaser.Math.Between(1000, 3000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }

  private createInputHandlers() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      SPACE: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    };
  }

  private setupPhysics() {
    // Expand world bounds for infinite climbing - much larger upper bound
    this.physics.world.setBounds(0, -100000, this.cameras.main.width, this.cameras.main.height + 100200);
  }
  
  private setupCamera() {
    // Match camera bounds to expanded physics world for infinite climbing
    this.cameras.main.setBounds(0, -100000, this.cameras.main.width, this.cameras.main.height + 100200);
    this.cameras.main.startFollow(this.player.getSprite());
    this.cameras.main.setFollowOffset(0, 100); // Offset so player is slightly below center
    this.cameras.main.setDeadzone(100, 150); // Deadzone for smoother following
  }

  private setupInfinitePlatformer() {
    // Always create initial platforms for gameplay
    this.platformSystem.createInitialPlatforms();
    
    // Initialize height tracking for questions
    const player = this.player.getSprite();
    if (player) {
      // Set initial question height tracking based on starting player position
      this.questionHeightTracker.lastQuestionHeight = player.y;
      this.questionHeightTracker.nextQuestionTriggerHeight = player.y - this.questionHeightTracker.heightPerQuestion;
    }
    
    // Set up continuous platform generation for infinite climbing
    this.time.addEvent({
      delay: 3000, // Every 3 seconds
      callback: () => {
        const playerSprite = this.player.getSprite();
        if (playerSprite) {
          this.platformSystem.generateProceduralPlatforms(playerSprite.y);
        }
      },
      loop: true
    });
    
    // Set up periodic power-up spawning
    this.time.addEvent({
      delay: 8000, // Every 8 seconds
      callback: () => {
        this.spawnRandomPowerUp();
      },
      loop: true
    });
    
    // Show first question after a short delay to let player get oriented
    if (this.questions.length > 0) {
      this.time.delayedCall(5000, () => {
        this.showHeightBasedQuestion();
      });
    }
  }

  private handleInput() {
    const player = this.player.getSprite();
    if (!player || !player.body) return;

    const body = player.body as Phaser.Physics.Arcade.Body;

    // Handle horizontal movement
    if (this.cursors.left.isDown || this.keys.A.isDown) {
      body.setVelocityX(-200);
      player.setFlipX(true);
    } else if (this.cursors.right.isDown || this.keys.D.isDown) {
      body.setVelocityX(200);
      player.setFlipX(false);
    } else {
      body.setVelocityX(0);
    }

    // Handle super jump charging with W key
    const currentWKeyState = this.keys.W.isDown;
    
    if (currentWKeyState && !this.previousWKeyState) {
      // W key just pressed - start charging super jump
      this.player.startSuperJumpCharge();
    } else if (!currentWKeyState && this.previousWKeyState) {
      // W key just released - release super jump
      const jumped = this.player.releaseSuperJump();
      if (jumped) {
        this.particleSystem.createJumpParticles(player.x, player.y + 16);
      }
    } else if (!currentWKeyState && (this.cursors.up.isDown || this.keys.SPACE.isDown) && body.touching.down) {
      // Normal jump with UP arrow or SPACE (only when W is not held)
      body.setVelocityY(-500);
      this.particleSystem.createJumpParticles(player.x, player.y + 16);
    }
    
    // Update previous state for next frame
    this.previousWKeyState = currentWKeyState;
  }

  private updateGameLogic(time: number, delta: number) {
    if (this.gameStats.isInvincible) {
      this.gameStats.invincibilityTimer -= delta;
      if (this.gameStats.invincibilityTimer <= 0) {
        this.gameStats.isInvincible = false;
        this.player.removeInvincibility();
      }
    }

    if (this.gameStats.multiplier > 1) {
      this.gameStats.invincibilityTimer -= delta;
      if (this.gameStats.invincibilityTimer <= 0) {
        this.gameStats.multiplier = 1;
      }
    }
    
    // Dynamic platform generation and cleanup
    const player = this.player.getSprite();
    if (player) {
      // Generate new platforms when player climbs high
      if (player.y < this.cameras.main.scrollY + 200) {
        if (Math.random() < 0.02) { // 2% chance per frame
          this.platformSystem.generateProceduralPlatforms(player.y);
        }
      }
      
      // Cleanup distant platforms to save memory
      if (time % 5000 < 16) { // Every 5 seconds approximately
        this.platformSystem.cleanupDistantPlatforms(player.y);
      }
      
      // Height-based question triggering
      this.checkHeightBasedQuestionTrigger(player.y);
    }
  }

  private checkGameBounds() {
    const player = this.player.getSprite();
    if (!player) return;
    
    const body = player.body as Phaser.Physics.Arcade.Body;
    
    // Check bottom boundary for fall death (keep this mechanic)
    if (player.y > this.cameras.main.height + 100) {
      this.loseLife();
    }
    
    // Manual side boundary checks (since we removed world bounds collision)
    const screenWidth = this.cameras.main.width;
    const playerWidth = player.width * player.scaleX;
    
    // Left boundary
    if (player.x < 0) {
      player.x = 0;
      body.setVelocityX(0);
    }
    
    // Right boundary  
    if (player.x + playerWidth > screenWidth) {
      player.x = screenWidth - playerWidth;
      body.setVelocityX(0);
    }
    
    // No upper boundary check - allow infinite climbing!
  }

  private handleAnswerSelected(data: { platform: Platform; isCorrect: boolean }) {
    this.gameStats.questionsAnswered++;

    if (data.isCorrect) {
      this.gameStats.correctAnswers++;
      this.handleCorrectAnswer(data.platform);
      // Only move to next question after correct answer
      this.moveToNextQuestion();
    } else {
      this.handleIncorrectAnswer(data.platform);
      // For incorrect answers, just apply penalty but keep question active
      // The wrong platform already disappeared, player can try other answers
    }
  }

  private handleCorrectAnswer(platform: Platform) {
    const question = this.questions[this.currentQuestionIndex];
    const basePoints = question.points || 100;
    const points = Math.floor(basePoints * this.gameStats.multiplier);

    this.gameStats.score += points;

    this.player.boost();
    this.particleSystem.createSuccessParticles(platform.x + platform.width / 2, platform.y);

    this.screenEffectsSystem.enhancedFlash(200, 0x00FF00, 0.6, 'pulse');
    this.screenEffectsSystem.createRipple(this.player.x, this.player.y, 150, 0x00FF00);

    this.uiSystem.showFloatingText(`+${points}`, platform.x + platform.width / 2, platform.y, '#6bcf7f');
  }

  private handleIncorrectAnswer(platform: Platform) {
    if (this.gameStats.hasShield) {
      this.gameStats.hasShield = false;
      this.player.removeShield();
      this.particleSystem.createShieldBreakParticles(platform.x + platform.width / 2, platform.y);
      this.uiSystem.showFloatingText('SHIELD BROKEN!', platform.x + platform.width / 2, platform.y, '#6F47EB');
    } else if (this.gameStats.isInvincible) {
      this.particleSystem.createInvincibilityParticles(platform.x + platform.width / 2, platform.y);
      this.uiSystem.showFloatingText('INVINCIBLE!', platform.x + platform.width / 2, platform.y, '#6F47EB');
    } else {
      this.loseLife();
    }

    this.screenEffectsSystem.enhancedShake(300, 0.02, 'horizontal');
    this.particleSystem.createFailureParticles(platform.x + platform.width / 2, platform.y);
  }


  private handlePowerUpCollected(powerUp: PowerUp) {
    this.gameStats.powerUpsUsed++;

    switch (powerUp.type) {
      case 'shield':
        this.gameStats.hasShield = true;
        this.player.addShield();
        this.uiSystem.showFloatingText('SHIELD ACTIVATED!', powerUp.x, powerUp.y, '#4ecdc4');
        break;

      case 'doubleBoost':
        this.player.setDoubleBoost(5000);
        this.uiSystem.showFloatingText('DOUBLE BOOST!', powerUp.x, powerUp.y, '#ff6b6b');
        break;

      case 'invincibility':
        this.gameStats.isInvincible = true;
        this.gameStats.invincibilityTimer = 10000;
        this.player.addInvincibility();
        this.uiSystem.showFloatingText('INVINCIBLE!', powerUp.x, powerUp.y, '#ffd93d');
        break;

      case 'scoreMultiplier':
        this.gameStats.multiplier = 2;
        this.gameStats.invincibilityTimer = 15000;
        this.uiSystem.showFloatingText('2X SCORE!', powerUp.x, powerUp.y, '#6bcf7f');
        break;

      case 'extraLife':
        this.gameStats.lives = Math.min(this.gameStats.lives + 1, 5);
        this.uiSystem.showFloatingText('EXTRA LIFE!', powerUp.x, powerUp.y, '#ff69b4');
        break;
    }

    this.particleSystem.createPowerUpParticles(powerUp.x, powerUp.y, powerUp.type);
  }

  private moveToNextQuestion() {
    // For the new infinite platformer, questions are handled via height-based triggers
    // So we just clear the current question and move to the next one
    this.clearHeightBasedQuestion();
  }

  private spawnRandomPowerUp() {
    if (Phaser.Math.Between(1, 100) <= 30) {
      const x = Phaser.Math.Between(50, this.cameras.main.width - 50);
      const y = Phaser.Math.Between(100, 300);
      this.powerUpSystem.spawnPowerUp(x, y);
    }
  }

  private gameOver() {
    this.scene.pause();
    
    // Calculate final score with bonuses
    this.calculateFinalScore();
    
    // Show game over screen with play again option
    this.showGameOverScreen();
  }
  
  private calculateFinalScore() {
    const gameTime = this.time.now - this.gameStats.startTime;
    const gameTimeSeconds = Math.floor(gameTime / 1000);
    
    // Calculate accuracy bonus
    const accuracy = this.gameStats.questionsAnswered > 0 
      ? this.gameStats.correctAnswers / this.gameStats.questionsAnswered 
      : 0;
    this.gameStats.accuracyBonus = Math.floor(accuracy * 500);
    
    // Calculate time bonus (faster completion = higher bonus)
    this.gameStats.timeBonus = Math.max(0, 1000 - gameTimeSeconds);
    
    // Calculate streak bonus
    this.gameStats.streakBonus = this.gameStats.maxStreak * 50;
    
    // Add all bonuses to final score
    this.gameStats.score += this.gameStats.accuracyBonus + this.gameStats.timeBonus + this.gameStats.streakBonus;
  }
  
  private showGameOverScreen() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    
    // Semi-transparent overlay
    const overlay = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.7);
    overlay.setOrigin(0, 0);
    overlay.setDepth(2000);
    overlay.setScrollFactor(0);
    
    // Game Over container
    const gameOverContainer = this.add.container(centerX, centerY);
    gameOverContainer.setDepth(2001);
    gameOverContainer.setScrollFactor(0);
    
    // Game Over background
    const bgPanel = this.add.rectangle(0, 0, 500, 400, 0xFFFFFF, 1);
    bgPanel.setStrokeStyle(4, 0x6F47EB, 1);
    
    // Game Over title
    const gameOverText = this.add.text(0, -150, 'GAME OVER', {
      fontSize: '48px',
      color: '#6F47EB',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Score breakdown
    const scoreTexts = [
      `Final Score: ${this.gameStats.score.toLocaleString()}`,
      `Questions Answered: ${this.gameStats.correctAnswers}/${this.gameStats.questionsAnswered}`,
      `Accuracy Bonus: +${this.gameStats.accuracyBonus}`,
      `Time Bonus: +${this.gameStats.timeBonus}`,
      `Streak Bonus: +${this.gameStats.streakBonus}`,
      `Enemies Defeated: ${this.gameStats.enemiesKilled}`,
      `Power-ups Used: ${this.gameStats.powerUpsUsed}`
    ];
    
    scoreTexts.forEach((text, index) => {
      const scoreText = this.add.text(0, -80 + (index * 25), text, {
        fontSize: '18px',
        color: '#1F2937',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        fontStyle: index === 0 ? 'bold' : 'normal'
      }).setOrigin(0.5);
      gameOverContainer.add(scoreText);
    });
    
    // Play Again button
    const playAgainButton = this.add.rectangle(0, 120, 200, 50, 0x6F47EB, 1);
    playAgainButton.setStrokeStyle(2, 0x4C2A92, 1);
    playAgainButton.setInteractive({ cursor: 'pointer' });
    
    const playAgainText = this.add.text(0, 120, 'PLAY AGAIN', {
      fontSize: '20px',
      color: '#FFFFFF',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Main Menu button
    const mainMenuButton = this.add.rectangle(0, 180, 200, 50, 0x6B7280, 1);
    mainMenuButton.setStrokeStyle(2, 0x4B5563, 1);
    mainMenuButton.setInteractive({ cursor: 'pointer' });
    
    const mainMenuText = this.add.text(0, 180, 'MAIN MENU', {
      fontSize: '20px',
      color: '#FFFFFF',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Add all elements to container
    gameOverContainer.add([
      bgPanel, gameOverText, playAgainButton, playAgainText, mainMenuButton, mainMenuText
    ]);
    
    // Button interactions
    playAgainButton.on('pointerover', () => {
      playAgainButton.setFillStyle(0x8B63EB);
      this.tweens.add({
        targets: playAgainButton,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 200,
        ease: 'Power2.easeOut'
      });
    });
    
    playAgainButton.on('pointerout', () => {
      playAgainButton.setFillStyle(0x6F47EB);
      this.tweens.add({
        targets: playAgainButton,
        scaleX: 1,
        scaleY: 1,
        duration: 200,
        ease: 'Power2.easeOut'
      });
    });
    
    playAgainButton.on('pointerdown', () => {
      this.restartGame();
    });
    
    mainMenuButton.on('pointerover', () => {
      mainMenuButton.setFillStyle(0x9CA3AF);
      this.tweens.add({
        targets: mainMenuButton,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 200,
        ease: 'Power2.easeOut'
      });
    });
    
    mainMenuButton.on('pointerout', () => {
      mainMenuButton.setFillStyle(0x6B7280);
      this.tweens.add({
        targets: mainMenuButton,
        scaleX: 1,
        scaleY: 1,
        duration: 200,
        ease: 'Power2.easeOut'
      });
    });
    
    mainMenuButton.on('pointerdown', () => {
      this.gameData.onGameOver(this.gameStats.score);
    });
    
    // Animate the game over screen
    gameOverContainer.setAlpha(0);
    gameOverContainer.setScale(0.8);
    
    this.tweens.add({
      targets: gameOverContainer,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 600,
      ease: 'Back.easeOut'
    });
  }
  
  private restartGame() {
    // Reset game stats
    this.gameStats = {
      score: 0,
      lives: 3,
      questionsAnswered: 0,
      correctAnswers: 0,
      hasShield: false,
      powerUpsUsed: 0,
      multiplier: 1,
      isInvincible: false,
      invincibilityTimer: 0,
      enemiesKilled: 0,
      timeBonus: 0,
      accuracyBonus: 0,
      streakBonus: 0,
      currentStreak: 0,
      maxStreak: 0,
      startTime: this.time.now
    };
    
    this.currentQuestionIndex = 0;
    
    // Restart the scene
    this.scene.restart();
  }

  private getDefaultQuestions(): Question[] {
    return [
      {
        id: 1,
        question: "What is 2 + 2?",
        answers: ["3", "4", "5", "6"],
        correct: "4",
        difficulty: "easy",
        subject: "Math",
        explanation: "2 + 2 = 4",
        points: 100
      },
      {
        id: 2,
        question: "Which planet is closest to the Sun?",
        answers: ["Venus", "Mercury", "Mars", "Earth"],
        correct: "Mercury",
        difficulty: "easy",
        subject: "Science",
        explanation: "Mercury is the closest planet to the Sun.",
        points: 100
      }
    ];
  }

  getGameStats() {
    return this.gameStats;
  }

  getCurrentQuestion() {
    return this.questions[this.currentQuestionIndex];
  }

  getPlayer() {
    return this.player;
  }

  // Enhanced event handlers for complete game systems
  private handleEnemyAttack(data: { damage: number; knockback: number; attacker: any }) {
    const { damage, knockback, attacker } = data;
    
    // Get attacker position if available
    let attackerX: number | undefined;
    let attackerY: number | undefined;
    
    if (attacker && attacker.getSprite) {
      const attackerSprite = attacker.getSprite();
      attackerX = attackerSprite.x;
      attackerY = attackerSprite.y;
    }
    
    // Apply damage to player
    const damageApplied = this.player.takeDamage(damage, knockback, attackerX, attackerY);
    
    if (damageApplied) {
      // Any damage restarts the entire game
      this.restartGame();
    }
  }

  private handleEnemyDied(data: { enemy: any }) {
    const { enemy } = data;
    
    // Award points for killing enemy with multiplier
    const basePoints = 50;
    const points = Math.floor(basePoints * this.gameStats.multiplier);
    this.gameStats.score += points;
    this.gameStats.enemiesKilled++;
    
    // Increase streak
    this.gameStats.currentStreak++;
    if (this.gameStats.currentStreak > this.gameStats.maxStreak) {
      this.gameStats.maxStreak = this.gameStats.currentStreak;
    }
    
    // Show floating text
    const enemySprite = enemy.getSprite();
    this.uiSystem.showFloatingText(`+${points}`, enemySprite.x, enemySprite.y, '#6F47EB');
    
    // Show streak bonus if applicable
    if (this.gameStats.currentStreak > 1) {
      this.uiSystem.showFloatingText(`${this.gameStats.currentStreak}x STREAK!`, enemySprite.x, enemySprite.y - 30, '#6F47EB');
    }
    
    // Create death particles
    this.particleSystem.createSuccessParticles(enemySprite.x, enemySprite.y);
  }

  private handlePlayerDamaged(data: { damage: number; knockback?: number; source?: string; objectType?: string }) {
    const { source, objectType } = data;
    
    // Check shields and invincibility first
    if (this.gameStats.hasShield) {
      this.gameStats.hasShield = false;
      this.player.removeShield();
      this.particleSystem.createShieldBreakParticles(this.player.getSprite().x, this.player.getSprite().y);
      this.uiSystem.showFloatingText('SHIELD BROKEN!', this.player.getSprite().x, this.player.getSprite().y - 50, '#6F47EB');
      return;
    }
    
    if (this.gameStats.isInvincible) {
      this.particleSystem.createInvincibilityParticles(this.player.getSprite().x, this.player.getSprite().y);
      this.uiSystem.showFloatingText('INVINCIBLE!', this.player.getSprite().x, this.player.getSprite().y - 50, '#6F47EB');
      return;
    }
    
    // Show damage source message
    if (source === 'falling-object' && objectType) {
      this.uiSystem.showFloatingText(`Hit by ${objectType}!`, this.cameras.main.width / 2, this.cameras.main.height / 2, '#6F47EB');
    } else if (source === 'explosion') {
      this.uiSystem.showFloatingText('EXPLOSION!', this.cameras.main.width / 2, this.cameras.main.height / 2, '#6F47EB');
    }
    
    // Any damage restarts the entire game
    this.restartGame();
  }

  private handleProjectileHit(data: { damage: number; knockback: number; target: any; projectile: any; owner: string }) {
    const { damage, knockback, target, projectile, owner } = data;
    
    // Only handle enemy projectiles hitting player
    if (owner === 'enemy' && target.getData('type') === 'player') {
      // Get projectile position for knockback direction
      const projectileX = projectile.x;
      const projectileY = projectile.y;
      
      // Apply damage to player
      const damageApplied = this.player.takeDamage(damage, knockback, projectileX, projectileY);
      
      if (damageApplied) {
        // Any damage restarts the entire game
        this.restartGame();
      }
    }
  }

  private handleEnemyShoot(data: { x: number; y: number; targetX: number; targetY: number; damage: number; knockback: number; owner: string }) {
    const { x, y, targetX, targetY, damage, knockback, owner } = data;
    
    // Create projectile using ProjectileSystem
    const projectileConfig: ProjectileConfig = {
      speed: 200,
      damage,
      knockback,
      lifetime: 3000,
      color: 0xff0000,
      size: 0.5,
      owner: 'enemy'
    };
    
    this.projectileSystem.createProjectile(x, y, targetX, targetY, projectileConfig);
  }

  private handleEnemyJumpedOn(data: { enemy: any }) {
    const { enemy } = data;
    
    // Give player a bounce boost
    const player = this.player.getSprite();
    const body = player.body as Phaser.Physics.Arcade.Body;
    body.setVelocityY(-200); // Bounce up
    
    // Award points for jumping on enemy with multiplier
    const basePoints = 25;
    const points = Math.floor(basePoints * this.gameStats.multiplier);
    this.gameStats.score += points;
    this.gameStats.enemiesKilled++;
    
    // Increase streak
    this.gameStats.currentStreak++;
    if (this.gameStats.currentStreak > this.gameStats.maxStreak) {
      this.gameStats.maxStreak = this.gameStats.currentStreak;
    }
    
    // Show floating text
    const enemySprite = enemy.getSprite();
    this.uiSystem.showFloatingText(`+${points}`, enemySprite.x, enemySprite.y, '#6F47EB');
    
    // Create bounce particles
    this.particleSystem.createSuccessParticles(enemySprite.x, enemySprite.y);
    
    // Enhanced screen shake with ripple
    this.screenEffectsSystem.enhancedShake(100, 0.01, 'circular');
    this.screenEffectsSystem.createRipple(this.player.x, this.player.y, 100, 0x6F47EB);
  }

  private handleSpawnPatrolEnemy(data: { x: number; y: number; platformX: number; platformWidth: number; patrolId: number }) {
    const { x, y, platformX, platformWidth, patrolId } = data;
    
    // Use the walker enemy type for patrol enemies
    const walkerConfig = {
      type: 'walker' as const,
      health: 2,
      speed: 40, // Slower for patrol
      attackRange: 30,
      attackDamage: 1,
      shootCooldown: 2000,
      knockbackForce: 80,
      color: 0x8B4513, // Brown color for patrol enemies
      size: 1.0,
      canBeJumpedOn: true
    };
    
    // Spawn the patrol enemy
    this.enemySystem.spawnEnemy(x, y, walkerConfig);
  }

  private handleQuestionAnswered(data: { answer: string; isCorrect: boolean; question: any }) {
    this.gameStats.questionsAnswered++;
    
    if (data.isCorrect) {
      this.gameStats.correctAnswers++;
      this.handleCorrectUIAnswer(data);
    } else {
      this.handleIncorrectUIAnswer(data);
    }
    
    // Clear the question from UI
    this.uiSystem.clearQuestion();
    
    // Move to next question after a delay
    this.moveToNextQuestion();
  }

  private handleCorrectUIAnswer(data: { answer: string; isCorrect: boolean; question: any }) {
    const basePoints = data.question.points || 100;
    const points = Math.floor(basePoints * this.gameStats.multiplier);
    
    this.gameStats.score += points;
    
    // Increase answer streak
    this.gameStats.currentStreak++;
    if (this.gameStats.currentStreak > this.gameStats.maxStreak) {
      this.gameStats.maxStreak = this.gameStats.currentStreak;
    }
    
    // Give player a boost
    this.player.boost();
    
    // Create visual effects at player position
    const player = this.player.getSprite();
    if (player) {
      this.particleSystem.createSuccessParticles(player.x, player.y);
      this.uiSystem.showFloatingText(`+${points}`, player.x, player.y - 50, '#6F47EB');
      
      // Show streak bonus if applicable
      if (this.gameStats.currentStreak > 1) {
        this.uiSystem.showFloatingText(`${this.gameStats.currentStreak}x STREAK!`, player.x, player.y - 80, '#6F47EB');
      }
    }
    
    // Enhanced screen flash with energy wave
    this.screenEffectsSystem.enhancedFlash(200, 0x6F47EB, 0.8, 'pulse');
    this.screenEffectsSystem.createEnergyWave(this.player.x, this.player.y, 0, 200);
  }

  private handleIncorrectUIAnswer(data: { answer: string; isCorrect: boolean; question: any }) {
    const player = this.player.getSprite();
    
    // Break streak on incorrect answer
    this.gameStats.currentStreak = 0;
    
    if (this.gameStats.hasShield) {
      this.gameStats.hasShield = false;
      this.player.removeShield();
      if (player) {
        this.particleSystem.createShieldBreakParticles(player.x, player.y);
        this.uiSystem.showFloatingText('SHIELD BROKEN!', player.x, player.y - 50, '#6F47EB');
      }
    } else if (this.gameStats.isInvincible) {
      if (player) {
        this.particleSystem.createInvincibilityParticles(player.x, player.y);
        this.uiSystem.showFloatingText('INVINCIBLE!', player.x, player.y - 50, '#6F47EB');
      }
    } else {
      this.loseLife();
    }
    
    // Enhanced failure effects
    this.screenEffectsSystem.enhancedShake(300, 0.02, 'horizontal');
    this.screenEffectsSystem.activateChromaticAberration(5, 800);
    this.screenEffectsSystem.screenPulse(0xFF0000, 0.3, 400);
    if (player) {
      this.particleSystem.createFailureParticles(player.x, player.y);
    }
  }

  private loseLife() {
    // Any life loss now restarts the entire game
    this.screenEffectsSystem.enhancedFlash(300, 0xFF0000, 0.7, 'strobe');
    this.restartGame();
  }

  // Height-based question triggering methods for infinite platformer
  private checkHeightBasedQuestionTrigger(currentPlayerY: number) {
    // Only proceed if we have questions and no active question is showing
    if (this.questions.length === 0 || this.questionHeightTracker.hasActiveQuestion) {
      return;
    }
    
    // Check if player has climbed enough to trigger next question
    // Since Y decreases as player climbs up, we check if current Y is <= trigger height
    if (currentPlayerY <= this.questionHeightTracker.nextQuestionTriggerHeight) {
      this.showHeightBasedQuestion();
    }
  }
  
  private showHeightBasedQuestion() {
    if (this.questions.length === 0 || this.questionHeightTracker.hasActiveQuestion) {
      return;
    }
    
    // Mark question as active
    this.questionHeightTracker.hasActiveQuestion = true;
    
    // Get current question
    const question = this.questions[this.currentQuestionIndex];
    
    // Update height tracking
    const player = this.player.getSprite();
    if (player) {
      this.questionHeightTracker.lastQuestionHeight = player.y;
      this.questionHeightTracker.nextQuestionTriggerHeight = player.y - this.questionHeightTracker.heightPerQuestion;
      
      // Create question platforms above the player's current position
      const questionY = player.y - 300; // Place platforms above player
      this.platformSystem.createPlatformsForQuestion(question, questionY);
    }
    
    // Add visual indicator that a question appeared
    this.screenEffectsSystem.enhancedFlash(300, 0x6F47EB, 0.8, 'fade');
    this.screenEffectsSystem.createRipple(this.player.x, this.player.y, 250, 0x6F47EB);
    
    // Show floating notification
    if (player) {
      this.uiSystem.showFloatingText('New Question!', player.x, player.y - 100, '#6F47EB');
    }
  }
  
  private clearHeightBasedQuestion() {
    // Mark question as no longer active
    this.questionHeightTracker.hasActiveQuestion = false;
    
    // Move to next question
    this.currentQuestionIndex++;
    if (this.currentQuestionIndex >= this.questions.length) {
      this.currentQuestionIndex = 0;
    }
  }
}
