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
  HIGHLIGHT: 0x7C3AED,  // Purple highlight: rgb(124, 58, 237)
  TEXT_LABEL: '#5A5A5A', // A dark gray for labels for readability on white
  TEXT_VALUE: '#333333', // A near-black for default values
  SUCCESS: '#2ecc71',
  WARNING: '#f39c12',
  DANGER: '#e74c3c'
};

export default class UISystem {
  private scene: MainGameScene;
  private scoreText?: Phaser.GameObjects.Text;
  private livesText?: Phaser.GameObjects.Text;
  private multiplierText?: Phaser.GameObjects.Text;
  private questionCounterText?: Phaser.GameObjects.Text;
  private accuracyText?: Phaser.GameObjects.Text;
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
    this.uiBackground = this.scene.add.rectangle(
      0, 0,
      this.scene.cameras.main.width,
      70, // Adjusted height
      THEME.BACKGROUND,
      1.0
    );
    this.uiBackground.setOrigin(0, 0);
    this.uiBackground.setDepth(1000);
    this.uiBackground.setScrollFactor(0); // Pins the UI to the camera

    this.uiBottomBorder = this.scene.add.rectangle(
        0, 69, this.scene.cameras.main.width, 1, 0xE5E7EB, 1
    );
    this.uiBottomBorder.setOrigin(0, 0);
    this.uiBottomBorder.setDepth(1001);
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
        this.scene.cameras.main.width - 200 + i * 35,
        35
      );
      
      const background = this.scene.add.circle(0, 0, 15, 0xE5E7EB, 0.8);
      const border = this.scene.add.circle(0, 0, 15);
      border.setStrokeStyle(2, 0xD1D5DB);
      
      container.add([background, border]);
      container.setDepth(1001);
      container.setAlpha(0.3);
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

  private updatePowerUpIndicators(gameStats: any) {
    const powerUps = [
      { active: gameStats.hasShield, color: 0x4ecdc4, emoji: '🛡️' },
      { active: gameStats.isInvincible, color: 0xffd93d, emoji: '⭐' },
      { active: gameStats.multiplier > 1, color: THEME.HIGHLIGHT, emoji: '💎' },
      { active: false, color: 0xff6b6b, emoji: '🚀' },
      { active: false, color: 0xff69b4, emoji: '❤️' }
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
    const floatingText = this.scene.add.text(x, y, text, {
      fontSize,
      color,
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    
    floatingText.setDepth(1003);
    
    const floatingTextData: FloatingText = {
      text: floatingText,
      timer: 2000,
      maxTimer: 2000
    };
    
    this.floatingTexts.push(floatingTextData);
    
    this.scene.tweens.add({
      targets: floatingText,
      y: y - 50,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 2000,
      ease: 'Power2.easeOut'
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
    
    const completeText = this.scene.add.text(centerX, centerY - 50, 'LEVEL COMPLETE!', {
      fontSize: '36px',
      color: '#2ecc71',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    
    const scoreText = this.scene.add.text(centerX, centerY + 10, `Score: ${score.toLocaleString()}`, {
      fontSize: '24px',
      color: '#f39c12',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    
    completeText.setDepth(1004);
    scoreText.setDepth(1004);
    
    completeText.setAlpha(0);
    scoreText.setAlpha(0);
    
    this.scene.tweens.add({
      targets: [completeText, scoreText],
      alpha: 1,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 800,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.time.delayedCall(2000, () => {
          this.scene.tweens.add({
            targets: [completeText, scoreText],
            alpha: 0,
            scaleX: 0.8,
            scaleY: 0.8,
            duration: 500,
            ease: 'Power2.easeIn',
            onComplete: () => {
              completeText.destroy();
              scoreText.destroy();
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
    
    const questionY = 120; // Fixed position at top of screen
    
    this.currentQuestionBg = this.scene.add.rectangle(
      screenWidth / 2,
      questionY,
      screenWidth - padding * 2,
      120,
      0xFFFFFF,
      1.0
    );
    this.currentQuestionBg.setStrokeStyle(1, 0xE5E7EB, 1);
    this.currentQuestionBg.setDepth(2000);
    this.currentQuestionBg.setScrollFactor(0);
    
    const shadowBg = this.scene.add.rectangle(
      screenWidth / 2 + 2,
      questionY + 2,
      screenWidth - padding * 2,
      120,
      0x000000,
      0.1
    );
    shadowBg.setDepth(1999);
    shadowBg.setScrollFactor(0);
    
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
      
      const bgColor = 0xFFFFFF;
      const borderColor = isCorrect ? THEME.HIGHLIGHT : 0x000000;
      
      const buttonBg = this.scene.add.rectangle(0, 0, buttonWidth, buttonHeight, bgColor, 1);
      buttonBg.setStrokeStyle(3, borderColor, 1);
      
      const buttonShadow = this.scene.add.rectangle(2, 2, buttonWidth, buttonHeight, 0x000000, 0.1);
      
      const buttonText = this.scene.add.text(0, 0, answer, {
        fontSize: '18px',
        color: isCorrect ? Phaser.Display.Color.RGBToString(124, 58, 237) : '#000000',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: buttonWidth - 30 }
      });
      buttonText.setOrigin(0.5);
      
      container.add([buttonShadow, buttonBg, buttonText]);
      container.setDepth(2000);
      container.setScrollFactor(0);
      container.setInteractive(new Phaser.Geom.Rectangle(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight), Phaser.Geom.Rectangle.Contains);
      
      container.on('pointerover', () => {
        buttonBg.setFillStyle(isCorrect ? THEME.HIGHLIGHT : 0x000000);
        buttonText.setColor('#FFFFFF');
        this.scene.tweens.add({
          targets: container,
          scaleX: 1.02,
          scaleY: 1.02,
          duration: 200,
          ease: 'Power2.easeOut'
        });
      });
      
      container.on('pointerout', () => {
        buttonBg.setFillStyle(0xFFFFFF);
        buttonText.setColor(isCorrect ? Phaser.Display.Color.RGBToString(124, 58, 237) : '#000000');
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