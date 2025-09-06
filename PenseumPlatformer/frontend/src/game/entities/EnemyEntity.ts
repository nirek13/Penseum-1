import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';

export interface EnemyConfig {
  type: 'shooter' | 'melee' | 'bomber';
  health: number;
  speed: number;
  attackRange: number;
  attackDamage: number;
  shootCooldown: number;
  knockbackForce: number;
  color: number;
  size: number;
}

export default class EnemyEntity {
  private scene: Phaser.Scene;
  private sprite: Phaser.Physics.Arcade.Sprite;
  private config: EnemyConfig;
  private health: number;
  private lastAttackTime: number = 0;
  private isAlive: boolean = true;
  private direction: number = 1; // 1 for right, -1 for left
  private lastDirectionChange: number = 0;
  private attackEffect?: Phaser.GameObjects.Sprite;
  private healthBar?: Phaser.GameObjects.Graphics;
  private healthBarBackground?: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number, config: EnemyConfig) {
    this.scene = scene;
    this.config = config;
    this.health = config.health;
    
    // Create enemy sprite
    this.sprite = scene.physics.add.sprite(x, y, 'enemy');
    this.sprite.setCollideWorldBounds(false);
    this.sprite.setBounce(0.1);
    this.sprite.setScale(config.size);
    
    // Set physics body
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(24, 24);
    body.setOffset(4, 4);
    body.setAllowGravity(true);
    
    this.setupAnimations();
    this.createHealthBar();
  }

  private setupAnimations() {
    // Idle animation
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: this.config.size * 1.1,
      scaleY: this.config.size * 0.9,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Movement animation
    this.scene.tweens.add({
      targets: this.sprite,
      rotation: 0.1,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private createHealthBar() {
    const barWidth = 30;
    const barHeight = 4;
    
    // Health bar background
    this.healthBarBackground = this.scene.add.graphics();
    this.healthBarBackground.fillStyle(0x000000, 0.5);
    this.healthBarBackground.fillRect(-barWidth / 2, -20, barWidth, barHeight);
    
    // Health bar
    this.healthBar = this.scene.add.graphics();
    this.updateHealthBar();
    
    // Attach to sprite
    this.sprite.add([this.healthBarBackground, this.healthBar]);
  }

  private updateHealthBar() {
    if (!this.healthBar) return;
    
    const barWidth = 30;
    const barHeight = 4;
    const healthPercent = this.health / this.config.health;
    
    this.healthBar.clear();
    this.healthBar.fillStyle(0xff0000, 1);
    this.healthBar.fillRect(-barWidth / 2, -20, barWidth * healthPercent, barHeight);
  }

  update(time: number, delta: number, playerSprite: Phaser.Physics.Arcade.Sprite) {
    if (!this.isAlive) return;

    const distanceToPlayer = Phaser.Math.Distance.Between(
      this.sprite.x, this.sprite.y,
      playerSprite.x, playerSprite.y
    );

    // Update direction based on player position
    if (time - this.lastDirectionChange > 1000) {
      this.direction = playerSprite.x > this.sprite.x ? 1 : -1;
      this.lastDirectionChange = time;
    }

    // Handle different enemy types
    switch (this.config.type) {
      case 'shooter':
        this.updateShooterBehavior(time, delta, playerSprite, distanceToPlayer);
        break;
      case 'melee':
        this.updateMeleeBehavior(time, delta, playerSprite, distanceToPlayer);
        break;
      case 'bomber':
        this.updateBomberBehavior(time, delta, playerSprite, distanceToPlayer);
        break;
    }

    // Update health bar position
    if (this.healthBar && this.healthBarBackground) {
      this.healthBar.x = this.sprite.x;
      this.healthBar.y = this.sprite.y;
      this.healthBarBackground.x = this.sprite.x;
      this.healthBarBackground.y = this.sprite.y;
    }
  }

  private updateShooterBehavior(time: number, delta: number, playerSprite: Phaser.Physics.Arcade.Sprite, distanceToPlayer: number) {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    
    // Move towards player but maintain shooting distance
    if (distanceToPlayer > this.config.attackRange) {
      body.setVelocityX(this.direction * this.config.speed);
    } else if (distanceToPlayer < this.config.attackRange * 0.7) {
      body.setVelocityX(-this.direction * this.config.speed);
    } else {
      body.setVelocityX(0);
    }

    // Shoot at player
    if (distanceToPlayer <= this.config.attackRange && time - this.lastAttackTime > this.config.shootCooldown) {
      this.shootAtPlayer(playerSprite);
      this.lastAttackTime = time;
    }
  }

  private updateMeleeBehavior(time: number, delta: number, playerSprite: Phaser.Physics.Arcade.Sprite, distanceToPlayer: number) {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    
    // Always move towards player
    body.setVelocityX(this.direction * this.config.speed);
    
    // Attack when close enough
    if (distanceToPlayer <= this.config.attackRange && time - this.lastAttackTime > this.config.shootCooldown) {
      this.meleeAttack(playerSprite);
      this.lastAttackTime = time;
    }
  }

  private updateBomberBehavior(time: number, delta: number, playerSprite: Phaser.Physics.Arcade.Sprite, distanceToPlayer: number) {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    
    // Move towards player aggressively
    body.setVelocityX(this.direction * this.config.speed * 1.5);
    
    // Explode when close enough
    if (distanceToPlayer <= this.config.attackRange && time - this.lastAttackTime > this.config.shootCooldown) {
      this.explode();
      this.lastAttackTime = time;
    }
  }

  private shootAtPlayer(playerSprite: Phaser.Physics.Arcade.Sprite) {
    // Create projectile
    const projectile = this.scene.physics.add.sprite(this.sprite.x, this.sprite.y, 'projectile');
    projectile.setScale(0.5);
    
    // Calculate direction to player
    const angle = Phaser.Math.Angle.Between(
      this.sprite.x, this.sprite.y,
      playerSprite.x, playerSprite.y
    );
    
    // Set projectile velocity
    const projectileSpeed = 200;
    const body = projectile.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(
      Math.cos(angle) * projectileSpeed,
      Math.sin(angle) * projectileSpeed
    );
    
    // Set projectile data
    projectile.setData('damage', this.config.attackDamage);
    projectile.setData('knockback', this.config.knockbackForce);
    projectile.setData('owner', 'enemy');
    
    // Visual effect
    this.createAttackEffect();
    
    // Destroy projectile after time
    this.scene.time.delayedCall(3000, () => {
      if (projectile && projectile.active) {
        projectile.destroy();
      }
    });
  }

  private meleeAttack(playerSprite: Phaser.Physics.Arcade.Sprite) {
    // Create attack effect
    this.createAttackEffect();
    
    // Check if player is in range
    const distanceToPlayer = Phaser.Math.Distance.Between(
      this.sprite.x, this.sprite.y,
      playerSprite.x, playerSprite.y
    );
    
    if (distanceToPlayer <= this.config.attackRange) {
      // Emit attack event
      this.scene.events.emit('enemy-attack', {
        damage: this.config.attackDamage,
        knockback: this.config.knockbackForce,
        attacker: this
      });
    }
  }

  private explode() {
    // Create explosion effect
    this.createExplosionEffect();
    
    // Damage nearby player
    const playerSprite = this.scene.children.list.find(child => 
      child instanceof Phaser.Physics.Arcade.Sprite && 
      child.getData('type') === 'player'
    ) as Phaser.Physics.Arcade.Sprite;
    
    if (playerSprite) {
      const distanceToPlayer = Phaser.Math.Distance.Between(
        this.sprite.x, this.sprite.y,
        playerSprite.x, playerSprite.y
      );
      
      if (distanceToPlayer <= this.config.attackRange * 2) {
        this.scene.events.emit('enemy-attack', {
          damage: this.config.attackDamage * 2,
          knockback: this.config.knockbackForce * 1.5,
          attacker: this
        });
      }
    }
    
    // Destroy enemy
    this.takeDamage(this.health);
  }

  private createAttackEffect() {
    if (this.attackEffect) {
      this.attackEffect.destroy();
    }
    
    this.attackEffect = this.scene.add.sprite(this.sprite.x, this.sprite.y, 'enemy');
    this.attackEffect.setTint(0xff0000);
    this.attackEffect.setAlpha(0.8);
    this.attackEffect.setScale(this.config.size * 1.5);
    
    this.scene.tweens.add({
      targets: this.attackEffect,
      scaleX: this.config.size * 2,
      scaleY: this.config.size * 2,
      alpha: 0,
      duration: 200,
      ease: 'Power2.easeOut',
      onComplete: () => {
        if (this.attackEffect) {
          this.attackEffect.destroy();
          this.attackEffect = undefined;
        }
      }
    });
  }

  private createExplosionEffect() {
    // Create multiple explosion particles
    for (let i = 0; i < 8; i++) {
      const particle = this.scene.add.circle(
        this.sprite.x + Phaser.Math.Between(-20, 20),
        this.sprite.y + Phaser.Math.Between(-20, 20),
        Phaser.Math.Between(3, 8),
        0xff0000
      );
      
      const velocityX = Phaser.Math.Between(-300, 300);
      const velocityY = Phaser.Math.Between(-300, -100);
      
      this.scene.tweens.add({
        targets: particle,
        x: particle.x + velocityX,
        y: particle.y + velocityY,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: 1000,
        ease: 'Power2.easeOut',
        onComplete: () => particle.destroy()
      });
    }
    
    // Screen shake
    this.scene.cameras.main.shake(300, 0.02);
  }

  takeDamage(damage: number) {
    this.health -= damage;
    this.updateHealthBar();
    
    // Visual damage effect
    this.sprite.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      this.sprite.clearTint();
    });
    
    if (this.health <= 0) {
      this.die();
    }
  }

  private die() {
    this.isAlive = false;
    
    // Death animation
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      scaleX: 0,
      scaleY: 0,
      rotation: Math.PI * 2,
      duration: 500,
      ease: 'Power2.easeOut',
      onComplete: () => {
        this.destroy();
      }
    });
    
    // Emit death event
    this.scene.events.emit('enemy-died', { enemy: this });
  }

  getSprite() {
    return this.sprite;
  }

  getConfig() {
    return this.config;
  }

  getHealth() {
    return this.health;
  }

  getIsAlive() {
    return this.isAlive;
  }

  destroy() {
    if (this.attackEffect) {
      this.attackEffect.destroy();
    }
    if (this.healthBar) {
      this.healthBar.destroy();
    }
    if (this.healthBarBackground) {
      this.healthBarBackground.destroy();
    }
    this.sprite.destroy();
  }
}
