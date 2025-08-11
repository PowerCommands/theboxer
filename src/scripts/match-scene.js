import { Boxer } from './boxer.js';
import { StrategyAIController } from './strategy-ai-controller.js';
import { KeyboardController } from './controllers.js';
import { createBoxerAnimations } from './animation-factory.js';
import { eventBus } from './event-bus.js';
import { RoundTimer } from './round-timer.js';
import { HealthManager } from './health-manager.js';
import { HitManager } from './hit-manager.js';
import { BOXER_PREFIXES, animKey } from './helpers.js';
import { RuleSet1Manager } from './ruleset1-manager.js';
import { RuleSet2Manager } from './ruleset2-manager.js';
import { RuleSet3Manager } from './ruleset3-manager.js';
import { CommentManager } from './comment-manager.js';
import { showComment } from './comment-manager.js';
import { recordResult, recordDraw } from './boxer-stats.js';
import { BOXERS } from './boxers.js';
import { saveGameState } from './save-system.js';
import { addMatchLog } from './match-log.js';

export class MatchScene extends Phaser.Scene {
  constructor() {
    super('MatchScene');
  }

  create(data) {
    console.log('MatchScene: create started');
    this.hitLimit = 280; // max distance for a hit to register

    this.scene.wake('OverlayUI');
    this.scene.setVisible('OverlayUI', true);

    const width = this.sys.game.config.width;
    const height = this.sys.game.config.height;
    const ringWidth = 880;
    const ringHeight = 660;
    // add ring background sized to ringWidth x ringHeight and centered
    this.add.image(width / 2, height / 2, 'ring').setDisplaySize(ringWidth, ringHeight);

    // create animations for both boxers
    createBoxerAnimations(this, BOXER_PREFIXES.P1);
    createBoxerAnimations(this, BOXER_PREFIXES.P2);

    // Player 1 may be human or AI controlled; player 2 always AI
    const controller1 = data?.aiLevel1
      ? new StrategyAIController(
          data.aiLevel1 === 'default'
            ? data.boxer1?.defaultStrategy || 1
            : data.aiLevel1,
          1
        )
      : new KeyboardController(this, {
          block: 'S',
          jabRight: 'E',
          jabLeft: 'Q',
          uppercut: 'W',
          hurt1: 'ONE',
          hurt2: 'TWO',
          dizzy: 'THREE',
          idle: 'SEVEN',
          ko: 'NUMPAD_EIGHT',
          win: 'ZERO',
          left: 'A',
          right: 'D',
        });
    this.isP1AI = !!data?.aiLevel1;
    const controller2 = new StrategyAIController(
      data?.aiLevel2 === 'default'
        ? data.boxer2?.defaultStrategy || 1
        : data?.aiLevel2 || 1,
      2
    );

    const centerX = width / 2;
    const centerY = height / 2;
    const ringLeft = centerX - ringWidth / 2;
    const ringRight = centerX + ringWidth / 2;
    const ringTop = centerY - ringHeight / 2;
    const ringBottom = centerY + ringHeight / 2;
    this.ringBounds = { left: ringLeft, right: ringRight, top: ringTop, bottom: ringBottom };
    const startY = centerY - 100; // position boxers a bit higher

    this.player1 = new Boxer(
      this,
      centerX,
      startY,
      BOXER_PREFIXES.P1,
      controller1,
      data?.boxer1
    );
    this.player2 = new Boxer(
      this,
      centerX,
      startY,
      BOXER_PREFIXES.P2,
      controller2,
      data?.boxer2
    );

    const halfWidth = this.player1.sprite.displayWidth / 2;
    this.player1Start = {
      x: ringLeft + halfWidth,
      y: startY,
    };
    this.player2Start = {
      x: ringRight - halfWidth,
      y: startY,
    };

    this.resetBoxers();

    // Prepare metadata for the match such as scheduled date, arena and ranks.
    const user = this.player1.stats.userCreated
      ? this.player1.stats
      : this.player2.stats.userCreated
      ? this.player2.stats
      : null;
    if (user) {
      const opponent =
        user === this.player1.stats ? this.player2.stats : this.player1.stats;
      let year = data?.year;
      let dateStr = data?.date;
      if (!year || !dateStr) {
        const logCount = getMatchLog().length;
        const baseDate = new Date(2025, 2, 5); // March 5, 2025
        const matchDate = new Date(baseDate);
        matchDate.setDate(baseDate.getDate() + logCount * 20);
        year = matchDate.getFullYear();
        const ds = matchDate.toLocaleDateString('sv-SE', {
          day: 'numeric',
          month: 'long',
        });
        const [day, month] = ds.split(' ');
        dateStr = `${day} ${month.charAt(0).toUpperCase()}${month.slice(1)}`;
      }
        const prestige = data?.arena?.Prestige || 1;
        const computeTime = (prest) => {
          let start;
          let end;
          switch (prest) {
            case 1:
              start = 12 * 60;
              end = 15 * 60;
              break;
            case 2:
              start = 15 * 60 + 30;
              end = 18 * 60 + 30;
              break;
            case 3:
              start = 19 * 60;
              end = 23 * 60 + 30;
              break;
            default:
              start = 12 * 60;
              end = 15 * 60;
          }
          const steps = Math.floor((end - start) / 30);
          const total = start + Phaser.Math.Between(0, steps) * 30;
          const hour = Math.floor(total / 60)
            .toString()
            .padStart(2, '0');
          const minute = (total % 60).toString().padStart(2, '0');
          return `${hour}:${minute}`;
        };
        const timeDisplay = data?.time || computeTime(prestige);
        this.matchMeta = {
          year,
          date: dateStr,
          rank: user.ranking,
          opponentRank: opponent.ranking,
          arena: data?.arena,
        };
        eventBus.emit('match-date', {
          date: dateStr,
          year,
          time: timeDisplay,
        arena: data?.arena?.Name || '',
        city: data?.arena?.City || '',
        country: data?.arena?.Country || '',
      });
    } else {
      this.matchMeta = null;
    }

    this.healthManager = new HealthManager(this.player1, this.player2);
    this.roundTimer = new RoundTimer(this);
    const makeMgr = (me, opp) => {
      switch (me.stats.ruleset) {
        case 1:
          return new RuleSet1Manager(me, opp);
        case 2:
          return new RuleSet2Manager(me, opp);
        default:
          return new RuleSet3Manager(me, opp);
      }
    };
    this.ruleManager1 = makeMgr(this.player1, this.player2);
    this.ruleManager2 = makeMgr(this.player2, this.player1);
    this.rulesetId = { p1: this.player1.stats.ruleset, p2: this.player2.stats.ruleset };
    this.roundLength = 180;
    this.lastSecond = -1;
    this.hits = { p1: 0, p2: 0 };
    this.roundHits = { p1: 0, p2: 0 };
    this.score = { p1: 0, p2: 0 };
    this.roundLog = [];
    this.hitManager = new HitManager(
      this.healthManager,
      this.hitLimit,
      this.hits,
      this.roundHits
    );
    this.maxRounds = Phaser.Math.Clamp(data?.rounds || 1, 1, 13);
    eventBus.on('round-ended', (round) => this.endRound(round));
    eventBus.on('next-round', () => this.startNextRound());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      eventBus.off('round-ended');
      eventBus.off('next-round');
    });

    eventBus.emit('set-names', {
      p1: data?.boxer1?.name || '',
      p2: data?.boxer2?.name || '',
    });
    eventBus.emit('hit-update', { p1: 0, p2: 0 });
    eventBus.emit('score-update', { p1: 0, p2: 0 });
    this.events.on('boxer-ko', (b) => this.handleKO(b));
    this.matchOver = false;
    this.pendingRound = null;

    this.breaking = false;
    this.closeTime = null;
    this.breakText = this.add
      .text(width / 2, height / 2, 'BREAK', {
        font: '64px Arial',
        color: '#ffffff',
        align: 'center',
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.paused = true;
    this.showIntro(data.boxer1, data.boxer2);
    this.debugText = {
      p1: this.add
        .text(20, height - 100, '', {
          font: '16px monospace',
          color: '#ffffff',
          align: 'left',
        })
        .setOrigin(0, 0),
      p2: this.add
        .text(width - 20, height - 100, '', {
          font: '16px monospace',
          color: '#ffffff',
          align: 'right',
        })
        .setOrigin(1, 0),
      center: this.add
        .text(width / 2, height - 100, '', {
          font: '16px monospace',
          color: '#ffffff',
          align: 'center',
        })
        .setOrigin(0.5, 0),
    };
    this.commentManager = new CommentManager(this);
    this.input.keyboard.on('keydown-P', (event) => {
      if (event.shiftKey) {
        this.togglePause();
      }
    });

    // Ensure the overlay UI is rendered above the match so that any
    // interactive elements like the post-match buttons are not obscured
    // by the boxers.
    this.scene.bringToTop('OverlayUI');

    console.log('MatchScene: create complete');
  }

  update(time, delta) {
    const rawDistance = Phaser.Math.Distance.Between(
      this.player1.sprite.x,
      this.player1.sprite.y,
      this.player2.sprite.x,
      this.player2.sprite.y
    );
    const distance =
      this.player1.sprite.x < this.player2.sprite.x
        ? rawDistance
        : -rawDistance;

    if (!this.breaking) {
      if (Math.abs(distance) < 50) {
        if (this.closeTime === null) this.closeTime = time;
        else if (time - this.closeTime >= 5000) {
          this.resetBoxers();
          this.showBreak();
          this.closeTime = null;
        }
      } else {
        this.closeTime = null;
      }
    }

    const currentSecond = this.roundLength - this.roundTimer.remaining;
    if (currentSecond !== this.lastSecond && currentSecond < this.roundLength) {
      this.ruleManager1.evaluate(currentSecond);
      this.ruleManager2.evaluate(currentSecond);
      this.lastSecond = currentSecond;
    }

    this.debugText.center.setText(`Distance: ${distance.toFixed(1)}`);
    const strat1 =
      typeof this.player1.controller.getLevel === 'function'
        ? `Strategy: ${this.player1.controller.getLevel()}`
        : 'Human controlled boxer';
    const strat2 =
      typeof this.player2.controller.getLevel === 'function'
        ? `Strategy: ${this.player2.controller.getLevel()}`
        : 'Human controlled boxer';
    const rule1 = `Ruleset: ruleset${this.rulesetId.p1} | ${
      this.ruleManager1.currentRule() || 'none'
    }`;
    const rule2 = `Ruleset: ruleset${this.rulesetId.p2} | ${
      this.ruleManager2.currentRule() || 'none'
    }`;
    this.debugText.p1.setText(`${strat1}\n${rule1}`);
    this.debugText.p2.setText(`${strat2}\n${rule2}`);

    if (this.paused) return;

    this.player1.update(delta, this.player2, currentSecond);
    this.player2.update(delta, this.player1, currentSecond);

    this.hitManager.handleHit(this.player1, this.player2, 'p2');
    this.hitManager.handleHit(this.player2, this.player1, 'p1');
  }

  resetBoxers() {
    this.player1.sprite.setPosition(this.player1Start.x, this.player1Start.y);
    this.player2.sprite.setPosition(this.player2Start.x, this.player2Start.y);
    this.player1.facingRight = true;
    this.player2.facingRight = false;
    this.player1.sprite.setFlipX(true);
    this.player2.sprite.setFlipX(false);
    this.player1.sprite.anims.play(animKey(BOXER_PREFIXES.P1, 'idle'));
    this.player2.sprite.anims.play(animKey(BOXER_PREFIXES.P2, 'idle'));
  }

  recoverBoxer(boxer) {
    if (boxer.stamina / boxer.maxStamina < 0.5) {
      boxer.adjustStamina(boxer.maxStamina * 0.75 - boxer.stamina);
    }
    if (boxer.power / boxer.maxPower < 0.5) {
      boxer.adjustPower(boxer.maxPower * 0.75 - boxer.power);
    }
    const minHealth = boxer.maxHealth * 0.25;
    let targetHealth = boxer.health + boxer.maxHealth * 0.25;
    targetHealth = Phaser.Math.Clamp(targetHealth, minHealth, boxer.maxHealth);
    boxer.adjustHealth(targetHealth - boxer.health);
  }

  endRound(round) {
    if (this.matchOver) return;
    const p1RoundScore =
      this.roundHits.p1 === this.roundHits.p2
        ? 10
        : this.roundHits.p1 > this.roundHits.p2
        ? 10
        : 9;
    const p2RoundScore =
      this.roundHits.p1 === this.roundHits.p2
        ? 10
        : this.roundHits.p1 > this.roundHits.p2
        ? 9
        : 10;
    this.score.p1 += p1RoundScore;
    this.score.p2 += p2RoundScore;
    eventBus.emit('score-update', { p1: this.score.p1, p2: this.score.p2 });
    this.roundLog.push({
      round,
      p1Score: p1RoundScore,
      p2Score: p2RoundScore,
      totalP1: this.score.p1,
      totalP2: this.score.p2,
    });
    this.roundHits.p1 = 0;
    this.roundHits.p2 = 0;
    this.ruleManager1.resetStrategyChanges();
    this.ruleManager2.resetStrategyChanges();
    this.paused = true;
    this.resetBoxers();
    if (round >= this.maxRounds) {
      this.determineWinnerByPoints();
    } else {
      const shift = round === this.maxRounds - 1 ? 3 : 1;
      if (
        this.hits.p1 < this.hits.p2 &&
        typeof this.player1.controller.shiftLevel === 'function'
      ) {
        this.player1.controller.shiftLevel(shift);
      }
      if (
        this.hits.p2 < this.hits.p1 &&
        typeof this.player2.controller.shiftLevel === 'function'
      ) {
        this.player2.controller.shiftLevel(shift);
      }
      this.pendingRound = round + 1;
    }
  }

  startNextRound() {
    if (this.matchOver || !this.pendingRound) return;
    this.recoverBoxer(this.player1);
    this.recoverBoxer(this.player2);
    this.roundTimer.start(this.roundLength, this.pendingRound);
    this.pendingRound = null;
    this.paused = false;
  }

  handleKO(loser) {
    if (this.matchOver) return;
    this.matchOver = true;
    const winner = loser === this.player1 ? this.player2 : this.player1;
    loser.isKO = true;
    loser.sprite.anims.play(animKey(loser.prefix, 'ko'));
    winner.isWinner = true;
    winner.sprite.play(animKey(winner.prefix, 'win'));
    this.roundTimer.pause();
    eventBus.emit('match-winner', {
      name: winner.stats?.name || winner.prefix,
      method: 'KO',
      round: this.roundTimer.round,
    });
    const timeSec = this.roundLength - this.roundTimer.remaining;
    const minutes = Math.floor(timeSec / 60);
    const seconds = Math.floor(timeSec % 60);
    const timeStr = `${minutes} min ${seconds} sec.`;
    const b1 = this.player1.stats;
    const b2 = this.player2.stats;
    const rank1 = b1.ranking;
    const rank2 = b2.ranking;
    const before1 = b1.earnings || 0;
    const before2 = b2.earnings || 0;
    recordResult(winner.stats, loser.stats, 'KO');
    const prize1 = b1.earnings - before1;
    const prize2 = b2.earnings - before2;
    const roundDetails1 = this.roundLog.map((r) => ({
      round: r.round,
      userScore: r.p1Score,
      oppScore: r.p2Score,
      totalUser: r.totalP1,
      totalOpp: r.totalP2,
    }));
    const roundDetails2 = this.roundLog.map((r) => ({
      round: r.round,
      userScore: r.p2Score,
      oppScore: r.p1Score,
      totalUser: r.totalP2,
      totalOpp: r.totalP1,
    }));
    addMatchLog(b1.name, {
      year: this.matchMeta?.year,
      date: this.matchMeta?.date,
      arena: this.matchMeta?.arena,
      rank: rank1,
      opponent: b2.name,
      opponentRank: rank2,
      result: winner.stats === b1 ? 'Win' : 'Loss',
      method: 'KO',
      round: this.roundTimer.round,
      time: timeStr,
      prize: prize1,
      roundDetails: roundDetails1,
    });
    addMatchLog(b2.name, {
      year: this.matchMeta?.year,
      date: this.matchMeta?.date,
      arena: this.matchMeta?.arena,
      rank: rank2,
      opponent: b1.name,
      opponentRank: rank1,
      result: winner.stats === b2 ? 'Win' : 'Loss',
      method: 'KO',
      round: this.roundTimer.round,
      time: timeStr,
      prize: prize2,
      roundDetails: roundDetails2,
    });
    saveGameState(BOXERS);
  }

  determineWinnerByPoints() {
    if (this.matchOver) return;
    this.matchOver = true;
    const b1 = this.player1.stats;
    const b2 = this.player2.stats;
    const rank1 = b1.ranking;
    const rank2 = b2.ranking;
    const score1 = this.score.p1;
    const score2 = this.score.p2;
    const before1 = b1.earnings || 0;
    const before2 = b2.earnings || 0;
    const roundDetails1 = this.roundLog.map((r) => ({
      round: r.round,
      userScore: r.p1Score,
      oppScore: r.p2Score,
      totalUser: r.totalP1,
      totalOpp: r.totalP2,
    }));
    const roundDetails2 = this.roundLog.map((r) => ({
      round: r.round,
      userScore: r.p2Score,
      oppScore: r.p1Score,
      totalUser: r.totalP2,
      totalOpp: r.totalP1,
    }));
    if (score1 === score2) {
      this.roundTimer.pause();
      eventBus.emit('match-winner', {
        name: 'Draw',
        method: 'Draw',
        round: this.roundTimer.round,
      });
      recordDraw(b1, b2);
      const prize1 = b1.earnings - before1;
      const prize2 = b2.earnings - before2;
      addMatchLog(b1.name, {
        year: this.matchMeta?.year,
        date: this.matchMeta?.date,
        arena: this.matchMeta?.arena,
        rank: rank1,
        opponent: b2.name,
        opponentRank: rank2,
        result: 'Draw',
        method: 'Points',
        round: this.roundTimer.round,
        time: '-',
        score: `${score1}-${score2}`,
        prize: prize1,
        roundDetails: roundDetails1,
      });
      addMatchLog(b2.name, {
        year: this.matchMeta?.year,
        date: this.matchMeta?.date,
        arena: this.matchMeta?.arena,
        rank: rank2,
        opponent: b1.name,
        opponentRank: rank1,
        result: 'Draw',
        method: 'Points',
        round: this.roundTimer.round,
        time: '-',
        score: `${score2}-${score1}`,
        prize: prize2,
        roundDetails: roundDetails2,
      });
      saveGameState(BOXERS);
      return;
    }

    let winner = score1 > score2 ? this.player1 : this.player2;
    const loser = winner === this.player1 ? this.player2 : this.player1;
    winner.isWinner = true;
    winner.sprite.play(animKey(winner.prefix, 'win'));
    loser.sprite.play(animKey(loser.prefix, 'idle'));
    this.roundTimer.pause();
    eventBus.emit('match-winner', {
      name: winner.stats?.name || winner.prefix,
      method: 'Points',
      round: this.roundTimer.round,
    });
    recordResult(winner.stats, loser.stats, 'Points');
    const prize1 = b1.earnings - before1;
    const prize2 = b2.earnings - before2;
    addMatchLog(b1.name, {
      year: this.matchMeta?.year,
      date: this.matchMeta?.date,
      arena: this.matchMeta?.arena,
      rank: rank1,
      opponent: b2.name,
      opponentRank: rank2,
      result: winner.stats === b1 ? 'Win' : 'Loss',
      method: 'Points',
      round: this.roundTimer.round,
      time: '-',
      score: `${score1}-${score2}`,
      prize: prize1,
      roundDetails: roundDetails1,
    });
    addMatchLog(b2.name, {
      year: this.matchMeta?.year,
      date: this.matchMeta?.date,
      arena: this.matchMeta?.arena,
      rank: rank2,
      opponent: b1.name,
      opponentRank: rank1,
      result: winner.stats === b2 ? 'Win' : 'Loss',
      method: 'Points',
      round: this.roundTimer.round,
      time: '-',
      score: `${score2}-${score1}`,
      prize: prize2,
      roundDetails: roundDetails2,
    });
    saveGameState(BOXERS);
  }

  setPlayerStrategy(player, level) {
    const ctrl = player === 1 ? this.player1.controller : this.player2.controller;
    if (ctrl && ctrl.setLevel) ctrl.setLevel(level);
  }

  showIntro(boxer1, boxer2) {
    const width = this.sys.game.config.width;
    const height = this.sys.game.config.height;
    const b1 = boxer1 || {};
    const b2 = boxer2 || {};
    const lines1 = [
      `Nickname: ${b1.nickName || ''}`,
      `Country: ${b1.country || ''}`,
      `Ranking: ${b1.ranking ?? ''}`,
      `Age: ${b1.age ?? ''}`,
      `Record: ${b1.wins || 0}-${b1.losses || 0}-${b1.draws || 0}`,
      `KO: ${b1.winsByKO || 0}`,
    ];
    const lines2 = [
      `Nickname: ${b2.nickName || ''}`,
      `Country: ${b2.country || ''}`,
      `Ranking: ${b2.ranking ?? ''}`,
      `Age: ${b2.age ?? ''}`,
      `Record: ${b2.wins || 0}-${b2.losses || 0}-${b2.draws || 0}`,
      `KO: ${b2.winsByKO || 0}`,
    ];
    const panelPadding = 10;
    const p1Text = this.add.text(40, height / 2 - 120, lines1.join('\n'), {
      font: '20px Arial',
      color: '#ffffff',
      align: 'left',
    });
    const p2Text = this.add
      .text(width - 40, height / 2 - 120, lines2.join('\n'), {
        font: '20px Arial',
        color: '#ffffff',
        align: 'right',
      })
      .setOrigin(1, 0);

    const p1Bg = this.add
      .rectangle(
        40 - panelPadding,
        height / 2 - 120 - panelPadding,
        p1Text.width + panelPadding * 2,
        p1Text.height + panelPadding * 2,
        0x808080,
        0.4
      )
      .setOrigin(0, 0);
    const p2Bg = this.add
      .rectangle(
        width - 40 + panelPadding,
        height / 2 - 120 - panelPadding,
        p2Text.width + panelPadding * 2,
        p2Text.height + panelPadding * 2,
        0x808080,
        0.4
      )
      .setOrigin(1, 0);
    p1Text.setDepth(1);
    p2Text.setDepth(1);

    this.introPanels = { p1: p1Text, p1Bg, p2: p2Text, p2Bg };

    this.startButton = this.add
      .text(width / 2, height / 2 + 140, 'Start match', {
        font: '32px Arial',
        color: '#00ff00',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.startButton.on('pointerup', () => {
      this.introPanels.p1.setVisible(false);
      this.introPanels.p1Bg.setVisible(false);
      this.introPanels.p2.setVisible(false);
      this.introPanels.p2Bg.setVisible(false);
      this.startButton.setVisible(false);
      this.roundTimer.start(this.roundLength, 1);
      this.paused = false;
      showComment('Round one have started.', 5);
    });
  }

  showBreak() {
    this.breaking = true;
    this.breakText.setVisible(true);
    this.time.delayedCall(5000, () => {
      this.breakText.setVisible(false);
      this.breaking = false;
    });
  }

  togglePause() {
    this.paused = !this.paused;
    if (this.paused) {
      this.roundTimer.pause();
      this.player1.sprite.anims.pause();
      this.player2.sprite.anims.pause();
    } else {
      this.roundTimer.resume();
      this.player1.sprite.anims.resume();
      this.player2.sprite.anims.resume();
    }
  }
}
