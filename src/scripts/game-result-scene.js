import { formatMoney, makeWhiteTransparent } from './helpers.js';
import { SoundManager } from './sound-manager.js';
import { updateMatchResult, clearCurrentMatches } from './calendar.js';
import { advanceMonth } from './game-date.js';
import { BOXERS } from './boxers.js';
import { saveGameState } from './save-system.js';

export class GameResultScene extends Phaser.Scene {
  constructor() {
    super('GameResultScene');
  }

  init(data) {
    this.resultData = data || {};
  }

  create() {
    const width = this.sys.game.config.width;
    const height = this.sys.game.config.height;
    SoundManager.playMenuLoop();

    this.add
      .text(width / 2, 20, 'Match Result', {
        font: '32px Arial',
        color: '#ffffff',
      })
      .setOrigin(0.5, 0);

    const rounds = Array.isArray(this.resultData.roundLog)
      ? this.resultData.roundLog
      : [];
    let y = 80;
    rounds.forEach((r) => {
      const line = `Round ${r.round}: ${r.p1Score}-${r.p2Score} (${r.totalP1}-${r.totalP2})`;
      this.add.text(width / 2, y, line, {
        font: '24px Arial',
        color: '#ffffff',
      }).setOrigin(0.5);
      y += 30;
    });
    y += 20;

    const b1 = this.resultData.b1 || {};
    const b2 = this.resultData.b2 || {};
    const b1RankChange =
      b1.rankingBefore != null && b1.rankingAfter != null
        ? b1.rankingBefore - b1.rankingAfter
        : 0;
    const b2RankChange =
      b2.rankingBefore != null && b2.rankingAfter != null
        ? b2.rankingBefore - b2.rankingAfter
        : 0;
    const b1Line = `${b1.name || 'Boxer 1'}: ${formatMoney(b1.prize)}  Rank ${
      b1.rankingBefore ?? '-'
    }→${b1.rankingAfter ?? '-'}${b1RankChange > 0 ? ' ↑' : ''}`;
    const b2Line = `${b2.name || 'Boxer 2'}: ${formatMoney(b2.prize)}  Rank ${
      b2.rankingBefore ?? '-'
    }→${b2.rankingAfter ?? '-'}${b2RankChange > 0 ? ' ↑' : ''}`;
    this.add
      .text(width / 2, y, b1Line, { font: '28px Arial', color: '#ffffff' })
      .setOrigin(0.5);
    this.add
      .text(width / 2, y + 40, b2Line, { font: '28px Arial', color: '#ffffff' })
      .setOrigin(0.5);
    y += 100;

    const belts = Array.isArray(this.resultData.titlesWon)
      ? this.resultData.titlesWon
      : [];
    if (belts.length > 0) {
      const beltY = y;
      const beltW = 220;
      const spacing = 20;
      const totalW = belts.length * beltW + (belts.length - 1) * spacing;
      let startX = (width - totalW) / 2 + beltW / 2;
      belts.forEach((b) => {
        const imgKey = makeWhiteTransparent(this, b.imageKey || b.code || b);
        const belt = this.add.image(startX, beltY, imgKey).setOrigin(0.5);
        belt.setDisplaySize(beltW, beltW * 0.5);
        startX += beltW + spacing;
      });
      y = beltY + beltW * 0.5 + 60;
    }

    const emitter = this.add.particles(0, 0, 'coin', {
      x: { min: width / 2 - 250, max: width / 2 + 250 },
      y: { min: -150, max: -50 },
      speedY: { min: 200, max: 400 },
      lifespan: 2000,
      quantity: 2,
      frequency: 80,
      scale: { start: 0.7, end: 0.2 },
      alpha: { start: 1, end: 0 },
      emitting: true,
    }).setDepth(10);
    this.time.delayedCall(1200, () => emitter.stop());

    const contY = height - 60;
    const cont = this.add
      .text(width / 2, contY, 'Continue', {
        font: '32px Arial',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const goNext = () => {
      if (
        typeof this.resultData.matchIndex === 'number' &&
        this.resultData.matchSummary
      ) {
        updateMatchResult(
          this.resultData.matchIndex,
          this.resultData.matchSummary
        );
      }
      if (this.resultData.returnScene === 'Calendar') {
        this.scene.start('Calendar');
      } else {
        clearCurrentMatches();
        advanceMonth();
        saveGameState(BOXERS);
        this.scene.start('Ranking');
      }
    };
    cont.once('pointerup', goNext);
    this.input.keyboard.once('keydown', goNext);
  }
}

