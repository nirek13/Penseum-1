import Phaser from 'phaser';
import { Particle } from '../../types/GameTypes';
import MainGameScene from '../scenes/MainGameScene';

export default class ParticleSystem {
  private scene: MainGameScene;
  private particles: Particle[] = [];
  private particlePool: Phaser.GameObjects.Graphics[] = [];
  private sparklePool: Phaser.GameObjects.Graphics[] = [];
  private trailPool: Phaser.GameObjects.Graphics[] = [];

  constructor(scene: MainGameScene) {
    this.scene = scene;
    this.initializeParticlePool();
  }

  private initializeParticlePool() {
    // Main particle pool
    for (let i = 0; i < 150; i++) {
      const particle = this.scene.add.graphics();
      particle.setActive(false);
      particle.setVisible(false);
      this.particlePool.push(particle);
    }
    
    // Sparkle effect pool
    for (let i = 0; i < 50; i++) {
      const sparkle = this.scene.add.graphics();
      sparkle.setActive(false);
      sparkle.setVisible(false);
      this.sparklePool.push(sparkle);
    }
    
    // Trail effect pool
    for (let i = 0; i < 30; i++) {
      const trail = this.scene.add.graphics();
      trail.setActive(false);
      trail.setVisible(false);
      this.trailPool.push(trail);
    }
  }

  private getParticleFromPool(): Phaser.GameObjects.Graphics | null {
    for (let particle of this.particlePool) {
      if (!particle.active) {
        particle.setActive(true);
        particle.setVisible(true);
        return particle;
      }
    }
    return null;
  }

  private returnParticleToPool(particle: Phaser.GameObjects.Graphics) {
    particle.setActive(false);
    particle.setVisible(false);
    particle.clear();
  }

  createJumpParticles(x: number, y: number) {
    // Main dust particles
    for (let i = 0; i < 12; i++) {
      this.createParticle({
        x: x + Phaser.Math.Between(-15, 15),
        y: y + Phaser.Math.Between(-8, 8),
        velocityX: Phaser.Math.Between(-80, 80),
        velocityY: Phaser.Math.Between(-40, -10),
        life: 600 + Phaser.Math.Between(0, 400),
        maxLife: 1000,
        color: '#6F47EB',
        size: Phaser.Math.Between(2, 5)
      });
    }
    
    // Add sparkle effects
    this.createSparkles(x, y, '#FFFFFF', 8);
    
    // Ground impact effect
    this.createGroundImpact(x, y + 16);
  }

  createSuccessParticles(x: number, y: number) {
    const colors = ['#6F47EB', '#8B5CF6', '#ffffff', '#E0E7FF'];
    
    // Main celebration particles
    for (let i = 0; i < 20; i++) {
      this.createParticle({
        x: x + Phaser.Math.Between(-25, 25),
        y: y + Phaser.Math.Between(-15, 15),
        velocityX: Phaser.Math.Between(-120, 120),
        velocityY: Phaser.Math.Between(-180, -70),
        life: 1200 + Phaser.Math.Between(0, 600),
        maxLife: 1800,
        color: Phaser.Utils.Array.GetRandom(colors),
        size: Phaser.Math.Between(3, 10)
      });
    }
    
    // Enhanced burst effect
    this.createBurst(x, y, '#6F47EB', 25);
    
    // Multiple sparkle rings
    this.createSparkleRing(x, y, 30, '#FFFFFF');
    this.createSparkleRing(x, y, 50, '#6F47EB');
    
    // Confetti effect
    this.createConfetti(x, y);
  }

  createFailureParticles(x: number, y: number) {
    const colors = ['#FF6B6B', '#FF8E8E', '#FFFFFF'];
    
    // Failure particles with downward emphasis
    for (let i = 0; i < 15; i++) {
      this.createParticle({
        x: x + Phaser.Math.Between(-20, 20),
        y: y + Phaser.Math.Between(-15, 15),
        velocityX: Phaser.Math.Between(-100, 100),
        velocityY: Phaser.Math.Between(-80, 20),
        life: 1000 + Phaser.Math.Between(0, 500),
        maxLife: 1500,
        color: Phaser.Utils.Array.GetRandom(colors),
        size: Phaser.Math.Between(3, 8)
      });
    }
    
    // Create X-shaped particle burst for failure
    this.createXBurst(x, y, '#FF6B6B');
  }

  createPowerUpParticles(x: number, y: number, type: string) {
    const typeColors = {
      shield: '#7C3AED',
      doubleBoost: '#1F2937',
      invincibility: '#6B7280',
      scoreMultiplier: '#7C3AED',
      extraLife: '#7C3AED',
      jetpack: '#F59E0B',
      trampoline: '#10B981',
      doubleJump: '#8B5CF6'
    };
    
    const color = typeColors[type as keyof typeof typeColors] || '#7C3AED';
    
    for (let i = 0; i < 20; i++) {
      this.createParticle({
        x: x + Phaser.Math.Between(-25, 25),
        y: y + Phaser.Math.Between(-25, 25),
        velocityX: Phaser.Math.Between(-120, 120),
        velocityY: Phaser.Math.Between(-120, -20),
        life: 1200 + Phaser.Math.Between(0, 600),
        maxLife: 1800,
        color,
        size: Phaser.Math.Between(4, 10)
      });
    }
    
    this.createBurst(x, y, color, 30);
    this.createSparkles(x, y, color, 15);
  }

  createShieldBreakParticles(x: number, y: number) {
    for (let i = 0; i < 12; i++) {
      this.createParticle({
        x: x + Phaser.Math.Between(-15, 15),
        y: y + Phaser.Math.Between(-15, 15),
        velocityX: Phaser.Math.Between(-60, 60),
        velocityY: Phaser.Math.Between(-80, -20),
        life: 600 + Phaser.Math.Between(0, 400),
        maxLife: 1000,
        color: '#4ecdc4',
        size: Phaser.Math.Between(2, 5)
      });
    }
  }

  createInvincibilityParticles(x: number, y: number) {
    for (let i = 0; i < 10; i++) {
      this.createParticle({
        x: x + Phaser.Math.Between(-20, 20),
        y: y + Phaser.Math.Between(-20, 20),
        velocityX: Phaser.Math.Between(-40, 40),
        velocityY: Phaser.Math.Between(-60, -10),
        life: 800 + Phaser.Math.Between(0, 400),
        maxLife: 1200,
        color: '#ffd93d',
        size: Phaser.Math.Between(3, 7)
      });
    }
    
    this.createSparkles(x, y, '#ffd93d', 8);
  }

  private createBurst(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = Phaser.Math.Between(80, 120);
      
      this.createParticle({
        x,
        y,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        life: 400 + Phaser.Math.Between(0, 200),
        maxLife: 600,
        color,
        size: Phaser.Math.Between(2, 4)
      });
    }
  }

  private createSparkles(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const sparkle = this.scene.add.star(
        x + Phaser.Math.Between(-40, 40),
        y + Phaser.Math.Between(-40, 40),
        6,
        Phaser.Math.Between(4, 10),
        Phaser.Math.Between(8, 16),
        parseInt(color.replace('#', '0x'))
      );
      
      // Enhanced sparkle animation with glow
      sparkle.setAlpha(0.9);
      sparkle.setBlendMode(Phaser.BlendModes.ADD);
      
      this.scene.tweens.add({
        targets: sparkle,
        scaleX: 0,
        scaleY: 0,
        alpha: 0,
        rotation: Math.PI * 4,
        duration: 1200 + Phaser.Math.Between(0, 500),
        ease: 'Power2.easeOut',
        onComplete: () => sparkle.destroy()
      });
      
      // Enhanced floating motion
      this.scene.tweens.add({
        targets: sparkle,
        x: sparkle.x + Phaser.Math.Between(-30, 30),
        y: sparkle.y - Phaser.Math.Between(30, 80),
        duration: 1200 + Phaser.Math.Between(0, 500),
        ease: 'Sine.easeOut'
      });
    }
  }

  // Ground impact effect
  createGroundImpact(x: number, y: number) {
    const colors = ['#6F47EB', '#FFFFFF'];
    
    for (let i = 0; i < 8; i++) {
      this.createParticle({
        x: x + Phaser.Math.Between(-25, 25),
        y: y,
        velocityX: Phaser.Math.Between(-80, 80),
        velocityY: Phaser.Math.Between(-40, -15),
        life: 500 + Phaser.Math.Between(0, 300),
        maxLife: 800,
        color: Phaser.Utils.Array.GetRandom(colors),
        size: Phaser.Math.Between(2, 4)
      });
    }
  }

  // Sparkle ring effect
  createSparkleRing(x: number, y: number, radius: number, color: string) {
    const count = Math.floor(radius / 10);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const sparkleX = x + Math.cos(angle) * radius;
      const sparkleY = y + Math.sin(angle) * radius;
      
      const sparkle = this.scene.add.star(
        sparkleX, sparkleY, 4, 3, 6,
        parseInt(color.replace('#', '0x'))
      );
      sparkle.setScale(0.5);
      sparkle.setBlendMode(Phaser.BlendModes.ADD);
      
      this.scene.tweens.add({
        targets: sparkle,
        scaleX: 0,
        scaleY: 0,
        alpha: 0,
        x: x + Math.cos(angle) * (radius + 30),
        y: y + Math.sin(angle) * (radius + 30),
        duration: 800,
        ease: 'Power2.easeOut',
        onComplete: () => sparkle.destroy()
      });
    }
  }

  // Confetti effect
  createConfetti(x: number, y: number) {
    const colors = ['#6F47EB', '#FFFFFF', '#E0E7FF', '#8B5CF6'];
    
    for (let i = 0; i < 15; i++) {
      const confetti = this.scene.add.rectangle(
        x + Phaser.Math.Between(-20, 20),
        y + Phaser.Math.Between(-15, 15),
        Phaser.Math.Between(6, 12),
        Phaser.Math.Between(3, 6),
        parseInt(Phaser.Utils.Array.GetRandom(colors).replace('#', '0x'))
      );
      
      confetti.setRotation(Phaser.Math.Between(0, Math.PI * 2));
      confetti.setAlpha(0.8);
      
      this.scene.tweens.add({
        targets: confetti,
        x: x + Phaser.Math.Between(-120, 120),
        y: y + Phaser.Math.Between(60, 180),
        rotation: confetti.rotation + Math.PI * 6,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: 2000,
        ease: 'Power2.easeOut',
        onComplete: () => confetti.destroy()
      });
    }
  }

  // X-shaped burst for failures
  createXBurst(x: number, y: number, color: string) {
    // Create X pattern with lines
    const xLine1 = this.scene.add.line(x, y, -20, -20, 20, 20, parseInt(color.replace('#', '0x')));
    const xLine2 = this.scene.add.line(x, y, -20, 20, 20, -20, parseInt(color.replace('#', '0x')));
    
    [xLine1, xLine2].forEach(line => {
      line.setLineWidth(4);
      line.setAlpha(0.8);
      
      this.scene.tweens.add({
        targets: line,
        scaleX: 2,
        scaleY: 2,
        alpha: 0,
        duration: 600,
        ease: 'Power2.easeOut',
        onComplete: () => line.destroy()
      });
    });
    
    // Add particles along the X lines
    const directions = [
      { x: 1, y: -1 }, { x: -1, y: -1 },
      { x: 1, y: 1 }, { x: -1, y: 1 }
    ];
    
    directions.forEach(dir => {
      for (let i = 1; i <= 6; i++) {
        this.createParticle({
          x: x + (dir.x * i * 10),
          y: y + (dir.y * i * 10),
          velocityX: dir.x * 100,
          velocityY: dir.y * 100,
          life: 700,
          maxLife: 700,
          color: color,
          size: 4
        });
      }
    });
  }

  private createParticle(config: Particle) {
    const particleGraphics = this.getParticleFromPool();
    if (!particleGraphics) return;
    
    particleGraphics.clear();
    particleGraphics.fillStyle(parseInt(config.color.replace('#', '0x')));
    particleGraphics.fillCircle(0, 0, config.size);
    
    particleGraphics.setPosition(config.x, config.y);
    
    const particleData: Particle & { graphics: Phaser.GameObjects.Graphics } = {
      ...config,
      graphics: particleGraphics
    };
    
    this.particles.push(particleData as any);
  }

  private updateParticle(particle: Particle & { graphics: Phaser.GameObjects.Graphics }, delta: number) {
    particle.life -= delta;
    
    if (particle.life <= 0) {
      this.returnParticleToPool(particle.graphics);
      return false;
    }
    
    // Update position
    particle.x += particle.velocityX * (delta / 1000);
    particle.y += particle.velocityY * (delta / 1000);
    particle.velocityY += 200 * (delta / 1000); // Gravity
    
    // Update visual properties
    const alpha = particle.life / particle.maxLife;
    const scale = 0.5 + (particle.life / particle.maxLife) * 0.5;
    
    particle.graphics.setPosition(particle.x, particle.y);
    particle.graphics.setAlpha(alpha);
    particle.graphics.setScale(scale);
    
    return true;
  }

  createExplosion(x: number, y: number, color: string = '#ffffff', intensity: number = 1) {
    const particleCount = Math.floor(15 * intensity);
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = Phaser.Math.Between(50, 150) * intensity;
      
      this.createParticle({
        x: x + Phaser.Math.Between(-10, 10),
        y: y + Phaser.Math.Between(-10, 10),
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        life: 600 + Phaser.Math.Between(0, 400),
        maxLife: 1000,
        color,
        size: Phaser.Math.Between(2, 6) * intensity
      });
    }
  }

  createTrail(x: number, y: number, color: string = '#ffffff') {
    this.createParticle({
      x: x + Phaser.Math.Between(-5, 5),
      y: y + Phaser.Math.Between(-5, 5),
      velocityX: Phaser.Math.Between(-20, 20),
      velocityY: Phaser.Math.Between(-30, 10),
      life: 300,
      maxLife: 300,
      color,
      size: Phaser.Math.Between(1, 3)
    });
  }

  update(time: number, delta: number) {
    this.particles = this.particles.filter(particle => {
      return this.updateParticle(particle as any, delta);
    });
  }

  clear() {
    this.particles.forEach(particle => {
      this.returnParticleToPool((particle as any).graphics);
    });
    this.particles = [];
  }

  getParticleCount() {
    return this.particles.length;
  }

  // New enhanced particle effects
  private createEnergyRings(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const ring = this.scene.add.circle(x, y, 5 + (i * 10), undefined);
      ring.setStrokeStyle(2, parseInt(color.replace('#', '0x')), 0.6);
      ring.setFillStyle(undefined);
      
      this.scene.tweens.add({
        targets: ring,
        radius: 30 + (i * 15),
        alpha: 0,
        duration: 600 + (i * 100),
        ease: 'Power2.easeOut',
        onComplete: () => ring.destroy()
      });
    }
  }
  
  private createEnergyWaves(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const wave = this.scene.add.ellipse(x, y, 10, 5, undefined);
      wave.setStrokeStyle(3, parseInt(color.replace('#', '0x')), 0.8);
      wave.setFillStyle(undefined);
      
      this.scene.tweens.add({
        targets: wave,
        width: 60 + (i * 20),
        height: 15 + (i * 5),
        alpha: 0,
        duration: 800 + (i * 150),
        ease: 'Sine.easeOut',
        onComplete: () => wave.destroy()
      });
    }
  }
  
  private createImpactWaves(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const wave = this.scene.add.circle(x, y, 8, undefined);
      wave.setStrokeStyle(4, parseInt(color.replace('#', '0x')), 0.7);
      wave.setFillStyle(undefined);
      
      this.scene.tweens.add({
        targets: wave,
        radius: 40 + (i * 12),
        alpha: 0,
        duration: 400 + (i * 80),
        ease: 'Power2.easeOut',
        onComplete: () => wave.destroy()
      });
    }
  }
  
  private createJetFlames(x: number, y: number) {
    for (let i = 0; i < 6; i++) {
      this.createParticle({
        x: x + Phaser.Math.Between(-5, 5),
        y: y + Phaser.Math.Between(0, 10),
        velocityX: Phaser.Math.Between(-20, 20),
        velocityY: Phaser.Math.Between(50, 120),
        life: 300 + Phaser.Math.Between(0, 200),
        maxLife: 500,
        color: i % 2 === 0 ? '#FF6B35' : '#F59E0B',
        size: Phaser.Math.Between(2, 5)
      });
    }
  }

  destroy() {
    this.clear();
    this.particlePool.forEach(particle => particle.destroy());
    this.particlePool = [];
  }
}