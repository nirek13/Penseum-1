import Phaser from 'phaser';
import MainGameScene from '../scenes/MainGameScene';
import { GameConfig } from '../config/GameConfig';

export interface FallingObject {
  id: string;
  type: 'rock' | 'spike' | 'bomb' | 'ice' | 'acid';
  sprite: Phaser.Physics.Arcade.Sprite;
  damage: number;
  speed: number;
  rotationSpeed: number;
  trail?: Phaser.GameObjects.Graphics;
}

export default class FallingObjectsSystem {
  private scene: MainGameScene;
  private fallingObjects: FallingObject[] = [];
  private objectPool: Phaser.Physics.Arcade.Group;
  private spawnTimer: number = 0;
  private spawnInterval: number = 3000; // 3 seconds base interval
  private maxObjects: number = 6;
  private playerSprite?: Phaser.Physics.Arcade.Sprite;
  private difficulty: number = 1;

  constructor(scene: MainGameScene) {
    this.scene = scene;
    this.objectPool = scene.physics.add.group();
    this.setupCollisions();
  }

  private setupCollisions() {
    // Collision with platforms (objects should break/stop)
    // This will be set up after platforms are available
  }

  setupPlayerCollision(playerSprite: Phaser.Physics.Arcade.Sprite) {
    this.playerSprite = playerSprite;
    
    // Set up collision between falling objects and player
    this.scene.physics.add.overlap(this.objectPool, playerSprite, (object, player) => {
      this.handleObjectPlayerCollision(object as Phaser.Physics.Arcade.Sprite, player as Phaser.Physics.Arcade.Sprite);
    });
  }

  setupPlatformCollision(platforms: Phaser.Physics.Arcade.StaticGroup) {
    // Objects should break or bounce when hitting platforms
    this.scene.physics.add.collider(this.objectPool, platforms, (object, platform) => {
      this.handleObjectPlatformCollision(object as Phaser.Physics.Arcade.Sprite, platform as Phaser.Physics.Arcade.Sprite);
    });
  }

  update(time: number, delta: number) {
    // Update spawn timer
    this.spawnTimer += delta;
    
    // Spawn new objects based on difficulty and interval
    if (this.spawnTimer >= this.getAdjustedSpawnInterval() && 
        this.fallingObjects.length < this.maxObjects) {
      this.spawnRandomObject();
      this.spawnTimer = 0;
    }

    // Update falling objects
    this.updateFallingObjects(time, delta);

    // Clean up objects that are off-screen
    this.cleanupOffScreenObjects();
  }

  private getAdjustedSpawnInterval(): number {
    // Spawn more frequently as difficulty increases
    return Math.max(1500, this.spawnInterval - (this.difficulty * 300));
  }

  private spawnRandomObject() {
    if (!this.playerSprite) return;

    const objectTypes: Array<keyof typeof this.getObjectConfig> = ['rock', 'spike', 'bomb', 'ice', 'acid'];
    const weights = [0.4, 0.3, 0.15, 0.1, 0.05]; // Probability weights
    
    const randomType = this.weightedRandom(objectTypes, weights);
    const screenWidth = this.scene.cameras.main.width;
    
    // Spawn above the screen, targeting near the player's horizontal position
    const playerX = this.playerSprite.x;
    const spawnRange = 200; // Pixels around player position
    const spawnX = Phaser.Math.Clamp(
      playerX + Phaser.Math.Between(-spawnRange, spawnRange),
      50,
      screenWidth - 50
    );
    const spawnY = this.scene.cameras.main.scrollY - 50;

    this.spawnObject(randomType, spawnX, spawnY);
  }

  private weightedRandom<T>(items: T[], weights: number[]): T {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return items[i];
      }
    }
    
    return items[0]; // Fallback
  }

  private spawnObject(type: FallingObject['type'], x: number, y: number) {
    const config = this.getObjectConfig(type);
    
    // Create sprite
    const sprite = this.scene.physics.add.sprite(x, y, `falling-${type}`);
    sprite.setData('objectType', type);
    sprite.setData('damage', config.damage);
    
    // Set physics properties
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    body.setVelocityY(config.baseSpeed + (this.difficulty * 20));
    body.setAngularVelocity(config.rotationSpeed);
    body.setCollideWorldBounds(false);
    body.setGravityY(config.gravity || 0);

    // Add to pool
    this.objectPool.add(sprite);

    // Create falling object data
    const fallingObject: FallingObject = {
      id: `${type}_${Date.now()}_${Math.random()}`,
      type,
      sprite,
      damage: config.damage,
      speed: config.baseSpeed,
      rotationSpeed: config.rotationSpeed
    };

    // Add special effects based on type
    this.addObjectEffects(fallingObject);

    this.fallingObjects.push(fallingObject);

    // Animate spawn effect
    this.createSpawnEffect(x, y);
  }

  private getObjectConfig(type: FallingObject['type']) {
    const configs = {
      rock: {
        baseSpeed: 150,
        damage: 1,
        rotationSpeed: 100,
        gravity: 50
      },
      spike: {
        baseSpeed: 200,
        damage: 2,
        rotationSpeed: 0,
        gravity: 30
      },
      bomb: {
        baseSpeed: 120,
        damage: 3,
        rotationSpeed: 200,
        gravity: 40
      },
      ice: {
        baseSpeed: 100,
        damage: 1,
        rotationSpeed: 50,
        gravity: 20
      },
      acid: {
        baseSpeed: 80,
        damage: 2,
        rotationSpeed: 150,
        gravity: 10
      }
    };

    return configs[type];
  }

  private addObjectEffects(fallingObject: FallingObject) {
    const sprite = fallingObject.sprite;
    
    switch (fallingObject.type) {
      case 'bomb':
        // Pulsing red glow for bombs
        this.scene.tweens.add({
          targets: sprite,
          scaleX: 1.2,
          scaleY: 1.2,
          duration: 800,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
        break;

      case 'spike':
        // Spinning spikes with trail
        this.createTrailEffect(fallingObject);
        break;

      case 'ice':
        // Subtle sparkle effect
        this.createSparkleEffect(fallingObject);
        break;

      case 'acid':
        // Dripping effect
        this.createDripEffect(fallingObject);
        break;

      case 'rock':
        // Simple shadow effect
        this.createShadowEffect(fallingObject);
        break;
    }
  }

  private createTrailEffect(fallingObject: FallingObject) {
    // Create a simple trail behind the object
    const trail = this.scene.add.graphics();
    fallingObject.trail = trail;
    
    // Update trail in the object's update cycle
    const updateTrail = () => {
      if (!fallingObject.sprite.active) return;
      
      trail.clear();
      trail.lineStyle(3, 0xff0000, 0.8);
      trail.moveTo(fallingObject.sprite.x, fallingObject.sprite.y);
      trail.lineTo(fallingObject.sprite.x, fallingObject.sprite.y + 20);
      trail.strokePath();
    };

    this.scene.time.addEvent({
      delay: 50,
      callback: updateTrail,
      repeat: -1
    });
  }

  private createSparkleEffect(fallingObject: FallingObject) {
    this.scene.time.addEvent({
      delay: 300,
      callback: () => {
        if (!fallingObject.sprite.active) return;
        
        // Create small sparkle particles
        for (let i = 0; i < 3; i++) {
          const sparkle = this.scene.add.circle(
            fallingObject.sprite.x + Phaser.Math.Between(-15, 15),
            fallingObject.sprite.y + Phaser.Math.Between(-15, 15),
            2,
            0x87CEEB
          );
          
          this.scene.tweens.add({
            targets: sparkle,
            alpha: 0,
            scaleX: 0,
            scaleY: 0,
            duration: 500,
            ease: 'Power2.easeOut',
            onComplete: () => sparkle.destroy()
          });
        }
      },
      repeat: -1
    });
  }

  private createDripEffect(fallingObject: FallingObject) {
    this.scene.time.addEvent({
      delay: 500,
      callback: () => {
        if (!fallingObject.sprite.active) return;
        
        // Create acid drip
        const drip = this.scene.add.circle(
          fallingObject.sprite.x,
          fallingObject.sprite.y + 20,
          3,
          0x32CD32
        );
        
        this.scene.tweens.add({
          targets: drip,
          y: drip.y + 30,
          alpha: 0,
          duration: 800,
          ease: 'Power2.easeOut',
          onComplete: () => drip.destroy()
        });
      },
      repeat: -1
    });
  }

  private createShadowEffect(fallingObject: FallingObject) {
    // Simple shadow beneath the rock
    const shadow = this.scene.add.ellipse(
      fallingObject.sprite.x,
      fallingObject.sprite.y + 40,
      20,
      8,
      0x000000,
      0.3
    );

    // Update shadow position
    const updateShadow = () => {
      if (!fallingObject.sprite.active) {
        shadow.destroy();
        return;
      }
      
      shadow.x = fallingObject.sprite.x;
      shadow.y = fallingObject.sprite.y + 40;
    };

    this.scene.time.addEvent({
      delay: 16, // ~60fps
      callback: updateShadow,
      repeat: -1
    });
  }

  private updateFallingObjects(time: number, delta: number) {
    this.fallingObjects.forEach(obj => {
      // Add some horizontal drift for variety
      if (obj.type === 'ice') {
        const body = obj.sprite.body as Phaser.Physics.Arcade.Body;
        body.setVelocityX(Math.sin(time * 0.001) * 30);
      }
      
      // Special bomb behavior - flash before exploding
      if (obj.type === 'bomb') {
        const age = time - (obj.sprite.getData('spawnTime') || time);
        if (age > 5000) { // After 5 seconds, bomb becomes unstable
          obj.sprite.setTint(Math.random() > 0.5 ? 0xff0000 : 0xffffff);
        }
      }
    });
  }

  private cleanupOffScreenObjects() {
    const screenHeight = this.scene.cameras.main.height;
    const playerY = this.playerSprite?.y || 0;
    const cleanupThreshold = playerY + screenHeight + 100;

    this.fallingObjects = this.fallingObjects.filter(obj => {
      if (obj.sprite.y > cleanupThreshold || !obj.sprite.active) {
        // Clean up trail effect if it exists
        if (obj.trail) {
          obj.trail.destroy();
        }
        
        // Remove from pool and destroy sprite
        this.objectPool.remove(obj.sprite);
        obj.sprite.destroy();
        
        return false;
      }
      return true;
    });
  }

  private handleObjectPlayerCollision(object: Phaser.Physics.Arcade.Sprite, player: Phaser.Physics.Arcade.Sprite) {
    const objectType = object.getData('objectType') as FallingObject['type'];
    const damage = object.getData('damage') as number;

    // Create impact effect
    this.createImpactEffect(object.x, object.y, objectType);

    // Special bomb explosion
    if (objectType === 'bomb') {
      this.createExplosion(object.x, object.y);
    }

    // Emit damage event
    this.scene.events.emit('player-damaged', {
      damage,
      source: 'falling-object',
      objectType
    });

    // Remove the object
    this.removeObject(object);
  }

  private handleObjectPlatformCollision(object: Phaser.Physics.Arcade.Sprite, platform: Phaser.Physics.Arcade.Sprite) {
    const objectType = object.getData('objectType') as FallingObject['type'];

    // Create impact effect
    this.createImpactEffect(object.x, object.y, objectType);

    // Special bomb explosion affects nearby area
    if (objectType === 'bomb') {
      this.createExplosion(object.x, object.y);
      
      // Check if player is in explosion radius
      if (this.playerSprite) {
        const distance = Phaser.Math.Distance.Between(
          object.x, object.y,
          this.playerSprite.x, this.playerSprite.y
        );
        
        if (distance <= 100) { // Explosion radius
          this.scene.events.emit('player-damaged', {
            damage: 2,
            source: 'explosion',
            objectType: 'bomb'
          });
        }
      }
    }

    // Remove the object
    this.removeObject(object);
  }

  private removeObject(sprite: Phaser.Physics.Arcade.Sprite) {
    // Find and remove from fallingObjects array
    const index = this.fallingObjects.findIndex(obj => obj.sprite === sprite);
    if (index !== -1) {
      const obj = this.fallingObjects[index];
      
      // Clean up trail if exists
      if (obj.trail) {
        obj.trail.destroy();
      }
      
      this.fallingObjects.splice(index, 1);
    }

    // Remove from pool and destroy
    this.objectPool.remove(sprite);
    sprite.destroy();
  }

  private createSpawnEffect(x: number, y: number) {
    // Warning indicator before object spawns
    const warning = this.scene.add.circle(x, y + 30, 20, 0xff0000, 0.3);
    warning.setStrokeStyle(3, 0xff0000, 0.8);

    this.scene.tweens.add({
      targets: warning,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 500,
      ease: 'Power2.easeOut',
      onComplete: () => warning.destroy()
    });
  }

  private createImpactEffect(x: number, y: number, type: FallingObject['type']) {
    const colors = {
      rock: 0x8B4513,
      spike: 0xFF0000,
      bomb: 0xFF4500,
      ice: 0x87CEEB,
      acid: 0x32CD32
    };

    // Create impact particles
    for (let i = 0; i < 6; i++) {
      const particle = this.scene.add.circle(
        x + Phaser.Math.Between(-10, 10),
        y + Phaser.Math.Between(-10, 10),
        Phaser.Math.Between(3, 8),
        colors[type] || 0xFFFFFF
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
        duration: 600,
        ease: 'Power2.easeOut',
        onComplete: () => particle.destroy()
      });
    }
  }

  private createExplosion(x: number, y: number) {
    // Large explosion effect
    for (let i = 0; i < 12; i++) {
      const particle = this.scene.add.circle(
        x + Phaser.Math.Between(-20, 20),
        y + Phaser.Math.Between(-20, 20),
        Phaser.Math.Between(8, 15),
        Phaser.Math.Choose([0xFF4500, 0xFF0000, 0xFFFF00])
      );

      const velocityX = Phaser.Math.Between(-300, 300);
      const velocityY = Phaser.Math.Between(-400, -100);

      this.scene.tweens.add({
        targets: particle,
        x: particle.x + velocityX,
        y: particle.y + velocityY,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: 1200,
        ease: 'Power2.easeOut',
        onComplete: () => particle.destroy()
      });
    }

    // Screen shake
    this.scene.cameras.main.shake(400, 0.03);
  }

  // Method to adjust difficulty
  setDifficulty(level: number) {
    this.difficulty = level;
    this.maxObjects = Math.min(10, 4 + level);
    this.spawnInterval = Math.max(1000, 3000 - (level * 200));
  }

  // Get current stats
  getStats() {
    return {
      activeObjects: this.fallingObjects.length,
      maxObjects: this.maxObjects,
      spawnInterval: this.getAdjustedSpawnInterval(),
      difficulty: this.difficulty
    };
  }

  destroy() {
    // Clean up all objects
    this.fallingObjects.forEach(obj => {
      if (obj.trail) {
        obj.trail.destroy();
      }
      obj.sprite.destroy();
    });

    this.fallingObjects = [];
    this.objectPool.destroy();
  }
}
