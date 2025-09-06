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

  private questions: Question[] = [];
  private currentQuestionIndex = 0;
  private gameData!: SceneData;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: any;

  private gameStats = {
    score: 0,
    lives: 3,
    questionsAnswered: 0,
    correctAnswers: 0,
    hasShield: false,
    powerUpsUsed: 0,
    multiplier: 1,
    isInvincible: false,
    invincibilityTimer: 0
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

    this.setupPhysics();
    this.setupCamera();
    this.createFirstQuestion();
    
    // Setup collisions AFTER platforms are created
    this.setupCollisions();

    // Log current jump physics configuration for debugging
    console.log('=== GAME PHYSICS CONFIGURATION ===');
    console.log('Jump Physics:', GameConfig.getJumpPhysicsInfo());
    console.log('To adjust difficulty, modify values in GameConfig.ts');
    console.log('=====================================');

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

    // Clean white background
    const bg = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0xFFFFFF);
    bg.setOrigin(0, 0);

    // Modern loading text with Penseum styling
    const loadingText = this.add.text(centerX, centerY - 20, 'Loading Questions...', {
      fontSize: '32px',
      color: '#000000',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Stylish progress bar container
    const progressBar = this.add.rectangle(centerX, centerY + 40, 300, 8, 0xE5E7EB);
    progressBar.setStrokeStyle(1, 0xD1D5DB, 1);
    
    // Purple progress fill
    const progressFill = this.add.rectangle(centerX - 150, centerY + 40, 0, 6, 0x7C3AED);
    progressFill.setOrigin(0, 0.5);

    let progress = 0;
    this.time.addEvent({
      delay: 50,
      repeat: 20,
      callback: () => {
        progress += 15;
        progressFill.width = Math.min(300, progress);
        if (progress >= 300) {
          loadingText.setText('Ready to Learn!');
          loadingText.setStyle({ color: '#7C3AED' }); // Change to purple when ready
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
    // Modern, minimal player design with Penseum colors and gradients
    const playerGraphics = this.add.graphics();
    
    // Create gradient background
    playerGraphics.fillGradientStyle(0x7C3AED, 0x5B21B6, 0x9333EA, 0x6D28D9);
    playerGraphics.fillRoundedRect(0, 0, 32, 32, 12); // Medium rounded corners
    
    // Add subtle highlight for depth
    playerGraphics.fillStyle(0xffffff, 0.4);
    playerGraphics.fillRoundedRect(4, 4, 24, 6, 3); // Larger white highlight
    
    // Add shadow underneath
    playerGraphics.fillStyle(0x000000, 0.2);
    playerGraphics.fillRoundedRect(2, 28, 28, 6, 3); // Shadow
    
    // Add border for definition
    playerGraphics.lineStyle(2, 0x4C1D95, 1);
    playerGraphics.strokeRoundedRect(1, 1, 30, 30, 12);
    
    playerGraphics.generateTexture('player', 32, 36);
    playerGraphics.destroy();

    // Player with shield - enhanced design
    const playerShieldGraphics = this.add.graphics();
    
    // Player body with gradient
    playerShieldGraphics.fillGradientStyle(0x7C3AED, 0x5B21B6, 0x9333EA, 0x6D28D9);
    playerShieldGraphics.fillRoundedRect(6, 6, 32, 32, 12);
    
    // Shield glow effect
    playerShieldGraphics.fillStyle(0x60A5FA, 0.3);
    playerShieldGraphics.fillCircle(22, 22, 24);
    
    // Shield outline with gradient effect
    playerShieldGraphics.lineStyle(4, 0x3B82F6, 1);
    playerShieldGraphics.strokeCircle(22, 22, 20);
    playerShieldGraphics.lineStyle(2, 0x60A5FA, 1);
    playerShieldGraphics.strokeCircle(22, 22, 18);
    
    // Player highlight
    playerShieldGraphics.fillStyle(0xffffff, 0.4);
    playerShieldGraphics.fillRoundedRect(10, 10, 24, 6, 3);
    
    playerShieldGraphics.generateTexture('player-shield', 44, 44);
    playerShieldGraphics.destroy();
  }

  private createPlatformSprites() {
    const platformConfigs = {
      correct: { base: 0x7C3AED, dark: 0x5B21B6, light: 0x9333EA, accent: 0x6D28D9 },
      incorrect: { base: 0x374151, dark: 0x1F2937, light: 0x4B5563, accent: 0x6B7280 },
      neutral: { base: 0x6B7280, dark: 0x4B5563, light: 0x9CA3AF, accent: 0xD1D5DB },
      breaking: { base: 0xEF4444, dark: 0xDC2626, light: 0xF87171, accent: 0x991B1B },
      trampoline: { base: 0x10B981, dark: 0x047857, light: 0x34D399, accent: 0x059669 },
      cracked: { base: 0x9CA3AF, dark: 0x6B7280, light: 0xD1D5DB, accent: 0x4B5563 }
    };

    Object.entries(platformConfigs).forEach(([type, colors]) => {
      const graphics = this.add.graphics();
      
      // Create shadow first (drawn behind)
      graphics.fillStyle(0x000000, 0.2);
      graphics.fillRoundedRect(2, 4, 150, 40, 12);
      
      // Create gradient background
      graphics.fillGradientStyle(colors.base, colors.dark, colors.light, colors.accent);
      graphics.fillRoundedRect(0, 0, 150, 40, 12);
      
      // Add subtle inner shadow for depth
      graphics.fillStyle(colors.dark, 0.3);
      graphics.fillRoundedRect(2, 2, 146, 4, 6);
      
      // Add highlight on top
      graphics.fillStyle(0xffffff, 0.2);
      graphics.fillRoundedRect(4, 4, 142, 8, 6);
      
      // Add special effects for different platform types
      if (type === 'breaking') {
        // Add crack pattern for breaking platforms
        graphics.lineStyle(2, colors.accent, 1);
        graphics.strokeRoundedRect(1, 1, 148, 38, 12);
        
        // Draw realistic crack lines
        graphics.lineStyle(2, colors.accent, 0.8);
        graphics.moveTo(30, 8);
        graphics.lineTo(45, 32);
        graphics.lineTo(55, 15);
        graphics.moveTo(80, 12);
        graphics.lineTo(70, 28);
        graphics.lineTo(85, 35);
        graphics.moveTo(100, 6);
        graphics.lineTo(115, 25);
        graphics.lineTo(125, 18);
        graphics.strokePath();
        
      } else if (type === 'trampoline') {
        // Add bounce indicator for trampolines
        graphics.lineStyle(3, colors.accent, 1);
        graphics.strokeRoundedRect(1, 1, 148, 38, 12);
        
        // Draw enhanced spring coils with 3D effect
        for (let i = 25; i < 125; i += 25) {
          graphics.lineStyle(3, colors.accent, 0.8);
          graphics.strokeCircle(i, 20, 6);
          graphics.lineStyle(2, colors.light, 0.6);
          graphics.strokeCircle(i, 18, 4);
        }
        
        // Add bounce indicators
        graphics.fillStyle(colors.light, 0.6);
        graphics.fillTriangle(75, 8, 70, 15, 80, 15);
        
      } else if (type === 'correct') {
        // Add subtle glow effect for correct platforms
        graphics.lineStyle(3, colors.light, 0.6);
        graphics.strokeRoundedRect(0, 0, 150, 40, 12);
        
      } else {
        // Standard enhanced border
        graphics.lineStyle(2, colors.accent, 1);
        graphics.strokeRoundedRect(1, 1, 148, 38, 12);
      }

      graphics.generateTexture(`platform-${type}`, 150, 44);
      graphics.destroy();
    });
  }

  private createPowerUpSprites() {
    const powerUps = [
      { key: 'shield', color: 0x7C3AED }, // Penseum purple
      { key: 'boost', color: 0x000000 }, // Black  
      { key: 'invincibility', color: 0x4B5563 }, // Gray
      { key: 'multiplier', color: 0x7C3AED }, // Purple
      { key: 'life', color: 0x000000 }, // Black
      { key: 'jetpack', color: 0xF59E0B }, // Orange for jetpack
      { key: 'trampoline', color: 0x10B981 }, // Green for trampoline
      { key: 'doubleJump', color: 0x8B5CF6 } // Light purple for double jump
    ];

    powerUps.forEach(({ key, color }) => {
      const graphics = this.add.graphics();
      
      if (key === 'jetpack') {
        // Special jetpack design
        graphics.fillStyle(color);
        graphics.fillRoundedRect(6, 4, 20, 24, 6);
        
        // Jetpack flames
        graphics.fillStyle(0xFF6B35);
        graphics.fillTriangle(8, 28, 12, 32, 16, 28);
        graphics.fillTriangle(16, 28, 20, 32, 24, 28);
        
        // Border
        graphics.lineStyle(2, 0xffffff, 1);
        graphics.strokeRoundedRect(6, 4, 20, 24, 6);
        
      } else if (key === 'trampoline') {
        // Special trampoline design
        graphics.fillStyle(color);
        graphics.fillRoundedRect(4, 4, 24, 24, 8);
        
        // Spring coil in center
        graphics.lineStyle(2, 0xffffff, 1);
        graphics.strokeCircle(16, 16, 6);
        graphics.strokeCircle(16, 16, 3);
        
        // Border
        graphics.strokeRoundedRect(4, 4, 24, 24, 8);
        
      } else {
        // Standard power-up design
        graphics.fillStyle(color);
        graphics.fillRoundedRect(4, 4, 24, 24, 8);
        
        // Clean white border
        graphics.lineStyle(2, 0xffffff, 1);
        graphics.strokeRoundedRect(4, 4, 24, 24, 8);
      }
      
      graphics.generateTexture(`powerup-${key}`, 32, 32);
      graphics.destroy();
    });
  }

  private createUISprites() {
    // Modern heart design in Penseum colors
    const heartGraphics = this.add.graphics();
    heartGraphics.fillStyle(0x7C3AED); // Purple heart
    heartGraphics.fillCircle(10, 12, 6);
    heartGraphics.fillCircle(18, 12, 6);
    heartGraphics.fillTriangle(14, 18, 6, 25, 22, 25);
    
    // White outline for contrast on white background
    heartGraphics.lineStyle(2, 0x000000, 0.5);
    heartGraphics.strokeCircle(10, 12, 6);
    heartGraphics.strokeCircle(18, 12, 6);
    
    heartGraphics.generateTexture('heart', 28, 28);
    heartGraphics.destroy();
  }

  private createEnemySprites() {
    // Shooter enemy - red triangle
    const shooterGraphics = this.add.graphics();
    shooterGraphics.fillStyle(0xff0000);
    shooterGraphics.fillTriangle(16, 4, 4, 28, 28, 28);
    shooterGraphics.lineStyle(2, 0x000000, 1);
    shooterGraphics.strokeTriangle(16, 4, 4, 28, 28, 28);
    shooterGraphics.generateTexture('enemy-shooter', 32, 32);
    shooterGraphics.destroy();

    // Melee enemy - dark red square
    const meleeGraphics = this.add.graphics();
    meleeGraphics.fillStyle(0x8B0000);
    meleeGraphics.fillRoundedRect(4, 4, 24, 24, 4);
    meleeGraphics.lineStyle(2, 0x000000, 1);
    meleeGraphics.strokeRoundedRect(4, 4, 24, 24, 4);
    meleeGraphics.generateTexture('enemy-melee', 32, 32);
    meleeGraphics.destroy();

    // Bomber enemy - dark red circle
    const bomberGraphics = this.add.graphics();
    bomberGraphics.fillStyle(0x4B0000);
    bomberGraphics.fillCircle(16, 16, 12);
    bomberGraphics.lineStyle(2, 0x000000, 1);
    bomberGraphics.strokeCircle(16, 16, 12);
    bomberGraphics.generateTexture('enemy-bomber', 32, 32);
    bomberGraphics.destroy();

    // Walker enemy - green square
    const walkerGraphics = this.add.graphics();
    walkerGraphics.fillStyle(0x006400);
    walkerGraphics.fillRoundedRect(4, 4, 24, 24, 4);
    walkerGraphics.lineStyle(2, 0x000000, 1);
    walkerGraphics.strokeRoundedRect(4, 4, 24, 24, 4);
    walkerGraphics.generateTexture('enemy-walker', 32, 32);
    walkerGraphics.destroy();

    // Generic enemy sprite (fallback)
    const enemyGraphics = this.add.graphics();
    enemyGraphics.fillStyle(0xff0000);
    enemyGraphics.fillRoundedRect(4, 4, 24, 24, 6);
    enemyGraphics.lineStyle(2, 0x000000, 1);
    enemyGraphics.strokeRoundedRect(4, 4, 24, 24, 6);
    enemyGraphics.generateTexture('enemy', 32, 32);
    enemyGraphics.destroy();
  }

  private createProjectileSprites() {
    // Enemy projectile - red circle with glow
    const enemyProjectileGraphics = this.add.graphics();
    enemyProjectileGraphics.fillGradientStyle(0xff0000, 0xaa0000, 0xff4444, 0x660000);
    enemyProjectileGraphics.fillCircle(4, 4, 4);
    enemyProjectileGraphics.lineStyle(1, 0x000000, 1);
    enemyProjectileGraphics.strokeCircle(4, 4, 4);
    enemyProjectileGraphics.generateTexture('projectile-enemy', 8, 8);
    enemyProjectileGraphics.destroy();

    // Player projectile - blue circle with glow
    const playerProjectileGraphics = this.add.graphics();
    playerProjectileGraphics.fillGradientStyle(0x0000ff, 0x0000aa, 0x4444ff, 0x000066);
    playerProjectileGraphics.fillCircle(4, 4, 4);
    playerProjectileGraphics.lineStyle(1, 0x000000, 1);
    playerProjectileGraphics.strokeCircle(4, 4, 4);
    playerProjectileGraphics.generateTexture('projectile-player', 8, 8);
    playerProjectileGraphics.destroy();

    // Generic projectile sprite (fallback)
    const projectileGraphics = this.add.graphics();
    projectileGraphics.fillGradientStyle(0xff0000, 0xaa0000, 0xff4444, 0x660000);
    projectileGraphics.fillCircle(4, 4, 4);
    projectileGraphics.lineStyle(1, 0x000000, 1);
    projectileGraphics.strokeCircle(4, 4, 4);
    projectileGraphics.generateTexture('projectile', 8, 8);
    projectileGraphics.destroy();
  }

  private createFallingObjectSprites() {
    // Rock - brown with cracks
    const rockGraphics = this.add.graphics();
    rockGraphics.fillGradientStyle(0x8B4513, 0x5D2F0A, 0xA0522D, 0x654321);
    rockGraphics.fillRoundedRect(0, 0, 24, 24, 6);
    
    // Add crack details
    rockGraphics.lineStyle(1, 0x3E2723, 0.8);
    rockGraphics.moveTo(6, 4);
    rockGraphics.lineTo(12, 16);
    rockGraphics.moveTo(16, 8);
    rockGraphics.lineTo(20, 18);
    rockGraphics.strokePath();
    
    // Shadow
    rockGraphics.fillStyle(0x000000, 0.2);
    rockGraphics.fillEllipse(12, 26, 20, 6);
    
    rockGraphics.generateTexture('falling-rock', 24, 28);
    rockGraphics.destroy();

    // Spike - metallic silver with sharp edges
    const spikeGraphics = this.add.graphics();
    spikeGraphics.fillGradientStyle(0xC0C0C0, 0x808080, 0xE0E0E0, 0x606060);
    spikeGraphics.fillTriangle(12, 0, 0, 24, 24, 24);
    
    // Metallic shine
    spikeGraphics.fillStyle(0xFFFFFF, 0.4);
    spikeGraphics.fillTriangle(12, 2, 8, 12, 16, 12);
    
    // Sharp edge highlight
    spikeGraphics.lineStyle(1, 0xFFFFFF, 0.6);
    spikeGraphics.moveTo(12, 0);
    spikeGraphics.lineTo(0, 24);
    spikeGraphics.strokePath();
    
    spikeGraphics.generateTexture('falling-spike', 24, 24);
    spikeGraphics.destroy();

    // Bomb - black with red fuse
    const bombGraphics = this.add.graphics();
    bombGraphics.fillGradientStyle(0x2C2C2C, 0x000000, 0x4A4A4A, 0x1A1A1A);
    bombGraphics.fillCircle(12, 12, 10);
    
    // Fuse
    bombGraphics.lineStyle(2, 0x8B4513, 1);
    bombGraphics.moveTo(12, 2);
    bombGraphics.lineTo(10, 0);
    bombGraphics.strokePath();
    
    // Spark at end of fuse
    bombGraphics.fillStyle(0xFF4500, 1);
    bombGraphics.fillCircle(10, 0, 2);
    
    // Shine on bomb
    bombGraphics.fillStyle(0xFFFFFF, 0.2);
    bombGraphics.fillCircle(8, 8, 3);
    
    bombGraphics.generateTexture('falling-bomb', 24, 24);
    bombGraphics.destroy();

    // Ice - translucent blue with sparkles
    const iceGraphics = this.add.graphics();
    iceGraphics.fillGradientStyle(0x87CEEB, 0x4682B4, 0xADD8E6, 0x5F9EA0);
    iceGraphics.fillRoundedRect(2, 2, 20, 20, 4);
    
    // Ice crystals
    iceGraphics.lineStyle(1, 0xFFFFFF, 0.8);
    iceGraphics.strokeRoundedRect(4, 4, 16, 16, 3);
    
    // Internal sparkles
    iceGraphics.fillStyle(0xFFFFFF, 0.6);
    iceGraphics.fillCircle(8, 8, 1);
    iceGraphics.fillCircle(16, 16, 1);
    iceGraphics.fillCircle(14, 10, 1);
    
    iceGraphics.generateTexture('falling-ice', 24, 24);
    iceGraphics.destroy();

    // Acid - green with bubbles
    const acidGraphics = this.add.graphics();
    acidGraphics.fillGradientStyle(0x32CD32, 0x228B22, 0x7FFF00, 0x006400);
    acidGraphics.fillCircle(12, 12, 10);
    
    // Bubbles
    acidGraphics.fillStyle(0x7FFF00, 0.4);
    acidGraphics.fillCircle(8, 8, 2);
    acidGraphics.fillCircle(16, 10, 3);
    acidGraphics.fillCircle(10, 16, 2);
    
    // Toxic glow
    acidGraphics.lineStyle(2, 0x7FFF00, 0.3);
    acidGraphics.strokeCircle(12, 12, 12);
    
    acidGraphics.generateTexture('falling-acid', 24, 24);
    acidGraphics.destroy();
  }

  private createBackground() {
    // Clean white background
    const bg = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0xFFFFFF);
    bg.setOrigin(0, 0);

    // Add subtle grid pattern for depth (minimal design)
    const gridSize = 60;
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0xE5E7EB, 0.3);
    
    // Vertical lines
    for (let x = 0; x < this.cameras.main.width; x += gridSize) {
      graphics.moveTo(x, 0);
      graphics.lineTo(x, this.cameras.main.height);
    }
    
    // Horizontal lines
    for (let y = 0; y < this.cameras.main.height; y += gridSize) {
      graphics.moveTo(0, y);
      graphics.lineTo(this.cameras.main.width, y);
    }
    
    graphics.strokePath();
    graphics.setAlpha(0.2);
    
    // Add some minimal floating accent elements
    for (let i = 0; i < 8; i++) {
      const accent = this.add.circle(
        Phaser.Math.Between(0, this.cameras.main.width),
        Phaser.Math.Between(0, this.cameras.main.height),
        Phaser.Math.Between(2, 4),
        0x7C3AED,
        0.1
      );

      this.tweens.add({
        targets: accent,
        alpha: 0.2,
        duration: Phaser.Math.Between(3000, 5000),
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
    this.physics.world.setBounds(0, -10000, this.cameras.main.width, this.cameras.main.height + 10200);
  }
  
  private setupCamera() {
    this.cameras.main.setBounds(0, -10000, this.cameras.main.width, this.cameras.main.height + 10200);
    this.cameras.main.startFollow(this.player.getSprite());
    this.cameras.main.setFollowOffset(0, 100); // Offset so player is slightly below center
    this.cameras.main.setDeadzone(100, 150); // Deadzone for smoother following
  }

  private createFirstQuestion() {
    // Always create initial platforms for gameplay
    this.platformSystem.createInitialPlatforms();
    
    console.log('Questions loaded:', this.questions.length);
    console.log('First question:', this.questions[0]);
    
    // Create question platforms if questions are available
    if (this.questions.length > 0) {
      console.log('Setting up first question immediately...');
      // Show question immediately when game starts
      const currentQuestion = this.questions[this.currentQuestionIndex];
      console.log('Showing question:', currentQuestion.question);
      this.uiSystem.showQuestion(currentQuestion);
      this.platformSystem.createPlatformsForQuestion(currentQuestion);
      this.spawnRandomPowerUp();
    } else {
      console.log('No questions available, using procedural platforms only');
      // If no questions, just create more procedural platforms
      this.time.addEvent({
        delay: 5000,
        callback: () => {
          const player = this.player.getSprite();
          if (player) {
            this.platformSystem.generateProceduralPlatforms(player.y);
          }
        },
        loop: true
      });
    }
  }

  private handleInput() {
    const player = this.player.getSprite();
    if (!player || !player.body) return;

    const body = player.body as Phaser.Physics.Arcade.Body;

    // Horizontal movement
    if (this.cursors.left.isDown || this.keys.A.isDown) {
      body.setVelocityX(-GameConfig.PLAYER_HORIZONTAL_SPEED);
      player.setFlipX(true);
    } else if (this.cursors.right.isDown || this.keys.D.isDown) {
      body.setVelocityX(GameConfig.PLAYER_HORIZONTAL_SPEED);
      player.setFlipX(false);
    } else {
      body.setVelocityX(0);
    }

    // Jumping mechanics
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
      if (this.player.jump()) {
        console.log('Jump sound effect');
        this.particleSystem.createJumpParticles(player.x, player.y + 16);
        
        // Check for enemy jump-on
        this.checkEnemyJumpOn(player);
      }
    }

    // Jetpack controls (hold to fly)
    if (this.cursors.up.isDown || this.keys.SPACE.isDown) {
      if (this.player.useJetpack(16)) { // Assuming 60fps, so ~16ms per frame
        // Create jetpack particle effects
        this.particleSystem.createJumpParticles(player.x, player.y + 20);
      }
    }
  }

  private checkEnemyJumpOn(player: Phaser.Physics.Arcade.Sprite) {
    const enemies = this.enemySystem.getEnemies();
    const playerBody = player.body as Phaser.Physics.Arcade.Body;
    
    enemies.forEach(enemy => {
      const enemySprite = enemy.getSprite();
      const enemyBody = enemySprite.body as Phaser.Physics.Arcade.Body;
      
      // Check if player is above enemy and falling down
      if (player.y < enemySprite.y - 10 && 
          playerBody.velocity.y > 0 && // Player is falling
          Math.abs(player.x - enemySprite.x) < 30) { // Within horizontal range
        
        // Check if player is directly above enemy
        if (player.x >= enemySprite.x - 15 && player.x <= enemySprite.x + 15) {
          enemy.handleJumpedOn();
        }
      }
    });
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
    }
  }

  private checkGameBounds() {
    const player = this.player.getSprite();
    if (player && player.y > this.cameras.main.height + 100) {
      this.loseLife();
    }
  }

  private handleAnswerSelected(data: { platform: Platform; isCorrect: boolean }) {
    this.gameStats.questionsAnswered++;

    if (data.isCorrect) {
      this.gameStats.correctAnswers++;
      this.handleCorrectAnswer(data.platform);
    } else {
      this.handleIncorrectAnswer(data.platform);
    }

    this.moveToNextQuestion();
  }

  private handleCorrectAnswer(platform: Platform) {
    const question = this.questions[this.currentQuestionIndex];
    const basePoints = question.points || 100;
    const points = Math.floor(basePoints * this.gameStats.multiplier);

    this.gameStats.score += points;

    this.player.boost();
    this.particleSystem.createSuccessParticles(platform.x + platform.width / 2, platform.y);

    this.cameras.main.flash(200, 0, 255, 0, false);

    this.uiSystem.showFloatingText(`+${points}`, platform.x + platform.width / 2, platform.y, '#6bcf7f');
  }

  private handleIncorrectAnswer(platform: Platform) {
    if (this.gameStats.hasShield) {
      this.gameStats.hasShield = false;
      this.player.removeShield();
      this.particleSystem.createShieldBreakParticles(platform.x + platform.width / 2, platform.y);
      this.uiSystem.showFloatingText('SHIELD BROKEN!', platform.x + platform.width / 2, platform.y, '#ffd93d');
    } else if (this.gameStats.isInvincible) {
      this.particleSystem.createInvincibilityParticles(platform.x + platform.width / 2, platform.y);
      this.uiSystem.showFloatingText('INVINCIBLE!', platform.x + platform.width / 2, platform.y, '#ffd93d');
    } else {
      this.loseLife();
    }

    this.cameras.main.shake(300, 0.02);
    this.particleSystem.createFailureParticles(platform.x + platform.width / 2, platform.y);
  }

  private loseLife() {
    this.gameStats.lives--;
    this.cameras.main.flash(300, 255, 0, 0, false);

    if (this.gameStats.lives <= 0) {
      this.gameOver();
    } else {
      this.player.respawn(this.cameras.main.width / 2, this.cameras.main.height - 150);
    }
  }

  private handlePowerUpCollected(powerUp: PowerUp) {
    this.gameStats.powerUpsUsed++;

    switch (powerUp.type) {
      case 'shield':
        this.gameStats.hasShield = true;
        this.player.addShield();
        this.uiSystem.showFloatingText('SHIELD ACTIVATED!', powerUp.x, powerUp.y, '#7C3AED');
        break;

      case 'doubleBoost':
        this.player.setDoubleBoost(5000);
        this.uiSystem.showFloatingText('DOUBLE BOOST!', powerUp.x, powerUp.y, '#000000');
        break;

      case 'invincibility':
        this.gameStats.isInvincible = true;
        this.gameStats.invincibilityTimer = 10000;
        this.player.addInvincibility();
        this.uiSystem.showFloatingText('INVINCIBLE!', powerUp.x, powerUp.y, '#4B5563');
        break;

      case 'scoreMultiplier':
        this.gameStats.multiplier = 2;
        this.gameStats.invincibilityTimer = 15000;
        this.uiSystem.showFloatingText('2X SCORE!', powerUp.x, powerUp.y, '#7C3AED');
        break;

      case 'extraLife':
        this.gameStats.lives = Math.min(this.gameStats.lives + 1, 5);
        this.uiSystem.showFloatingText('EXTRA LIFE!', powerUp.x, powerUp.y, '#000000');
        break;

      case 'jetpack':
        this.player.addJetpack();
        this.uiSystem.showFloatingText('JETPACK FUEL!', powerUp.x, powerUp.y, '#F59E0B');
        break;

      case 'doubleJump':
        this.player.addDoubleJump();
        this.uiSystem.showFloatingText('DOUBLE JUMP!', powerUp.x, powerUp.y, '#8B5CF6');
        break;

      case 'trampoline':
        // This creates a temporary trampoline platform
        this.createTrampolinePlatform(powerUp.x, powerUp.y - 40);
        this.uiSystem.showFloatingText('TRAMPOLINE PLACED!', powerUp.x, powerUp.y, '#10B981');
        break;
    }

    this.particleSystem.createPowerUpParticles(powerUp.x, powerUp.y, powerUp.type);
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
    
    // Give player a boost
    this.player.boost();
    
    // Create visual effects at player position
    const player = this.player.getSprite();
    if (player) {
      this.particleSystem.createSuccessParticles(player.x, player.y);
      this.uiSystem.showFloatingText(`+${points}`, player.x, player.y - 50, '#6bcf7f');
    }
    
    // Screen flash
    this.cameras.main.flash(200, 0, 255, 0, false);
  }

  private handleIncorrectUIAnswer(data: { answer: string; isCorrect: boolean; question: any }) {
    const player = this.player.getSprite();
    
    if (this.gameStats.hasShield) {
      this.gameStats.hasShield = false;
      this.player.removeShield();
      if (player) {
        this.particleSystem.createShieldBreakParticles(player.x, player.y);
        this.uiSystem.showFloatingText('SHIELD BROKEN!', player.x, player.y - 50, '#ffd93d');
      }
    } else if (this.gameStats.isInvincible) {
      if (player) {
        this.particleSystem.createInvincibilityParticles(player.x, player.y);
        this.uiSystem.showFloatingText('INVINCIBLE!', player.x, player.y - 50, '#ffd93d');
      }
    } else {
      this.loseLife();
    }
    
    // Screen shake and failure effects
    this.cameras.main.shake(300, 0.02);
    if (player) {
      this.particleSystem.createFailureParticles(player.x, player.y);
    }
  }

  private moveToNextQuestion() {
    this.currentQuestionIndex++;

    if (this.currentQuestionIndex >= this.questions.length) {
      this.currentQuestionIndex = 0;
    }

    this.time.delayedCall(2000, () => {
      const nextQuestion = this.questions[this.currentQuestionIndex];
      this.uiSystem.showQuestion(nextQuestion);
      this.platformSystem.createPlatformsForQuestion(nextQuestion);
      this.spawnRandomPowerUp();
    });
  }

  private spawnRandomPowerUp() {
    if (Phaser.Math.Between(1, 100) <= 30) {
      const x = Phaser.Math.Between(50, this.cameras.main.width - 50);
      const y = Phaser.Math.Between(100, 300);
      this.powerUpSystem.spawnPowerUp(x, y);
    }
  }

  private createTrampolinePlatform(x: number, y: number) {
    const trampoline = this.physics.add.staticSprite(x, y, 'platform-trampoline');
    trampoline.setOrigin(0, 0);
    trampoline.setScale(1);
    
    // Add trampoline to platforms group for collision
    this.platformSystem.getPlatforms().add(trampoline);
    
    // Set up special trampoline collision
    this.physics.add.overlap(this.player.getSprite(), trampoline, () => {
      this.player.trampolineBounce();
      
      // Remove trampoline after use (single use)
      this.time.delayedCall(100, () => {
        trampoline.destroy();
      });
    });
    
    // Auto-remove after 30 seconds if not used
    this.time.delayedCall(30000, () => {
      if (trampoline && trampoline.active) {
        trampoline.destroy();
      }
    });
    
    // Animate trampoline appearance
    trampoline.setAlpha(0);
    this.tweens.add({
      targets: trampoline,
      alpha: 1,
      scaleY: 1.2,
      duration: 300,
      yoyo: true,
      ease: 'Bounce.easeOut'
    });
  }

  private gameOver() {
    this.scene.pause();
    this.time.delayedCall(1000, () => {
      this.gameData.onGameOver(this.gameStats.score);
    });
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
      // Reduce lives
      this.gameStats.lives--;
      
      // Check for game over
      if (this.gameStats.lives <= 0) {
        this.gameOver();
      } else {
        // Respawn player
        this.player.respawn(this.cameras.main.width / 2, this.cameras.main.height - 150);
      }
    }
  }

  private handleEnemyDied(data: { enemy: any }) {
    const { enemy } = data;
    
    // Award points for killing enemy
    const points = 50;
    this.gameStats.score += points;
    
    // Show floating text
    const enemySprite = enemy.getSprite();
    this.uiSystem.showFloatingText(`+${points}`, enemySprite.x, enemySprite.y, '#00ff00');
    
    // Create death particles
    this.particleSystem.createSuccessParticles(enemySprite.x, enemySprite.y);
  }

  private handlePlayerDamaged(data: { damage: number; knockback: number }) {
    // Update UI to show damage
    this.cameras.main.flash(100, 255, 0, 0, false);
    this.cameras.main.shake(200, 0.01);
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
        // Reduce lives
        this.gameStats.lives--;
        
        // Check for game over
        if (this.gameStats.lives <= 0) {
          this.gameOver();
        } else {
          // Respawn player
          this.player.respawn(this.cameras.main.width / 2, this.cameras.main.height - 150);
        }
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
    
    // Award points for jumping on enemy
    const points = 25;
    this.gameStats.score += points;
    
    // Show floating text
    const enemySprite = enemy.getSprite();
    this.uiSystem.showFloatingText(`+${points}`, enemySprite.x, enemySprite.y, '#00ff00');
    
    // Create bounce particles
    this.particleSystem.createSuccessParticles(enemySprite.x, enemySprite.y);
    
    // Screen shake
    this.cameras.main.shake(100, 0.01);
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
    
    console.log(`Spawned patrol enemy on platform ${patrolId} at (${x}, ${y})`);
  }
}
