import { Boxer } from './boxer.js';
import { KeyboardController } from './controllers.js';
import { createBoxerAnimations } from './animation-factory.js';

export class MatchScene extends Phaser.Scene {
  constructor() {
    super('Match');
  }

  create(data) {
    console.log('MatchScene: create started');

    this.hitLimit = 320; // max distance for a hit to register

    const width = this.sys.game.config.width;
    const height = this.sys.game.config.height;
    // add ring background sized to 880x660 and centered
    this.add.image(width / 2, height / 2, 'ring').setDisplaySize(880, 660);

    // create animations for both boxers
    createBoxerAnimations(this, 'boxer1');
    createBoxerAnimations(this, 'boxer2');

    // controllers (swapped controls so the boxer on the right uses the
    // right-hand keys)
    const controller1 = new KeyboardController(this, {
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      jabRight: Phaser.Input.Keyboard.KeyCodes.E,
      jabLeft: Phaser.Input.Keyboard.KeyCodes.Q,
      uppercut: Phaser.Input.Keyboard.KeyCodes.F,
      block: Phaser.Input.Keyboard.KeyCodes.X,
      hurt1: Phaser.Input.Keyboard.KeyCodes.FOUR,
      hurt2: Phaser.Input.Keyboard.KeyCodes.FIVE,
      dizzy: Phaser.Input.Keyboard.KeyCodes.SIX,
      idle: Phaser.Input.Keyboard.KeyCodes.EIGHT,
      ko: Phaser.Input.Keyboard.KeyCodes.G,
      win: Phaser.Input.Keyboard.KeyCodes.PLUS,
    });
    const controller2 = new KeyboardController(this, {
      jabRight: Phaser.Input.Keyboard.KeyCodes.PAGEDOWN,
      jabLeft: Phaser.Input.Keyboard.KeyCodes.DELETE,
      uppercut: Phaser.Input.Keyboard.KeyCodes.NUMPAD_ZERO,
      block: Phaser.Input.Keyboard.KeyCodes.NUMPAD_FIVE,
      hurt1: Phaser.Input.Keyboard.KeyCodes.ONE,
      hurt2: Phaser.Input.Keyboard.KeyCodes.TWO,
      dizzy: Phaser.Input.Keyboard.KeyCodes.THREE,
      idle: Phaser.Input.Keyboard.KeyCodes.SEVEN,
      ko: Phaser.Input.Keyboard.KeyCodes.NUMPAD_EIGHT,
      win: Phaser.Input.Keyboard.KeyCodes.ZERO,
    });

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
      'boxer1',
      controller1,
      data?.boxer1
    );
    this.player2 = new Boxer(
      this,
      this.player2Start.x,
      this.player2Start.y,
      'boxer2',
      controller2,
      data?.boxer2
    );

    this.resetBoxers();

    this.ui = this.scene.get('OverlayUI');
    if (this.ui) {
      this.ui.setNames(data?.boxer1?.name || '', data?.boxer2?.name || '');
      this.ui.events.on('round-ended', (round) => {
        this.endRound(round);
      });
      this.ui.startRound(180, 1);
    }

    this.events.on('boxer-ko', (b) => this.handleKO(b));
    this.matchOver = false;

    console.log('MatchScene: create complete');
  }

  update(time, delta) {
    this.player1.update(delta);
    this.player2.update(delta);

    this.handleHit(this.player1, this.player2, 'p2');
    this.handleHit(this.player2, this.player1, 'p1');
  }

  handleHit(attacker, defender, defenderKey) {
    if (!attacker.isAttacking() || attacker.hasHit) return;
    if (defender.isBlocking()) return;

    if (
      (attacker.facingRight && defender.sprite.x < attacker.sprite.x) ||
      (!attacker.facingRight && defender.sprite.x > attacker.sprite.x)
    ) {
      return;
    }

    const distance = Phaser.Math.Distance.Between(
      attacker.sprite.x,
      attacker.sprite.y,
      defender.sprite.x,
      defender.sprite.y
    );

    const aBounds = attacker.sprite.getBounds();
    const dBounds = defender.sprite.getBounds();
    if (distance <= this.hitLimit &&
        Phaser.Geom.Intersects.RectangleToRectangle(aBounds, dBounds)) {
      attacker.hasHit = true;
      defender.takeDamage(0.05 * attacker.power);
      if (this.ui) {
        const value = defender.health / defender.maxHealth;
        this.ui.setBarValue(this.ui.bars[defenderKey].health, value);
      }
    }
  }

  resetBoxers() {
    this.player1.sprite.setPosition(this.player1Start.x, this.player1Start.y);
    this.player2.sprite.setPosition(this.player2Start.x, this.player2Start.y);
    this.player1.facingRight = true;
    this.player2.facingRight = false;
    this.player1.sprite.setFlipX(true);
    this.player2.sprite.setFlipX(false);
    this.player1.sprite.anims.play('boxer1_idle');
    this.player2.sprite.anims.play('boxer2_idle');
  }

  endRound(round) {
    if (this.matchOver) return;
    this.resetBoxers();
    if (this.ui) {
      this.ui.startRound(180, round + 1);
    }
  }

  handleKO(loser) {
    if (this.matchOver) return;
    this.matchOver = true;
    const winner = loser === this.player1 ? this.player2 : this.player1;
    loser.isKO = true;
    loser.sprite.anims.play(`${loser.prefix}_ko`);
    winner.isWinner = true;
    winner.sprite.play(`${winner.prefix}_win`);
    if (this.ui) {
      this.ui.stopClock();
      this.ui.announceWinner(winner.stats?.name || winner.prefix);
    }
  }
}
