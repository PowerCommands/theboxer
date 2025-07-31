import { Boxer } from './boxer.js';
import { StrategyAIController } from './strategy-ai-controller.js';
import { createBoxerAnimations } from './animation-factory.js';
import { eventBus } from './event-bus.js';
import { RoundTimer } from './round-timer.js';
import { HealthManager } from './health-manager.js';
import { BOXER_PREFIXES, animKey } from './helpers.js';

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

    // AI controllers using strategy pattern
    const controller1 = new StrategyAIController('offensive');
    const controller2 = new StrategyAIController('defensive');
    // Example of switching strategy during the match:
    // controller1.setStrategy('defensive');

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

    console.log('MatchScene: create complete');
  }

  update(time, delta) {
    this.player1.update(delta, this.player2);
    this.player2.update(delta, this.player1);

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
    if (defender.isBlocking()) {
      attacker.adjustPower(-0.06);
      attacker.adjustStamina(-0.06);
      return;
    }

    attacker.hasHit = true;
    let damage = 0.05 * attacker.power;
    if (distance >= 200) damage *= 0.5;
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
    this.roundTimer.stop();
    eventBus.emit('match-winner', winner.stats?.name || winner.prefix);
  }

  setPlayerStrategy(player, name) {
    const ctrl = player === 1 ? this.player1.controller : this.player2.controller;
    if (ctrl && ctrl.setStrategy) ctrl.setStrategy(name);
  }
}
