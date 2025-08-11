// match-intro-scene.js
// Phaser 3 scen för “Tale of the Tape” utan timeline-API (manuell kedjning av tweens)

import { makeWhiteTransparent } from './helpers.js';

export class MatchIntroScene extends Phaser.Scene {
  constructor() {
    super('MatchIntroScene');
    this._skipHandlersBound = false;
  }

  init(data) {
    // Förväntad struktur:
    // {
    //   red: { name, nick, record:{w,l,d}, rank, country },
    //   blue:{ name, nick, record:{w,l,d}, rank, country },
    //   weightClass: string,
    //   purse: number,
    //   winnerBonus: number,
    //   titlesOnTheLine: Array<{ code, name, imageKey }>
    // }
    this.matchData = data || {};
  }

  create() {
    const data = this.matchData;
    const { width, height } = this.scale;

    // Hjälpare
    const formatMoney = (n) => Math.max(0, Math.floor(n || 0)).toLocaleString('sv-SE');
    const countUp = (from, to, duration, onUpdate) => {
      const obj = { value: from || 0 };
      this.tweens.add({
        targets: obj,
        value: Math.max(0, to || 0),
        duration: Math.max(200, duration || 800),
        onUpdate: () => onUpdate && onUpdate(obj.value),
      });
    };

    // --- FIGHT CARDS ---
    const redCard = this.createCard(data.red, data.weightClass, true);
    const blueCard = this.createCard(data.blue, data.weightClass, false);

    const cardY = height * 0.3;
    const leftTargetX = width * 0.25;
    const rightTargetX = width * 0.75;

    // Position cards just outside the screen based on their explicit width.
    redCard.setPosition(-redCard.cardWidth, cardY).setDepth(5);
    blueCard.setPosition(width + blueCard.cardWidth, cardY).setDepth(5);

    // --- ARENAINFO ---
    const infoContainer = this.add.container(width / 2, height * 0.68);
    const infoBg = this.add.graphics();
    infoBg.fillStyle(0x000000, 0.55);
    infoBg.fillRoundedRect(-300, -75, 600, 150, 14);
    infoContainer.add(infoBg);

    const locationLine = [
      data?.arena?.Name,
      data?.arena?.City,
      data?.arena?.Country,
    ]
      .filter(Boolean)
      .join(', ');

    // compute or use provided time
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
    const timeDisplay = data.time || computeTime(data?.arena?.Prestige || 1);
    data.time = timeDisplay;

    const dateLine = [data.date, data.year, timeDisplay].filter(Boolean).join(' ');

    const arenaText = this.add
      .text(0, -15, locationLine, {
        fontFamily: 'Arial',
        fontSize: '26px',
        color: '#FFFFFF',
        align: 'center',
        wordWrap: { width: 560 },
      })
      .setOrigin(0.5);
    infoContainer.add(arenaText);

    const dateText = this.add
      .text(0, 25, dateLine, {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#FFD166',
        align: 'center',
      })
      .setOrigin(0.5);
    infoContainer.add(dateText);
    const scheduleText = this.add
      .text(0, 60, 'Scheduled for 3 rounds', {
        fontFamily: 'Arial',
        fontSize: '22px',
        color: '#FFFFFF',
        align: 'center',
      })
      .setOrigin(0.5);
    infoContainer.add(scheduleText);
    infoContainer.setAlpha(0);

    // --- PRISPENGAR ---
    const purseContainer = this.add.container(width / 2, height * 0.85);
    const purseBg = this.add.graphics();
    purseBg.fillStyle(0x000000, 0.55);
    purseBg.fillRoundedRect(-300, -80, 600, 160, 14);
    purseContainer.add(purseBg);

    const purseTitle = this.add.text(0, -38, 'Purse & Bonus', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#FFD166',
      align: 'center',
    }).setOrigin(0.5);
    purseContainer.add(purseTitle);

    const purseText = this.add.text(0, 5, '0', {
      fontFamily: 'Arial',
      fontSize: '42px',
      color: '#FFFFFF',
      align: 'center',
    }).setOrigin(0.5);
    purseContainer.add(purseText);

    let bonusText = null;
    if (data.winnerBonus && data.winnerBonus > 0) {
      bonusText = this.add.text(0, 50, `Winner bonus: ${formatMoney(data.winnerBonus)}`, {
        fontFamily: 'Arial',
        fontSize: '22px',
        color: '#BEE3DB',
        align: 'center',
      }).setOrigin(0.5);
      purseContainer.add(bonusText);
    }
    purseContainer.setAlpha(0);

    
    const emitter = this.add.particles(0, 0, 'coin', {
      x: { min: width / 2 - 250, max: width / 2 + 250 },
      y: { min: -150, max: -50 },
      speedY: { min: 200, max: 400 },
      lifespan: 2000,
      quantity: 2,
      frequency: 80,
      scale: { start: 0.7, end: 0.2 },
      alpha: { start: 1, end: 0 },
      emitting: false
    }).setDepth(10);

    // --- BÄLTEN ---
    const belts = [];
    const beltsData = Array.isArray(data.titlesOnTheLine) ? data.titlesOnTheLine : [];
    if (beltsData.length > 0) {
      const beltY = height * 0.52;
      const beltW = 220; // ungefärlig visningsbredd
      const spacing = 20;
      const totalW = beltsData.length * beltW + (beltsData.length - 1) * spacing;
      let startX = (width - totalW) / 2 + beltW / 2;

      beltsData.forEach((b) => {
        const imgKey = makeWhiteTransparent(this, b.imageKey || b.code);
        const belt = this.add.image(startX, beltY, imgKey).setOrigin(0.5);
        belt.setDisplaySize(beltW, beltW * 0.5);
        belt.setAlpha(0);
        belt.y += 20; // för en liten "hopptween"
        belts.push(belt);
        startX += beltW + spacing;
      });
    }

    // --- CTA ---
    const cta = this.add.text(width / 2, height * 0.95, 'Press any key to continue', {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: '#FFFFFF'
    }).setOrigin(0.5);
    cta.setAlpha(0);

    // --- Skip / continue när som helst ---
    const startMatch = () => {
      // Rensa animationer och timers så vi inte dubblar
      if (this.tweens && this.tweens.killAll) this.tweens.killAll();
      // Scene key for the actual fight is "Match"
      this.scene.start('MatchScene', data);
    };
    if (!this._skipHandlersBound) {
      this._skipHandlersBound = true;
      this.input.keyboard?.on('keydown', startMatch);
      this.input.on('pointerdown', startMatch);
    }

    // --- Manuell kedjning (ersätter timeline) ---
    const chain = (steps) => {
      const run = (i = 0) => {
        if (i >= steps.length) return;
        const s = steps[i];
        if (s.type === 'delay') {
          this.time.delayedCall(s.ms, () => run(i + 1));
          return;
        }
        const oc = s.onComplete;
        this.tweens.add({
          ...s,
          onComplete: () => {
            if (typeof oc === 'function') oc();
            run(i + 1);
          }
        });
      };
      run(0);
    };

    const steps = [];

    // 1) Cards in
    steps.push({
      targets: redCard,
      x: leftTargetX,
      duration: 900,
      ease: 'Elastic.Out',
      onStart: () => this.sound?.play?.('whoosh', { volume: 0.6 })
    });
    steps.push({
      targets: blueCard,
      x: rightTargetX,
      duration: 900,
      ease: 'Elastic.Out'
    });

    // 2) Paus
    steps.push({ type: 'delay', ms: 450 });

    // 3) Arena info
    steps.push({
      targets: infoContainer,
      alpha: 1,
      duration: 280,
    });

    // 4) Purse + counter + coins
    steps.push({
      targets: purseContainer,
      alpha: 1,
      duration: 280,
      onStart: () => {
        this.sound?.play?.('coin_jingle', { volume: 0.6 });
        emitter.start();
        this.time.delayedCall(1200, () => emitter.stop());
        countUp(0, data.purse || 0, 1100, (v) => {
          purseText.setText(formatMoney(v));
        });
        if (bonusText) {
          bonusText.setText(`Winner bonus: ${formatMoney(data.winnerBonus)}`);
        }
      }
    });

    // 5) Bälten en och en + shine
    belts.forEach((belt) => {
      steps.push({
        targets: belt,
        alpha: 1,
        y: belt.y - 20,
        duration: 480,
        ease: 'Back.Out',
        onStart: () => this.sound?.play?.('whoosh', { volume: 0.4 }),
        onComplete: () => this.shineBelt(belt)
      });
    });

    // 6) CTA + blink
    steps.push({
      targets: cta,
      alpha: 1,
      duration: 450,
      onComplete: () => {
        this.tweens.add({
          targets: cta,
          alpha: 0.25,
          duration: 600,
          yoyo: true,
          repeat: -1
        });
      }
    });

    // Kör sekvens
    chain(steps);
  }

  // Skapar ett fight card (panel + texter)
  createCard(boxer = {}, weightClass = '', isLeft = true) {
    const {
      name = 'Unknown',
      nickName = '',
      nick = '',
      wins = 0,
      losses = 0,
      draws = 0,
      ranking = 0,
      country = '',
      continent = '',
      age = null,
    } = boxer;
    const nickname = nick || nickName || '';
    const c = this.add.container(0, 0);

    const cardWidth = 520;
    const cardHeight = 310;

    // Panelbild (preloadad som 'fight_card'). Faller tillbaka till grafik om saknas.
    let panel;
    if (this.textures.exists('fight_card')) {
      panel = this.add.image(0, 0, 'fight_card').setOrigin(0.5);
      panel.setDisplaySize(cardWidth, cardHeight);
    } else {
      const g = this.add.graphics();
      g.fillStyle(0x0b0b0f, 0.85);
      g.fillRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 12);
      g.lineStyle(2, 0xC1A44A, 0.9);
      g.strokeRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 12);
      panel = g;
    }
    c.add(panel);

    const headline = [name, nickname ? `“${nickname}”` : '']
      .filter(Boolean)
      .join(' ');
    const tName = this.add.text(0, -80, headline, {
      fontFamily: 'Arial',
      fontSize: '30px',
      color: '#FFFFFF',
      align: 'center',
      wordWrap: { width: 480 }
    }).setOrigin(0.5);
    c.add(tName);

    if (age !== null) {
      const tAge = this.add.text(0, -42, `Age: ${age}`, {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#FFFFFF',
        align: 'center'
      }).setOrigin(0.5);
      c.add(tAge);
    }

    const tRecord = this.add.text(0, -10, `Record: ${wins}-${losses}-${draws}`, {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#BEE3DB',
      align: 'center'
    }).setOrigin(0.5);
    c.add(tRecord);

    const tRank = this.add.text(0, 30, `Rank: ${ranking}`, {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#FFD166',
      align: 'center'
    }).setOrigin(0.5);
    c.add(tRank);

    const location = country
      ? `${country}${continent ? ` (${continent})` : ''}`
      : '';
    const tClass = this.add.text(
      0,
      74,
      [weightClass, location].filter(Boolean).join('  •  '),
      {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: '#FFFFFF',
      align: 'center'
    }).setOrigin(0.5);
    c.add(tClass);

    // Spegla lite om högerkort för variation (valfritt)
    // Tidigare skalades högerkortets innehåll om vilket gjorde kortet
    // oproportionerligt stort. Vi låter alla element behålla sina
    // ursprungliga skalor så att både vänster och höger kort ser likadana ut.

    // Hjälp-egenskaper: sätt storlek utan att påverka skalning
    c.setSize(cardWidth, cardHeight);
    c.cardWidth = cardWidth;
    c.cardHeight = cardHeight;

    return c;
  }

  // Enkel “shine”-effekt: vit remsa ADD-blend som glider över bältet
  shineBelt(belt) {
    const w = belt.displayWidth;
    const h = belt.displayHeight;

    const startX = belt.x - w / 2 - 40;
    const endX = belt.x + w / 2 + 40;

    const stripe = this.add.rectangle(startX, belt.y, 40, h * 1.1, 0xffffff, 0.14).setOrigin(0.5);
    stripe.setBlendMode(Phaser.BlendModes.ADD);

    // Maska till bältets rektangel så remsan inte sticker ut
    const maskGfx = this.add.graphics();
    maskGfx.fillStyle(0xffffff, 1);
    maskGfx.fillRect(belt.x - w / 2, belt.y - h / 2, w, h);
    const mask = maskGfx.createGeometryMask();
    stripe.setMask(mask);

    this.tweens.add({
      targets: stripe,
      x: endX,
      duration: 650,
      ease: 'Sine.InOut',
      onComplete: () => {
        stripe.destroy();
        maskGfx.destroy();
      }
    });
  }
}
