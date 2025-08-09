import { ARENAS } from './arena-data.js';

export class ArenaManager {
  static getRandomArena(highestRank) {
    let prestige;
    if (highestRank > 7) {
      prestige = 1;
    } else if (highestRank > 2) {
      prestige = 2;
    } else {
      prestige = 1;
    }
    const options = ARENAS.filter((a) => a.Prestige === prestige);
    const index = Phaser.Math.Between(0, options.length - 1);
    return options[index];
  }
}
