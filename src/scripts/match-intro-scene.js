import { SoundManager } from './sound-manager.js';
import { formatMoney } from './helpers.js';

export class MatchIntroScene extends Phaser.Scene {
  constructor() {
    super('MatchIntroScene');
  }

  create(data) {
    this.matchData = data;
    const width = this.sys.game.config.width;
    const height = this.sys.game.config.height;

    // play crowd ambience
    SoundManager.sounds?.crowd?.play();

    // allow skipping at any time
    const skip = () => {
      if (this.skipped) return;
      this.skipped = true;
      this.timeline?.stop();
      SoundManager.sounds?.crowd?.stop();
      this.scene.launch('OverlayUI');
      this.scene.start('Match', this.matchData);
    };
    this.input.keyboard.on('keydown', skip);
    this.input.on('pointerdown', skip);

    // fighter cards
    const createCard = (fighter, side) => {
      const card = this.add.container(
        side === 'left' ? -width * 0.4 : width * 1.4,
        height * 0.35
      );
      card.add(this.add.image(0, 0, 'stinger'));
      card.add(
        this.add
          .text(0, -60, fighter.name, { font: '32px Arial', color: '#ffffff' })
          .setOrigin(0.5)
      );
      card.add(
        this.add
          .text(0, -20, `"${fighter.nick}"`, {
            font: '24px Arial',
            color: '#ffff00',
          })
          .setOrigin(0.5)
      );
      const { w = 0, l = 0, d = 0 } = fighter.record || {};
      card.add(
        this.add
          .text(0, 20, `Record: ${w}-${l}-${d}`, {
            font: '20px Arial',
            color: '#ffffff',
          })
          .setOrigin(0.5)
      );
      card.add(
        this.add
          .text(0, 50, `Rank: ${fighter.rank}`, {
            font: '20px Arial',
            color: '#ffffff',
          })
          .setOrigin(0.5)
      );
      return card;
    };

    const redCard = createCard(data.red, 'left');
    const blueCard = createCard(data.blue, 'right');

    // purse panel
    const purseContainer = this.add.container(width / 2, height * 0.65).setAlpha(0);
    const purseText = this.add
      .text(0, 0, formatMoney(0), {
        font: '40px Arial',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    purseContainer.add(purseText);
    let bonusText;
    if (data.winnerBonus > 0) {
      bonusText = this.add
        .text(0, 40, '', {
          font: '24px Arial',
          color: '#ffff00',
        })
        .setOrigin(0.5);
      purseContainer.add(bonusText);
    }

    const emitter = this.add.particles(0, 0, 'coin', {
      speed: { min: -300, max: 300 },
      angle: { min: 0, max: 360 },
      gravityY: 400,
      lifespan: 1500,
      quantity: 30,
      scale: { start: 0.5, end: 0 },
      emitting: false,
    });

    // belts setup
    const beltsData = data.titlesOnTheLine || [];
    const belts = [];
    const maxCols = 3;
    const spacingX = 220;
    const spacingY = 120;
    const cols = Math.min(maxCols, beltsData.length);
    const startX = width / 2 - ((cols - 1) * spacingX) / 2;
    const startY = height * 0.2;
    beltsData.forEach((b, i) => {
      const col = i % maxCols;
      const row = Math.floor(i / maxCols);
      const x = startX + col * spacingX;
      const y = startY + row * spacingY;
      const key = b.imageKey || `belt_${b.code}`;
      const sprite = this.add.image(x, y, key).setScale(0.5).setAlpha(0);
      belts.push(sprite);
    });

    const cta = this.add
      .text(width / 2, height * 0.9, 'Press any key to continue', {
        font: '32px Arial',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    // timeline
    const timeline = this.tweens.createTimeline();
    this.timeline = timeline;

    timeline.add({
      targets: redCard,
      x: width * 0.25,
      duration: 1000,
      ease: 'Elastic.Out',
      onStart: () => this.sound.play('stinger'),
    });
    timeline.add({
      targets: blueCard,
      x: width * 0.75,
      duration: 1000,
      ease: 'Elastic.Out',
      offset: 0,
    });

    timeline.add({ duration: 500 });

    timeline.add({
      targets: purseContainer,
      alpha: 1,
      duration: 300,
      onStart: () => {
        this.sound.play('coin_jingle');
        emitter.explode(40, width / 2, height * 0.65);
        this.tweens.addCounter({
          from: 0,
          to: data.purse || 0,
          duration: 1000,
          onUpdate: (t) => {
            purseText.setText(formatMoney(Math.floor(t.getValue())));
          },
        });
        if (bonusText) {
          bonusText.setText(`Winner bonus: ${formatMoney(data.winnerBonus)}`);
        }
      },
    });

    belts.forEach((belt) => {
      timeline.add({
        targets: belt,
        alpha: 1,
        y: belt.y - 20,
        duration: 500,
        ease: 'Back.Out',
        onStart: () => this.sound.play('whoosh'),
        onComplete: () => this.shineBelt(belt),
      });
    });

    timeline.add({
      targets: cta,
      alpha: 1,
      duration: 500,
      onComplete: () => {
        this.tweens.add({
          targets: cta,
          alpha: 0,
          duration: 500,
          yoyo: true,
          repeat: -1,
        });
      },
    });

    timeline.play();
  }

  shineBelt(sprite) {
    const w = sprite.displayWidth;
    const h = sprite.displayHeight;
    const shine = this.add.rectangle(
      sprite.x - w,
      sprite.y,
      w * 0.2,
      h * 1.5,
      0xffffff,
      0.3
    );
    shine.setAngle(20);
    shine.setMask(sprite.createBitmapMask());
    this.tweens.add({
      targets: shine,
      x: sprite.x + w,
      duration: 800,
      ease: 'Sine.InOut',
      onComplete: () => shine.destroy(),
    });
  }
}

