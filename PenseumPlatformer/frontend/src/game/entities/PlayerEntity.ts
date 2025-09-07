import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';

export default class PlayerEntity {
  private scene: Phaser.Scene;
  private sprite: Phaser.Physics.Arcade.Sprite;
  private hasShield: boolean = true;
  private isInvincible: boolean = true;
  private hasDoubleBoost: boolean = false;
  private doubleBoostTimer: number = 0;
  private invincibilityTimer: number = 0;
  private shieldEffect?: Phaser.GameObjects.Sprite;
  private invincibilityEffect?: Phaser.GameObjects.Sprite;
  
  // New power-up states
  private hasJetpack: boolean = false;
  private jetpackFuel: number = 0;
  private jetpackMaxFuel: number = 3000; // 3 seconds of flight
  private jetpackEffect?: Phaser.GameObjects.Sprite;
  private hasDoubleJump: boolean = false;
  private canDoubleJump: boolean = false;
  private doubleJumpTimer: number = 0;
  
  // Super jump states
  private isSuperJumpCharging: boolean = false;
  private superJumpCharge: number = 0;
  private maxSuperJumpCharge: number = 2000; // 2 seconds to full charge
  private superJumpIndicator?: Phaser.GameObjects.Graphics;
  private chargingEffect?: Phaser.GameObjects.Sprite;

  // Knockback and damage states
  private isKnockedBack: boolean = false;
  private knockbackTimer: number = 0;
  private knockbackDuration: number = 500; // 0.5 seconds
  private lastDamageTime: number = 0;
  private damageCooldown: number = 1000; // 1 second invincibility after taking damage

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, 'player');
    this.sprite.setCollideWorldBounds(false); // Allow infinite climbing - no ceiling limit
    this.sprite.setBounce(0.2);
    this.sprite.setScale(1.2);
    
    // Ensure proper physics body size
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(28, 28); // Slightly smaller than the 32x32 sprite for better gameplay
    body.setOffset(2, 2);
    
    this.setupAnimations();
  }

  private setupAnimations() {
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 1.1,
      scaleY: 1.3,
      duration: 100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  update(time: number, delta: number) {
    if (this.hasDoubleBoost) {
      this.doubleBoostTimer -= delta;
      if (this.doubleBoostTimer <= 0) {
        this.removeDoubleBoost();
      }
    }

    if (this.isInvincible) {
      this.invincibilityTimer -= delta;
      if (this.invincibilityTimer <= 0) {
        this.removeInvincibility();
      }
    }

    // Update jetpack
    if (this.hasJetpack) {
      this.jetpackFuel -= delta;
      if (this.jetpackFuel <= 0) {
        this.removeJetpack();
      }
    }

    // Update double jump
    if (this.hasDoubleJump) {
      this.doubleJumpTimer -= delta;
      if (this.doubleJumpTimer <= 0) {
        this.removeDoubleJump();
      }
      
      // Reset double jump when on ground
      const body = this.sprite.body as Phaser.Physics.Arcade.Body;
      if (body.touching.down) {
        this.canDoubleJump = true;
      }
    }

    // Update super jump charging
    if (this.isSuperJumpCharging) {
      this.superJumpCharge = Math.min(this.superJumpCharge + delta, this.maxSuperJumpCharge);
      this.updateSuperJumpIndicator();
    }

    // Update knockback
    if (this.isKnockedBack) {
      this.knockbackTimer -= delta;
      if (this.knockbackTimer <= 0) {
        this.isKnockedBack = false;
        this.sprite.clearTint();
      }
    }

    this.updateEffects();
  }

  private updateEffects() {
    if (this.shieldEffect) {
      this.shieldEffect.setPosition(this.sprite.x, this.sprite.y);
      this.shieldEffect.rotation += 0.02;
    }

    if (this.invincibilityEffect) {
      this.invincibilityEffect.setPosition(this.sprite.x, this.sprite.y);
      this.invincibilityEffect.rotation += 0.05;
    }

    if (this.jetpackEffect) {
      this.jetpackEffect.setPosition(this.sprite.x, this.sprite.y + 8);
      this.jetpackEffect.rotation += 0.1;
    }

    if (this.superJumpIndicator) {
      this.superJumpIndicator.setPosition(this.sprite.x, this.sprite.y - 30);
    }

    if (this.chargingEffect) {
      this.chargingEffect.setPosition(this.sprite.x, this.sprite.y);
      this.chargingEffect.rotation += 0.08;
    }
  }

  addShield() {
    this.hasShield = true;
    this.sprite.setTexture('player-shield');
    
    this.shieldEffect = this.scene.add.sprite(this.sprite.x, this.sprite.y, 'player');
    this.shieldEffect.setTint(0x4ecdc4);
    this.shieldEffect.setAlpha(0.3);
    this.shieldEffect.setScale(1.5);
    
    this.scene.tweens.add({
      targets: this.shieldEffect,
      alpha: 0.6,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  removeShield() {
    this.hasShield = false;
    this.sprite.setTexture('player');
    
    if (this.shieldEffect) {
      this.shieldEffect.destroy();
      this.shieldEffect = undefined;
    }
  }

  addInvincibility() {
    this.isInvincible = true;
    this.invincibilityTimer = 10000; // 10 seconds
    
    this.invincibilityEffect = this.scene.add.sprite(this.sprite.x, this.sprite.y, 'player');
    this.invincibilityEffect.setTint(0xffd93d);
    this.invincibilityEffect.setAlpha(0.4);
    this.invincibilityEffect.setScale(1.8);
    
    this.scene.tweens.add({
      targets: this.sprite,
      tint: 0xffd93d,
      duration: 200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  removeInvincibility() {
    this.isInvincible = false;
    this.sprite.clearTint();
    this.scene.tweens.killTweensOf(this.sprite);
    this.setupAnimations();
    
    if (this.invincibilityEffect) {
      this.invincibilityEffect.destroy();
      this.invincibilityEffect = undefined;
    }
  }

  setDoubleBoost(duration: number) {
    this.hasDoubleBoost = true;
    this.doubleBoostTimer = duration;
    
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 1.4,
      scaleY: 1.4,
      duration: 200,
      yoyo: true,
      repeat: 3,
      ease: 'Back.easeOut'
    });
  }

  private removeDoubleBoost() {
    this.hasDoubleBoost = false;
    this.sprite.setScale(1.2);
  }

  addJetpack() {
    this.hasJetpack = true;
    this.jetpackFuel = this.jetpackMaxFuel;
    
    this.jetpackEffect = this.scene.add.sprite(this.sprite.x, this.sprite.y + 8, 'powerup-jetpack');
    this.jetpackEffect.setTint(0xF59E0B);
    this.jetpackEffect.setAlpha(0.7);
    this.jetpackEffect.setScale(0.8);
    
    this.scene.tweens.add({
      targets: this.jetpackEffect,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  removeJetpack() {
    this.hasJetpack = false;
    this.jetpackFuel = 0;
    
    if (this.jetpackEffect) {
      this.jetpackEffect.destroy();
      this.jetpackEffect = undefined;
    }
  }

  addDoubleJump() {
    this.hasDoubleJump = true;
    this.canDoubleJump = true;
    this.doubleJumpTimer = 15000; // 15 seconds
    
    // Visual indicator
    this.scene.tweens.add({
      targets: this.sprite,
      tint: 0x8B5CF6,
      duration: 200,
      yoyo: true,
      repeat: 2,
      ease: 'Power2.easeOut'
    });
  }

  removeDoubleJump() {
    this.hasDoubleJump = false;
    this.canDoubleJump = false;
    this.sprite.clearTint();
  }

  addTrampolinePlatform(x: number, y: number) {
    // This will be called by the platform system
    const trampoline = this.scene.physics.add.staticSprite(x, y, 'platform-trampoline');
    trampoline.setOrigin(0, 0);
    trampoline.setScale(1);
    
    return trampoline;
  }

  boost() {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const boostPower = this.hasDoubleBoost ? -250 : -150;
    
    body.setVelocityY(boostPower);
    
    // Visual feedback
    this.scene.tweens.add({
      targets: this.sprite,
      scaleY: 1.5,
      duration: 150,
      yoyo: true,
      ease: 'Back.easeOut'
    });
    
    // Screen shake
    this.scene.cameras.main.shake(200, 0.01);
  }

  jump() {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    
    if (body.touching.down) {
      // Normal jump
      body.setVelocityY(-GameConfig.JUMP_VELOCITY);
      this.canDoubleJump = true; // Reset double jump
      return true;
    } else if (this.hasDoubleJump && this.canDoubleJump) {
      // Double jump
      body.setVelocityY(-GameConfig.DOUBLE_JUMP_VELOCITY);
      this.canDoubleJump = false;
      
      // Special double jump effect
      this.scene.tweens.add({
        targets: this.sprite,
        scaleX: 1.4,
        scaleY: 0.8,
        duration: 100,
        yoyo: true,
        ease: 'Power2.easeOut'
      });
      
      return true;
    }
    
    return false;
  }

  useJetpack(delta: number) {
    if (!this.hasJetpack || this.jetpackFuel <= 0) return false;
    
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    
    // Jetpack thrust
    body.setVelocityY(-GameConfig.JETPACK_VELOCITY);
    this.jetpackFuel -= delta * 2; // Consume fuel faster while using
    
    // Create jetpack particle effects
    if (this.jetpackEffect) {
      this.scene.tweens.add({
        targets: this.jetpackEffect,
        alpha: 1,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 50,
        ease: 'Power2.easeOut'
      });
    }
    
    return true;
  }

  trampolineBounce() {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    
    // Super bounce from trampoline
    body.setVelocityY(-GameConfig.TRAMPOLINE_JUMP_VELOCITY);
    
    // Special trampoline effect
    this.scene.tweens.add({
      targets: this.sprite,
      scaleY: 1.8,
      duration: 200,
      yoyo: true,
      ease: 'Bounce.easeOut'
    });
    
    // Big screen shake
    this.scene.cameras.main.shake(400, 0.02);
  }

  startSuperJumpCharge() {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    
    // Can only charge super jump when on ground
    if (!body.touching.down) return false;
    
    this.isSuperJumpCharging = true;
    this.superJumpCharge = 0;
    
    // Create charging visual effects
    this.createSuperJumpIndicator();
    this.createChargingEffect();
    
    // Player glows while charging
    this.sprite.setTint(0x6F47EB);
    
    return true;
  }

  cancelSuperJumpCharge() {
    this.isSuperJumpCharging = false;
    this.superJumpCharge = 0;
    
    // Remove visual effects
    this.removeSuperJumpIndicator();
    this.removeChargingEffect();
    
    // Remove tint
    this.sprite.clearTint();
  }

  releaseSuperJump() {
    if (!this.isSuperJumpCharging) return false;
    
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    
    // Calculate jump power based on charge (50% to 200% of normal jump)
    const chargeRatio = this.superJumpCharge / this.maxSuperJumpCharge;
    const baseJumpPower = GameConfig.JUMP_VELOCITY;
    const superJumpPower = baseJumpPower * (0.5 + chargeRatio * 1.5);
    
    // Apply super jump
    body.setVelocityY(-superJumpPower);
    
    // Create super jump effects based on charge level
    this.createSuperJumpEffects(chargeRatio);
    
    // Clean up charging state
    this.cancelSuperJumpCharge();
    
    // Screen shake intensity based on charge
    const shakeIntensity = 0.01 + (chargeRatio * 0.02);
    this.scene.cameras.main.shake(200 + (chargeRatio * 300), shakeIntensity);
    
    return true;
  }

  private createSuperJumpIndicator() {
    this.superJumpIndicator = this.scene.add.graphics();
    this.superJumpIndicator.setDepth(1000);
    this.updateSuperJumpIndicator();
  }

  private updateSuperJumpIndicator() {
    if (!this.superJumpIndicator) return;
    
    const chargeRatio = this.superJumpCharge / this.maxSuperJumpCharge;
    const barWidth = 40;
    const barHeight = 6;
    
    this.superJumpIndicator.clear();
    
    // Background bar
    this.superJumpIndicator.fillStyle(0x000000, 0.5);
    this.superJumpIndicator.fillRoundedRect(-barWidth/2, 0, barWidth, barHeight, 3);
    
    // Charge bar - color changes with charge level
    let chargeColor = 0x6F47EB;
    if (chargeRatio > 0.5) chargeColor = 0xFFFFFF;
    if (chargeRatio >= 1.0) chargeColor = 0x6F47EB;
    
    this.superJumpIndicator.fillStyle(chargeColor, 0.9);
    this.superJumpIndicator.fillRoundedRect(-barWidth/2, 0, barWidth * chargeRatio, barHeight, 3);
    
    // Pulsing effect when fully charged
    if (chargeRatio >= 1.0) {
      this.scene.tweens.add({
        targets: this.superJumpIndicator,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 200,
        yoyo: true,
        repeat: 0,
        ease: 'Power2.easeOut'
      });
    }
  }

  private createChargingEffect() {
    this.chargingEffect = this.scene.add.sprite(this.sprite.x, this.sprite.y, 'player');
    this.chargingEffect.setTint(0x6F47EB);
    this.chargingEffect.setAlpha(0.3);
    this.chargingEffect.setScale(1.2);
    
    // Pulsing charging effect
    this.scene.tweens.add({
      targets: this.chargingEffect,
      alpha: 0.6,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private createSuperJumpEffects(chargeRatio: number) {
    // Create jump particles based on charge level
    const particleCount = Math.floor(8 + chargeRatio * 12);
    const particleColor = chargeRatio >= 1.0 ? 0xFFFFFF : 0x6F47EB;
    
    for (let i = 0; i < particleCount; i++) {
      const particle = this.scene.add.circle(
        this.sprite.x + Phaser.Math.Between(-15, 15),
        this.sprite.y + Phaser.Math.Between(-10, 10),
        Phaser.Math.Between(3, 6),
        particleColor
      );
      
      const velocityX = Phaser.Math.Between(-150, 150);
      const velocityY = Phaser.Math.Between(-200, -50);
      
      this.scene.tweens.add({
        targets: particle,
        x: particle.x + velocityX,
        y: particle.y + velocityY,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: 600 + chargeRatio * 400,
        ease: 'Power2.easeOut',
        onComplete: () => particle.destroy()
      });
    }
    
    // Special effects for fully charged jump
    if (chargeRatio >= 1.0) {
      // Create energy rings
      for (let i = 0; i < 3; i++) {
        const ring = this.scene.add.circle(this.sprite.x, this.sprite.y, 5 + (i * 8), undefined);
        ring.setStrokeStyle(3, 0x6F47EB, 0.7);
        ring.setFillStyle(undefined);
        
        this.scene.tweens.add({
          targets: ring,
          radius: 30 + (i * 15),
          alpha: 0,
          duration: 400 + (i * 100),
          ease: 'Power2.easeOut',
          onComplete: () => ring.destroy()
        });
      }
    }
    
    // Player animation based on charge
    const scaleMultiplier = 1.2 + (chargeRatio * 0.6);
    this.scene.tweens.add({
      targets: this.sprite,
      scaleY: scaleMultiplier,
      duration: 150,
      yoyo: true,
      ease: 'Back.easeOut'
    });
  }

  private removeSuperJumpIndicator() {
    if (this.superJumpIndicator) {
      this.superJumpIndicator.destroy();
      this.superJumpIndicator = undefined;
    }
  }

  private removeChargingEffect() {
    if (this.chargingEffect) {
      this.chargingEffect.destroy();
      this.chargingEffect = undefined;
    }
  }

  respawn(x: number, y: number) {
    this.sprite.setPosition(x, y);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    
    // Make player semi-transparent during respawn
    this.sprite.setAlpha(0.5);
    
    // Animate back to full opacity
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 1,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 1000,
      ease: 'Back.easeOut'
    });
    
    // Give temporary invincibility
    this.addInvincibility();
    this.invincibilityTimer = 3000; // 3 seconds
  }

  getSprite() {
    return this.sprite;
  }

  getHasShield() {
    return this.hasShield;
  }

  getIsInvincible() {
    return this.isInvincible;
  }

  getHasDoubleBoost() {
    return this.hasDoubleBoost;
  }

  getHasJetpack() {
    return this.hasJetpack;
  }

  getJetpackFuel() {
    return this.jetpackFuel;
  }

  getHasDoubleJump() {
    return this.hasDoubleJump;
  }

  getCanDoubleJump() {
    return this.canDoubleJump;
  }

  getIsSuperJumpCharging() {
    return this.isSuperJumpCharging;
  }

  getSuperJumpCharge() {
    return this.superJumpCharge;
  }

  getMaxSuperJumpCharge() {
    return this.maxSuperJumpCharge;
  }

  // Knockback and damage methods
  takeDamage(damage: number, knockbackForce: number, attackerX?: number, attackerY?: number) {
    const currentTime = this.scene.time.now;
    
    // Check if player is in damage cooldown
    if (currentTime - this.lastDamageTime < this.damageCooldown) {
      return false;
    }
    
    // Check if player has shield
    if (this.hasShield) {
      this.removeShield();
      this.createShieldBreakEffect();
      return false;
    }
    
    // Check if player is invincible
    if (this.isInvincible) {
      this.createInvincibilityEffect();
      return false;
    }
    
    // Apply damage
    this.lastDamageTime = currentTime;
    
    // Apply knockback
    this.applyKnockback(knockbackForce, attackerX, attackerY);
    
    // Visual damage effect
    this.createDamageEffect();
    
    // Emit damage event
    this.scene.events.emit('player-damaged', { damage, knockbackForce });
    
    return true;
  }

  private applyKnockback(force: number, attackerX?: number, attackerY?: number) {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    
    // Calculate knockback direction
    let knockbackX = 0;
    let knockbackY = -force * 0.7; // Always knock up
    
    if (attackerX !== undefined && attackerY !== undefined) {
      // Knock away from attacker
      const direction = this.sprite.x > attackerX ? 1 : -1;
      knockbackX = direction * force * 0.5;
    } else {
      // Random horizontal knockback
      knockbackX = (Math.random() > 0.5 ? 1 : -1) * force * 0.3;
    }
    
    // Apply knockback
    body.setVelocity(knockbackX, knockbackY);
    
    // Set knockback state
    this.isKnockedBack = true;
    this.knockbackTimer = this.knockbackDuration;
    
    // Visual knockback effect
    this.sprite.setTint(0xff0000);
    
    // Screen shake
    this.scene.cameras.main.shake(200, 0.01);
  }

  private createDamageEffect() {
    // Create damage particles
    for (let i = 0; i < 6; i++) {
      const particle = this.scene.add.circle(
        this.sprite.x + Phaser.Math.Between(-10, 10),
        this.sprite.y + Phaser.Math.Between(-10, 10),
        Phaser.Math.Between(2, 4),
        0xff0000
      );
      
      const velocityX = Phaser.Math.Between(-100, 100);
      const velocityY = Phaser.Math.Between(-150, -50);
      
      this.scene.tweens.add({
        targets: particle,
        x: particle.x + velocityX,
        y: particle.y + velocityY,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: 500,
        ease: 'Power2.easeOut',
        onComplete: () => particle.destroy()
      });
    }
  }

  private createShieldBreakEffect() {
    // Create shield break particles
    for (let i = 0; i < 8; i++) {
      const particle = this.scene.add.circle(
        this.sprite.x + Phaser.Math.Between(-15, 15),
        this.sprite.y + Phaser.Math.Between(-15, 15),
        Phaser.Math.Between(3, 6),
        0x4ecdc4
      );
      
      const velocityX = Phaser.Math.Between(-150, 150);
      const velocityY = Phaser.Math.Between(-200, -100);
      
      this.scene.tweens.add({
        targets: particle,
        x: particle.x + velocityX,
        y: particle.y + velocityY,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: 800,
        ease: 'Power2.easeOut',
        onComplete: () => particle.destroy()
      });
    }
  }

  private createInvincibilityEffect() {
    // Create invincibility particles
    for (let i = 0; i < 4; i++) {
      const particle = this.scene.add.circle(
        this.sprite.x + Phaser.Math.Between(-8, 8),
        this.sprite.y + Phaser.Math.Between(-8, 8),
        Phaser.Math.Between(2, 4),
        0xffd93d
      );
      
      const velocityX = Phaser.Math.Between(-50, 50);
      const velocityY = Phaser.Math.Between(-100, -50);
      
      this.scene.tweens.add({
        targets: particle,
        x: particle.x + velocityX,
        y: particle.y + velocityY,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: 400,
        ease: 'Power2.easeOut',
        onComplete: () => particle.destroy()
      });
    }
  }

  getIsKnockedBack() {
    return this.isKnockedBack;
  }

  getLastDamageTime() {
    return this.lastDamageTime;
  }

  getDamageCooldown() {
    return this.damageCooldown;
  }

  get x(): number {
    return this.sprite.x;
  }

  get y(): number {
    return this.sprite.y;
  }

  destroy() {
    if (this.shieldEffect) {
      this.shieldEffect.destroy();
    }
    if (this.invincibilityEffect) {
      this.invincibilityEffect.destroy();
    }
    if (this.jetpackEffect) {
      this.jetpackEffect.destroy();
    }
    if (this.superJumpIndicator) {
      this.superJumpIndicator.destroy();
    }
    if (this.chargingEffect) {
      this.chargingEffect.destroy();
    }
    this.sprite.destroy();
  }
}