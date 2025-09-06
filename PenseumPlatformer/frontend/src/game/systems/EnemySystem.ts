import Phaser from 'phaser';
import EnemyEntity, { EnemyConfig } from '../entities/EnemyEntity';
import ProjectileSystem, { ProjectileConfig } from './ProjectileSystem';
import { GameConfig } from '../config/GameConfig';

export default class EnemySystem {
  private scene: Phaser.Scene;
  private enemies: EnemyEntity[] = [];
  private projectiles: Phaser.Physics.Arcade.Group;
  private enemyConfigs: Map<string, EnemyConfig> = new Map();
  private spawnTimer: number = 0;
  private spawnInterval: number = 5000; // 5 seconds between spawns
  private maxEnemies: number = 5;
  private playerSprite?: Phaser.Physics.Arcade.Sprite;
  private projectileSystem?: ProjectileSystem;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.projectiles = scene.physics.add.group();
    this.setupEnemyConfigs();
    this.setupCollisions();
  }

  private setupEnemyConfigs() {
    // Shooter enemy - attacks from distance
    this.enemyConfigs.set('shooter', {
      type: 'shooter',
      health: 3,
      speed: 50,
      attackRange: 200,
      attackDamage: 1,
      shootCooldown: 2000,
      knockbackForce: 100,
      color: 0xff0000,
      size: 1.0,
      canBeJumpedOn: true
    });

    // Melee enemy - attacks up close
    this.enemyConfigs.set('melee', {
      type: 'melee',
      health: 2,
      speed: 80,
      attackRange: 40,
      attackDamage: 2,
      shootCooldown: 1500,
      knockbackForce: 150,
      color: 0x8B0000,
      size: 1.2,
      canBeJumpedOn: true
    });

    // Bomber enemy - explodes when close
    this.enemyConfigs.set('bomber', {
      type: 'bomber',
      health: 1,
      speed: 60,
      attackRange: 60,
      attackDamage: 3,
      shootCooldown: 3000,
      knockbackForce: 200,
      color: 0x4B0000,
      size: 1.5,
      canBeJumpedOn: true
    });

    // Walker enemy - chases player across platforms
    this.enemyConfigs.set('walker', {
      type: 'walker',
      health: 1,
      speed: 60,
      attackRange: 30,
      attackDamage: 1,
      shootCooldown: 1000,
      knockbackForce: 80,
      color: 0x006400,
      size: 1.0,
      canBeJumpedOn: true
    });
  }

  private setupCollisions() {
    // Projectile vs player collision
    this.scene.physics.add.overlap(this.projectiles, this.scene.children.list, (projectile, target) => {
      const targetSprite = target as Phaser.Physics.Arcade.Sprite;
      if (targetSprite.getData('type') === 'player') {
        this.handleProjectileHit(projectile as Phaser.Physics.Arcade.Sprite, targetSprite);
      }
    });

    // Enemy vs player collision will be set up after enemies are created
  }

  setupPlayerCollision(playerSprite: Phaser.Physics.Arcade.Sprite) {
    this.playerSprite = playerSprite;
    playerSprite.setData('type', 'player');
    
    // Update projectile collision
    this.scene.physics.add.overlap(this.projectiles, playerSprite, (projectile, player) => {
      this.handleProjectileHit(projectile as Phaser.Physics.Arcade.Sprite, player as Phaser.Physics.Arcade.Sprite);
    });
  }

  setProjectileSystem(projectileSystem: ProjectileSystem) {
    this.projectileSystem = projectileSystem;
  }

  private handleProjectileHit(projectile: Phaser.Physics.Arcade.Sprite, player: Phaser.Physics.Arcade.Sprite) {
    const damage = projectile.getData('damage') || 1;
    const knockback = projectile.getData('knockback') || 100;
    
    // Emit attack event
    this.scene.events.emit('enemy-attack', {
      damage,
      knockback,
      attacker: null
    });
    
    // Destroy projectile
    projectile.destroy();
  }

  private handleEnemyCollision(player: Phaser.Physics.Arcade.Sprite, enemy: Phaser.Physics.Arcade.Sprite) {
    // Find the enemy entity
    const enemyEntity = this.enemies.find(e => e.getSprite() === enemy);
    if (enemyEntity && enemyEntity.getIsAlive()) {
      const config = enemyEntity.getConfig();
      
      // Emit attack event
      this.scene.events.emit('enemy-attack', {
        damage: config.attackDamage,
        knockback: config.knockbackForce,
        attacker: enemyEntity
      });
    }
  }

  update(time: number, delta: number, playerSprite: Phaser.Physics.Arcade.Sprite) {
    // Update all enemies
    this.enemies.forEach(enemy => {
      if (enemy.getIsAlive()) {
        enemy.update(time, delta, playerSprite);
      }
    });

    // Spawn new enemies
    this.spawnTimer += delta;
    if (this.spawnTimer >= this.spawnInterval && this.enemies.length < this.maxEnemies) {
      this.spawnRandomEnemy(playerSprite);
      this.spawnTimer = 0;
    }

    // Clean up dead enemies
    this.enemies = this.enemies.filter(enemy => {
      if (!enemy.getIsAlive()) {
        enemy.destroy();
        return false;
      }
      return true;
    });

    // Update projectiles
    this.updateProjectiles(delta);
  }

  private spawnRandomEnemy(playerSprite: Phaser.Physics.Arcade.Sprite) {
    const enemyTypes = Array.from(this.enemyConfigs.keys());
    const randomType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    const config = this.enemyConfigs.get(randomType)!;
    
    // Spawn enemy at random position near player
    const spawnDistance = 300;
    const angle = Math.random() * Math.PI * 2;
    const x = playerSprite.x + Math.cos(angle) * spawnDistance;
    const y = playerSprite.y + Math.sin(angle) * spawnDistance;
    
    // Ensure enemy spawns within screen bounds
    const clampedX = Phaser.Math.Clamp(x, 50, this.scene.cameras.main.width - 50);
    const clampedY = Phaser.Math.Clamp(y, 100, this.scene.cameras.main.height - 100);
    
    this.spawnEnemy(clampedX, clampedY, config);
  }

  spawnEnemy(x: number, y: number, config: EnemyConfig) {
    const enemy = new EnemyEntity(this.scene, x, y, config);
    this.enemies.push(enemy);
    
    // Set up enemy sprite data
    enemy.getSprite().setData('type', 'enemy');
    enemy.getSprite().setData('enemyEntity', enemy);
    
    // Set up collision with player if player exists
    if (this.playerSprite) {
      this.scene.physics.add.overlap(
        this.playerSprite,
        enemy.getSprite(),
        (player, enemy) => {
          this.handleEnemyCollision(player as Phaser.Physics.Arcade.Sprite, enemy as Phaser.Physics.Arcade.Sprite);
        }
      );
    }
    
    // Visual spawn effect
    this.createSpawnEffect(x, y);
  }

  setPlatforms(platforms: Phaser.Physics.Arcade.StaticGroup) {
    // Set platforms for all existing enemies
    this.enemies.forEach(enemy => {
      enemy.setPlatforms(platforms);
    });
  }

  private createSpawnEffect(x: number, y: number) {
    // Create spawn particles
    for (let i = 0; i < 6; i++) {
      const particle = this.scene.add.circle(x, y, 3, 0xff0000);
      
      const velocityX = Phaser.Math.Between(-100, 100);
      const velocityY = Phaser.Math.Between(-100, 100);
      
      this.scene.tweens.add({
        targets: particle,
        x: x + velocityX,
        y: y + velocityY,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: 500,
        ease: 'Power2.easeOut',
        onComplete: () => particle.destroy()
      });
    }
  }

  private updateProjectiles(delta: number) {
    // Update projectile positions and check for out-of-bounds
    this.projectiles.children.entries.forEach(projectile => {
      const sprite = projectile as Phaser.Physics.Arcade.Sprite;
      
      // Remove projectiles that are out of bounds
      if (sprite.x < -50 || sprite.x > this.scene.cameras.main.width + 50 ||
          sprite.y < -50 || sprite.y > this.scene.cameras.main.height + 50) {
        this.projectiles.remove(sprite);
        sprite.destroy();
      }
    });
  }

  // Method to spawn enemies at specific locations (useful for level design)
  spawnEnemyAtPlatform(platformX: number, platformY: number, enemyType: string = 'shooter') {
    const config = this.enemyConfigs.get(enemyType);
    if (config) {
      const x = platformX + Phaser.Math.Between(-50, 50);
      const y = platformY - 50; // Above the platform
      this.spawnEnemy(x, y, config);
    }
  }

  // Method to clear all enemies (useful for level transitions)
  clearAllEnemies() {
    this.enemies.forEach(enemy => enemy.destroy());
    this.enemies = [];
    this.projectiles.clear(true, true);
  }

  // Method to get all active enemies
  getEnemies() {
    return this.enemies.filter(enemy => enemy.getIsAlive());
  }

  // Method to get enemy count
  getEnemyCount() {
    return this.enemies.filter(enemy => enemy.getIsAlive()).length;
  }

  // Method to adjust difficulty
  setDifficulty(level: number) {
    // Increase spawn rate and max enemies with difficulty
    this.spawnInterval = Math.max(2000, 5000 - (level * 500));
    this.maxEnemies = Math.min(10, 3 + level);
    
    // Increase enemy health and damage
    this.enemyConfigs.forEach((config, key) => {
      config.health = Math.min(10, 2 + level);
      config.attackDamage = Math.min(5, 1 + Math.floor(level / 2));
    });
  }

  destroy() {
    this.clearAllEnemies();
    this.projectiles.destroy();
  }
}
