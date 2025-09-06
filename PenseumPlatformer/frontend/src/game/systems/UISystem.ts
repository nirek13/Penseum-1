import Phaser from 'phaser';
import MainGameScene from '../scenes/MainGameScene';

interface FloatingText {
  text: Phaser.GameObjects.Text;
  timer: number;
  maxTimer: number;
}

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
      100,
      0x2c3e50,
      0.8
    );
    this.uiBackground.setOrigin(0, 0);
    this.uiBackground.setDepth(1000);
  }

  private createScoreDisplay() {
    const scoreLabel = this.scene.add.text(20, 15, 'SCORE', {
      fontSize: '12px',
      color: '#ecf0f1',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    scoreLabel.setDepth(1001);

    this.scoreText = this.scene.add.text(20, 30, '0', {
      fontSize: '24px',
      color: '#f39c12',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    this.scoreText.setDepth(1001);
  }

  private createLivesDisplay() {
    const livesLabel = this.scene.add.text(150, 15, 'LIVES', {
      fontSize: '12px',
      color: '#ecf0f1',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    livesLabel.setDepth(1001);

    for (let i = 0; i < 5; i++) {
      const heart = this.scene.add.sprite(150 + i * 25, 45, 'heart');
      heart.setScale(0.8);
      heart.setDepth(1001);
      this.livesHearts.push(heart);
    }
  }

  private createMultiplierDisplay() {
    const multiplierLabel = this.scene.add.text(300, 15, 'MULTIPLIER', {
      fontSize: '12px',
      color: '#ecf0f1',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    multiplierLabel.setDepth(1001);

    this.multiplierText = this.scene.add.text(300, 30, '1x', {
      fontSize: '20px',
      color: '#2ecc71',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    this.multiplierText.setDepth(1001);
  }

  private createQuestionCounter() {
    const counterLabel = this.scene.add.text(420, 15, 'QUESTIONS', {
      fontSize: '12px',
      color: '#ecf0f1',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    counterLabel.setDepth(1001);

    this.questionCounterText = this.scene.add.text(420, 30, '0/0', {
      fontSize: '16px',
      color: '#3498db',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    this.questionCounterText.setDepth(1001);
  }

  private createAccuracyDisplay() {
    const accuracyLabel = this.scene.add.text(550, 15, 'ACCURACY', {
      fontSize: '12px',
      color: '#ecf0f1',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    accuracyLabel.setDepth(1001);

    this.accuracyText = this.scene.add.text(550, 30, '0%', {
      fontSize: '16px',
      color: '#9b59b6',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    this.accuracyText.setDepth(1001);
  }

  private createPowerUpIndicators() {
    for (let i = 0; i < 5; i++) {
      const container = this.scene.add.container(
        this.scene.cameras.main.width - 200 + i * 35,
        25
      );
      
      const background = this.scene.add.circle(0, 0, 15, 0x34495e, 0.8);
      const border = this.scene.add.circle(0, 0, 15);
      border.setStrokeStyle(2, 0x7f8c8d);
      
      container.add([background, border]);
      container.setDepth(1001);
      container.setAlpha(0.3);
      
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
      const currentScore = parseInt(this.scoreText.text);
      if (currentScore !== score) {
        this.animateScoreChange(currentScore, score);
      }
    }
  }

  private animateScoreChange(from: number, to: number) {
    if (!this.scoreText) return;
    
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
          ease: 'Back.easeOut'
        });
      }
    });
  }

  private updateLives(lives: number) {
    this.livesHearts.forEach((heart, index) => {
      if (index < lives) {
        heart.setAlpha(1);
        heart.setTint(0xffffff);
      } else {
        heart.setAlpha(0.3);
        heart.setTint(0x7f8c8d);
      }
    });
  }

  private updateMultiplier(multiplier: number) {
    if (this.multiplierText) {
      this.multiplierText.setText(`${multiplier}x`);
      
      if (multiplier > 1) {
        this.multiplierText.setColor('#f39c12');
        this.scene.tweens.add({
          targets: this.multiplierText,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 200,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      } else {
        this.multiplierText.setColor('#2ecc71');
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
    if (this.accuracyText && answered > 0) {
      const accuracy = Math.round((correct / answered) * 100);
      this.accuracyText.setText(`${accuracy}%`);
      
      if (accuracy >= 80) {
        this.accuracyText.setColor('#2ecc71');
      } else if (accuracy >= 60) {
        this.accuracyText.setColor('#f39c12');
      } else {
        this.accuracyText.setColor('#e74c3c');
      }
    }
  }

  private updatePowerUpIndicators(gameStats: any) {
    const powerUps = [
      { active: gameStats.hasShield, color: 0x4ecdc4, emoji: '🛡️' },
      { active: gameStats.isInvincible, color: 0xffd93d, emoji: '⭐' },
      { active: gameStats.multiplier > 1, color: 0x6bcf7f, emoji: '💎' },
      { active: false, color: 0xff6b6b, emoji: '🚀' },
      { active: false, color: 0xff69b4, emoji: '❤️' }
    ];
    
    powerUps.forEach((powerUp, index) => {
      if (this.powerUpIndicators[index]) {
        const container = this.powerUpIndicators[index];
        
        if (powerUp.active) {
          container.setAlpha(1);
          const background = container.list[0] as any;
          background.setFillStyle(powerUp.color, 0.8);
          
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
          const background = container.list[0] as any;
          background.setFillStyle(0x34495e, 0.8);
          
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
    console.log('UISystem.showQuestion called with:', question);
    this.clearQuestion();
    this.currentQuestionData = question;
    
    const screenWidth = this.scene.cameras.main.width;
    const padding = 40;
    
    // Get camera position for UI positioning
    const camera = this.scene.cameras.main;
    const questionY = 120; // Fixed position at top of screen
    
    console.log('Creating question UI at Y:', questionY);
    
    // Create modern question background with Penseum styling
    this.currentQuestionBg = this.scene.add.rectangle(
      screenWidth / 2,
      questionY,
      screenWidth - padding * 2,
      120,
      0xFFFFFF,
      1.0
    );
    // Clean shadow effect
    this.currentQuestionBg.setStrokeStyle(1, 0xE5E7EB, 1);
    this.currentQuestionBg.setDepth(2000);
    this.currentQuestionBg.setScrollFactor(0); // Make it stick to camera
    
    // Add drop shadow effect by creating a slightly offset background
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
    
    // Create question text with modern Penseum typography
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
    this.currentQuestion.setScrollFactor(0); // Make it stick to camera
    
    // Create modern answer buttons with Penseum styling
    const buttonWidth = (screenWidth - padding * 4) / 2;
    const buttonHeight = 70;
    const startX = padding * 2 + buttonWidth / 2;
    const startY = questionY + 100; // Position buttons below question
    
    question.answers.forEach((answer: string, index: number) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      const x = startX + col * (buttonWidth + 20);
      const y = startY + row * (buttonHeight + 10);
      
      const container = this.scene.add.container(x, y);
      
      const isCorrect = answer === question.correct;
      
      // Penseum-style button design
      const bgColor = 0xFFFFFF; // White background for all buttons
      const borderColor = isCorrect ? 0x7C3AED : 0x000000; // Purple for correct, black for incorrect
      
      const buttonBg = this.scene.add.rectangle(0, 0, buttonWidth, buttonHeight, bgColor, 1);
      buttonBg.setStrokeStyle(3, borderColor, 1); // Strong border
      
      // Add subtle shadow
      const buttonShadow = this.scene.add.rectangle(2, 2, buttonWidth, buttonHeight, 0x000000, 0.1);
      
      const buttonText = this.scene.add.text(0, 0, answer, {
        fontSize: '18px',
        color: isCorrect ? '#7C3AED' : '#000000', // Purple text for correct, black for incorrect
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: buttonWidth - 30 }
      });
      buttonText.setOrigin(0.5);
      
      container.add([buttonShadow, buttonBg, buttonText]);
      container.setDepth(2000);
      container.setScrollFactor(0); // Make buttons stick to camera
      container.setInteractive(new Phaser.Geom.Rectangle(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight), Phaser.Geom.Rectangle.Contains);
      
      // Modern hover effects with Penseum styling
      container.on('pointerover', () => {
        // Change to filled background on hover
        buttonBg.setFillStyle(isCorrect ? 0x7C3AED : 0x000000);
        buttonText.setColor('#FFFFFF'); // White text on colored background
        this.scene.tweens.add({
          targets: container,
          scaleX: 1.02,
          scaleY: 1.02,
          duration: 200,
          ease: 'Power2.easeOut'
        });
      });
      
      container.on('pointerout', () => {
        // Return to white background with colored border/text
        buttonBg.setFillStyle(0xFFFFFF);
        buttonText.setColor(isCorrect ? '#7C3AED' : '#000000');
        this.scene.tweens.add({
          targets: container,
          scaleX: 1,
          scaleY: 1,
          duration: 200,
          ease: 'Power2.easeOut'
        });
      });
      
      // Handle answer selection
      container.on('pointerdown', () => {
        this.selectAnswer(answer, isCorrect, question);
      });
      
      this.answerButtons.push(container);
    });
    
    // Show difficulty and points
    const difficultyText = this.scene.add.text(
      screenWidth - 20,
      60,
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
    
    // Animate everything in
    const elements = [this.currentQuestionBg, this.currentQuestion, difficultyText, ...this.answerButtons];
    elements.forEach(el => {
      el.setAlpha(0);
      this.scene.tweens.add({
        targets: el,
        alpha: 1,
        y: el.y + 20,
        duration: 600,
        ease: 'Back.easeOut'
      });
    });
  }

  private selectAnswer(answer: string, isCorrect: boolean, question: any) {
    // Disable all buttons
    this.answerButtons.forEach(button => {
      button.removeInteractive();
    });
    
    if (isCorrect) {
      this.showFloatingText('CORRECT! +' + question.points, this.scene.cameras.main.width / 2, 300, '#27ae60', '32px');
      this.scene.cameras.main.flash(200, 0, 255, 0, false);
    } else {
      this.showFloatingText('WRONG! -1 Life', this.scene.cameras.main.width / 2, 300, '#e74c3c', '32px');
      this.scene.cameras.main.shake(300, 0.02);
    }
    
    // Emit event to game scene
    this.scene.events.emit('question-answered', { 
      answer, 
      isCorrect, 
      question,
      points: question.points 
    });
    
    // Clear question after delay
    this.scene.time.delayedCall(2000, () => {
      this.clearQuestion();
    });
  }

  clearQuestion() {
    if (this.currentQuestion) {
      this.currentQuestion.destroy();
      this.currentQuestion = undefined;
    }
    
    if (this.currentQuestionBg) {
      this.currentQuestionBg.destroy();
      this.currentQuestionBg = undefined;
    }
    
    this.answerButtons.forEach(button => {
      button.destroy();
    });
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