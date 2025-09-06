import Phaser from 'phaser';
import { Question, Platform } from '../../types/GameTypes';
import MainGameScene from '../scenes/MainGameScene';
import { GameConfig } from '../config/GameConfig';

export default class PlatformSystem {
  private scene: MainGameScene;
  private platforms: Phaser.Physics.Arcade.StaticGroup;
  private movingPlatforms: Phaser.Physics.Arcade.Group; // New group for dynamic platforms
  private platformData: Platform[] = [];
  private answerTexts: Phaser.GameObjects.Text[] = [];
  private questionText?: Phaser.GameObjects.Text;
  private questionBackground?: Phaser.GameObjects.Rectangle;

  constructor(scene: MainGameScene) {
    this.scene = scene;
    this.platforms = scene.physics.add.staticGroup();
    this.movingPlatforms = scene.physics.add.group(); // Initialize the new group
    this.setupCollisions();
  }

  private setupCollisions() {
    // This will be called after the player is created
  }

  setupPlayerCollision(playerSprite: Phaser.Physics.Arcade.Sprite) {
    // Set up basic collision first (this makes player bounce off platforms)
    this.scene.physics.add.collider(playerSprite, this.platforms);
    this.scene.physics.add.collider(playerSprite, this.movingPlatforms); // New collider for moving platforms
    
    // Set up overlap detection for answer handling
    this.scene.physics.add.overlap(playerSprite, this.platforms, (player, platform) => {
      // Only handle answer logic for question platforms (ones with platformInfo)
      const platformSprite = platform as Phaser.Physics.Arcade.Sprite;
      const platformInfo = platformSprite.getData('platformInfo');
      if (platformInfo) {
        this.handlePlatformCollision(player as Phaser.Physics.Arcade.Sprite, platformSprite);
      }
    });
  }

  createPlatformsForQuestion(question: Question) {
    this.clearPlatforms();
    this.clearQuestion();
    
    this.createQuestionDisplay(question);
    
    const platformWidth = 150;
    const platformHeight = 40;
    const spacing = (this.scene.cameras.main.width - (platformWidth * 4)) / 5;
    const baseY = this.scene.cameras.main.height - 200;
    
    this.platformData = [];
    
    question.answers.forEach((answer, index) => {
      const x = spacing + index * (platformWidth + spacing);
      const y = baseY + Phaser.Math.Between(-50, 50);
      
      const isCorrect = answer === question.correct;
      const platformTexture = isCorrect ? 'platform-correct' : 'platform-incorrect';
      
      const platform = this.scene.physics.add.staticSprite(x, y, platformTexture);
      platform.setOrigin(0, 0);
      platform.setScale(1);
      
      // Ensure the physics body matches the platform size
      platform.body?.setSize(platformWidth, platformHeight);
      platform.body?.setOffset(0, 0);
      
      this.platforms.add(platform);
      
      const platformInfo: Platform = {
        x,
        y,
        width: platformWidth,
        height: platformHeight,
        answer,
        isCorrect,
        color: isCorrect ? '#7C3AED' : '#000000', // Penseum colors
        id: `platform-${index}`
      };
      
      this.platformData.push(platformInfo);
      
      const answerText = this.scene.add.text(
        x + platformWidth / 2,
        y + platformHeight / 2,
        answer,
        {
          fontSize: '14px',
          color: '#ffffff', // White text on colored platforms
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: platformWidth - 20 }
        }
      ).setOrigin(0.5);
      
      this.answerTexts.push(answerText);
      
      platform.setData('platformInfo', platformInfo);
      
      // Animate platform appearance
      this.scene.tweens.add({
        targets: platform,
        y: y,
        duration: 500 + index * 100,
        ease: 'Bounce.easeOut',
        delay: index * 100
      });
      
      this.scene.tweens.add({
        targets: answerText,
        y: y + platformHeight / 2,
        alpha: 1,
        duration: 500 + index * 100,
        ease: 'Power2.easeOut',
        delay: index * 100
      });
      
      // Pulse correct answer
      if (isCorrect) {
        this.scene.tweens.add({
          targets: platform,
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 1000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    });
  }

  private createQuestionDisplay(question: Question) {
    const padding = 20;
    const maxWidth = this.scene.cameras.main.width - padding * 2;
    
    this.questionBackground = this.scene.add.rectangle(
      this.scene.cameras.main.width / 2,
      60,
      maxWidth,
      80,
      0xFFFFFF,
      1
    );
    this.questionBackground.setStrokeStyle(2, 0x7C3AED, 1);
    
    this.questionText = this.scene.add.text(
      this.scene.cameras.main.width / 2,
      60,
      question.question,
      {
        fontSize: '18px',
        color: '#000000',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: maxWidth - 40 }
      }
    ).setOrigin(0.5);
    
    const difficultyColor = this.getDifficultyColor(question.difficulty);
    const difficultyBadge = this.scene.add.rectangle(
      this.scene.cameras.main.width - 80,
      30,
      120,
      25,
      difficultyColor,
      0.8
    );
    
    const difficultyText = this.scene.add.text(
      this.scene.cameras.main.width - 80,
      30,
      question.difficulty.toUpperCase(),
      {
        fontSize: '12px',
        color: '#ffffff',
        fontFamily: 'Arial',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);
    
    const pointsText = this.scene.add.text(
      80,
      30,
      `${question.points} pts`,
      {
        fontSize: '14px',
        color: '#ffd93d',
        fontFamily: 'Arial',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);
    
    // Animate question appearance
    this.scene.tweens.add({
      targets: [this.questionBackground, this.questionText, difficultyBadge, difficultyText, pointsText],
      alpha: 1,
      y: '+=10',
      duration: 800,
      ease: 'Back.easeOut'
    });
  }

  private getDifficultyColor(difficulty: string): number {
    switch (difficulty) {
      case 'easy': return 0x7C3AED;     // Penseum purple for easy
      case 'medium': return 0x000000;   // Black for medium  
      case 'hard': return 0x4B5563;     // Gray for hard
      default: return 0x6B7280;         // Default gray
    }
  }

  private handlePlatformCollision(player: Phaser.Physics.Arcade.Sprite, platform: Phaser.Physics.Arcade.Sprite) {
    const platformInfo = platform.getData('platformInfo') as Platform;
    
    if (platformInfo) {
      this.animatePlatformSelection(platform);
      
      // Emit event to game scene
      this.scene.events.emit('answer-selected', {
        platform: platformInfo,
        isCorrect: platformInfo.isCorrect
      });
      
      // Clear platforms after a delay
      this.scene.time.delayedCall(1000, () => {
        this.clearPlatforms();
      });
    }
  }

  private animatePlatformSelection(platform: Phaser.Physics.Arcade.Sprite) {
    const platformInfo = platform.getData('platformInfo') as Platform;
    
    if (platformInfo.isCorrect) {
      platform.setTint(0x00ff00);
      this.scene.tweens.add({
        targets: platform,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 200,
        yoyo: true,
        repeat: 2,
        ease: 'Back.easeOut'
      });
    } else {
      platform.setTint(0xff0000);
      this.scene.tweens.add({
        targets: platform,
        rotation: 0.1,
        duration: 100,
        yoyo: true,
        repeat: 3,
        ease: 'Power2.easeInOut'
      });
    }
    
    // Fade out all platforms
    this.scene.tweens.add({
      targets: platform,
      alpha: 0.3,
      duration: 1000,
      ease: 'Power2.easeOut'
    });
  }

  private clearPlatforms() {
    this.platforms.clear(true, true);
    this.movingPlatforms.clear(true, true); // Clear moving platforms as well
    this.platformData = [];
    
    this.answerTexts.forEach(text => text.destroy());
    this.answerTexts = [];
  }

  private clearQuestion() {
    if (this.questionText) {
      this.questionText.destroy();
      this.questionText = undefined;
    }
    
    if (this.questionBackground) {
      this.questionBackground.destroy();
      this.questionBackground = undefined;
    }
  }

  update(time: number, delta: number) {
    // Animate incorrect platforms with subtle movement
    this.platforms.children.entries.forEach((platform, index) => {
      const sprite = platform as Phaser.Physics.Arcade.Sprite;
      const platformInfo = sprite.getData('platformInfo') as Platform;
      
      if (platformInfo && !platformInfo.isCorrect) {
        const oscillation = Math.sin(time * 0.002 + index) * 2;
        sprite.y = platformInfo.y + oscillation;
        
        // Update corresponding text position
        if (this.answerTexts[index]) {
          this.answerTexts[index].y = platformInfo.y + platformInfo.height / 2 + oscillation;
        }
      }
    });

    // Update moving platforms
    this.movingPlatforms.children.entries.forEach(platform => {
      const sprite = platform as Phaser.Physics.Arcade.Sprite;
      const moveData = sprite.getData('moveData');
      if (moveData) {
        // Calculate smooth oscillation
        const t = Math.sin(this.scene.time.now * moveData.speed) * 0.5 + 0.5;
        sprite.x = Phaser.Math.Linear(moveData.startX, moveData.endX, t);
      }
    });
  }

  getPlatforms() {
    return this.platforms;
  }

  getPlatformData() {
    return this.platformData;
  }

  createInitialPlatforms() {
    const screenWidth = this.scene.cameras.main.width;
    const screenHeight = this.scene.cameras.main.height;
    
    // Create a large, stable starting platform for player (ground level)
    const startPlatformWidth = 400;
    this.createPlatform(
      screenWidth / 2 - startPlatformWidth / 2,
      screenHeight - 60,
      startPlatformWidth,
      50,
      'platform-neutral'
    );
    
    // Create guaranteed reachable climbing path using GameConfig
    this.createInitialClimbingPath(screenWidth, screenHeight);
    
    // Add some intermediate platforms for alternative routes
    this.createInitialHelperPlatforms(screenWidth, screenHeight);
  }
  
  private createInitialClimbingPath(screenWidth: number, screenHeight: number) {
    const startingPlatform = {
      x: screenWidth / 2 - 200,
      y: screenHeight - 60,
      width: 400
    };
    
    let lastX = startingPlatform.x + startingPlatform.width / 2;
    let lastY = startingPlatform.y;
    let lastWidth = startingPlatform.width;
    
    // Create 6 guaranteed climbing platforms
    for (let i = 0; i < 6; i++) {
      const width = Phaser.Math.Between(GameConfig.MIN_PLATFORM_WIDTH, GameConfig.MAX_PLATFORM_WIDTH);
      
      // Find next reachable position
      const nextPosition = this.findNextReachablePosition(lastX, lastY, lastWidth, width, screenWidth);
      
      if (nextPosition) {
        this.createPlatform(nextPosition.x, nextPosition.y, width, GameConfig.PLATFORM_HEIGHT, 'platform-neutral');
        lastX = nextPosition.x;
        lastY = nextPosition.y;
        lastWidth = width;
      } else {
        // Fallback positioning for initial platforms
        const fallbackX = screenWidth * (0.2 + (i % 2) * 0.6) - width / 2;
        const fallbackY = screenHeight - 160 - (i * GameConfig.getOptimalVerticalGap());
        
        this.createPlatform(fallbackX, fallbackY, width, GameConfig.PLATFORM_HEIGHT, 'platform-neutral');
        lastX = fallbackX;
        lastY = fallbackY;
        lastWidth = width;
      }
    }
  }
  
  private createInitialHelperPlatforms(screenWidth: number, screenHeight: number) {
    // Add 2-3 helper platforms for alternative routes
    const helperPlatforms = [
      { x: screenWidth * 0.5, y: screenHeight - 200 },
      { x: screenWidth * 0.45, y: screenHeight - 380 },
      { x: screenWidth * 0.15, y: screenHeight - 300 }
    ];
    
    helperPlatforms.forEach(platform => {
      const width = Phaser.Math.Between(GameConfig.MIN_PLATFORM_WIDTH, GameConfig.MIN_PLATFORM_WIDTH + 30);
      this.createPlatform(platform.x - width / 2, platform.y, width, GameConfig.PLATFORM_HEIGHT, 'platform-neutral');
    });
  }
  
  // Refactored to handle both static and moving platforms
  private createPlatform(x: number, y: number, width: number, height: number, texture: string) {
    let platform;
    const isMoving = texture === 'platform-moving';

    if (isMoving) {
        platform = this.scene.physics.add.sprite(x, y, texture);
        this.movingPlatforms.add(platform);
        platform.body?.setAllowGravity(false);
        platform.body?.setImmovable(true);
        platform.body?.setSize(width, height);
        this.setupMovingPlatform(platform);
    } else {
        platform = this.scene.physics.add.staticSprite(x, y, texture);
        this.platforms.add(platform);
        platform.body?.setSize(width, height);
    }

    platform.setOrigin(0, 0);
    platform.setScale(width / 150, height / 40); // Scale based on original texture size
    platform.refreshBody();
    platform.body?.setOffset(0, 0);
    
    // Setup special platform behaviors
    if (texture === 'platform-breaking') {
      this.setupBreakingPlatform(platform);
    } else if (texture === 'platform-trampoline') {
      this.setupTrampolinePlatform(platform);
    }
    
    // Animate platform appearance
    platform.setAlpha(0);
    this.scene.tweens.add({
      targets: platform,
      alpha: 1,
      duration: 800,
      ease: 'Power2.easeOut'
    });
  }
  
  generateProceduralPlatforms(playerY: number) {
    // Generate platforms above the player when they climb high
    const screenWidth = this.scene.cameras.main.width;
    const screenHeight = this.scene.cameras.main.height;
    const generateY = playerY - screenHeight;
    
    // Use GameConfig for physics calculations
    const jumpPhysics = GameConfig.getJumpPhysicsInfo();
    console.log('Jump Physics:', jumpPhysics);
    
    // Create guaranteed reachable path with physics validation
    this.generateGuaranteedPath(screenWidth, generateY);
    
    // Add alternative route platforms for variety
    this.generateAlternativeRoutes(screenWidth, generateY);
  }
  
  private generateGuaranteedPath(screenWidth: number, startY: number) {
    const numPlatforms = Phaser.Math.Between(5, 8);
    let lastPlatformX = screenWidth / 2;
    let lastPlatformY = startY;
    let lastPlatformWidth = GameConfig.MIN_PLATFORM_WIDTH;
    
    for (let i = 0; i < numPlatforms; i++) {
      const width = Phaser.Math.Between(GameConfig.MIN_PLATFORM_WIDTH, GameConfig.MAX_PLATFORM_WIDTH);
      
      // Find a reachable position for the next platform
      const nextPosition = this.findNextReachablePosition(
        lastPlatformX,
        lastPlatformY,
        lastPlatformWidth,
        width,
        screenWidth
      );
      
      if (nextPosition) {
        // Randomly choose platform type for procedural platforms
        const platformType = this.getRandomPlatformType();
        this.createPlatform(nextPosition.x, nextPosition.y, width, GameConfig.PLATFORM_HEIGHT, platformType);
        
        // Update for next iteration
        lastPlatformX = nextPosition.x;
        lastPlatformY = nextPosition.y;
        lastPlatformWidth = width;
        
        // Add debug visualization
        this.debugPlatformConnection(
          lastPlatformX + lastPlatformWidth / 2,
          lastPlatformY,
          nextPosition.x + width / 2,
          nextPosition.y
        );
      } else {
        // Fallback to safe position if no reachable position found
        console.warn('Could not find reachable position, using fallback');
        const fallbackX = Math.max(GameConfig.MIN_PLATFORM_EDGE_DISTANCE, 
          Math.min(screenWidth - width - GameConfig.MIN_PLATFORM_EDGE_DISTANCE, lastPlatformX));
        const fallbackY = lastPlatformY - GameConfig.getOptimalVerticalGap();
        
        this.createPlatform(fallbackX, fallbackY, width, GameConfig.PLATFORM_HEIGHT, 'platform-neutral');
        
        lastPlatformX = fallbackX;
        lastPlatformY = fallbackY;
        lastPlatformWidth = width;
      }
    }
  }
  
  private generateAlternativeRoutes(screenWidth: number, startY: number) {
    const numHelperPlatforms = Phaser.Math.Between(2, 4);
    
    for (let i = 0; i < numHelperPlatforms; i++) {
      const x = Phaser.Math.Between(
        GameConfig.MIN_PLATFORM_EDGE_DISTANCE, 
        screenWidth - GameConfig.MAX_PLATFORM_WIDTH - GameConfig.MIN_PLATFORM_EDGE_DISTANCE
      );
      const y = startY - Phaser.Math.Between(100, GameConfig.getSafeJumpHeight() * 2);
      const width = Phaser.Math.Between(GameConfig.MIN_PLATFORM_WIDTH, GameConfig.MAX_PLATFORM_WIDTH);
      
      // Only create if it doesn't interfere with guaranteed path
      if (this.isPositionValidForHelper(x, y, width)) {
        this.createPlatform(x, y, width, GameConfig.PLATFORM_HEIGHT, 'platform-neutral');
      }
    }
  }
  
private findNextReachablePosition(
  fromX: number, fromY: number, fromWidth: number, toWidth: number, screenWidth: number
): {x: number, y: number} | null {
  const attempts = 20;
  const optimalVerticalGap = GameConfig.getOptimalVerticalGap();
const MIN_HORIZONTAL_SPACING = 50; // pixels
const MIN_VERTICAL_SPACING = 40;   // pixels

  for (let attempt = 0; attempt < attempts; attempt++) {
    const verticalGap = Phaser.Math.Between(
      Math.max(MIN_VERTICAL_SPACING, optimalVerticalGap - 30),
      GameConfig.getSafeJumpHeight() - GameConfig.PLATFORM_SAFETY_MARGIN
    );

    const targetY = fromY - verticalGap;

    const safeHorizontalDistance = GameConfig.getSafeHorizontalDistance();
    const minX = Math.max(
      GameConfig.MIN_PLATFORM_EDGE_DISTANCE, 
      fromX - safeHorizontalDistance
    );
    const maxX = Math.min(
      screenWidth - toWidth - GameConfig.MIN_PLATFORM_EDGE_DISTANCE, 
      fromX + fromWidth + safeHorizontalDistance
    );

    if (minX < maxX) {
      const targetX = Phaser.Math.Between(minX, maxX);

      // New overcrowding check
      const tooClose = this.platformData.some(p =>
        Math.abs(p.x - targetX) < MIN_HORIZONTAL_SPACING &&
        Math.abs(p.y - targetY) < MIN_VERTICAL_SPACING
      );
      if (tooClose) continue;

      if (GameConfig.isPlatformReachable(fromX, fromY, targetX, targetY, fromWidth, toWidth)) {
        return { x: targetX, y: targetY };
      }
    }
  }

  return null;
}

  
  private isPositionValidForHelper(x: number, y: number, width: number): boolean {
    // Simple check to avoid overlapping with main platforms
    // For now, just ensure it's not too close to screen edges
    return x >= GameConfig.MIN_PLATFORM_EDGE_DISTANCE && 
           x + width <= this.scene.cameras.main.width - GameConfig.MIN_PLATFORM_EDGE_DISTANCE;
  }
  
  private debugPlatformConnection(fromX: number, fromY: number, toX: number, toY: number) {
    // Optional: Add visual debug lines to show platform connections
    // This can be enabled during development to visualize reachability
    if (false) { // Set to true for debugging
      const debugLine = this.scene.add.line(0, 0, fromX, fromY, toX, toY, 0x00ff00, 0.3);
      debugLine.setOrigin(0, 0);
      
      // Remove debug line after a delay
      this.scene.time.delayedCall(5000, () => {
        debugLine.destroy();
      });
    }
  }
  
  cleanupDistantPlatforms(playerY: number) {
    // Remove platforms that are too far below the player
    const maxDistance = this.scene.cameras.main.height * 2;
    
    this.platforms.children.entries.forEach(platform => {
      const sprite = platform as Phaser.Physics.Arcade.Sprite;
      if (sprite.y > playerY + maxDistance) {
        this.platforms.remove(sprite);
        sprite.destroy();
      }
    });

    this.movingPlatforms.children.entries.forEach(platform => {
        const sprite = platform as Phaser.Physics.Arcade.Sprite;
        if (sprite.y > playerY + maxDistance) {
            this.movingPlatforms.remove(sprite);
            sprite.destroy();
        }
    });
  }

  getRandomPlatformType(): string {
    const random = Math.random();
    if (random < 0.6) {
      return 'platform-neutral'; // 60% chance for normal platforms
    } else if (random < 0.75) {
      return 'platform-breaking'; // 15% chance for breaking platforms
    } else if (random < 0.9) {
      return 'platform-trampoline'; // 15% chance for trampolines
    } else {
      return 'platform-moving'; // 10% chance for moving platforms
    }
  }

  private setupBreakingPlatform(platform: Phaser.Physics.Arcade.Sprite) {
    let isBreaking = false;
    
    // Add overlap detection for breaking platforms
    this.scene.physics.add.overlap(this.scene.getPlayer().getSprite(), platform, () => {
      if (isBreaking) return;
      
      isBreaking = true;
      
      // Start breaking animation
      this.scene.tweens.add({
        targets: platform,
        alpha: 0.5,
        scaleY: 0.8,
        duration: 500,
        ease: 'Power2.easeOut'
      });
      
      // Change to cracked texture
      platform.setTexture('platform-cracked');
      
      // Break after delay
      this.scene.time.delayedCall(1000, () => {
        // Create breaking particle effect
        this.createBreakingParticles(platform.x + 75, platform.y + 20);
        
        // Remove platform
        this.platforms.remove(platform);
        platform.destroy();
      });
    });
  }

  private setupTrampolinePlatform(platform: Phaser.Physics.Arcade.Sprite) {
    // Add special trampoline collision
    this.scene.physics.add.overlap(this.scene.getPlayer().getSprite(), platform, () => {
      this.scene.getPlayer().trampolineBounce();
      
      // Animate trampoline compression
      this.scene.tweens.add({
        targets: platform,
        scaleY: 0.7,
        duration: 100,
        yoyo: true,
        ease: 'Power2.easeOut'
      });
    });
  }

  private setupMovingPlatform(platform: Phaser.Physics.Arcade.Sprite) {
    const minRange = 100;
    const maxRange = 250;
    const moveRange = Phaser.Math.Between(minRange, maxRange);
    const startX = platform.x;
    const endX = startX + (Math.random() > 0.5 ? moveRange : -moveRange);
    
    // Store movement data
    platform.setData('moveData', {
      startX: startX,
      endX: endX,
      speed: Phaser.Math.FloatBetween(0.0005, 0.0015)
    });
  }

  private createBreakingParticles(x: number, y: number) {
    // Create debris particles
    for (let i = 0; i < 8; i++) {
      const particle = this.scene.add.rectangle(x, y, 6, 6, 0xEF4444);
      
      const velocityX = Phaser.Math.Between(-200, 200);
      const velocityY = Phaser.Math.Between(-300, -100);
      
      this.scene.tweens.add({
        targets: particle,
        x: x + velocityX,
        y: y + velocityY,
        alpha: 0,
        rotation: Math.PI * 2,
        duration: 1000,
        ease: 'Power2.easeOut',
        onComplete: () => particle.destroy()
      });
    }
  }

  destroy() {
    this.clearPlatforms();
    this.clearQuestion();
    this.platforms.destroy();
    this.movingPlatforms.destroy();
  }
}
