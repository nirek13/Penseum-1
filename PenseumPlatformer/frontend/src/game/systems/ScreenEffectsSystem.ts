import Phaser from 'phaser';
import MainGameScene from '../scenes/MainGameScene';

interface ScreenTransition {
  id: string;
  graphics: Phaser.GameObjects.Graphics;
  tween?: Phaser.Tweens.Tween;
  duration: number;
  startTime: number;
}

interface ChromaticAberration {
  redLayer: Phaser.GameObjects.Rectangle;
  blueLayer: Phaser.GameObjects.Rectangle;
  active: boolean;
  intensity: number;
}

export default class ScreenEffectsSystem {
  private scene: MainGameScene;
  private transitions: Map<string, ScreenTransition> = new Map();
  private chromaticAberration?: ChromaticAberration;
  private vignetteGraphics?: Phaser.GameObjects.Graphics;
  private screenOverlay?: Phaser.GameObjects.Rectangle;
  private pulseOverlay?: Phaser.GameObjects.Rectangle;
  
  // Effect pools for performance
  private ripplePool: Phaser.GameObjects.Graphics[] = [];
  private energyWavePool: Phaser.GameObjects.Graphics[] = [];

  constructor(scene: MainGameScene) {
    this.scene = scene;
    this.initializeEffects();
  }

  private initializeEffects() {
    this.createVignette();
    this.createChromaticAberration();
    this.createScreenOverlay();
    this.initializeEffectPools();
  }

  private createVignette() {
    this.vignetteGraphics = this.scene.add.graphics();
    this.vignetteGraphics.setDepth(9998);
    this.vignetteGraphics.setScrollFactor(0);
    this.vignetteGraphics.setAlpha(0.3);
    
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    
    // Create radial gradient vignette effect
    for (let i = 0; i < 50; i++) {
      const alpha = (i / 50) * 0.6;
      const radius = Math.min(width, height) * 0.6 + (i * 8);
      this.vignetteGraphics.lineStyle(16, 0x000000, alpha);
      this.vignetteGraphics.strokeCircle(width / 2, height / 2, radius);
    }
  }

  private createChromaticAberration() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    this.chromaticAberration = {
      redLayer: this.scene.add.rectangle(0, 0, width, height, 0xFF0000, 0.05),
      blueLayer: this.scene.add.rectangle(0, 0, width, height, 0x0000FF, 0.05),
      active: false,
      intensity: 0
    };

    this.chromaticAberration.redLayer.setOrigin(0, 0);
    this.chromaticAberration.blueLayer.setOrigin(0, 0);
    this.chromaticAberration.redLayer.setDepth(9995);
    this.chromaticAberration.blueLayer.setDepth(9995);
    this.chromaticAberration.redLayer.setScrollFactor(0);
    this.chromaticAberration.blueLayer.setScrollFactor(0);
    this.chromaticAberration.redLayer.setBlendMode(Phaser.BlendModes.SCREEN);
    this.chromaticAberration.blueLayer.setBlendMode(Phaser.BlendModes.SCREEN);
    this.chromaticAberration.redLayer.setVisible(false);
    this.chromaticAberration.blueLayer.setVisible(false);
  }

  private createScreenOverlay() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    this.screenOverlay = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0);
    this.screenOverlay.setOrigin(0, 0);
    this.screenOverlay.setDepth(9999);
    this.screenOverlay.setScrollFactor(0);

    this.pulseOverlay = this.scene.add.rectangle(0, 0, width, height, 0x6F47EB, 0);
    this.pulseOverlay.setOrigin(0, 0);
    this.pulseOverlay.setDepth(9997);
    this.pulseOverlay.setScrollFactor(0);
    this.pulseOverlay.setBlendMode(Phaser.BlendModes.ADD);
  }

  private initializeEffectPools() {
    // Initialize ripple pool
    for (let i = 0; i < 10; i++) {
      const ripple = this.scene.add.graphics();
      ripple.setDepth(9996);
      ripple.setVisible(false);
      this.ripplePool.push(ripple);
    }

    // Initialize energy wave pool
    for (let i = 0; i < 15; i++) {
      const wave = this.scene.add.graphics();
      wave.setDepth(9996);
      wave.setVisible(false);
      this.energyWavePool.push(wave);
    }
  }

  // Enhanced screen shake with different patterns
  enhancedShake(duration: number = 500, intensity: number = 0.02, pattern: 'normal' | 'horizontal' | 'vertical' | 'circular' = 'normal') {
    switch (pattern) {
      case 'horizontal':
        this.scene.cameras.main.shake(duration, new Phaser.Math.Vector2(intensity, 0));
        break;
      case 'vertical':
        this.scene.cameras.main.shake(duration, new Phaser.Math.Vector2(0, intensity));
        break;
      case 'circular':
        // Circular shake pattern
        let angle = 0;
        const shakeTimer = this.scene.time.addEvent({
          delay: 16,
          repeat: duration / 16,
          callback: () => {
            const x = Math.cos(angle) * intensity * 100;
            const y = Math.sin(angle) * intensity * 100;
            this.scene.cameras.main.setScroll(x, y);
            angle += 0.3;
          },
          callbackScope: this
        });
        
        this.scene.time.delayedCall(duration, () => {
          this.scene.cameras.main.setScroll(0, 0);
        });
        break;
      default:
        this.scene.cameras.main.shake(duration, intensity);
    }
  }

  // Advanced screen flash with custom colors and patterns
  enhancedFlash(duration: number = 200, color: number = 0xFFFFFF, intensity: number = 0.8, pattern: 'fade' | 'pulse' | 'strobe' = 'fade') {
    if (!this.screenOverlay) return;

    this.screenOverlay.setFillStyle(color, intensity);

    switch (pattern) {
      case 'pulse':
        this.scene.tweens.add({
          targets: this.screenOverlay,
          alpha: intensity,
          duration: duration * 0.3,
          ease: 'Power2.easeOut',
          yoyo: true,
          repeat: 1,
          onComplete: () => {
            this.screenOverlay!.setAlpha(0);
          }
        });
        break;
      case 'strobe':
        let strobes = 0;
        const strobeTimer = this.scene.time.addEvent({
          delay: 50,
          repeat: duration / 50,
          callback: () => {
            this.screenOverlay!.setAlpha(strobes % 2 === 0 ? intensity : 0);
            strobes++;
          },
          callbackScope: this
        });
        
        this.scene.time.delayedCall(duration, () => {
          this.screenOverlay!.setAlpha(0);
        });
        break;
      default:
        this.scene.cameras.main.flash(duration, 
          (color >> 16) & 0xFF, 
          (color >> 8) & 0xFF, 
          color & 0xFF, 
          false, 
          undefined, 
          intensity
        );
    }
  }

  // Screen transition effects
  fadeToBlack(duration: number = 500, callback?: () => void) {
    if (!this.screenOverlay) return;

    this.screenOverlay.setAlpha(0);
    this.screenOverlay.setFillStyle(0x000000, 1);

    this.scene.tweens.add({
      targets: this.screenOverlay,
      alpha: 1,
      duration: duration,
      ease: 'Power2.easeInOut',
      onComplete: callback
    });
  }

  fadeFromBlack(duration: number = 500, callback?: () => void) {
    if (!this.screenOverlay) return;

    this.screenOverlay.setAlpha(1);
    this.screenOverlay.setFillStyle(0x000000, 1);

    this.scene.tweens.add({
      targets: this.screenOverlay,
      alpha: 0,
      duration: duration,
      ease: 'Power2.easeInOut',
      onComplete: callback
    });
  }

  // Chromatic aberration effect
  activateChromaticAberration(intensity: number = 3, duration: number = 1000) {
    if (!this.chromaticAberration) return;

    this.chromaticAberration.active = true;
    this.chromaticAberration.intensity = intensity;
    this.chromaticAberration.redLayer.setVisible(true);
    this.chromaticAberration.blueLayer.setVisible(true);

    // Animate the aberration effect
    this.scene.tweens.add({
      targets: { offset: 0 },
      offset: intensity,
      duration: duration * 0.3,
      ease: 'Power2.easeOut',
      yoyo: true,
      repeat: 0,
      onUpdate: (tween) => {
        if (!this.chromaticAberration) return;
        const offset = (tween.targets[0] as any).offset;
        this.chromaticAberration.redLayer.setPosition(-offset, 0);
        this.chromaticAberration.blueLayer.setPosition(offset, 0);
      },
      onComplete: () => {
        if (!this.chromaticAberration) return;
        this.chromaticAberration.active = false;
        this.chromaticAberration.redLayer.setVisible(false);
        this.chromaticAberration.blueLayer.setVisible(false);
      }
    });
  }

  // Screen ripple effect
  createRipple(x: number, y: number, maxRadius: number = 200, color: number = 0x6F47EB) {
    const ripple = this.getRippleFromPool();
    if (!ripple) return;

    ripple.clear();
    ripple.setVisible(true);
    ripple.setAlpha(0.8);

    this.scene.tweens.add({
      targets: { radius: 0 },
      radius: maxRadius,
      duration: 800,
      ease: 'Power2.easeOut',
      onUpdate: (tween) => {
        const radius = (tween.targets[0] as any).radius;
        const alpha = 0.8 - (radius / maxRadius) * 0.8;
        
        ripple.clear();
        ripple.lineStyle(4, color, alpha);
        ripple.strokeCircle(x, y, radius);
        
        if (radius > maxRadius * 0.3) {
          ripple.lineStyle(2, 0xFFFFFF, alpha * 0.6);
          ripple.strokeCircle(x, y, radius - 10);
        }
      },
      onComplete: () => {
        this.returnRippleToPool(ripple);
      }
    });
  }

  // Energy wave effect
  createEnergyWave(x: number, y: number, direction: number = 0, length: number = 300) {
    const wave = this.getEnergyWaveFromPool();
    if (!wave) return;

    wave.clear();
    wave.setVisible(true);
    wave.setAlpha(1);

    this.scene.tweens.add({
      targets: { progress: 0 },
      progress: 1,
      duration: 600,
      ease: 'Power2.easeOut',
      onUpdate: (tween) => {
        const progress = (tween.targets[0] as any).progress;
        const alpha = 1 - progress;
        
        wave.clear();
        
        // Main energy beam
        wave.lineStyle(8, 0x6F47EB, alpha);
        const endX = x + Math.cos(direction) * length * progress;
        const endY = y + Math.sin(direction) * length * progress;
        wave.moveTo(x, y);
        wave.lineTo(endX, endY);
        wave.strokePath();
        
        // Energy trail
        wave.lineStyle(4, 0x8B5CF6, alpha * 0.8);
        wave.moveTo(x, y);
        wave.lineTo(endX, endY);
        wave.strokePath();
        
        // Core beam
        wave.lineStyle(2, 0xFFFFFF, alpha);
        wave.moveTo(x, y);
        wave.lineTo(endX, endY);
        wave.strokePath();
      },
      onComplete: () => {
        this.returnEnergyWaveToPool(wave);
      }
    });
  }

  // Screen pulse effect
  screenPulse(color: number = 0x6F47EB, intensity: number = 0.15, duration: number = 300) {
    if (!this.pulseOverlay) return;

    this.pulseOverlay.setFillStyle(color, 0);

    this.scene.tweens.add({
      targets: this.pulseOverlay,
      alpha: intensity,
      duration: duration * 0.5,
      ease: 'Power2.easeOut',
      yoyo: true,
      onComplete: () => {
        this.pulseOverlay!.setAlpha(0);
      }
    });
  }

  // Vignette intensity control
  setVignetteIntensity(intensity: number) {
    if (this.vignetteGraphics) {
      this.vignetteGraphics.setAlpha(Math.max(0, Math.min(1, intensity)));
    }
  }

  // Screen glitch effect
  screenGlitch(duration: number = 500, intensity: number = 10) {
    const glitchOverlay = this.scene.add.graphics();
    glitchOverlay.setDepth(9998);
    glitchOverlay.setScrollFactor(0);

    const glitchEvent = this.scene.time.addEvent({
      delay: 50,
      repeat: duration / 50,
      callback: () => {
        // Random glitch bars
        glitchOverlay.clear();
        for (let i = 0; i < intensity; i++) {
          const y = Phaser.Math.Between(0, this.scene.cameras.main.height);
          const height = Phaser.Math.Between(2, 20);
          const color = Phaser.Math.RND.pick([0xFF0000, 0x00FF00, 0x0000FF, 0xFFFFFF]);
          
          glitchOverlay.fillStyle(color, 0.8);
          glitchOverlay.fillRect(0, y, this.scene.cameras.main.width, height);
        }
        
        // Random chromatic shift
        if (this.chromaticAberration) {
          const offset = Phaser.Math.Between(-5, 5);
          this.chromaticAberration.redLayer.setPosition(-offset, 0);
          this.chromaticAberration.blueLayer.setPosition(offset, 0);
          this.chromaticAberration.redLayer.setVisible(true);
          this.chromaticAberration.blueLayer.setVisible(true);
        }
      },
      callbackScope: this
    });
    
    this.scene.time.delayedCall(duration, () => {
      glitchOverlay.destroy();
      if (this.chromaticAberration) {
        this.chromaticAberration.redLayer.setVisible(false);
        this.chromaticAberration.blueLayer.setVisible(false);
      }
    });
  }

  // Pool management
  private getRippleFromPool(): Phaser.GameObjects.Graphics | null {
    for (const ripple of this.ripplePool) {
      if (!ripple.visible) {
        return ripple;
      }
    }
    return null;
  }

  private returnRippleToPool(ripple: Phaser.GameObjects.Graphics) {
    ripple.setVisible(false);
    ripple.clear();
  }

  private getEnergyWaveFromPool(): Phaser.GameObjects.Graphics | null {
    for (const wave of this.energyWavePool) {
      if (!wave.visible) {
        return wave;
      }
    }
    return null;
  }

  private returnEnergyWaveToPool(wave: Phaser.GameObjects.Graphics) {
    wave.setVisible(false);
    wave.clear();
  }

  // Cleanup
  destroy() {
    this.transitions.clear();
    this.ripplePool.forEach(ripple => ripple.destroy());
    this.energyWavePool.forEach(wave => wave.destroy());
    
    if (this.vignetteGraphics) this.vignetteGraphics.destroy();
    if (this.chromaticAberration) {
      this.chromaticAberration.redLayer.destroy();
      this.chromaticAberration.blueLayer.destroy();
    }
    if (this.screenOverlay) this.screenOverlay.destroy();
    if (this.pulseOverlay) this.pulseOverlay.destroy();
  }
}