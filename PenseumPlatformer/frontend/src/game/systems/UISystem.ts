import Phaser from 'phaser';
import MainGameScene from '../scenes/MainGameScene';

interface FloatingText {
  text: Phaser.GameObjects.Text;
  timer: number;
  maxTimer: number;
}

// Theme colors for easy management
const THEME = {
  BACKGROUND: 0xffffff, // White primary background
  HIGHLIGHT: 0x6F47EB,  // Purple highlight: rgb(111, 71, 235)
  TEXT_LABEL: '#6F47EB', // Purple for labels
  TEXT_VALUE: '#1F2937', // Dark gray for values
  SUCCESS: '#6F47EB',   // Purple for success
  WARNING: '#6F47EB',   // Purple for warning
  DANGER: '#6F47EB',    // Purple for danger
  STREAK: '#6F47EB'     // Purple for streaks
};

export default class UISystem {
  private scene: MainGameScene;
  private scoreText?: Phaser.GameObjects.Text;
  private livesText?: Phaser.GameObjects.Text;
  private multiplierText?: Phaser.GameObjects.Text;
  private questionCounterText?: Phaser.GameObjects.Text;
  private accuracyText?: Phaser.GameObjects.Text;
  private streakText?: Phaser.GameObjects.Text;
  private powerUpIndicators: Phaser.GameObjects.Container[] = [];
  private floatingTexts: FloatingText[] = [];
  private livesHearts: Phaser.GameObjects.Sprite[] = [];
  private uiBackground?: Phaser.GameObjects.Rectangle;
  private uiBottomBorder?: Phaser.GameObjects.Rectangle;
  private currentQuestion?: Phaser.GameObjects.Text;
  private currentQuestionBg?: Phaser.GameObjects.Rectangle;
  private answerButtons: Phaser.GameObjects.Container[] = [];
  private currentQuestionData: any = null;

  constructor(scene: MainGameScene) {
    this.scene = scene;
    this.createUI();
  }

  private createUI() {
    this.createUIBackground();
    this.createScoreDisplay();
    this.createLivesDisplay();
    this.createMultiplierDisplay();
    this.createQuestionCounter();
    this.createAccuracyDisplay();
    this.createPowerUpIndicators();
  }

  private createUIBackground() {
    // Glass morphism background with layered effects
    const bgHeight = 85;
    
    // Main glass background with blur simulation
    this.uiBackground = this.scene.add.rectangle(
      0, 0,
      this.scene.cameras.main.width,
      bgHeight,
      0xFFFFFF,
      0.15 // Ultra-transparent base
    );
    this.uiBackground.setOrigin(0, 0);
    this.uiBackground.setDepth(998);
    this.uiBackground.setScrollFactor(0);
    
    // Frosted glass overlay with multiple layers for depth
    const frostLayer1 = this.scene.add.rectangle(
      0, 0,
      this.scene.cameras.main.width,
      bgHeight,
      0x6F47EB,
      0.08
    );
    frostLayer1.setOrigin(0, 0);
    frostLayer1.setDepth(999);
    frostLayer1.setScrollFactor(0);
    
    const frostLayer2 = this.scene.add.rectangle(
      0, 0,
      this.scene.cameras.main.width,
      bgHeight,
      0xFFFFFF,
      0.25
    );
    frostLayer2.setOrigin(0, 0);
    frostLayer2.setDepth(1000);
    frostLayer2.setScrollFactor(0);
    
    // Subtle gradient bands for glass effect
    const gradientBand1 = this.scene.add.rectangle(
      0, 0,
      this.scene.cameras.main.width,
      25,
      0xF8FAFC,
      0.4
    );
    gradientBand1.setOrigin(0, 0);
    gradientBand1.setDepth(1001);
    gradientBand1.setScrollFactor(0);
    
    const gradientBand2 = this.scene.add.rectangle(
      0, 25,
      this.scene.cameras.main.width,
      35,
      0xE0E7FF,
      0.15
    );
    gradientBand2.setOrigin(0, 0);
    gradientBand2.setDepth(1001);
    gradientBand2.setScrollFactor(0);
    
    const gradientBand3 = this.scene.add.rectangle(
      0, 60,
      this.scene.cameras.main.width,
      25,
      0x6F47EB,
      0.05
    );
    gradientBand3.setOrigin(0, 0);
    gradientBand3.setDepth(1001);
    gradientBand3.setScrollFactor(0);

    // Premium shadow with multiple layers
    const shadowDeep = this.scene.add.rectangle(
      0, bgHeight + 4, this.scene.cameras.main.width, 8, 0x000000, 0.15
    );
    shadowDeep.setOrigin(0, 0);
    shadowDeep.setDepth(997);
    shadowDeep.setScrollFactor(0);
    
    const shadowMid = this.scene.add.rectangle(
      0, bgHeight + 2, this.scene.cameras.main.width, 4, 0x000000, 0.08
    );
    shadowMid.setOrigin(0, 0);
    shadowMid.setDepth(998);
    shadowMid.setScrollFactor(0);
    
    // Glass border with highlight
    const borderHighlight = this.scene.add.rectangle(
      0, 0, this.scene.cameras.main.width, 1, 0xFFFFFF, 0.6
    );
    borderHighlight.setOrigin(0, 0);
    borderHighlight.setDepth(1002);
    borderHighlight.setScrollFactor(0);
    
    this.uiBottomBorder = this.scene.add.rectangle(
      0, bgHeight - 1, this.scene.cameras.main.width, 1, 0x6F47EB, 0.3
    );
    this.uiBottomBorder.setOrigin(0, 0);
    this.uiBottomBorder.setDepth(1002);
    this.uiBottomBorder.setScrollFactor(0);
  }

  private createScoreDisplay() {
    const scoreLabel = this.scene.add.text(20, 15, 'SCORE', {
      fontSize: '12px',
      color: THEME.TEXT_LABEL,
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    scoreLabel.setDepth(1001);
    scoreLabel.setScrollFactor(0);

    this.scoreText = this.scene.add.text(20, 30, '0', {
      fontSize: '24px',
      color: THEME.TEXT_VALUE,
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    this.scoreText.setDepth(1001);
    this.scoreText.setScrollFactor(0);
  }

  private createLivesDisplay() {
    const livesLabel = this.scene.add.text(150, 15, 'LIVES', {
      fontSize: '12px',
      color: THEME.TEXT_LABEL,
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    livesLabel.setDepth(1001);
    livesLabel.setScrollFactor(0);

    for (let i = 0; i < 5; i++) {
      const heart = this.scene.add.sprite(150 + i * 25, 45, 'heart');
      heart.setScale(0.8);
      heart.setDepth(1001);
      heart.setScrollFactor(0);
      this.livesHearts.push(heart);
    }
  }

  private createMultiplierDisplay() {
    const multiplierLabel = this.scene.add.text(300, 15, 'MULTIPLIER', {
      fontSize: '12px',
      color: THEME.TEXT_LABEL,
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    multiplierLabel.setDepth(1001);
    multiplierLabel.setScrollFactor(0);

    this.multiplierText = this.scene.add.text(300, 30, '1x', {
      fontSize: '20px',
      color: THEME.TEXT_VALUE,
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    this.multiplierText.setDepth(1001);
    this.multiplierText.setScrollFactor(0);
  }

  private createQuestionCounter() {
    const counterLabel = this.scene.add.text(420, 15, 'QUESTIONS', {
      fontSize: '12px',
      color: THEME.TEXT_LABEL,
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    counterLabel.setDepth(1001);
    counterLabel.setScrollFactor(0);

    this.questionCounterText = this.scene.add.text(420, 30, '0/0', {
      fontSize: '16px',
      color: THEME.TEXT_VALUE,
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    this.questionCounterText.setDepth(1001);
    this.questionCounterText.setScrollFactor(0);
    
    // Add streak display
    const streakLabel = this.scene.add.text(420, 50, 'STREAK', {
      fontSize: '12px',
      color: THEME.TEXT_LABEL,
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    streakLabel.setDepth(1001);
    streakLabel.setScrollFactor(0);
    
    this.streakText = this.scene.add.text(420, 65, '0', {
      fontSize: '16px',
      color: THEME.STREAK,
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    this.streakText.setDepth(1001);
    this.streakText.setScrollFactor(0);
  }

  private createAccuracyDisplay() {
    const accuracyLabel = this.scene.add.text(550, 15, 'ACCURACY', {
      fontSize: '12px',
      color: THEME.TEXT_LABEL,
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    accuracyLabel.setDepth(1001);
    accuracyLabel.setScrollFactor(0);

    this.accuracyText = this.scene.add.text(550, 30, '0%', {
      fontSize: '16px',
      color: THEME.TEXT_VALUE,
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    this.accuracyText.setDepth(1001);
    this.accuracyText.setScrollFactor(0);
  }

  private createPowerUpIndicators() {
    for (let i = 0; i < 5; i++) {
      const container = this.scene.add.container(
        this.scene.cameras.main.width - 220 + i * 38,
        42
      );
      
      // Glass morphism power-up indicators
      const outerGlow = this.scene.add.circle(0, 0, 22, 0x6F47EB, 0.1);
      const shadow = this.scene.add.circle(2, 2, 16, 0x000000, 0.2);
      const glassBase = this.scene.add.circle(0, 0, 16, 0xFFFFFF, 0.2);
      const glassFrost = this.scene.add.circle(0, 0, 16, 0x6F47EB, 0.05);
      const innerHighlight = this.scene.add.circle(0, -4, 10, 0xFFFFFF, 0.4);
      const border = this.scene.add.circle(0, 0, 16);
      border.setStrokeStyle(1.5, 0x6F47EB, 0.3);
      
      // Inner glow ring
      const innerGlow = this.scene.add.circle(0, 0, 14);
      innerGlow.setStrokeStyle(2, 0xFFFFFF, 0.2);
      
      container.add([outerGlow, shadow, glassBase, glassFrost, innerHighlight, innerGlow, border]);
      container.setDepth(1003);
      container.setAlpha(0.6);
      container.setScrollFactor(0);
      
      this.powerUpIndicators.push(container);
    }
  }

  update(gameStats: any) {
    this.updateScore(gameStats.score);
    this.updateLives(gameStats.lives);
    this.updateMultiplier(gameStats.multiplier);
    this.updateQuestionCounter(gameStats.questionsAnswered, 20);
    this.updateAccuracy(gameStats.questionsAnswered, gameStats.correctAnswers);
    this.updateStreak(gameStats.currentStreak, gameStats.maxStreak);
    this.updatePowerUpIndicators(gameStats);
    this.updateFloatingTexts();
  }

  private updateScore(score: number) {
    if (this.scoreText) {
      const currentScore = parseInt(this.scoreText.text.replace(/,/g, ''));
      if (currentScore !== score) {
        this.animateScoreChange(currentScore, score);
      }
    }
  }

  private animateScoreChange(from: number, to: number) {
    if (!this.scoreText) return;

    this.scoreText.setColor(Phaser.Display.Color.RGBToString(124, 58, 237));
    
    this.scene.tweens.add({
      targets: { value: from },
      value: to,
      duration: 500,
      ease: 'Power2.easeOut',
      onUpdate: (tween) => {
        const value = Math.floor((tween.targets[0] as any).value);
        this.scoreText!.setText(value.toLocaleString());
      },
      onComplete: () => {
        this.scene.tweens.add({
          targets: this.scoreText,
          scaleX: 1.2,
          scaleY: 1.2,
          duration: 100,
          yoyo: true,
          ease: 'Back.easeOut',
          onComplete: () => {
              this.scoreText?.setColor(THEME.TEXT_VALUE);
          }
        });
      }
    });
  }

  private updateLives(lives: number) {
    this.livesHearts.forEach((heart, index) => {
      if (index < lives) {
        heart.setAlpha(1);
        heart.setTint(THEME.HIGHLIGHT);
      } else {
        heart.setAlpha(0.3);
        heart.setTint(0xcccccc);
      }
    });
  }

  private updateMultiplier(multiplier: number) {
    if (this.multiplierText) {
      this.multiplierText.setText(`${multiplier}x`);
      
      if (multiplier > 1) {
        this.multiplierText.setColor(Phaser.Display.Color.RGBToString(124, 58, 237));
        
        if (!this.scene.tweens.isTweening(this.multiplierText)) {
            this.scene.tweens.add({
              targets: this.multiplierText,
              scaleX: 1.2,
              scaleY: 1.2,
              duration: 200,
              yoyo: true,
              repeat: -1,
              ease: 'Sine.easeInOut'
            });
        }
      } else {
        this.multiplierText.setColor(THEME.TEXT_VALUE);
        this.scene.tweens.killTweensOf(this.multiplierText);
        this.multiplierText.setScale(1);
      }
    }
  }

  private updateQuestionCounter(answered: number, total: number) {
    if (this.questionCounterText) {
      this.questionCounterText.setText(`${answered}/${total}`);
    }
  }

  private updateAccuracy(answered: number, correct: number) {
    if (this.accuracyText) {
        if (answered > 0) {
            const accuracy = Math.round((correct / answered) * 100);
            this.accuracyText.setText(`${accuracy}%`);
            
            if (accuracy >= 80) {
              this.accuracyText.setColor(THEME.SUCCESS);
            } else if (accuracy >= 60) {
              this.accuracyText.setColor(THEME.WARNING);
            } else {
              this.accuracyText.setColor(THEME.DANGER);
            }
        } else {
            this.accuracyText.setText('0%');
            this.accuracyText.setColor(THEME.TEXT_VALUE);
        }
    }
  }

  private updateStreak(currentStreak: number, maxStreak: number) {
    if (this.streakText) {
      this.streakText.setText(`${currentStreak}`);
      
      if (currentStreak > 0) {
        this.streakText.setColor(THEME.STREAK);
        
        if (currentStreak > 2 && !this.scene.tweens.isTweening(this.streakText)) {
          this.scene.tweens.add({
            targets: this.streakText,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 300,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
        }
      } else {
        this.streakText.setColor(THEME.TEXT_LABEL);
        this.scene.tweens.killTweensOf(this.streakText);
        this.streakText.setScale(1);
      }
    }
  }

  private updatePowerUpIndicators(gameStats: any) {
    const powerUps = [
      { active: gameStats.hasShield, color: THEME.HIGHLIGHT, emoji: '🛡️' },
      { active: gameStats.isInvincible, color: 0x6B7280, emoji: '⭐' },
      { active: gameStats.multiplier > 1, color: THEME.HIGHLIGHT, emoji: '💎' },
      { active: false, color: 0xF59E0B, emoji: '🚀' },
      { active: false, color: THEME.HIGHLIGHT, emoji: '❤️' }
    ];
    
    powerUps.forEach((powerUp, index) => {
      if (this.powerUpIndicators[index]) {
        const container = this.powerUpIndicators[index];
        
        if (powerUp.active) {
          container.setAlpha(1);
          const background = container.list[0] as Phaser.GameObjects.Shape;
          background.setFillStyle(powerUp.color, 1);
          
          if (!container.getData('hasEmoji')) {
            const emojiText = this.scene.add.text(0, 0, powerUp.emoji, {
              fontSize: '16px',
              align: 'center'
            }).setOrigin(0.5);
            emojiText.setDepth(1002);
            container.add(emojiText);
            container.setData('hasEmoji', true);
          }
        } else {
          container.setAlpha(0.3);
          const background = container.list[0] as Phaser.GameObjects.Shape;
          background.setFillStyle(0xE5E7EB, 0.8);
          
          if (container.getData('hasEmoji')) {
            const emoji = container.list[2];
            if (emoji) emoji.destroy();
            container.setData('hasEmoji', false);
          }
        }
      }
    });
  }

  showFloatingText(text: string, x: number, y: number, color: string = '#ffffff', fontSize: string = '16px') {
    // Glass morphism floating text background
    const textBg = this.scene.add.rectangle(x, y, 0, 0, 0xFFFFFF, 0.2);
    textBg.setDepth(1002);
    
    // Enhanced floating text with glass morphism backing
    const floatingText = this.scene.add.text(x, y, text, {
      fontSize,
      color,
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      fontStyle: '900',
      stroke: 'rgba(0,0,0,0.8)',
      strokeThickness: 4,
      shadow: {
        offsetX: 3,
        offsetY: 3,
        color: 'rgba(0,0,0,0.6)',
        blur: 8,
        stroke: true,
        fill: true
      }
    }).setOrigin(0.5);
    
    // Adjust background to text size
    const textBounds = floatingText.getBounds();
    textBg.setSize(textBounds.width + 30, textBounds.height + 15);
    textBg.setStrokeStyle(2, parseInt(color.replace('#', '0x')), 0.4);
    
    floatingText.setDepth(1004);
    floatingText.setAlpha(0);
    textBg.setAlpha(0);
    
    const floatingTextData: FloatingText = {
      text: floatingText,
      timer: 2500,
      maxTimer: 2500
    };
    
    this.floatingTexts.push(floatingTextData);
    
    // Animate background as well
    this.scene.tweens.add({
      targets: textBg,
      alpha: 0.3,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 200,
      ease: 'Back.easeOut'
    });
    
    this.scene.tweens.add({
      targets: textBg,
      y: y - 60,
      alpha: 0,
      scaleX: 0.8,
      scaleY: 0.8,
      duration: 2000,
      delay: 300,
      ease: 'Power2.easeOut',
      onComplete: () => textBg.destroy()
    });
    
    // Enhanced animation with bounce effect
    this.scene.tweens.add({
      targets: floatingText,
      alpha: 1,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 200,
      ease: 'Back.easeOut'
    });

    this.scene.tweens.add({
      targets: floatingText,
      y: y - 60,
      alpha: 0,
      scaleX: 0.8,
      scaleY: 0.8,
      duration: 2000,
      delay: 300,
      ease: 'Power2.easeOut'
    });
    
    // Add subtle floating motion
    this.scene.tweens.add({
      targets: floatingText,
      x: x + Phaser.Math.Between(-10, 10),
      duration: 2500,
      ease: 'Sine.easeInOut'
    });
  }

  private updateFloatingTexts() {
    this.floatingTexts = this.floatingTexts.filter(floatingText => {
      floatingText.timer -= this.scene.game.loop.delta;
      
      if (floatingText.timer <= 0) {
        floatingText.text.destroy();
        return false;
      }
      
      return true;
    });
  }

  showCombo(combo: number, x: number, y: number) {
    if (combo > 1) {
      this.showFloatingText(`COMBO x${combo}!`, x, y - 30, '#f39c12', '20px');
      
      this.scene.cameras.main.flash(100, 255, 165, 0, false);
    }
  }

  showLevelComplete(score: number) {
    const centerX = this.scene.cameras.main.width / 2;
    const centerY = this.scene.cameras.main.height / 2;
    
    // Glass morphism completion panel
    const panelShadow = this.scene.add.rectangle(centerX + 8, centerY + 8, 500, 200, 0x000000, 0.3);
    const panel = this.scene.add.rectangle(centerX, centerY, 500, 200, 0xFFFFFF, 0.2);
    const panelFrost = this.scene.add.rectangle(centerX, centerY, 500, 200, 0x6F47EB, 0.1);
    const panelHighlight = this.scene.add.rectangle(centerX, centerY - 40, 460, 60, 0xFFFFFF, 0.3);
    const panelBorder = this.scene.add.rectangle(centerX, centerY, 500, 200, undefined);
    panelBorder.setStrokeStyle(3, 0x6F47EB, 0.5);
    
    const completeText = this.scene.add.text(centerX, centerY - 35, 'LEVEL COMPLETE!', {
      fontSize: '42px',
      color: '#6F47EB',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      fontStyle: '900',
      stroke: 'rgba(255,255,255,0.8)',
      strokeThickness: 5,
      shadow: {
        offsetX: 3,
        offsetY: 3,
        color: 'rgba(0,0,0,0.4)',
        blur: 6,
        stroke: true,
        fill: true
      }
    }).setOrigin(0.5);
    
    const scoreText = this.scene.add.text(centerX, centerY + 25, `Score: ${score.toLocaleString()}`, {
      fontSize: '28px',
      color: '#1F2937',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      fontStyle: 'bold',
      stroke: 'rgba(255,255,255,0.6)',
      strokeThickness: 3,
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: 'rgba(0,0,0,0.3)',
        blur: 4,
        stroke: true,
        fill: true
      }
    }).setOrigin(0.5);
    
    [panelShadow, panel, panelFrost, panelHighlight, panelBorder].forEach(el => {
      el.setDepth(1003);
      el.setAlpha(0);
    });
    
    completeText.setDepth(1005);
    scoreText.setDepth(1005);
    
    [completeText, scoreText].forEach(el => el.setAlpha(0));
    
    // Animate panel first
    this.scene.tweens.add({
      targets: [panelShadow, panel, panelFrost, panelHighlight, panelBorder],
      alpha: 1,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 600,
      ease: 'Back.easeOut'
    });
    
    // Then animate text
    this.scene.tweens.add({
      targets: [completeText, scoreText],
      alpha: 1,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 800,
      delay: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.time.delayedCall(2500, () => {
          this.scene.tweens.add({
            targets: [panelShadow, panel, panelFrost, panelHighlight, panelBorder, completeText, scoreText],
            alpha: 0,
            scaleX: 0.8,
            scaleY: 0.8,
            duration: 600,
            ease: 'Power2.easeIn',
            onComplete: () => {
              [panelShadow, panel, panelFrost, panelHighlight, panelBorder, completeText, scoreText].forEach(el => el.destroy());
            }
          });
        });
      }
    });
  }

  hideUI() {
    const uiElements = [
      this.scoreText,
      this.livesText,
      this.multiplierText,
      this.questionCounterText,
      this.accuracyText,
      this.uiBackground,
      this.uiBottomBorder,
      ...this.livesHearts,
      ...this.powerUpIndicators
    ];
    
    this.scene.tweens.add({
      targets: uiElements.filter(el => el),
      alpha: 0,
      duration: 500,
      ease: 'Power2.easeIn'
    });
  }

  showUI() {
    const uiElements = [
      this.scoreText,
      this.livesText,
      this.multiplierText,
      this.questionCounterText,
      this.accuracyText,
      this.uiBackground,
      this.uiBottomBorder,
      ...this.livesHearts,
      ...this.powerUpIndicators
    ];
    
    this.scene.tweens.add({
      targets: uiElements.filter(el => el),
      alpha: 1,
      duration: 500,
      ease: 'Power2.easeOut'
    });
  }

  showQuestion(question: any) {
    this.clearQuestion();
    this.currentQuestionData = question;
    
    const screenWidth = this.scene.cameras.main.width;
    const padding = 40;
    
    const questionY = 130; // Fixed position at top of screen
    const questionWidth = screenWidth - padding * 2;
    const questionHeight = 140;
    
    // Multi-layered glass morphism question background
    const deepShadow = this.scene.add.rectangle(
      screenWidth / 2 + 6,
      questionY + 6,
      questionWidth,
      questionHeight,
      0x000000,
      0.15
    );
    deepShadow.setDepth(1990);
    deepShadow.setScrollFactor(0);
    
    const midShadow = this.scene.add.rectangle(
      screenWidth / 2 + 3,
      questionY + 3,
      questionWidth,
      questionHeight,
      0x000000,
      0.1
    );
    midShadow.setDepth(1995);
    midShadow.setScrollFactor(0);
    
    this.currentQuestionBg = this.scene.add.rectangle(
      screenWidth / 2,
      questionY,
      questionWidth,
      questionHeight,
      0xFFFFFF,
      0.25
    );
    this.currentQuestionBg.setDepth(2000);
    this.currentQuestionBg.setScrollFactor(0);
    
    // Glass frosting layers
    const frostLayer = this.scene.add.rectangle(
      screenWidth / 2,
      questionY,
      questionWidth,
      questionHeight,
      0x6F47EB,
      0.08
    );
    frostLayer.setDepth(2001);
    frostLayer.setScrollFactor(0);
    
    // Highlight stripe at top
    const topHighlight = this.scene.add.rectangle(
      screenWidth / 2,
      questionY - questionHeight/2 + 8,
      questionWidth - 20,
      16,
      0xFFFFFF,
      0.4
    );
    topHighlight.setDepth(2002);
    topHighlight.setScrollFactor(0);
    
    // Glass border with glow
    const borderGlow = this.scene.add.rectangle(
      screenWidth / 2,
      questionY,
      questionWidth + 4,
      questionHeight + 4,
      undefined
    );
    borderGlow.setStrokeStyle(3, 0x6F47EB, 0.3);
    borderGlow.setDepth(1998);
    borderGlow.setScrollFactor(0);
    
    const glassBorder = this.scene.add.rectangle(
      screenWidth / 2,
      questionY,
      questionWidth,
      questionHeight,
      undefined
    );
    glassBorder.setStrokeStyle(2, 0xFFFFFF, 0.5);
    glassBorder.setDepth(2003);
    glassBorder.setScrollFactor(0);
    
    const shadowBg = midShadow;
    
    this.currentQuestion = this.scene.add.text(
      screenWidth / 2,
      questionY,
      question.question,
      {
        fontSize: '28px',
        color: '#000000',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: screenWidth - padding * 3 },
        lineSpacing: 8
      }
    );
    this.currentQuestion.setOrigin(0.5);
    this.currentQuestion.setDepth(2001);
    this.currentQuestion.setScrollFactor(0);
    
    const buttonWidth = (screenWidth - padding * 4) / 2;
    const buttonHeight = 70;
    const startX = padding * 2 + buttonWidth / 2;
    const startY = questionY + 100;
    
    question.answers.forEach((answer: string, index: number) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      const x = startX + col * (buttonWidth + 20);
      const y = startY + row * (buttonHeight + 10);
      
      const container = this.scene.add.container(x, y);
      
      const isCorrect = answer === question.correct;
      
      // Glass morphism answer buttons
      const buttonShadow = this.scene.add.rectangle(3, 3, buttonWidth, buttonHeight, 0x000000, 0.2);
      
      const buttonBg = this.scene.add.rectangle(0, 0, buttonWidth, buttonHeight, 0xFFFFFF, 0.3);
      
      const buttonFrost = this.scene.add.rectangle(0, 0, buttonWidth, buttonHeight, 0x6F47EB, 0.05);
      
      const buttonHighlight = this.scene.add.rectangle(0, -buttonHeight/4, buttonWidth - 20, buttonHeight/3, 0xFFFFFF, 0.4);
      
      const borderColor = isCorrect ? THEME.HIGHLIGHT : 0x6F47EB;
      const buttonBorder = this.scene.add.rectangle(0, 0, buttonWidth, buttonHeight, undefined);
      buttonBorder.setStrokeStyle(2, borderColor, 0.6);
      
      const buttonText = this.scene.add.text(0, 0, answer, {
        fontSize: '18px',
        color: isCorrect ? Phaser.Display.Color.RGBToString(124, 58, 237) : '#000000',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: buttonWidth - 30 }
      });
      buttonText.setOrigin(0.5);
      
      container.add([buttonShadow, buttonBg, buttonFrost, buttonHighlight, buttonBorder, buttonText]);
      container.setDepth(2000);
      container.setScrollFactor(0);
      container.setInteractive(new Phaser.Geom.Rectangle(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight), Phaser.Geom.Rectangle.Contains);
      
      container.on('pointerover', () => {
        buttonBg.setFillStyle(0x6F47EB, 0.4);
        buttonFrost.setFillStyle(0xFFFFFF, 0.2);
        buttonText.setColor('#FFFFFF');
        buttonBorder.setStrokeStyle(3, 0x6F47EB, 1);
        this.scene.tweens.add({
          targets: container,
          scaleX: 1.03,
          scaleY: 1.03,
          duration: 200,
          ease: 'Back.easeOut'
        });
      });
      
      container.on('pointerout', () => {
        buttonBg.setFillStyle(0xFFFFFF, 0.3);
        buttonFrost.setFillStyle(0x6F47EB, 0.05);
        buttonText.setColor(isCorrect ? Phaser.Display.Color.RGBToString(111, 71, 235) : '#1F2937');
        buttonBorder.setStrokeStyle(2, borderColor, 0.6);
        this.scene.tweens.add({
          targets: container,
          scaleX: 1,
          scaleY: 1,
          duration: 200,
          ease: 'Power2.easeOut'
        });
      });
      
      container.on('pointerdown', () => {
        this.selectAnswer(answer, isCorrect, question);
      });
      
      this.answerButtons.push(container);
    });
    
    const difficultyText = this.scene.add.text(
      screenWidth - 20,
      questionY - 80,
      `${question.difficulty.toUpperCase()} • ${question.points} pts`,
      {
        fontSize: '16px',
        color: '#f39c12',
        fontFamily: 'Arial',
        fontStyle: 'bold'
      }
    );
    difficultyText.setOrigin(1, 0.5);
    difficultyText.setDepth(2001);
    difficultyText.setScrollFactor(0);
    
    const elements = [this.currentQuestionBg, shadowBg, this.currentQuestion, difficultyText, ...this.answerButtons];
    elements.forEach((el, index) => {
      const initialY = el.y;
      el.y = initialY - 30;
      el.setAlpha(0);
      this.scene.tweens.add({
        targets: el,
        alpha: 1,
        y: initialY,
        duration: 500,
        delay: index * 50,
        ease: 'Power2.easeOut'
      });
    });
  }

  private selectAnswer(answer: string, isCorrect: boolean, question: any) {
    this.answerButtons.forEach(button => {
      button.removeInteractive();
    });
    
    if (isCorrect) {
      this.showFloatingText('CORRECT! +' + question.points, this.scene.cameras.main.width / 2, 300, '#27ae60', '32px');
      this.scene.cameras.main.flash(200, 46, 204, 113, false); // Flash purple
    } else {
      this.showFloatingText('WRONG! -1 Life', this.scene.cameras.main.width / 2, 300, '#e74c3c', '32px');
      this.scene.cameras.main.shake(300, 0.02);
    }
    
    this.scene.events.emit('question-answered', { 
      answer, 
      isCorrect, 
      question,
      points: question.points 
    });
    
    this.scene.time.delayedCall(2000, () => {
      this.clearQuestion();
    });
  }

  clearQuestion() {
    // Animate out before destroying
    const elements = [this.currentQuestionBg, this.currentQuestion, ...this.answerButtons].filter(el => el);
    
    elements.forEach((el, index) => {
        if (el && this.scene) {
            this.scene.tweens.add({
                targets: el,
                alpha: 0,
                y: el.y + 30,
                duration: 300,
                delay: index * 30,
                ease: 'Power2.easeIn',
                onComplete: () => {
                    el.destroy();
                }
            });
        }
    });

    this.currentQuestion = undefined;
    this.currentQuestionBg = undefined;
    this.answerButtons = [];
    this.currentQuestionData = null;
  }

  hasActiveQuestion() {
    return this.currentQuestionData !== null;
  }

  destroy() {
    this.floatingTexts.forEach(floatingText => {
      floatingText.text.destroy();
    });
    this.floatingTexts = [];
    
    this.powerUpIndicators.forEach(indicator => {
      indicator.destroy();
    });
    this.powerUpIndicators = [];
    
    this.livesHearts.forEach(heart => {
      heart.destroy();
    });
    this.livesHearts = [];
  }
}