import Phaser from 'phaser';
import { Question, Platform } from '../../types/GameTypes';
import MainGameScene from '../scenes/MainGameScene';
import { GameConfig } from '../config/GameConfig';

export default class PlatformSystem {
  private scene: MainGameScene;
  private platforms: Phaser.Physics.Arcade.StaticGroup;
  private platformData: Platform[] = [];
  private answerTexts: Phaser.GameObjects.Text[] = [];
  private questionText?: Phaser.GameObjects.Text;
  private questionBackground?: Phaser.GameObjects.Rectangle;
  private platformCounter: number = 0;
  private enemyPatrolPlatforms: Set<number> = new Set();
  private patrollingEnemies: Map<number, any> = new Map();

  constructor(scene: MainGameScene) {
    this.scene = scene;
    this.platforms = scene.physics.add.staticGroup();
    this.setupCollisions();
  }

  private setupCollisions() {
    // This will be called after the player is created
  }

  setupPlayerCollision(playerSprite: Phaser.Physics.Arcade.Sprite) {
    // Set up basic collision first (this makes player bounce off platforms)
    this.scene.physics.add.collider(playerSprite, this.platforms);
    
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

  createPlatformsForQuestion(question: Question, customY?: number) {
    // Only clear previous question UI, NOT the platforms for infinite climbing
    this.clearQuestion();
    this.clearAnswerTexts();
    
    this.createQuestionDisplay(question, customY);
    
    // Increment platform counter and check for patrol platforms
    this.platformCounter++;
    
    const platformWidth = 150;
    const platformHeight = 40;
    const screenWidth = this.scene.cameras.main.width;
    // Use customY if provided, otherwise use default position
    const baseY = customY !== undefined ? customY : this.scene.cameras.main.height - 200;
    
    this.platformData = [];
    
    // Create approach platforms to ensure question platforms are accessible
    if (customY !== undefined) {
      this.createApproachPlatforms(baseY, screenWidth, platformWidth);
    }
    
    // Create symmetrical platform positions guaranteed to be accessible
    const platformPositions = this.generateSymmetricalPlatformPositions(question.answers.length, screenWidth, baseY, platformWidth);
    
    question.answers.forEach((answer, index) => {
      const position = platformPositions[index];
      const x = position.x;
      const y = position.y;
      
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
        color: isCorrect ? '#6F47EB' : '#FFFFFF', // Updated purple and white colors
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
      
      // Check if this should be a patrol platform (every 15th)
      if (this.platformCounter % 15 === 0 && !this.enemyPatrolPlatforms.has(this.platformCounter)) {
        this.enemyPatrolPlatforms.add(this.platformCounter);
        this.spawnPatrollingEnemy(x, y, platformWidth);
        
        // Add visual indicator for patrol platforms
        const patrolIndicator = this.scene.add.circle(x + platformWidth/2, y - 20, 8, 0x6F47EB);
        patrolIndicator.setAlpha(0.7);
        this.scene.tweens.add({
          targets: patrolIndicator,
          scaleX: 1.2,
          scaleY: 1.2,
          duration: 1000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
      
      // Animate platform appearance with staggered timing for symmetrical effect
      const animationDelay = Math.abs(index - (question.answers.length - 1) / 2) * 100;
      this.scene.tweens.add({
        targets: platform,
        y: y,
        duration: 500,
        ease: 'Bounce.easeOut',
        delay: animationDelay
      });
      
      this.scene.tweens.add({
        targets: answerText,
        y: y + platformHeight / 2,
        alpha: 1,
        duration: 500,
        ease: 'Power2.easeOut',
        delay: animationDelay
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

  private generateSymmetricalPlatformPositions(numAnswers: number, screenWidth: number, baseY: number, platformWidth: number): Array<{x: number, y: number}> {
    const positions: Array<{x: number, y: number}> = [];
    const centerX = screenWidth / 2;
    const minSpacing = 50; // Minimum spacing between platforms
    const maxHorizontalSpread = screenWidth * 0.8; // Use 80% of screen width
    
    // Create symmetrical layout based on number of answers
    if (numAnswers === 2) {
      // Two platforms symmetrically placed
      const offset = Math.min(200, maxHorizontalSpread / 4);
      positions.push(
        { x: centerX - offset - platformWidth / 2, y: baseY },
        { x: centerX + offset - platformWidth / 2, y: baseY }
      );
    } else if (numAnswers === 3) {
      // Three platforms: center and two sides
      const sideOffset = Math.min(220, maxHorizontalSpread / 3);
      positions.push(
        { x: centerX - sideOffset - platformWidth / 2, y: baseY },
        { x: centerX - platformWidth / 2, y: baseY + 30 }, // Center slightly lower for variety
        { x: centerX + sideOffset - platformWidth / 2, y: baseY }
      );
    } else if (numAnswers === 4) {
      // Four platforms in symmetrical diamond/cross pattern
      const spacing = Math.min(160, maxHorizontalSpread / 5);
      positions.push(
        { x: centerX - spacing * 1.5 - platformWidth / 2, y: baseY },
        { x: centerX - spacing / 2 - platformWidth / 2, y: baseY - 40 },
        { x: centerX + spacing / 2 - platformWidth / 2, y: baseY - 40 },
        { x: centerX + spacing * 1.5 - platformWidth / 2, y: baseY }
      );
    } else {
      // For more than 4 answers, arrange in symmetrical arc
      const totalSpacing = Math.min(maxHorizontalSpread, (numAnswers - 1) * (platformWidth + minSpacing));
      const startX = centerX - totalSpacing / 2;
      const arcHeight = 60; // Height variation for arc effect
      
      for (let i = 0; i < numAnswers; i++) {
        const progress = numAnswers > 1 ? i / (numAnswers - 1) : 0.5;
        const x = startX + progress * totalSpacing - platformWidth / 2;
        
        // Create arc effect with sine curve
        const arcProgress = (progress - 0.5) * Math.PI;
        const arcOffset = Math.sin(arcProgress) * arcHeight;
        const y = baseY + arcOffset;
        
        positions.push({ x, y });
      }
    }
    
    // Ensure all positions are within screen bounds and accessible
    return this.validateAndAdjustPlatformPositions(positions, screenWidth, platformWidth);
  }
  
  private createApproachPlatforms(questionY: number, screenWidth: number, platformWidth: number) {
    // Create 2-3 intermediate platforms leading to the question area
    const numApproachPlatforms = 3;
    const verticalSpacing = 120; // Height between approach platforms
    const centerX = screenWidth / 2;
    
    for (let i = 0; i < numApproachPlatforms; i++) {
      const y = questionY + (i + 1) * verticalSpacing; // Below question platforms
      const xOffset = (i % 2 === 0) ? -150 : 150; // Alternate left/right
      const x = centerX + xOffset - platformWidth / 2;
      
      // Ensure approach platform is within screen bounds
      const clampedX = Math.max(30, Math.min(screenWidth - platformWidth - 30, x));
      
      // Create approach platform using neutral texture
      const platform = this.scene.physics.add.staticSprite(clampedX, y, 'platform-neutral');
      platform.setOrigin(0, 0);
      platform.setScale(1);
      
      // Set physics body
      platform.body?.setSize(platformWidth, 40);
      platform.body?.setOffset(0, 0);
      
      this.platforms.add(platform);
      
      // Mark as approach platform (not question platform) so it won't be cleared
      platform.setData('type', 'approach');
      
      // Animate appearance
      platform.setAlpha(0);
      this.scene.tweens.add({
        targets: platform,
        alpha: 0.8, // Slightly transparent to indicate they're temporary
        duration: 500,
        ease: 'Power2.easeOut',
        delay: i * 150
      });
    }
  }

  private validateAndAdjustPlatformPositions(positions: Array<{x: number, y: number}>, screenWidth: number, platformWidth: number): Array<{x: number, y: number}> {
    const minEdgeDistance = 30;
    const maxX = screenWidth - platformWidth - minEdgeDistance;
    
    return positions.map((pos, index) => {
      // Clamp X position to screen bounds
      const clampedX = Math.max(minEdgeDistance, Math.min(maxX, pos.x));
      
      // Ensure platforms don't overlap by checking distance to other platforms
      let adjustedX = clampedX;
      let adjustedY = pos.y;
      
      // Check for overlaps with previously processed platforms
      for (let i = 0; i < index; i++) {
        const otherPos = positions[i];
        const horizontalDistance = Math.abs(adjustedX - otherPos.x);
        const verticalDistance = Math.abs(adjustedY - otherPos.y);
        
        // If platforms are too close horizontally and vertically
        if (horizontalDistance < platformWidth + 30 && verticalDistance < 50) {
          // Adjust Y position to create layered effect
          adjustedY = otherPos.y + (index % 2 === 0 ? 50 : -50);
        }
      }
      
      return { x: adjustedX, y: adjustedY };
    });
  }

  private createQuestionDisplay(question: Question, customY?: number) {
    const padding = 20;
    const maxWidth = this.scene.cameras.main.width - padding * 2;
    // Always position question display at top of screen for infinite platformer
    const displayY = customY !== undefined ? 60 : 60; // Always at top when in infinite mode
    
    this.questionBackground = this.scene.add.rectangle(
      this.scene.cameras.main.width / 2,
      displayY,
      maxWidth,
      80,
      0xFFFFFF,
      1
    );
    this.questionBackground.setStrokeStyle(2, 0x6F47EB, 1);
    
    // For infinite platformer, make question follow camera
    if (customY !== undefined) {
      this.questionBackground.setScrollFactor(0);
      this.questionBackground.setDepth(1500);
    }
    
    this.questionText = this.scene.add.text(
      this.scene.cameras.main.width / 2,
      displayY,
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
    
    // Make question text follow camera for infinite platformer
    if (customY !== undefined) {
      this.questionText.setScrollFactor(0);
      this.questionText.setDepth(1501);
    }
    
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
        color: '#6F47EB',
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
      case 'easy': return 0x6F47EB;     // Updated purple for easy
      case 'medium': return 0x6F47EB;   // Purple for medium  
      case 'hard': return 0x6F47EB;     // Purple for hard
      default: return 0x6F47EB;         // Default purple
    }
  }

  private handlePlatformCollision(player: Phaser.Physics.Arcade.Sprite, platform: Phaser.Physics.Arcade.Sprite) {
    const platformInfo = platform.getData('platformInfo') as Platform;
    
    if (platformInfo) {
      if (platformInfo.isCorrect) {
        // Handle correct answer
        this.animatePlatformSelection(platform);
        
        // Give upward boost for correct answers
        const boostVelocity = -400; // Strong upward boost
        player.setVelocityY(boostVelocity);
        
        // Create visual effect for boost
        this.createBoostEffect(player.x, player.y);
        
        // Emit event to game scene
        this.scene.events.emit('answer-selected', {
          platform: platformInfo,
          isCorrect: true
        });
        
        // Handle platform conversion after a delay
        this.scene.time.delayedCall(1000, () => {
          this.convertCorrectPlatformToRegular(platform);
          this.removeIncorrectPlatforms(platform);
          this.clearQuestion();
          this.clearAnswerTexts();
        });
      } else {
        // Handle incorrect answer - platform disappears immediately
        this.handleIncorrectAnswerPlatform(platform, platformInfo);
      }
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
    this.platformData = [];
    
    this.answerTexts.forEach(text => text.destroy());
    this.answerTexts = [];
  }

  private clearAnswerTexts() {
    this.answerTexts.forEach(text => text.destroy());
    this.answerTexts = [];
  }

  private clearQuestionPlatforms() {
    // Remove platforms that are question platforms (have platformInfo) or approach platforms
    const platformsToRemove: Phaser.Physics.Arcade.Sprite[] = [];
    
    this.platforms.children.entries.forEach(platform => {
      const sprite = platform as Phaser.Physics.Arcade.Sprite;
      const platformInfo = sprite.getData('platformInfo');
      const platformType = sprite.getData('type');
      
      // Remove question platforms and approach platforms
      if (platformInfo || platformType === 'approach') {
        platformsToRemove.push(sprite);
      }
    });
    
    platformsToRemove.forEach(platform => {
      this.platforms.remove(platform);
      platform.destroy();
    });
    
    // Clear platformData array as it only contains question platforms
    this.platformData = [];
  }

  private convertCorrectPlatformToRegular(correctPlatform: Phaser.Physics.Arcade.Sprite) {
    const platformInfo = correctPlatform.getData('platformInfo') as Platform;
    
    // Find and fade out the corresponding answer text
    const answerTextIndex = this.platformData.findIndex(p => p.id === platformInfo.id);
    if (answerTextIndex !== -1 && this.answerTexts[answerTextIndex]) {
      this.scene.tweens.add({
        targets: this.answerTexts[answerTextIndex],
        alpha: 0,
        duration: 500,
        ease: 'Power2.easeOut',
        onComplete: () => {
          this.answerTexts[answerTextIndex].destroy();
        }
      });
    }
    
    // Remove question platform data to make it a regular platform
    correctPlatform.setData('platformInfo', null);
    
    // Change texture to neutral platform
    correctPlatform.setTexture('platform-neutral');
    
    // Clear any tint and stop any question-specific animations
    correctPlatform.clearTint();
    this.scene.tweens.killTweensOf(correctPlatform);
    
    // Reset scale and alpha to normal
    correctPlatform.setScale(1);
    correctPlatform.setAlpha(1);
    
    // Add subtle visual effect to indicate it's now permanent
    this.scene.tweens.add({
      targets: correctPlatform,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 300,
      yoyo: true,
      ease: 'Power2.easeInOut',
      onComplete: () => {
        // Subtle permanent glow effect
        this.scene.tweens.add({
          targets: correctPlatform,
          alpha: 0.9,
          duration: 2000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    });
  }

  private handleIncorrectAnswerPlatform(platform: Phaser.Physics.Arcade.Sprite, platformInfo: Platform) {
    // Find and remove the corresponding answer text immediately
    const answerTextIndex = this.platformData.findIndex(p => p.id === platformInfo.id);
    if (answerTextIndex !== -1 && this.answerTexts[answerTextIndex]) {
      this.answerTexts[answerTextIndex].destroy();
      this.answerTexts[answerTextIndex] = null as any; // Mark as destroyed
    }
    
    // Emit event to game scene for incorrect answer
    this.scene.events.emit('answer-selected', {
      platform: platformInfo,
      isCorrect: false
    });
    
    // Create crumbling effect
    this.createCrumblingEffect(platform.x + 75, platform.y + 20);
    
    // Immediately animate platform disappearance
    platform.setTint(0xff0000); // Red tint to show it's wrong
    
    this.scene.tweens.add({
      targets: platform,
      alpha: 0,
      scaleX: 0.1,
      scaleY: 0.1,
      rotation: 0.3,
      y: platform.y + 50, // Fall down effect
      duration: 300,
      ease: 'Power2.easeIn',
      onComplete: () => {
        this.platforms.remove(platform);
        platform.destroy();
      }
    });
    
    // Remove this platform from platformData
    const platformIndex = this.platformData.findIndex(p => p.id === platformInfo.id);
    if (platformIndex !== -1) {
      this.platformData.splice(platformIndex, 1);
    }
  }

  private createCrumblingEffect(x: number, y: number) {
    // Create crumbling particles with red color for wrong answers
    for (let i = 0; i < 10; i++) {
      const particle = this.scene.add.rectangle(x, y, 4, 4, 0xff4444);
      
      const velocityX = Phaser.Math.Between(-150, 150);
      const velocityY = Phaser.Math.Between(-200, 50);
      
      this.scene.tweens.add({
        targets: particle,
        x: x + velocityX,
        y: y + velocityY,
        alpha: 0,
        rotation: Math.PI * 2,
        duration: 800,
        ease: 'Power2.easeOut',
        onComplete: () => particle.destroy()
      });
    }
  }

  private removeIncorrectPlatforms(correctPlatform: Phaser.Physics.Arcade.Sprite) {
    const platformsToRemove: Phaser.Physics.Arcade.Sprite[] = [];
    
    this.platforms.children.entries.forEach(platform => {
      const sprite = platform as Phaser.Physics.Arcade.Sprite;
      const platformInfo = sprite.getData('platformInfo');
      const platformType = sprite.getData('type');
      
      // Remove remaining incorrect answer platforms and approach platforms, but keep the correct one
      if ((platformInfo && !platformInfo.isCorrect && sprite !== correctPlatform) || platformType === 'approach') {
        platformsToRemove.push(sprite);
      }
    });
    
    // Animate removal of remaining incorrect platforms
    platformsToRemove.forEach((platform, index) => {
      this.scene.tweens.add({
        targets: platform,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        rotation: Math.PI,
        duration: 500,
        delay: index * 100,
        ease: 'Power2.easeIn',
        onComplete: () => {
          this.platforms.remove(platform);
          platform.destroy();
        }
      });
    });
    
    // Update platformData to remove incorrect platforms
    this.platformData = this.platformData.filter(data => data.isCorrect);
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

    // Moving platforms removed
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
  
  private createPlatform(x: number, y: number, width: number, height: number, texture: string) {
    const platform = this.scene.physics.add.staticSprite(x, y, texture);
    this.platforms.add(platform);
    platform.body?.setSize(width, height);

    platform.setOrigin(0, 0);
platform.setScale(width / 150, height / 40);
platform.body?.setSize(150, 40); // Match original texture size
platform.refreshBody(); // now physics body matches scaled sprite
    
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
  }

  getRandomPlatformType(): string {
    const random = Math.random();
    if (random < 0.7) {
      return 'platform-neutral'; // 70% chance for normal platforms
    } else if (random < 0.85) {
      return 'platform-breaking'; // 15% chance for breaking platforms
    } else {
      return 'platform-trampoline'; // 15% chance for trampolines
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

  // Moving platform setup removed

  private createBreakingParticles(x: number, y: number) {
    // Create debris particles
    for (let i = 0; i < 8; i++) {
      const particle = this.scene.add.rectangle(x, y, 6, 6, 0x6F47EB);
      
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

  private createBoostEffect(x: number, y: number) {
    // Create upward boost particles
    for (let i = 0; i < 12; i++) {
      const particle = this.scene.add.circle(x, y, 4, 0x6F47EB);
      
      const velocityX = Phaser.Math.Between(-50, 50);
      const velocityY = Phaser.Math.Between(-200, -100);
      
      this.scene.tweens.add({
        targets: particle,
        x: x + velocityX,
        y: y + velocityY * 2,
        alpha: 0,
        scaleX: 1.5,
        scaleY: 1.5,
        duration: 800,
        ease: 'Power2.easeOut',
        onComplete: () => particle.destroy()
      });
    }
    
    // Create boost ring effect
    const boostRing = this.scene.add.circle(x, y, 20, 0x6F47EB, 0);
    boostRing.setStrokeStyle(3, 0x6F47EB);
    
    this.scene.tweens.add({
      targets: boostRing,
      scaleX: 3,
      scaleY: 3,
      alpha: 0,
      duration: 600,
      ease: 'Power2.easeOut',
      onComplete: () => boostRing.destroy()
    });
  }

  private spawnPatrollingEnemy(platformX: number, platformY: number, platformWidth: number) {
    // Emit event to main game scene to spawn patrolling enemy
    this.scene.events.emit('spawn-patrol-enemy', {
      x: platformX + platformWidth / 2,
      y: platformY - 50,
      platformX: platformX,
      platformWidth: platformWidth,
      patrolId: this.platformCounter
    });
  }

  getPatrolPlatforms() {
    return this.enemyPatrolPlatforms;
  }

  destroy() {
    this.clearPlatforms();
    this.clearQuestion();
    this.platforms.destroy();
  }
}
