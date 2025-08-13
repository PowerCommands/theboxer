import { PERKS } from './perks-data.js';
import { getPlayerBoxer } from './player-boxer.js';
import { addTransaction, getBalance, getTransactions } from './bank-account.js';
import { getTestMode } from './config.js';
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

    const startY = 140; // shifted down 20px
    const spacing = 120;
    const leftMargin = width * 0.05;
    const testMode = getTestMode();
    const buttons = [];
    let txTexts = [];

    const renderTransactions = () => {
      txTexts.forEach((t) => t.destroy());
      txTexts = [];
      const txStartX = leftMargin + 500;
      txTexts.push(
        this.add.text(txStartX, startY - 40, 'Transactions', {
          font: '24px Arial',
          color: '#ffffff',
        })
      );
      getTransactions()
        .slice()
        .forEach((amt, idx) => {
          txTexts.push(
            this.add.text(txStartX, startY + idx * 30, formatMoney(amt), {
              font: '20px Arial',
              color: '#ffffff',
            })
          );
        });
    };

    const updateButtons = () => {
      buttons.forEach(({ btn, perk }) => {
        const owned = player?.perks?.some(
          (p) => p.Name === perk.Name && p.Level === perk.Level
        );
        const prevOwned =
          perk.Level === 1 ||
          player?.perks?.some(
            (p) => p.Name === perk.Name && p.Level === perk.Level - 1
          );
        if (owned) {
          btn.setText('Owned').disableInteractive().setTint(0x888888);
        } else if (!prevOwned && !testMode) {
          btn.setText('Locked').disableInteractive().setTint(0x888888);
        } else if (!testMode && getBalance() < perk.Price) {
          btn
            .setText('Not enough money')
            .disableInteractive()
            .setTint(0x888888);
        } else {
          btn
            .setText('Buy')
            .setInteractive({ useHandCursor: true })
            .clearTint();
        }
      });
    };

    PERKS.forEach((perk, idx) => {
      const y = startY + idx * spacing;
      const key = `${perk.Name.toLowerCase()}-level${perk.Level}`;
      this.add.image(leftMargin + 50, y, key).setDisplaySize(100, 100);
      const label = `${perk.Name} Level ${perk.Level} - ${formatMoney(
        perk.Price
      )}`;
      this.add.text(leftMargin + 150, y - 40, label, {
        font: '24px Arial',
        color: '#ffffff',
      });
      const btn = this.add
        .text(leftMargin + 450, y, '', {
          font: '24px Arial',
          color: '#ffff00',
        })
        .setOrigin(0.5, 0);

      btn.on('pointerdown', () => {
        if (!testMode) {
          if (getBalance() < perk.Price) return;
          const prereq =
            perk.Level === 1 ||
            player.perks.some(
              (p) => p.Name === perk.Name && p.Level === perk.Level - 1
            );
          if (!prereq) return;
          addTransaction(-perk.Price);
          player.bank = (player.bank || 0) - perk.Price;
        }
        player.perks.push({ ...perk });
        saveGameState(BOXERS);
        balanceText.setText(
          `Bank account balance: ${formatMoney(getBalance())}`
        );
        updateButtons();
        renderTransactions();
      });

      buttons.push({ btn, perk });
    });

    updateButtons();
    renderTransactions();

    const goBack = () => {
      this.scene.start('Ranking');
    };
    this.add
      .text(20, height - 40, 'Back', {
        font: '24px Arial',
        color: '#ffff00',
      })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', goBack);
    this.input.keyboard.on('keydown-BACKSPACE', goBack);
  }
}
