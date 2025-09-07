import Phaser from 'phaser';
import MainGameScene from '../scenes/MainGameScene';

interface BackgroundLayer {
  graphics: Phaser.GameObjects.TileSprite;
  speed: number;
  depth: number;
}

interface FloatingParticle {
  sprite: Phaser.GameObjects.Shape;
  velocity: Phaser.Math.Vector2;
  life: number;
  maxLife: number;
  type: 'star' | 'dust' | 'energy' | 'sparkle';
}

interface CloudParticle {
  graphics: Phaser.GameObjects.Graphics;
  x: number;
  y: number;
  scale: number;
  alpha: number;
  speed: number;
}

export default class EnvironmentSystem {
  private scene: MainGameScene;
  private backgroundLayers: BackgroundLayer[] = [];
  private floatingParticles: FloatingParticle[] = [];
  private cloudParticles: CloudParticle[] = [];
  private atmosphericOverlay?: Phaser.GameObjects.Graphics;
  private gradientBackground?: Phaser.GameObjects.Graphics;
  
  // Animated elements
  private energyRings: Phaser.GameObjects.Graphics[] = [];
  private lightBeams: Phaser.GameObjects.Graphics[] = [];
  private auraBands: Phaser.GameObjects.Graphics[] = [];

  // Environment state
  private currentHeight: number = 0;
  private environmentIntensity: number = 0.5;
  private timeOfDay: 'dawn' | 'day' | 'dusk' | 'night' = 'dawn';

  constructor(scene: MainGameScene) {
    this.scene = scene;
    this.initializeEnvironment();
  }

  private initializeEnvironment() {
    this.createDynamicBackground();
    this.createAtmosphericOverlay();
    this.initializeParticleSystems();
    this.createAnimatedElements();
    this.startEnvironmentUpdates();
  }

  private createDynamicBackground() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    // Create gradient background
    this.gradientBackground = this.scene.add.graphics();
    this.gradientBackground.setDepth(-1000);
    this.gradientBackground.setScrollFactor(0);
    this.updateGradientBackground();

    // Create parallax background layers
    for (let i = 0; i < 5; i++) {
      const layer = this.scene.add.tileSprite(0, 0, width * 2, height * 2, '');
      layer.setDepth(-900 + i * 10);
      layer.setScrollFactor(0.1 + (i * 0.1));
      layer.setAlpha(0.3 - (i * 0.05));

      // Generate dynamic texture for layer
      const layerTexture = this.createLayerTexture(i);
      layer.setTexture(layerTexture);

      this.backgroundLayers.push({
        graphics: layer,
        speed: 0.2 + (i * 0.1),
        depth: -900 + i * 10
      });
    }
  }

  private createLayerTexture(layerIndex: number): string {
    const textureKey = `bg-layer-${layerIndex}`;
    const graphics = this.scene.add.graphics();
    
    const width = 800;
    const height = 600;

    switch (layerIndex) {
      case 0: // Distant stars
        graphics.fillStyle(0x000011, 0.8);
        graphics.fillRect(0, 0, width, height);
        
        for (let i = 0; i < 200; i++) {
          const x = Phaser.Math.Between(0, width);
          const y = Phaser.Math.Between(0, height);
          const brightness = Phaser.Math.FloatBetween(0.3, 1.0);
          
          graphics.fillStyle(0xFFFFFF, brightness);
          graphics.fillCircle(x, y, Phaser.Math.Between(1, 3));
          
          if (Math.random() < 0.1) { // Twinkling stars
            graphics.fillStyle(0x6F47EB, brightness * 0.5);
            graphics.fillCircle(x, y, 4);
          }
        }
        break;

      case 1: // Nebula clouds
        graphics.fillStyle(0x1a1a2e, 0.6);
        graphics.fillRect(0, 0, width, height);
        
        for (let i = 0; i < 20; i++) {
          const x = Phaser.Math.Between(-50, width + 50);
          const y = Phaser.Math.Between(-50, height + 50);
          const radius = Phaser.Math.Between(40, 120);
          
          // Create gradient effect with multiple circles
          graphics.fillStyle(0x6F47EB, 0.3);
          graphics.fillCircle(x, y, radius);
          graphics.fillStyle(0x8B5CF6, 0.1);
          graphics.fillCircle(x, y, radius * 0.7);
          graphics.fillStyle(0xA78BFA, 0.05);
          graphics.fillCircle(x, y, radius * 0.4);
        }
        break;

      case 2: // Energy fields
        graphics.fillStyle(0x0f0f23, 0.4);
        graphics.fillRect(0, 0, width, height);
        
        for (let i = 0; i < 15; i++) {
          const x = Phaser.Math.Between(0, width);
          const y = Phaser.Math.Between(0, height);
          
          graphics.lineStyle(2, 0x6F47EB, 0.6);
          graphics.strokeEllipse(x, y, Phaser.Math.Between(60, 150), Phaser.Math.Between(20, 60));
          
          graphics.lineStyle(1, 0x8B5CF6, 0.8);
          graphics.strokeEllipse(x, y, Phaser.Math.Between(40, 100), Phaser.Math.Between(15, 45));
        }
        break;

      case 3: // Floating particles
        graphics.fillStyle(0x16213e, 0.3);
        graphics.fillRect(0, 0, width, height);
        
        for (let i = 0; i < 100; i++) {
          const x = Phaser.Math.Between(0, width);
          const y = Phaser.Math.Between(0, height);
          const size = Phaser.Math.FloatBetween(1, 4);
          
          graphics.fillStyle(0xFFFFFF, Phaser.Math.FloatBetween(0.2, 0.8));
          graphics.fillCircle(x, y, size);
        }
        break;

      case 4: // Atmospheric haze
        graphics.fillStyle(0x4c1d95, 0.1);
        graphics.fillRect(0, 0, width, height);
        
        // Create gradient effect with rectangles
        for (let i = 0; i < height; i += 20) {
          const ratio = i / height;
          const alpha = 0.2 * (1 - ratio);
          const color = Phaser.Display.Color.Interpolate.RGBWithRGB(
            111, 71, 235,
            196, 181, 253,
            100,
            Math.floor(ratio * 100)
          );
          graphics.fillStyle(Phaser.Display.Color.GetColor32(color.r, color.g, color.b, 255), alpha);
          graphics.fillRect(0, i, width, 20);
        }
        break;
    }

    graphics.generateTexture(textureKey, width, height);
    graphics.destroy();
    
    return textureKey;
  }

  private createAtmosphericOverlay() {
    this.atmosphericOverlay = this.scene.add.graphics();
    this.atmosphericOverlay.setDepth(-800);
    this.atmosphericOverlay.setScrollFactor(0);
    this.updateAtmosphericOverlay();
  }

  private updateAtmosphericOverlay() {
    if (!this.atmosphericOverlay) return;

    this.atmosphericOverlay.clear();
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    // Create atmospheric gradient effect based on height and time
    
    let topColor: number, bottomColor: number;
    
    switch (this.timeOfDay) {
      case 'dawn':
        topColor = 0xFF5E4D;
        bottomColor = 0x6F47EB;
        break;
      case 'day':
        topColor = 0x87CEEB;
        bottomColor = 0xFFFFFF;
        break;
      case 'dusk':
        topColor = 0xFF4500;
        bottomColor = 0x191970;
        break;
      case 'night':
      default:
        topColor = 0x191970;
        bottomColor = 0x000000;
        break;
    }
    
    // Create gradient effect with strips
    for (let i = 0; i < height; i += 10) {
      const ratio = i / height;
      const topRGB = Phaser.Display.Color.IntegerToRGB(topColor);
      const bottomRGB = Phaser.Display.Color.IntegerToRGB(bottomColor);
      const interpolatedColor = Phaser.Display.Color.Interpolate.RGBWithRGB(
        topRGB.r, topRGB.g, topRGB.b,
        bottomRGB.r, bottomRGB.g, bottomRGB.b,
        100,
        Math.floor(ratio * 100)
      );
      
      const alpha = (0.15 - 0.05 * ratio) * this.environmentIntensity;
      this.atmosphericOverlay.fillStyle(
        Phaser.Display.Color.GetColor32(interpolatedColor.r, interpolatedColor.g, interpolatedColor.b, 255), 
        alpha
      );
      this.atmosphericOverlay.fillRect(0, i, width, 10);
    }
  }

  private updateGradientBackground() {
    if (!this.gradientBackground) return;

    this.gradientBackground.clear();
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    // Dynamic gradient based on current height
    const heightRatio = Math.min(this.currentHeight / 5000, 1);
    
    const topColor = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.IntegerToColor(0x1a1a2e),
      Phaser.Display.Color.IntegerToColor(0x16213e),
      100,
      Math.floor(heightRatio * 100)
    );
    
    const bottomColor = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.IntegerToColor(0x0f0f23),
      Phaser.Display.Color.IntegerToColor(0x4c1d95),
      100,
      Math.floor(heightRatio * 100)
    );

    // Create gradient effect with strips
    for (let i = 0; i < height; i += 15) {
      const ratio = i / height;
      const interpolatedColor = Phaser.Display.Color.Interpolate.RGBWithRGB(
        topColor.r, topColor.g, topColor.b,
        bottomColor.r, bottomColor.g, bottomColor.b,
        100,
        Math.floor(ratio * 100)
      );
      
      this.gradientBackground.fillStyle(
        Phaser.Display.Color.GetColor32(interpolatedColor.r, interpolatedColor.g, interpolatedColor.b, 255)
      );
      this.gradientBackground.fillRect(0, i, width, 15);
    }
  }

  private initializeParticleSystems() {
    // Initialize floating particles
    for (let i = 0; i < 50; i++) {
      this.createFloatingParticle();
    }

    // Initialize cloud particles
    for (let i = 0; i < 15; i++) {
      this.createCloudParticle();
    }
  }

  private createFloatingParticle() {
    const types: Array<'star' | 'dust' | 'energy' | 'sparkle'> = ['star', 'dust', 'energy', 'sparkle'];
    const type = Phaser.Utils.Array.GetRandom(types);
    
    const x = Phaser.Math.Between(-100, this.scene.cameras.main.width + 100);
    const y = Phaser.Math.Between(-100, this.scene.cameras.main.height + 100);

    let sprite: Phaser.GameObjects.Shape;
    
    switch (type) {
      case 'star':
        sprite = this.scene.add.star(x, y, 5, 2, 4, 0xFFFFFF);
        break;
      case 'energy':
        sprite = this.scene.add.circle(x, y, 3, 0x6F47EB);
        break;
      case 'sparkle':
        sprite = this.scene.add.star(x, y, 4, 1, 2, 0x8B5CF6);
        break;
      default:
        sprite = this.scene.add.circle(x, y, 1.5, 0xFFFFFF);
    }

    sprite.setDepth(-850);
    sprite.setAlpha(Phaser.Math.FloatBetween(0.3, 0.8));
    sprite.setScale(Phaser.Math.FloatBetween(0.5, 1.5));
    sprite.setScrollFactor(Phaser.Math.FloatBetween(0.1, 0.3));

    const particle: FloatingParticle = {
      sprite,
      velocity: new Phaser.Math.Vector2(
        Phaser.Math.FloatBetween(-20, 20),
        Phaser.Math.FloatBetween(-30, -5)
      ),
      life: Phaser.Math.Between(5000, 15000),
      maxLife: Phaser.Math.Between(5000, 15000),
      type
    };

    this.floatingParticles.push(particle);
  }

  private createCloudParticle() {
    const graphics = this.scene.add.graphics();
    graphics.setDepth(-870);
    graphics.setScrollFactor(0.05);

    const cloud: CloudParticle = {
      graphics,
      x: Phaser.Math.Between(-200, this.scene.cameras.main.width + 200),
      y: Phaser.Math.Between(0, this.scene.cameras.main.height),
      scale: Phaser.Math.FloatBetween(0.5, 2.0),
      alpha: Phaser.Math.FloatBetween(0.1, 0.4),
      speed: Phaser.Math.FloatBetween(5, 20)
    };

    this.cloudParticles.push(cloud);
    this.updateCloudParticle(cloud);
  }

  private updateCloudParticle(cloud: CloudParticle) {
    cloud.graphics.clear();
    cloud.graphics.setAlpha(cloud.alpha);

    // Create cloud shape with multiple circles
    const numCircles = Phaser.Math.Between(8, 15);
    const baseRadius = 30 * cloud.scale;

    for (let i = 0; i < numCircles; i++) {
      const angle = (i / numCircles) * Math.PI * 2;
      const distance = Phaser.Math.Between(0, baseRadius * 0.7);
      const x = cloud.x + Math.cos(angle) * distance;
      const y = cloud.y + Math.sin(angle) * distance * 0.6;
      const radius = Phaser.Math.Between(baseRadius * 0.3, baseRadius);

      cloud.graphics.fillStyle(0x8B5CF6, 0.3);
      cloud.graphics.fillCircle(x, y, radius);
      
      cloud.graphics.fillStyle(0xFFFFFF, 0.1);
      cloud.graphics.fillCircle(x - radius * 0.3, y - radius * 0.3, radius * 0.7);
    }
  }

  private createAnimatedElements() {
    // Create energy rings
    for (let i = 0; i < 5; i++) {
      const ring = this.scene.add.graphics();
      ring.setDepth(-820);
      ring.setScrollFactor(0.2);
      this.energyRings.push(ring);
    }

    // Create light beams
    for (let i = 0; i < 8; i++) {
      const beam = this.scene.add.graphics();
      beam.setDepth(-830);
      beam.setScrollFactor(0.15);
      this.lightBeams.push(beam);
    }

    // Create aura bands
    for (let i = 0; i < 10; i++) {
      const band = this.scene.add.graphics();
      band.setDepth(-810);
      band.setScrollFactor(0.25);
      this.auraBands.push(band);
    }
  }

  private startEnvironmentUpdates() {
    this.scene.time.addEvent({
      delay: 100,
      callback: this.updateEnvironment,
      callbackScope: this,
      loop: true
    });
  }

  private updateEnvironment() {
    this.updateParallaxLayers();
    this.updateFloatingParticles();
    this.updateCloudParticles();
    this.updateAnimatedElements();
    this.updateEnvironmentState();
  }

  private updateParallaxLayers() {
    const cameraY = this.scene.cameras.main.scrollY;
    
    this.backgroundLayers.forEach((layer, index) => {
      layer.graphics.tilePositionY += layer.speed;
      layer.graphics.tilePositionX += layer.speed * 0.2;
      
      // Adjust layer based on camera movement
      layer.graphics.y = cameraY * (0.1 + index * 0.02);
    });
  }

  private updateFloatingParticles() {
    for (let i = this.floatingParticles.length - 1; i >= 0; i--) {
      const particle = this.floatingParticles[i];
      
      particle.life -= 100;
      if (particle.life <= 0) {
        particle.sprite.destroy();
        this.floatingParticles.splice(i, 1);
        this.createFloatingParticle(); // Replace with new particle
        continue;
      }

      // Update position
      particle.sprite.x += particle.velocity.x * 0.1;
      particle.sprite.y += particle.velocity.y * 0.1;

      // Update alpha based on life
      const lifeRatio = particle.life / particle.maxLife;
      particle.sprite.setAlpha(lifeRatio * 0.8);

      // Add subtle animation
      const time = this.scene.time.now;
      switch (particle.type) {
        case 'energy':
          particle.sprite.setScale(0.8 + Math.sin(time * 0.005) * 0.2);
          break;
        case 'sparkle':
          particle.sprite.setRotation(time * 0.002);
          break;
        case 'star':
          particle.sprite.setAlpha(lifeRatio * (0.5 + Math.sin(time * 0.01) * 0.3));
          break;
      }

      // Wrap around screen
      if (particle.sprite.x < -100) particle.sprite.x = this.scene.cameras.main.width + 100;
      if (particle.sprite.x > this.scene.cameras.main.width + 100) particle.sprite.x = -100;
      if (particle.sprite.y < -100) particle.sprite.y = this.scene.cameras.main.height + 100;
    }
  }

  private updateCloudParticles() {
    this.cloudParticles.forEach(cloud => {
      cloud.x += cloud.speed * 0.1;
      
      // Wrap around
      if (cloud.x > this.scene.cameras.main.width + 200) {
        cloud.x = -200;
        cloud.y = Phaser.Math.Between(0, this.scene.cameras.main.height);
      }

      // Subtle vertical floating
      cloud.y += Math.sin(this.scene.time.now * 0.001 + cloud.x * 0.01) * 0.5;
      
      this.updateCloudParticle(cloud);
    });
  }

  private updateAnimatedElements() {
    const time = this.scene.time.now;
    const cameraY = this.scene.cameras.main.scrollY;

    // Update energy rings
    this.energyRings.forEach((ring, index) => {
      ring.clear();
      
      const x = (index * 200) + Math.sin(time * 0.001 + index) * 100;
      const y = cameraY + (index * 150) + Math.cos(time * 0.002 + index) * 80;
      const radius = 40 + Math.sin(time * 0.003 + index) * 20;
      
      ring.lineStyle(3, 0x6F47EB, 0.4 + Math.sin(time * 0.004 + index) * 0.2);
      ring.strokeCircle(x, y, radius);
      
      ring.lineStyle(1, 0x8B5CF6, 0.6);
      ring.strokeCircle(x, y, radius * 0.7);
    });

    // Update light beams
    this.lightBeams.forEach((beam, index) => {
      beam.clear();
      
      const x = (index * 100) + Math.sin(time * 0.0008 + index) * 50;
      const y1 = cameraY - 100;
      const y2 = cameraY + this.scene.cameras.main.height + 100;
      const width = 2 + Math.sin(time * 0.005 + index) * 1;
      
      beam.lineStyle(width, 0x6F47EB, 0.2 + Math.sin(time * 0.006 + index) * 0.1);
      beam.moveTo(x, y1);
      beam.lineTo(x + Math.sin(time * 0.003 + index) * 30, y2);
      beam.strokePath();
    });

    // Update aura bands
    this.auraBands.forEach((band, index) => {
      band.clear();
      
      const y = cameraY + (index * 80) + Math.sin(time * 0.002 + index) * 40;
      const alpha = 0.15 + Math.sin(time * 0.004 + index) * 0.1;
      
      band.fillStyle(0x8B5CF6, alpha);
      band.fillEllipse(this.scene.cameras.main.width / 2, y, 
        this.scene.cameras.main.width * 1.5, 
        20 + Math.sin(time * 0.003 + index) * 10);
    });
  }

  private updateEnvironmentState() {
    // Update current height based on camera
    this.currentHeight = Math.abs(this.scene.cameras.main.scrollY);
    
    // Update time of day based on height
    if (this.currentHeight < 1000) {
      this.timeOfDay = 'dawn';
    } else if (this.currentHeight < 2500) {
      this.timeOfDay = 'day';
    } else if (this.currentHeight < 4000) {
      this.timeOfDay = 'dusk';
    } else {
      this.timeOfDay = 'night';
    }

    // Update environment intensity
    this.environmentIntensity = 0.3 + (this.currentHeight / 5000) * 0.7;

    // Update gradient background periodically
    if (this.scene.time.now % 2000 < 100) {
      this.updateGradientBackground();
      this.updateAtmosphericOverlay();
    }
  }

  // Public methods for external control
  setIntensity(intensity: number) {
    this.environmentIntensity = Phaser.Math.Clamp(intensity, 0, 1);
  }

  createEnvironmentPulse(x: number, y: number, color: number = 0x6F47EB) {
    const pulseRings = [];
    
    for (let i = 0; i < 3; i++) {
      const ring = this.scene.add.graphics();
      ring.setDepth(-820);
      pulseRings.push(ring);
      
      this.scene.tweens.add({
        targets: { radius: 0 },
        radius: 150 + (i * 50),
        duration: 1000 + (i * 200),
        ease: 'Power2.easeOut',
        onUpdate: (tween) => {
          const radius = (tween.targets[0] as any).radius;
          const alpha = 0.6 - (radius / 200) * 0.6;
          
          ring.clear();
          ring.lineStyle(4 - i, color, alpha);
          ring.strokeCircle(x, y, radius);
        },
        onComplete: () => {
          ring.destroy();
        }
      });
    }
  }

  destroy() {
    this.backgroundLayers.forEach(layer => layer.graphics.destroy());
    this.floatingParticles.forEach(particle => particle.sprite.destroy());
    this.cloudParticles.forEach(cloud => cloud.graphics.destroy());
    this.energyRings.forEach(ring => ring.destroy());
    this.lightBeams.forEach(beam => beam.destroy());
    this.auraBands.forEach(band => band.destroy());
    
    if (this.atmosphericOverlay) this.atmosphericOverlay.destroy();
    if (this.gradientBackground) this.gradientBackground.destroy();
  }
}