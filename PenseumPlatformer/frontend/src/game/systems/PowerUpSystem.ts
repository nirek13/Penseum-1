import Phaser from 'phaser';
import { PowerUp } from '../../types/GameTypes';
import MainGameScene from '../scenes/MainGameScene';

export default class PowerUpSystem {
  private scene: MainGameScene;
  private powerUps: Phaser.Physics.Arcade.Group;
  private activePowerUps: PowerUp[] = [];

  constructor(scene: MainGameScene) {
    this.scene = scene;
    this.powerUps = scene.physics.add.group();
    this.setupCollisions();
  }

  private setupCollisions() {
    // This will be called after the player is created
  }

  setupPlayerCollision(playerSprite: Phaser.Physics.Arcade.Sprite) {
    this.scene.physics.add.overlap(
      playerSprite,
      this.powerUps,
      (player, powerUp) => {
        this.collectPowerUp(powerUp as Phaser.Physics.Arcade.Sprite);
      }
    );
  }

  spawnPowerUp(x: number, y: number, type?: string) {
    const powerUpTypes = ['shield', 'doubleBoost', 'invincibility', 'scoreMultiplier', 'extraLife', 'jetpack', 'trampoline', 'doubleJump'];
    const selectedType = type || Phaser.Utils.Array.GetRandom(powerUpTypes);
    
    const powerUpSprite = this.scene.physics.add.sprite(x, y, `powerup-${selectedType}`);
    powerUpSprite.setCollideWorldBounds(true);
    powerUpSprite.setBounce(0.8);
    powerUpSprite.setVelocity(
      Phaser.Math.Between(-50, 50),
      Phaser.Math.Between(-100, -50)
    );
    
    this.powerUps.add(powerUpSprite);
    
    const powerUpData: PowerUp = {
      id: `powerup-${Date.now()}-${Math.random()}`,
      type: selectedType as 'shield' | 'doubleBoost' | 'invincibility' | 'scoreMultiplier' | 'extraLife' | 'jetpack' | 'trampoline' | 'doubleJump',
      x,
      y,
      width: 32,
      height: 32,
      isActive: false
    };
    
    powerUpSprite.setData('powerUpInfo', powerUpData);
    
    this.animatePowerUpSpawn(powerUpSprite, selectedType);
    
    // Auto-despawn after 15 seconds
    this.scene.time.delayedCall(15000, () => {
      if (powerUpSprite.active) {
        this.despawnPowerUp(powerUpSprite);
      }
    });
  }

  private animatePowerUpSpawn(sprite: Phaser.Physics.Arcade.Sprite, type: string) {
    sprite.setAlpha(0);
    sprite.setScale(0);
    
    // Spawn animation
    this.scene.tweens.add({
      targets: sprite,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 500,
      ease: 'Back.easeOut'
    });
    
    // Floating animation
    this.scene.tweens.add({
      targets: sprite,
      y: sprite.y - 10,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Rotation animation
    this.scene.tweens.add({
      targets: sprite,
      rotation: Math.PI * 2,
      duration: 3000,
      repeat: -1,
      ease: 'Linear'
    });
    
    // Glow effect
    const glowColor = this.getPowerUpGlowColor(type);
    this.scene.tweens.add({
      targets: sprite,
      tint: glowColor,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private getPowerUpGlowColor(type: string): number {
    switch (type) {
      case 'shield': return 0x4ecdc4;
      case 'doubleBoost': return 0xff6b6b;
      case 'invincibility': return 0xffd93d;
      case 'scoreMultiplier': return 0x6bcf7f;
      case 'extraLife': return 0xff69b4;
      case 'jetpack': return 0xF59E0B;
      case 'trampoline': return 0x10B981;
      case 'doubleJump': return 0x8B5CF6;
      default: return 0xffffff;
    }
  }

  private collectPowerUp(powerUpSprite: Phaser.Physics.Arcade.Sprite) {
    const powerUpData = powerUpSprite.getData('powerUpInfo') as PowerUp;
    
    if (powerUpData) {
      powerUpData.isActive = true;
      this.activePowerUps.push(powerUpData);
      
      this.animatePowerUpCollection(powerUpSprite);
      
      // Emit event to game scene
      this.scene.events.emit('power-up-collected', powerUpData);
      
      // Remove the power-up sprite
      this.scene.time.delayedCall(300, () => {
        this.powerUps.remove(powerUpSprite);
        powerUpSprite.destroy();
      });
    }
  }

  private animatePowerUpCollection(sprite: Phaser.Physics.Arcade.Sprite) {
    // Scale and fade animation
    this.scene.tweens.add({
      targets: sprite,
      scaleX: 2,
      scaleY: 2,
      alpha: 0.3,
      duration: 300,
      ease: 'Back.easeIn'
    });
    
    // Screen flash
    this.scene.cameras.main.flash(200, 255, 255, 255, false);
    
    // Particle burst
    for (let i = 0; i < 10; i++) {
      const particle = this.scene.add.circle(
        sprite.x,
        sprite.y,
        Phaser.Math.Between(2, 6),
        this.getPowerUpGlowColor(sprite.getData('powerUpInfo').type)
      );
      
      this.scene.tweens.add({
        targets: particle,
        x: sprite.x + Phaser.Math.Between(-50, 50),
        y: sprite.y + Phaser.Math.Between(-50, 50),
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: 600,
        ease: 'Power2.easeOut',
        onComplete: () => particle.destroy()
      });
    }
  }

  private despawnPowerUp(sprite: Phaser.Physics.Arcade.Sprite) {
    this.scene.tweens.add({
      targets: sprite,
      alpha: 0,
      scaleX: 0,
      scaleY: 0,
      duration: 500,
      ease: 'Back.easeIn',
      onComplete: () => {
        this.powerUps.remove(sprite);
        sprite.destroy();
      }
    });
  }

  spawnRandomPowerUp() {
    if (this.powerUps.children.size < 3) {
      const x = Phaser.Math.Between(50, this.scene.cameras.main.width - 50);
      const y = Phaser.Math.Between(100, this.scene.cameras.main.height - 300);
      this.spawnPowerUp(x, y);
    }
  }

  spawnPowerUpForDifficulty(difficulty: string) {
    const x = Phaser.Math.Between(100, this.scene.cameras.main.width - 100);
    const y = Phaser.Math.Between(150, 300);
    
    let powerUpType;
    switch (difficulty) {
      case 'easy':
        powerUpType = Phaser.Utils.Array.GetRandom(['shield', 'extraLife', 'doubleJump']);
        break;
      case 'medium':
        powerUpType = Phaser.Utils.Array.GetRandom(['doubleBoost', 'scoreMultiplier', 'trampoline']);
        break;
      case 'hard':
        powerUpType = Phaser.Utils.Array.GetRandom(['invincibility', 'scoreMultiplier', 'doubleBoost', 'jetpack']);
        break;
      default:
        powerUpType = undefined;
    }
    
    this.spawnPowerUp(x, y, powerUpType);
  }

  clearAllPowerUps() {
    this.powerUps.children.entries.forEach(powerUp => {
      const sprite = powerUp as Phaser.Physics.Arcade.Sprite;
      this.despawnPowerUp(sprite);
    });
    
    this.activePowerUps = [];
  }

  update(time: number, delta: number) {
    // Update power-up physics and animations
    this.powerUps.children.entries.forEach((powerUp, index) => {
      const sprite = powerUp as Phaser.Physics.Arcade.Sprite;
      const body = sprite.body as Phaser.Physics.Arcade.Body;
      
      // Keep power-ups bouncing
      if (body.velocity.y > 0 && body.touching.down) {
        body.setVelocityY(-100);
      }
      
      // Add subtle floating animation
      const oscillation = Math.sin(time * 0.003 + index * 2) * 5;
      sprite.y = sprite.getData('originalY') || sprite.y + oscillation;
      
      if (!sprite.getData('originalY')) {
        sprite.setData('originalY', sprite.y);
      }
    });
    
    // Clean up expired power-ups
    this.activePowerUps = this.activePowerUps.filter(powerUp => {
      if (powerUp.duration && powerUp.duration > 0) {
        powerUp.duration -= delta;
        return powerUp.duration > 0;
      }
      return true;
    });
  }

  getActivePowerUps() {
    return this.activePowerUps;
  }

  getPowerUps() {
    return this.powerUps;
  }

  destroy() {
    this.clearAllPowerUps();
    this.powerUps.destroy();
  }
}