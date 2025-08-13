import { getRankings, getMatchPreview } from './boxer-stats.js';
import { getTestMode } from './config.js';
import { getPlayerBoxer, getMaxPlaybookLevel } from './player-boxer.js';
import { SoundManager } from './sound-manager.js';
import { scheduleMatch, getPendingMatch, clearPendingMatch } from './next-match.js';
import { RULESETS } from './ruleset-data.js';

export class MatchSetupScene extends Phaser.Scene {
  constructor() {
    super('MatchSetup');
    this.isBoxer1Human = false;
    this.selectedPlaybook1 = 'default';
    this.selectedFightPlan1 = 'default';
    this.selectedPlaybook2 = 'default';
    this.selectedFightPlan2 = 'default';
    this.selectedRounds = 1;
  }

  create() {
    const width = this.sys.game.config.width;
    const height = this.sys.game.config.height;
    this.add
      .text(20, 20, 'Match setup', { font: '24px Arial', color: '#ffffff' })
      .setOrigin(0, 0);

    this.createControlOptions(width);
    this.createSelectors(width);
    this.showOpponentOptions(width, height);

    const back = () => {
      this.scene.start('Ranking');
    };
    this.add
      .text(20, height - 40, 'Back', { font: '24px Arial', color: '#ffff00' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', back);
    this.input.keyboard.on('keydown-BACKSPACE', back);
  }

  createControlOptions(width) {
    const spacing = 40;
    const startX = width / 2 - 150 - spacing / 2;
    const centerY = 100;

    const makeOption = (x, label, icon, mode) => {
      const container = this.add.container(x, centerY);
      const bg = this.add.rectangle(0, 0, 300, 200, 0x001b44, 0.4);
      const img = this.add.image(0, -30, icon).setDisplaySize(128, 128);
      const txt = this.add
        .text(0, 70, label, { font: '32px Arial', color: '#ffffff' })
        .setOrigin(0.5);
      container.add([bg, img, txt]);
      container.setSize(300, 200);
      container.setInteractive({ useHandCursor: true });
      container.on('pointerdown', () => {
        SoundManager.playClick();
        this.isBoxer1Human = mode === 'human';
      });
    };

    makeOption(startX, 'Computer', 'computer', 'ai');
    makeOption(startX + 300 + spacing, 'Keyboard', 'keyboard', 'human');
  }

  createSelectors(width) {
    const player = getPlayerBoxer();
    const plans = Object.values(RULESETS);
    const availablePlans1 = plans.filter(
      (p) => !p.perk || player.perks?.some((r) => r.Name === p.perk)
    );
    const maxLevel = getMaxPlaybookLevel();
    const html = `
      <div style="color:#fff;font-family:Arial;font-size:18px;background:rgba(0,0,0,0.6);padding:10px;border-radius:10px;">
        <div>Playbook P1: <input type="number" id="pb1" min="1" max="${maxLevel}" value="${maxLevel}" style="width:60px" /></div>
        <div>Fight plan P1: <select id="fp1">${availablePlans1
          .map((p) => `<option value="${p.id}">${p.name}</option>`)
          .join('')}</select></div>
        ${
          getTestMode()
            ? `<div>Playbook P2: <input type="number" id="pb2" min="1" max="10" value="1" style="width:60px" /></div>
               <div>Fight plan P2: <select id="fp2">${plans
                 .map((p) => `<option value="${p.id}">${p.name}</option>`)
                 .join('')}</select></div>`
            : ''
        }
        <div>Rounds: <input type="number" id="rounds" min="1" max="13" value="1" style="width:60px" /></div>
      </div>`;
    const dom = this.add.dom(width / 2, 260).createFromHTML(html);
    const pb1 = dom.getChildByID('pb1');
    const fp1 = dom.getChildByID('fp1');
    const pb2 = dom.getChildByID('pb2');
    const fp2 = dom.getChildByID('fp2');
    const roundsInput = dom.getChildByID('rounds');
    pb1?.addEventListener('change', () => {
      this.selectedPlaybook1 = pb1.value;
    });
    fp1?.addEventListener('change', () => {
      this.selectedFightPlan1 = fp1.value;
    });
    pb2?.addEventListener('change', () => {
      this.selectedPlaybook2 = pb2.value;
    });
    fp2?.addEventListener('change', () => {
      this.selectedFightPlan2 = fp2.value;
    });
    roundsInput.addEventListener('change', () => {
      const val = parseInt(roundsInput.value, 10);
      this.selectedRounds = Phaser.Math.Clamp(val || 1, 1, 13);
    });
  }

  showOpponentOptions(width, height) {
    const allBoxers = getRankings();
    const maxNameLen = allBoxers.reduce((m, b) => Math.max(m, b.name.length), 4);
    const namePad = Math.max(15, maxNameLen + 1);
    const maxRegionLen = allBoxers.reduce(
      (m, b) => Math.max(m, (b.continent || '').length),
      0
    );
    const regionPad = Math.max(14, maxRegionLen + 1);
    const rectWidth = width * 0.9;
    const charWidth = 12;
    const totalChars = Math.floor(rectWidth / charWidth);
    const baseWidths = [5, namePad, regionPad, 5, 5, 5, 5, 5, 5, 10];
    const baseWidth = baseWidths.reduce((sum, w) => sum + w, 0);
    const titlePad = Math.max(totalChars - baseWidth, 20);
    const columnWidths = [
      baseWidths[0],
      baseWidths[1],
      baseWidths[2],
      baseWidths[3],
      baseWidths[4],
      baseWidths[5],
      baseWidths[6],
      baseWidths[7],
      baseWidths[8],
      titlePad,
      baseWidths[9],
    ];
    const rowHeight = 24;
    const tableLeft = width * 0.05;
    this.add
      .rectangle(tableLeft, 360, rectWidth, rowHeight, 0x001b44, 0.4)
      .setOrigin(0, 0);
    const headers =
      `${'Rank'.padEnd(columnWidths[0])}` +
      `${'Name'.padEnd(columnWidths[1])}` +
      `${'Region'.padEnd(columnWidths[2])}` +
      `${'Age'.padEnd(columnWidths[3])}` +
      `${'M'.padEnd(columnWidths[4])}` +
      `${'W'.padEnd(columnWidths[5])}` +
      `${'L'.padEnd(columnWidths[6])}` +
      `${'D'.padEnd(columnWidths[7])}` +
      `${'KO'.padEnd(columnWidths[8])}` +
      `${'Titles'.padEnd(columnWidths[9])}` +
      `${'Title bout'.padEnd(columnWidths[10])}`;
    this.add.text(tableLeft, 360, headers, {
      font: '20px monospace',
      color: '#ffff00',
    });
    const player = getPlayerBoxer();
    const above = allBoxers
      .filter((b) => b.ranking < player.ranking)
      .slice(-3);
    const belowOrEqual = allBoxers.filter((b) => b.ranking >= player.ranking);
    const boxers = above.concat(belowOrEqual);
    boxers.forEach((b, i) => {
      const y = 380 + i * 24;
      this.add
        .rectangle(tableLeft, y, rectWidth, rowHeight, 0x001b44, 0.4)
        .setOrigin(0, 0);
      const titlesStr = b.titles ? b.titles.map((t) => `${t}🏆`).join(' ') : '';
      const isPlayer = b === player;
      const preview = !isPlayer ? getMatchPreview(player, b) : null;
      const isTitleBout = preview && preview.titlesOnTheLine.length > 0;
      const line =
        `${b.ranking.toString().padEnd(columnWidths[0])}` +
        `${b.name.padEnd(columnWidths[1])}` +
        `${(b.continent || '').padEnd(columnWidths[2])}` +
        `${b.age.toString().padEnd(columnWidths[3])}` +
        `${b.matches.toString().padEnd(columnWidths[4])}` +
        `${b.wins.toString().padEnd(columnWidths[5])}` +
        `${b.losses.toString().padEnd(columnWidths[6])}` +
        `${b.draws.toString().padEnd(columnWidths[7])}` +
        `${b.winsByKO.toString().padEnd(columnWidths[8])}` +
        `${titlesStr.padEnd(columnWidths[9])}` +
        `${(isTitleBout ? 'Yes' : '').padEnd(columnWidths[10])}`;
      const txt = this.add.text(tableLeft, y, line, {
        font: '20px monospace',
        color: isPlayer ? '#404040' : '#ffffff',
        fontStyle: isPlayer ? 'bold' : 'normal',
      });
      if (!isPlayer) {
        txt.setInteractive({ useHandCursor: true });
        txt.on('pointerdown', () => this.selectOpponent(b));
      }
    });
  }

  selectOpponent(boxer2) {
    SoundManager.playClick();
    const boxer1 = getPlayerBoxer();
    if (this.selectedFightPlan1 && this.selectedFightPlan1 !== 'default') {
      boxer1.ruleset = this.selectedFightPlan1;
    }
    if (this.selectedFightPlan2 && this.selectedFightPlan2 !== 'default') {
      boxer2.ruleset = this.selectedFightPlan2;
    }
    const aiLevel1 = this.isBoxer1Human ? null : this.selectedPlaybook1;
    const aiLevel2 = this.selectedPlaybook2;
    scheduleMatch({
      boxer1,
      boxer2,
      aiLevel1,
      aiLevel2,
      rounds: this.selectedRounds,
    });
    const pending = getPendingMatch();
    if (pending) {
      const matchData = { ...pending, red: pending.boxer1, blue: pending.boxer2 };
      clearPendingMatch();
      this.scene.start('MatchIntroScene', matchData);
    }
  }
}
