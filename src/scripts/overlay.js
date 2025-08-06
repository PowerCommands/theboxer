import { eventBus } from './event-bus.js';

export class OverlayUI extends Phaser.Scene {
  constructor() {
    super('OverlayUI');
    this.pendingNames = ['', ''];
    this.newMatchText = null;
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

    eventBus.on('timer-tick', (seconds) => this.updateTimerText(seconds));
    eventBus.on('round-started', (round) => this.showRound(round));
    eventBus.on('set-names', ({ p1, p2 }) => this.setNames(p1, p2));
    eventBus.on('health-changed', ({ player, value }) => {
      this.setBarValue(this.bars[player].health, value);
    });
    eventBus.on('stamina-changed', ({ player, value }) => {
      this.setBarValue(this.bars[player].stamina, value);
    });
    eventBus.on('power-changed', ({ player, value }) => {
      this.setBarValue(this.bars[player].power, value);
    });
    eventBus.on('match-winner', (name) => this.announceWinner(name));

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      eventBus.off('timer-tick');
      eventBus.off('round-started');
      eventBus.off('set-names');
      eventBus.off('health-changed');
      eventBus.off('stamina-changed');
      eventBus.off('power-changed');
      eventBus.off('match-winner');
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

  updateTimerText(seconds) {
    if (!this.timerText) return;
    const minutes = Math.floor(seconds / 60);
    const s = seconds % 60;
    this.timerText.setText(`${minutes}:${s.toString().padStart(2, '0')}`);
  }

  showRound(number) {
    if (!this.roundText) return;
    this.roundText.setText(`Round ${number}`);
  }

  setNames(p1, p2) {
    this.pendingNames = [p1, p2];
    if (this.nameText) {
      this.nameText.p1.setText(p1);
      this.nameText.p2.setText(p2);
    }
  }

  stopClock() {
    this.updateTimerText(0);
  }

  announceWinner(name) {
    if (this.roundText) {
      this.roundText.setText(`${name} wins by KO!`);
    }
    if (!this.newMatchText) {
      const width = this.sys.game.config.width;
      const height = this.sys.game.config.height;
      this.newMatchText = this.add
        .text(width / 2, height / 2, 'Start New Match', {
          font: '32px Arial',
          color: '#ffffff',
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      this.newMatchText.on('pointerup', () => {
        this.scene.stop('Match');
        this.scene.start('SelectBoxer');
      });
    } else {
      this.newMatchText.setVisible(true);
    }
  }
}
