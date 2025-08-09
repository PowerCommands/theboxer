import { eventBus } from './event-bus.js';
import { appConfig } from './config.js';

export class OverlayUI extends Phaser.Scene {
  constructor() {
    super('OverlayUI');
    this.pendingNames = ['', ''];
    this.newMatchText = null;
    this.rankingText = null;
    this.nextRoundText = null;
    this.matchOver = false;
  }

  create() {
    const width = this.sys.game.config.width;
    const infoY = 0;
    const infoHeight = 120;
    this.add
      .rectangle(width / 2, infoY, width, infoHeight, 0x808080, 0.5)
      .setOrigin(0.5, 0);

    // show application name and version
    this.appInfoText = this.add.text(
      width / 2,
      infoY + 10,
      `${appConfig.name} v${appConfig.version}`,
      {
        font: '20px Arial',
        color: '#ffffff',
      }
    );
    this.appInfoText.setOrigin(0.5, 0);

    // create timer text centered slightly lower
    this.timerText = this.add.text(width / 2, infoY + 40, '0:00', {
      font: '24px Arial',
      color: '#ffffff',
    });
    this.timerText.setOrigin(0.5, 0);

    this.roundText = this.add.text(width / 2, infoY + 70, '', {
      font: '24px Arial',
      color: '#ffffff',
    });
    this.roundText.setOrigin(0.5, 0);

    this.nameText = {
      p1: this.add.text(20, infoY + 2, this.pendingNames[0], {
        font: '20px Arial',
        color: '#ffffff',
      }),
      p2: this.add.text(width - 170, infoY + 2, this.pendingNames[1], {
        font: '20px Arial',
        color: '#ffffff',
      }),
    };

    // create bars for player1 and player2
    this.bars = {
      p1: {
        stamina: this.createBar(20, infoY + 20, 150, 15, 0x00aa00),
        power: this.createBar(20, infoY + 40, 150, 15, 0x0000aa),
        health: this.createBar(20, infoY + 60, 150, 15, 0xaa0000),
      },
      p2: {
        stamina: this.createBar(width - 170, infoY + 20, 150, 15, 0x00aa00),
        power: this.createBar(width - 170, infoY + 40, 150, 15, 0x0000aa),
        health: this.createBar(width - 170, infoY + 60, 150, 15, 0xaa0000),
      },
    };

    this.hitText = {
      p1: this.add.text(20, infoY + 90, 'Hits: 0', {
        font: '16px Arial',
        color: '#ffffff',
      }),
      p2: this.add.text(width - 170, infoY + 90, 'Hits: 0', {
        font: '16px Arial',
        color: '#ffffff',
      }),
    };

    // initialize full bars
    this.setBarValue(this.bars.p1.stamina, 1);
    this.setBarValue(this.bars.p1.power, 1);
    this.setBarValue(this.bars.p1.health, 1);
    this.setBarValue(this.bars.p2.stamina, 1);
    this.setBarValue(this.bars.p2.power, 1);
    this.setBarValue(this.bars.p2.health, 1);

    eventBus.on('timer-tick', (seconds) => this.updateTimerText(seconds));
    eventBus.on('round-started', (round) => {
      this.hideNextRoundButton();
      this.showRound(round);
    });
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
    eventBus.on('round-ended', () => this.showNextRoundButton());
    eventBus.on('match-winner', (data) => {
      this.matchOver = true;
      this.hideNextRoundButton();
      this.announceWinner(data);
    });
    eventBus.on('hit-update', ({ p1, p2 }) => {
      this.hitText.p1.setText(`Hits: ${p1}`);
      this.hitText.p2.setText(`Hits: ${p2}`);
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      eventBus.off('timer-tick');
      eventBus.off('round-started');
      eventBus.off('set-names');
      eventBus.off('health-changed');
      eventBus.off('stamina-changed');
      eventBus.off('power-changed');
      eventBus.off('round-ended');
      eventBus.off('match-winner');
      eventBus.off('hit-update');
    });
  }

  createBar(x, y, width, height, color) {
    const bg = this.add.rectangle(x, y, width, height, 0x444444).setOrigin(0, 0);
    const fill = this.add
      .rectangle(x + 1, y + 1, width - 2, height - 2, color)
      .setOrigin(0, 0);
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

  announceWinner({ name, method, round }) {
    if (this.roundText) {
      if (method === 'KO') {
        this.roundText.setText(`${name} wins by KO in round ${round}!`);
      } else if (method === 'Draw') {
        this.roundText.setText('Match ends in a draw!');
      } else {
        this.roundText.setText(`${name} wins on points!`);
      }
    }
    // Ensure this overlay scene is rendered above the match scene so
    // that the post-match buttons are never hidden behind the boxers.
    this.scene.bringToTop();
    const width = this.sys.game.config.width;
    const height = this.sys.game.config.height;
    if (!this.newMatchText) {
      this.newMatchText = this.add
        .text(width / 2, height / 2, 'Start New Match', {
          font: '32px Arial',
          color: '#ffffff',
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .setDepth(1);
      this.newMatchText.on('pointerup', () => {
        this.scene.stop('Match');
        this.scene.start('SelectBoxer');
      });
    } else {
      this.newMatchText.setVisible(true);
    }

    if (!this.rankingText) {
      this.rankingText = this.add
        .text(width / 2, height / 2 + 40, 'Show ranking', {
          font: '32px Arial',
          color: '#ffffff',
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .setDepth(1);
      this.rankingText.on('pointerup', () => {
        this.scene.stop('Match');
        this.scene.start('Ranking');
      });
    } else {
      this.rankingText.setVisible(true);
    }
  }

  showNextRoundButton() {
    if (this.matchOver) return;
    const width = this.sys.game.config.width;
    const height = this.sys.game.config.height;
    if (!this.nextRoundText) {
      this.nextRoundText = this.add
        .text(width / 2, height / 2, 'Next round', {
          font: '32px Arial',
          color: '#ffffff',
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .setDepth(1);
      this.nextRoundText.on('pointerup', () => {
        this.nextRoundText.setVisible(false);
        eventBus.emit('next-round');
      });
    } else {
      this.nextRoundText.setVisible(true);
    }
  }

  hideNextRoundButton() {
    if (this.nextRoundText) this.nextRoundText.setVisible(false);
  }
}
