import { getRankings } from './boxer-stats.js';

export class RankingScene extends Phaser.Scene {
  constructor() {
    super('Ranking');
  }

  create() {
    const width = this.sys.game.config.width;
    const height = this.sys.game.config.height;
    this.add
      .text(width / 2, 20, 'Ranking', {
        font: '32px Arial',
        color: '#ffffff',
      })
      .setOrigin(0.5, 0);

    const boxers = getRankings();
    boxers.forEach((b, i) => {
      const line = `${b.ranking}. ${b.name} - M:${b.matches} W:${b.wins} L:${b.losses} D:${b.draws} KO:${b.winsByKO}`;
      this.add.text(80, 80 + i * 24, line, {
        font: '20px Arial',
        color: '#ffffff',
      });
    });

    this.add
      .text(width / 2, height - 60, 'New game', {
        font: '24px Arial',
        color: '#00ff00',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => {
        this.scene.start('SelectBoxer');
      });
  }
}

