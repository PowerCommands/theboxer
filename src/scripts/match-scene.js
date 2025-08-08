import { Boxer } from './boxer.js';
import { StrategyAIController } from './strategy-ai-controller.js';
import { KeyboardController } from './controllers.js';
import { createBoxerAnimations } from './animation-factory.js';
import { eventBus } from './event-bus.js';
import { RoundTimer } from './round-timer.js';
import { HealthManager } from './health-manager.js';
import { HitManager } from './hit-manager.js';
import { BOXER_PREFIXES, animKey } from './helpers.js';
import { RuleManager } from './rule-manager.js';
import { recordResult, recordDraw } from './boxer-stats.js';

export class MatchScene extends Phaser.Scene {
  constructor() {
    super('Match');
  }

  create(data) {
    console.log('MatchScene: create started');

    this.hitLimit = 280; // max distance for a hit to register

    const width = this.sys.game.config.width;
    const height = this.sys.game.config.height;
    // add ring background sized to 880x660 and centered
    this.add.image(width / 2, height / 2, 'ring').setDisplaySize(880, 660);

    // create animations for both boxers
    createBoxerAnimations(this, BOXER_PREFIXES.P1);
    createBoxerAnimations(this, BOXER_PREFIXES.P2);

    // Player 1 may be human or AI controlled; player 2 always AI
    const controller1 = data?.aiLevel1
      ? new StrategyAIController(data.aiLevel1, 1)
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
    const controller2 = new StrategyAIController(data?.aiLevel2 || 1, 2);

    const centerX = width / 2;
    const centerY = height / 2;
    const ringWidth = 880; // slightly larger ring
    const margin = 50;
    const startY = centerY - 100; // position boxers a bit higher
    this.player1Start = {
      x: centerX - ringWidth / 2 + margin,
      y: startY,
    };
    this.player2Start = {
      x: centerX + ringWidth / 2 - margin,
      y: startY,
    };
    this.player1 = new Boxer(
      this,
      this.player1Start.x,
      this.player1Start.y,
      BOXER_PREFIXES.P1,
      controller1,
      data?.boxer1
    );
    this.player2 = new Boxer(
      this,
      this.player2Start.x,
      this.player2Start.y,
      BOXER_PREFIXES.P2,
      controller2,
      data?.boxer2
    );

    this.resetBoxers();

    this.healthManager = new HealthManager(this.player1, this.player2);
    this.roundTimer = new RoundTimer(this);
    this.ruleManager = new RuleManager(this.player1, this.player2);
    this.roundLength = 180;
    this.lastSecond = -1;
    this.hits = { p1: 0, p2: 0 };
    this.hitManager = new HitManager(this.healthManager, this.hitLimit, this.hits);
    this.maxRounds = Phaser.Math.Clamp(data?.rounds || 1, 1, 13);
    eventBus.on('round-ended', (round) => this.endRound(round));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      eventBus.off('round-ended');
    });

    eventBus.emit('set-names', {
      p1: data?.boxer1?.name || '',
      p2: data?.boxer2?.name || '',
    });
    eventBus.emit('hit-update', { p1: 0, p2: 0 });
    this.roundTimer.start(180, 1);

    this.events.on('boxer-ko', (b) => this.handleKO(b));
    this.matchOver = false;

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

    this.paused = false;
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
    this.input.keyboard.on('keydown-P', (event) => {
      if (event.shiftKey) {
        this.togglePause();
      }
    });

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
      this.ruleManager.evaluate(currentSecond);
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
    const rule1 = `Rule: ${this.ruleManager.boxerRules.p1 || 'none'}`;
    const rule2 = `Rule: ${this.ruleManager.boxerRules.p2 || 'none'}`;
    this.debugText.p1.setText(
      `Stamina: ${this.player1.stamina.toFixed(2)}\n` +
        `Power: ${this.player1.power.toFixed(2)}\n` +
        `Health: ${this.player1.health.toFixed(2)}\n` +
        `${strat1}\n${rule1}`
    );
    this.debugText.p2.setText(
      `Stamina: ${this.player2.stamina.toFixed(2)}\n` +
        `Power: ${this.player2.power.toFixed(2)}\n` +
        `Health: ${this.player2.health.toFixed(2)}\n` +
        `${strat2}\n${rule2}`
    );

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
    this.ruleManager.resetStrategyChanges();
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
      this.resetBoxers();
      this.recoverBoxer(this.player1);
      this.recoverBoxer(this.player2);
      this.roundTimer.start(180, round + 1);
    }
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
    recordResult(winner.stats, loser.stats, 'KO');
  }

  determineWinnerByPoints() {
    if (this.matchOver) return;
    this.matchOver = true;
    if (
      this.hits.p1 === this.hits.p2 &&
      this.player1.health === this.player2.health
    ) {
      this.roundTimer.pause();
      eventBus.emit('match-winner', {
        name: 'Draw',
        method: 'Draw',
        round: this.roundTimer.round,
      });
      recordDraw(this.player1.stats, this.player2.stats);
      return;
    }

    let winner;
    if (this.hits.p1 === this.hits.p2) {
      winner =
        this.player1.health > this.player2.health ? this.player1 : this.player2;
    } else {
      winner = this.hits.p1 > this.hits.p2 ? this.player1 : this.player2;
    }
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
  }

  setPlayerStrategy(player, level) {
    const ctrl = player === 1 ? this.player1.controller : this.player2.controller;
    if (ctrl && ctrl.setLevel) ctrl.setLevel(level);
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
