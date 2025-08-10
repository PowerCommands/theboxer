import { getRankings } from './boxer-stats.js';
import { appConfig, getTestMode, setTestMode } from './config.js';
import { getPlayerBoxer } from './player-boxer.js';
import { SoundManager } from './sound-manager.js';
import { getPendingMatch, clearPendingMatch } from './next-match.js';
import {
  loadGameState,
  applyLoadedState,
  migrateIfNeeded,
  resetSavedData,
} from './save-system.js';

export class RankingScene extends Phaser.Scene {
  constructor() {
    super('Ranking');
  }

  create() {
    const width = this.sys.game.config.width;
    SoundManager.playMenuLoop();

    // Load any saved boxer stats before rendering the list.
    const loaded = loadGameState();
    if (loaded) {
      applyLoadedState(migrateIfNeeded(loaded));
    }

    // Show application name and version at the top
    const infoY = 20;
    this.add
      .text(width / 2, infoY, `${appConfig.name} v${appConfig.version}`, {
        font: '20px Arial',
        color: '#ffffff',
      })
      .setOrigin(0.5, 0);

    // Position the ranking title below the app info
    const headerY = infoY + 40;
    this.add
      .text(width / 2, headerY, 'Ranking', {
        font: '32px Arial',
        color: '#ffffff',
      })
      .setOrigin(0.5, 0);

    const boxers = getRankings();
    const player = getPlayerBoxer();
    const maxNameLen = boxers.reduce((m, b) => Math.max(m, b.name.length), 4);
    const namePad = Math.max(15, maxNameLen + 1);
    const maxTitleLen = boxers.reduce(
      (m, b) =>
        Math.max(
          m,
          (b.titles ? b.titles.map((t) => `${t}🏆`).join(' ').length : 0)
        ),
      6
    );
    const titlePad = Math.max(10, maxTitleLen + 1);
    const columnWidths = [5, namePad, titlePad, 5, 5, 5, 5, 5, 5];
    const rectWidth = width * 0.9;
    const rowHeight = 24;
    const tableTop = headerY + 40;
    const tableLeft = width * 0.05;
    this.add
      .rectangle(tableLeft, tableTop, rectWidth, rowHeight, 0x808080, 0.5)
      .setOrigin(0, 0);
    const headers =
      `${'Rank'.padEnd(columnWidths[0])}` +
      `${'Name'.padEnd(columnWidths[1])}` +
      `${'Titles'.padEnd(columnWidths[2])}` +
      `${'Age'.padEnd(columnWidths[3])}` +
      `${'M'.padEnd(columnWidths[4])}` +
      `${'W'.padEnd(columnWidths[5])}` +
      `${'L'.padEnd(columnWidths[6])}` +
      `${'D'.padEnd(columnWidths[7])}` +
      `${'KO'.padEnd(columnWidths[8])}`;
    this.add.text(tableLeft, tableTop, headers, {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ffff00',
    });

    // Setup scrollable ranking list
    const headerHeight = rowHeight; // header bar height
    const viewportY = tableTop + headerHeight; // area below header
    const viewportHeight = Math.floor(this.sys.game.config.height * 0.6); // visible area height scales with game size
    const contentOffsetX = tableLeft;
    const contentOffsetY = viewportY; // unused but kept for clarity

    // Container that holds all rows (children added in scene coords)
    const content = this.add.container(0, 0);

    const startY = viewportY + 0;
    boxers.forEach((b, i) => {
      const y = startY + i * rowHeight;
      const rowRect = this.add
        .rectangle(width / 2, y, rectWidth, rowHeight, 0x808080, 0.5)
        .setOrigin(0.5, 0);
      const line =
        `${b.ranking.toString().padEnd(columnWidths[0])}` +
        `${b.name.padEnd(columnWidths[1])}` +
        `${(b.titles ? b.titles.map((t) => `${t}🏆`).join(' ') : '').padEnd(columnWidths[2])}` +
        `${b.age.toString().padEnd(columnWidths[3])}` +
        `${b.matches.toString().padEnd(columnWidths[4])}` +
        `${b.wins.toString().padEnd(columnWidths[5])}` +
        `${b.losses.toString().padEnd(columnWidths[6])}` +
        `${b.draws.toString().padEnd(columnWidths[7])}` +
        `${b.winsByKO.toString().padEnd(columnWidths[8])}`;
      const isPlayer = player && (b === player || b.name === player.name);
      const txt = this.add
        .text(contentOffsetX, y, line, {
          font: '20px monospace',
          color: isPlayer ? '#0000ff' : '#ffffff',
          fontStyle: isPlayer ? 'bold' : 'normal',
        })
        .setOrigin(0, 0);

      content.add(rowRect);
      content.add(txt);
    });

    // Mask rectangle defining visible viewport
    const maskShape = this.add
      .rectangle(width / 2, viewportY, rectWidth, viewportHeight, 0x000000, 0)
      .setOrigin(0.5, 0)
      .setVisible(false);
    const geoMask = maskShape.createGeometryMask();
    content.setMask(geoMask);

    // Initial scroll position and metrics
    content.y = 0;
    const contentHeight = boxers.length * rowHeight;
    const maxScroll = Math.max(0, contentHeight - viewportHeight);

    function updateScrollbar(scrollY) {
      if (maxScroll <= 0) {
        thumb.setVisible(false);
        track.setVisible(false);
        return;
      }
      thumb.setVisible(true);
      track.setVisible(true);
      const ratio = scrollY / maxScroll;
      const freeSpace = viewportHeight - thumbHeight;
      thumb.y = trackY + ratio * freeSpace;
    }

    function setScroll(scrollY) {
      const clamped = Phaser.Math.Clamp(scrollY, 0, maxScroll);
      content.y = -clamped;
      updateScrollbar(clamped);
    }

    const WHEEL_STEP = 40;
    this.input.on('wheel', (_pointer, _gameObjects, _dx, dy) => {
      const currentScroll = -content.y;
      setScroll(currentScroll + (dy > 0 ? WHEEL_STEP : -WHEEL_STEP));
    });

    // Scrollbar track and thumb
    const trackX = tableLeft + rectWidth + 8;
    const trackY = viewportY;
    const track = this.add
      .rectangle(trackX, trackY, 8, viewportHeight, 0x666666, 0.6)
      .setOrigin(0, 0);
    const thumbMinHeight = 20;
    const thumbHeight = Math.max(
      thumbMinHeight,
      (viewportHeight / Math.max(viewportHeight, contentHeight)) * viewportHeight
    );
    const thumb = this.add
      .rectangle(trackX, trackY, 8, thumbHeight, 0xffffff, 0.9)
      .setOrigin(0, 0);

    // Dragging the thumb
    thumb.setInteractive({ draggable: true, useHandCursor: true });
    this.input.setDraggable(thumb, true);
    this.input.on('drag', (pointer, obj, dragX, dragY) => {
      if (obj !== thumb || maxScroll <= 0) return;
      const minY = trackY;
      const maxY = trackY + viewportHeight - thumbHeight;
      const y = Phaser.Math.Clamp(dragY, minY, maxY);
      thumb.y = y;
      const ratio = (y - trackY) / (viewportHeight - thumbHeight);
      const newScroll = ratio * maxScroll;
      setScroll(newScroll);
    });

    // Initialize scrollbar position so the player's boxer is centered if possible
    let initialScroll = 0;
    if (player) {
      const index = boxers.findIndex((b) => b === player || b.name === player.name);
      if (index >= 0) {
        const visibleRows = Math.floor(viewportHeight / rowHeight);
        const targetIndex = Phaser.Math.Clamp(
          index - Math.floor(visibleRows / 2),
          0,
          Math.max(0, boxers.length - visibleRows)
        );
        initialScroll = targetIndex * rowHeight;
      }
    }
    setScroll(initialScroll);

    const tableBottom = viewportY + viewportHeight;

    const pending = getPendingMatch();
    const hasPlayer = !!getPlayerBoxer();
    if (pending) {
      const infoY = tableBottom + 10;
      this.add.text(
        tableLeft,
        infoY,
        `Next fight ${pending.date} ${pending.boxer1.name} Vs ${pending.boxer2.name}`,
        { font: '24px Arial', color: '#ffffff' }
      );
      this.add.text(
        tableLeft,
        infoY + 30,
        `Rounds: ${pending.rounds}`,
        { font: '20px Arial', color: '#ffffff' }
      );
      this.add.text(
        tableLeft,
        infoY + 60,
        `${pending.arena.Name}, ${pending.arena.City} (${pending.arena.Country})`,
        { font: '20px Arial', color: '#ffffff' }
      );
      const targetRank = Math.min(pending.boxer1.ranking, pending.boxer2.ranking);
      this.add.text(
        tableLeft,
        infoY + 90,
        `Winner of this fight gets ranked as number ${targetRank}.`,
        { font: '20px Arial', color: '#ffffff' }
      );
      this.add
        .text(tableLeft, infoY + 130, 'Start fight!', {
          font: '24px Arial',
          color: '#00ff00',
        })
        .setOrigin(0, 0)
        .setInteractive({ useHandCursor: true })
        .on('pointerup', () => {
          SoundManager.stopMenuLoop();
          SoundManager.playIntro();
          this.scene.launch('OverlayUI');
          const { boxer1, boxer2, aiLevel1, aiLevel2, rounds, arena, year, date } =
            pending;
          clearPendingMatch();
          this.scene.start('Match', {
            boxer1,
            boxer2,
            aiLevel1,
            aiLevel2,
            rounds,
            arena,
            year,
            date,
          });
        });
    } else {
      const btnLabel = getTestMode()
        ? 'Start new game'
        : hasPlayer
        ? 'Setup next fight'
        : 'Start new game';
      const tableRight = tableLeft + rectWidth;
      const startBtn = this.add
        .text(tableLeft, tableBottom + 10, btnLabel, {
          font: '24px Arial',
          color: '#00ff00',
        })
        .setOrigin(0, 0)
        .setInteractive({ useHandCursor: true })
        .on('pointerup', () => {
          if (getTestMode()) {
            this.scene.start('SelectBoxer');
          } else if (hasPlayer) {
            this.scene.start('SelectBoxer');
          } else {
            this.scene.start('CreateBoxer');
          }
        });

      // Button to reset saved rankings and stats.
      const resetBtn = this.add
        .text(tableLeft, startBtn.y + 40, 'Reset data', {
          font: '20px Arial',
          color: '#ff0000',
        })
        .setOrigin(0, 0)
        .setInteractive({ useHandCursor: true })
        .on('pointerup', () => {
          if (
            window.confirm(
              'This will erase saved rankings, stats, and match log. Continue?'
            )
          ) {
            resetSavedData();
            this.scene.restart();
          }
        });

      this.add
        .text(tableLeft, resetBtn.y + 40, 'Match log', {
          font: '20px Arial',
          color: '#ffffff',
        })
        .setOrigin(0, 0)
        .setInteractive({ useHandCursor: true })
        .on('pointerup', () => {
          this.scene.start('MatchLog');
        });

      // Place the test mode checkbox on the same row as the start button
      const testLabel = this.add
        .text(tableRight, startBtn.y, 'Test mode', {
          font: '20px Arial',
          color: '#ffffff',
        })
        .setOrigin(1, 0);
      const cbX = testLabel.x - testLabel.width - 30;
      const cbY = startBtn.y;
      const testBox = this.add
        .rectangle(cbX, cbY, 20, 20, 0xffffff)
        .setOrigin(0, 0)
        .setInteractive({ useHandCursor: true });
      const testCheck = this.add
        .text(cbX + 10, cbY, 'X', {
          font: '20px Arial',
          color: '#000000',
        })
        .setOrigin(0.5, 0)
        .setVisible(getTestMode());
      testBox.on('pointerdown', () => {
        const newVal = !getTestMode();
        setTestMode(newVal);
        testCheck.setVisible(newVal);
      });
    }
  }
}

