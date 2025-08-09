import { getMatchLog } from './match-log.js';
import { SoundManager } from './sound-manager.js';

export class MatchLogScene extends Phaser.Scene {
  constructor() {
    super('MatchLog');
  }

  create() {
    const width = this.sys.game.config.width;
    SoundManager.playMenuLoop();
    this.add
      .text(width / 2, 20, 'Match log', {
        font: '32px Arial',
        color: '#ffffff',
      })
      .setOrigin(0.5, 0);

    const log = getMatchLog();
    let y = 80;
    if (!log.length) {
      this.add
        .text(width / 2, y, 'No matches recorded', {
          font: '24px Arial',
          color: '#ffffff',
        })
        .setOrigin(0.5, 0);
    } else {
      log.forEach((entry) => {
        const summaryParts = [];
        summaryParts.push(`vs ${entry.opponent}`);
        summaryParts.push(entry.result);
        summaryParts.push(`by ${entry.method}`);
        if (entry.method === 'KO') {
          summaryParts.push(`R${entry.round} ${entry.time}`);
        } else if (entry.method === 'Points') {
          summaryParts.push(`${entry.rounds}R ${entry.score}`);
        }
        const summary = summaryParts.join(' - ');
        const sumText = this.add
          .text(20, y, summary, { font: '20px Arial', color: '#ffffff' })
          .setInteractive({ useHandCursor: true });
        let detailsLines = [];
        if (entry.roundDetails) {
          detailsLines = entry.roundDetails.map(
            (r) =>
              `R${r.round}: ${r.userScore}-${r.oppScore} (${r.totalUser}-${r.totalOpp})`
          );
        }
        const detText = this.add
          .text(40, y + 24, detailsLines.join('\n'), {
            font: '18px Arial',
            color: '#dddddd',
          })
          .setVisible(false);
        sumText.on('pointerup', () => {
          detText.setVisible(!detText.visible);
        });
        y += sumText.height + detText.height + 10;
      });
    }

    this.add
      .text(20, this.sys.game.config.height - 40, 'Back', {
        font: '24px Arial',
        color: '#00ff00',
      })
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => {
        this.scene.start('Ranking');
      });
  }
}
