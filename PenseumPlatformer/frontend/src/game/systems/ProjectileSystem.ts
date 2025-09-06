import Phaser from 'phaser';

export interface ProjectileConfig {
  speed: number;
  damage: number;
  knockback: number;
  lifetime: number;
  color: number;
  size: number;
  owner: 'enemy' | 'player';
}

export default class ProjectileSystem {
  private scene: Phaser.Scene;
  private projectiles: Phaser.Physics.Arcade.Group;
  private enemyProjectiles: Phaser.Physics.Arcade.Group;
  private playerProjectiles: Phaser.Physics.Arcade.Group;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.projectiles = scene.physics.add.group();
    this.enemyProjectiles = scene.physics.add.group();
    this.playerProjectiles = scene.physics.add.group();
    
    this.setupCollisions();
  }

  private setupCollisions() {
    // Enemy projectiles vs player
    this.scene.physics.add.overlap(
      this.enemyProjectiles,
      this.scene.children.list.filter(child => 
        child instanceof Phaser.Physics.Arcade.Sprite && 
        child.getData('type') === 'player'
      ),
      (projectile, player) => {
        this.handleProjectileHit(projectile as Phaser.Physics.Arcade.Sprite, player as Phaser.Physics.Arcade.Sprite);
      }
    );

    // Player projectiles vs enemies
    this.scene.physics.add.overlap(
      this.playerProjectiles,
      this.scene.children.list.filter(child => 
        child instanceof Phaser.Physics.Arcade.Sprite && 
        child.getData('type') === 'enemy'
      ),
      (projectile, enemy) => {
        this.handleProjectileHit(projectile as Phaser.Physics.Arcade.Sprite, enemy as Phaser.Physics.Arcade.Sprite);
      }
    );

    // Projectiles vs platforms
    this.scene.physics.add.collider(
      this.projectiles,
      this.scene.children.list.filter(child => 
        child instanceof Phaser.Physics.Arcade.Sprite && 
        child.getData('type') === 'platform'
      ),
      (projectile, platform) => {
        this.handleProjectilePlatformCollision(projectile as Phaser.Physics.Arcade.Sprite, platform as Phaser.Physics.Arcade.Sprite);
      }
    );
  }

  setupPlayerCollision(playerSprite: Phaser.Physics.Arcade.Sprite) {
    playerSprite.setData('type', 'player');
    
    // Update enemy projectile collision
    this.scene.physics.add.overlap(this.enemyProjectiles, playerSprite, (projectile, player) => {
      this.handleProjectileHit(projectile as Phaser.Physics.Arcade.Sprite, player as Phaser.Physics.Arcade.Sprite);
    });
  }

  setupEnemyCollision(enemySprites: Phaser.Physics.Arcade.Sprite[]) {
    enemySprites.forEach(enemy => {
      enemy.setData('type', 'enemy');
      
      // Update player projectile collision
      this.scene.physics.add.overlap(this.playerProjectiles, enemy, (projectile, enemy) => {
        this.handleProjectileHit(projectile as Phaser.Physics.Arcade.Sprite, enemy as Phaser.Physics.Arcade.Sprite);
      });
    });
  }

  private handleProjectileHit(projectile: Phaser.Physics.Arcade.Sprite, target: Phaser.Physics.Arcade.Sprite) {
    const damage = projectile.getData('damage') || 1;
    const knockback = projectile.getData('knockback') || 100;
    const owner = projectile.getData('owner') || 'enemy';
    
    // Create hit effect
    this.createHitEffect(projectile.x, projectile.y, projectile.getData('color') || 0xff0000);
    
    // Emit attack event
    this.scene.events.emit('projectile-hit', {
      damage,
      knockback,
      target,
      projectile,
      owner
    });
    
    // Destroy projectile
    this.destroyProjectile(projectile);
  }

  private handleProjectilePlatformCollision(projectile: Phaser.Physics.Arcade.Sprite, platform: Phaser.Physics.Arcade.Sprite) {
    // Create impact effect
    this.createImpactEffect(projectile.x, projectile.y, projectile.getData('color') || 0xff0000);
    
    // Destroy projectile
    this.destroyProjectile(projectile);
  }

  createProjectile(x: number, y: number, targetX: number, targetY: number, config: ProjectileConfig) {
    // Create projectile sprite
    const projectile = this.scene.physics.add.sprite(x, y, 'projectile');
    projectile.setScale(config.size);
    projectile.setTint(config.color);
    
    // Set physics properties
    const body = projectile.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(8, 8);
    body.setOffset(4, 4);
    
    // Calculate direction and velocity
    const angle = Phaser.Math.Angle.Between(x, y, targetX, targetY);
    const velocityX = Math.cos(angle) * config.speed;
    const velocityY = Math.sin(angle) * config.speed;
    
    body.setVelocity(velocityX, velocityY);
    
    // Set projectile data
    projectile.setData('damage', config.damage);
    projectile.setData('knockback', config.knockback);
    projectile.setData('owner', config.owner);
    projectile.setData('color', config.color);
    projectile.setData('lifetime', config.lifetime);
    
    // Add to appropriate group
    this.projectiles.add(projectile);
    if (config.owner === 'enemy') {
      this.enemyProjectiles.add(projectile);
    } else {
      this.playerProjectiles.add(projectile);
    }
    
    // Set up lifetime
    this.scene.time.delayedCall(config.lifetime, () => {
      if (projectile && projectile.active) {
        this.destroyProjectile(projectile);
      }
    });
    
    // Add rotation animation
    this.scene.tweens.add({
      targets: projectile,
      rotation: Math.PI * 2,
      duration: 1000,
      repeat: -1,
      ease: 'Linear'
    });
    
    return projectile;
  }

  private destroyProjectile(projectile: Phaser.Physics.Arcade.Sprite) {
    // Create destruction effect
    this.createDestructionEffect(projectile.x, projectile.y, projectile.getData('color') || 0xff0000);
    
    // Remove from groups
    this.projectiles.remove(projectile);
    this.enemyProjectiles.remove(projectile);
    this.playerProjectiles.remove(projectile);
    
    // Destroy sprite
    projectile.destroy();
  }

  private createHitEffect(x: number, y: number, color: number) {
    // Create hit particles
    for (let i = 0; i < 4; i++) {
      const particle = this.scene.add.circle(x, y, 2, color);
      
      const velocityX = Phaser.Math.Between(-50, 50);
      const velocityY = Phaser.Math.Between(-50, 50);
      
      this.scene.tweens.add({
        targets: particle,
        x: x + velocityX,
        y: y + velocityY,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: 300,
        ease: 'Power2.easeOut',
        onComplete: () => particle.destroy()
      });
    }
  }

  private createImpactEffect(x: number, y: number, color: number) {
    // Create impact particles
    for (let i = 0; i < 6; i++) {
      const particle = this.scene.add.circle(x, y, 3, color);
      
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

  private createDestructionEffect(x: number, y: number, color: number) {
    // Create destruction particles
    for (let i = 0; i < 3; i++) {
      const particle = this.scene.add.circle(x, y, 1, color);
      
      const velocityX = Phaser.Math.Between(-30, 30);
      const velocityY = Phaser.Math.Between(-30, 30);
      
      this.scene.tweens.add({
        targets: particle,
        x: x + velocityX,
        y: y + velocityY,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: 200,
        ease: 'Power2.easeOut',
        onComplete: () => particle.destroy()
      });
    }
  }

  update(time: number, delta: number) {
    // Update projectile positions and check for out-of-bounds
    this.projectiles.children.entries.forEach(projectile => {
      const sprite = projectile as Phaser.Physics.Arcade.Sprite;
      
      // Remove projectiles that are out of bounds
      if (sprite.x < -100 || sprite.x > this.scene.cameras.main.width + 100 ||
          sprite.y < -100 || sprite.y > this.scene.cameras.main.height + 100) {
        this.destroyProjectile(sprite);
      }
    });
  }

  // Method to clear all projectiles
  clearAllProjectiles() {
    this.projectiles.clear(true, true);
    this.enemyProjectiles.clear(true, true);
    this.playerProjectiles.clear(true, true);
  }

  // Method to get projectile count
  getProjectileCount() {
    return this.projectiles.children.size;
  }

  // Method to get enemy projectile count
  getEnemyProjectileCount() {
    return this.enemyProjectiles.children.size;
  }

  // Method to get player projectile count
  getPlayerProjectileCount() {
    return this.playerProjectiles.children.size;
  }

  destroy() {
    this.clearAllProjectiles();
    this.projectiles.destroy();
    this.enemyProjectiles.destroy();
    this.playerProjectiles.destroy();
  }
}
