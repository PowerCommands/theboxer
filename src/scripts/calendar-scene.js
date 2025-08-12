import { generateMonthlyMatches, simulateMatch } from './calendar.js';
import { getPendingMatch, clearPendingMatch } from './next-match.js';
import { getMatchLog } from './match-log.js';
import { SoundManager } from './sound-manager.js';

export class CalendarScene extends Phaser.Scene {
  constructor() {
    super('Calendar');
    this.matches = [];
    this.currentIndex = 0;
    this.rows = [];
  }

  create() {
    const width = this.sys.game.config.width;
    SoundManager.playMenuLoop();
    const pending = getPendingMatch();
    if (!pending) {
      // No scheduled player match, return to rankings
      this.scene.start('Ranking');
      return;
    }

    const { matches } = generateMonthlyMatches(getMatchLog().length, [
      pending.boxer1.name,
      pending.boxer2.name,
    ]);
    // Player match is always last
    this.matches = [...matches, { ...pending, player: true }];

    this.title = this.add
      .text(width / 2, 20, 'Upcoming Matches', {
        font: '32px Arial',
        color: '#ffffff',
      })
      .setOrigin(0.5, 0);

    this.render();
  }

  formatLine(match) {
    let line = `${match.date} ${match.boxer1.name} vs ${match.boxer2.name}`;
    if (match.result) {
      line += ` - ${match.result.winner} ${match.result.method}`;
    }
    return line;
  }

  render() {
    this.rows.forEach((r) => r.destroy());
    this.rows = [];
    const width = this.sys.game.config.width;
    const startY = 80;
    this.matches.forEach((m, i) => {
      const txt = this.add
        .text(width / 2, startY + i * 40, this.formatLine(m), {
          font: '24px Arial',
          color: '#ffffff',
        })
        .setOrigin(0.5, 0);
      if (!m.result && i === this.currentIndex) {
        txt.setColor('#00ff00');
        txt.setInteractive({ useHandCursor: true });
        txt.on('pointerup', () => this.handleMatch(m));
      }
      this.rows.push(txt);
    });
  }

  async handleMatch(match) {
    if (match.player) {
      const matchData = { ...match, red: match.boxer1, blue: match.boxer2 };
      clearPendingMatch();
      this.scene.start('MatchIntroScene', matchData);
      return;
    }
    await simulateMatch(match, 500);
    this.currentIndex += 1;
    this.render();
  }
}

