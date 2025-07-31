export class OverlayUI extends Phaser.Scene {
  constructor() {
    super('OverlayUI');
    this.remainingTime = 0; // in seconds
    this.roundNumber = 0;
    this.pendingStart = false;
    this.pendingNames = ['', ''];
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

    this.nameText = {
      p1: this.add.text(20, 2, this.pendingNames[0], {
        font: '20px Arial',
        color: '#ffffff',
      }),
      p2: this.add.text(width - 170, 2, this.pendingNames[1], {
        font: '20px Arial',
        color: '#ffffff',
      }),
    };

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

    if (this.pendingStart) {
      this.startRound(this.remainingTime, this.roundNumber);
      this.pendingStart = false;
    }
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
    if (!this.timerText) return;
    const minutes = Math.floor(this.remainingTime / 60);
    const seconds = this.remainingTime % 60;
    this.timerText.setText(`${minutes}:${seconds.toString().padStart(2, '0')}`);
  }

  startRound(seconds, number) {
    this.remainingTime = seconds;
    this.roundNumber = number;
    if (!this.roundText) {
      this.pendingStart = true;
      return;
    }
    this.updateTimerText();
    this.roundText.setText(`Round ${number}`);
    this.time.delayedCall(2000, () => {
      this.roundText.setText('');
    });
  }

  setNames(p1, p2) {
    this.pendingNames = [p1, p2];
    if (this.nameText) {
      this.nameText.p1.setText(p1);
      this.nameText.p2.setText(p2);
    }
  }
}
