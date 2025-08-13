import { PERKS } from './perks-data.js';
import { getPlayerBoxer } from './player-boxer.js';
import { addTransaction, getBalance } from './bank-account.js';
import { formatMoney } from './helpers.js';
import { SoundManager } from './sound-manager.js';
import { saveGameState } from './save-system.js';
import { BOXERS } from './boxers.js';

export class PerksScene extends Phaser.Scene {
  constructor() {
    super('PerksScene');
  }

  create() {
    const width = this.sys.game.config.width;
    const height = this.sys.game.config.height;
    SoundManager.playMenuLoop();
    const player = getPlayerBoxer();

    this.add
      .text(width / 2, 20, 'Perks', {
        font: '32px Arial',
        color: '#ffffff',
      })
      .setOrigin(0.5, 0);

    const balanceText = this.add
      .text(
        width / 2,
        60,
        `Bank account balance: ${formatMoney(getBalance())}`,
        {
          font: '24px Arial',
          color: '#ffffff',
        }
      )
      .setOrigin(0.5, 0);

    const startY = 120;
    const spacing = 120;
    PERKS.forEach((perk, idx) => {
      const y = startY + idx * spacing;
      const key = `${perk.Name.toLowerCase()}-level${perk.Level}`;
      this.add.image(width / 2 - 200, y, key).setDisplaySize(100, 100);
      const label = `${perk.Name} Level ${perk.Level} - ${formatMoney(
        perk.Price
      )}`;
      this.add.text(width / 2 - 100, y - 40, label, {
        font: '24px Arial',
        color: '#ffffff',
      });
      const owned = player?.perks?.some(
        (p) => p.Name === perk.Name && p.Level === perk.Level
      );
      const btn = this.add
        .text(width / 2 + 200, y, owned ? 'Owned' : 'Buy', {
          font: '24px Arial',
          color: '#ffff00',
        })
        .setOrigin(0.5, 0)
        .setInteractive({ useHandCursor: true });
      if (owned) {
        btn.disableInteractive().setTint(0x888888);
      } else {
        btn.on('pointerdown', () => {
          if (getBalance() < perk.Price) return;
          player.perks.push({ ...perk });
          addTransaction(-perk.Price);
          player.bank = (player.bank || 0) - perk.Price;
          saveGameState(BOXERS);
          balanceText.setText(
            `Bank account balance: ${formatMoney(getBalance())}`
          );
          btn.setText('Owned').disableInteractive().setTint(0x888888);
        });
      }
    });

    this.add
      .text(20, height - 40, 'Back', {
        font: '24px Arial',
        color: '#ffff00',
      })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.scene.start('MatchLog', { boxer: player });
      });
  }
}
