import { Boxer } from './boxer.js';
import { StrategyAIController } from './strategy-ai-controller.js';
import { createBoxerAnimations } from './animation-factory.js';
import { eventBus } from './event-bus.js';
import { RoundTimer } from './round-timer.js';
import { HealthManager } from './health-manager.js';
import { BOXER_PREFIXES, animKey } from './helpers.js';
import { RuleManager } from './rule-manager.js';

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

    // AI controllers using offensive level strategies
    const controller1 = new StrategyAIController(4);
    const controller2 = new StrategyAIController(6);
    // Example of switching strategy during the match:
    // controller1.setLevel(5);

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
    eventBus.on('round-ended', (round) => this.endRound(round));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      eventBus.off('round-ended');
    });

    eventBus.emit('set-names', {
      p1: data?.boxer1?.name || '',
      p2: data?.boxer2?.name || '',
    });
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
    this.debugText = this.add
      .text(width / 2, height - 100, '', {
        font: '16px monospace',
        color: '#ffffff',
        align: 'center',
      })
      .setOrigin(0.5, 0);
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
    const action1 = this.player1.lastAction;
    const action2 = this.player2.lastAction;
    const statsLine =
      `P1 S:${this.player1.stamina.toFixed(2)} H:${this.player1.health.toFixed(2)} P:${this.player1.power.toFixed(2)} | ` +
      `P2 S:${this.player2.stamina.toFixed(2)} H:${this.player2.health.toFixed(2)} P:${this.player2.power.toFixed(2)}`;
    const strategyLine =
      `Strategi: P1 ${this.player1.controller.getLevel()} | P2 ${this.player2.controller.getLevel()}`;
    this.debugText.setText([
      `Distans: ${distance.toFixed(1)}`,
      `P1: ${action1} | P2: ${action2}`,
      statsLine,
      strategyLine,
    ]);

    const currentSecond = this.roundLength - this.roundTimer.remaining;
    if (currentSecond !== this.lastSecond && currentSecond < this.roundLength) {
      this.ruleManager.evaluate(currentSecond);
      this.lastSecond = currentSecond;
    }

    if (this.paused) return;

    this.player1.update(delta, this.player2, currentSecond);
    this.player2.update(delta, this.player1, currentSecond);

    this.handleHit(this.player1, this.player2, 'p2');
    this.handleHit(this.player2, this.player1, 'p1');
  }

  handleHit(attacker, defender, defenderKey) {
    if (!attacker.isAttacking() || attacker.hasHit) return;
    if (!this.isFacingCorrectly(attacker, defender)) return;
    const distance = Phaser.Math.Distance.Between(
      attacker.sprite.x,
      attacker.sprite.y,
      defender.sprite.x,
      defender.sprite.y
    );
    if (distance > this.hitLimit) return;
    if (!this.isColliding(attacker, defender)) return;
    attacker.hasHit = true;
    const current = attacker.sprite.anims.currentAnim?.key;
    const isUppercut = current === animKey(attacker.prefix, 'uppercut');
    let damage = 0.05 * attacker.power;
    if (isUppercut) damage *= 2;
    if (distance >= 200) damage *= 0.5;

    if (defender.isBlocking()) {
      const penalty = isUppercut ? 0.12 : 0.06;
      attacker.adjustPower(-penalty);
      attacker.adjustStamina(-penalty);
      damage *= 0.5;
    }

    this.healthManager.damage(defenderKey, damage);
  }

  isFacingCorrectly(attacker, defender) {
    return !(
      (attacker.facingRight && defender.sprite.x < attacker.sprite.x) ||
      (!attacker.facingRight && defender.sprite.x > attacker.sprite.x)
    );
  }

  isInRange(attacker, defender) {
    const distance = Phaser.Math.Distance.Between(
      attacker.sprite.x,
      attacker.sprite.y,
      defender.sprite.x,
      defender.sprite.y
    );
    return distance <= this.hitLimit;
  }

  isColliding(attacker, defender) {
    const aBounds = attacker.sprite.getBounds();
    const dBounds = defender.sprite.getBounds();
    return Phaser.Geom.Intersects.RectangleToRectangle(aBounds, dBounds);
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

  endRound(round) {
    if (this.matchOver) return;
    this.resetBoxers();
    this.roundTimer.start(180, round + 1);
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
    eventBus.emit('match-winner', winner.stats?.name || winner.prefix);
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
