export class OverlayUI extends Phaser.Scene {
  constructor() {
    super('OverlayUI');
    this.remainingTime = 0; // in seconds
    this.roundNumber = 0;
  }

  create() {
    const width = this.sys.game.config.width;
    // create timer text centered at top
    this.timerText = this.add.text(width / 2, 20, '0:00', {
      font: '24px Arial',
      color: '#ffffff',
    });
    this.timerText.setOrigin(0.5, 0);

    this.roundText = this.add.text(width / 2, 50, '', {
      font: '24px Arial',
      color: '#ffffff',
    });
    this.roundText.setOrigin(0.5, 0);

    // create bars for player1 and player2
    this.bars = {
      p1: {
        stamina: this.createBar(20, 20, 150, 15, 0x00aa00),
        power: this.createBar(20, 40, 150, 15, 0x0000aa),
        health: this.createBar(20, 60, 150, 15, 0xaa0000),
      },
      p2: {
        stamina: this.createBar(width - 170, 20, 150, 15, 0x00aa00),
        power: this.createBar(width - 170, 40, 150, 15, 0x0000aa),
        health: this.createBar(width - 170, 60, 150, 15, 0xaa0000),
      },
    };

    // initialize full bars
    this.setBarValue(this.bars.p1.stamina, 1);
    this.setBarValue(this.bars.p1.power, 1);
    this.setBarValue(this.bars.p1.health, 1);
    this.setBarValue(this.bars.p2.stamina, 1);
    this.setBarValue(this.bars.p2.power, 1);
    this.setBarValue(this.bars.p2.health, 1);

    // update timer once per second
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (this.remainingTime > 0) {
          this.remainingTime -= 1;
          this.updateTimerText();
          if (this.remainingTime === 0) {
            this.events.emit('round-ended', this.roundNumber);
          }
        }
      },
    });
  }

  createBar(x, y, width, height, color) {
    const bg = this.add.rectangle(x, y, width, height, 0x444444).setOrigin(0, 0);
    const fill = this.add.rectangle(x + 1, y + 1, width - 2, height - 2, color).setOrigin(0, 0);
    return { bg, fill, width: width - 2 };
  }

  setBarValue(bar, value) {
    const w = Phaser.Math.Clamp(value, 0, 1) * bar.width;
    bar.fill.width = w;
  }

  updateTimerText() {
    const minutes = Math.floor(this.remainingTime / 60);
    const seconds = this.remainingTime % 60;
    this.timerText.setText(`${minutes}:${seconds.toString().padStart(2, '0')}`);
  }

  startRound(seconds, number) {
    this.remainingTime = seconds;
    this.roundNumber = number;
    this.updateTimerText();
    this.roundText.setText(`Round ${number}`);
    this.time.delayedCall(2000, () => {
      this.roundText.setText('');
    });
  }
}
