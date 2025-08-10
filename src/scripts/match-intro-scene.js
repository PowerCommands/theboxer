// match-intro-scene.js
// Phaser 3 scen för “Tale of the Tape” utan timeline-API (manuell kedjning av tweens)

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

    const cardY = height * 0.35;
    const leftTargetX = width * 0.25;
    const rightTargetX = width * 0.75;

    redCard.setPosition(-redCard.displayWidth, cardY);
    blueCard.setPosition(width + blueCard.displayWidth, cardY);

    // --- PRISPENGAR ---
    const purseContainer = this.add.container(width / 2, height * 0.68);
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

    
    const emitter = this.add.particles(width / 2, height * 0.68, 'coin', {
      speed: { min: 100, max: 250 },
      // 270° = uppåt i Phaser (justera ±30° som innan)
      angle: { min: 240, max: 300 },
      gravityY: 600,
      lifespan: 900,
      quantity: 0,
      scale: { start: 0.7, end: 0.2 },
      alpha: { start: 1, end: 0 },
      emitting: false
    });

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
        const imgKey = b.imageKey || b.code;
        const belt = this.add.image(startX, beltY, imgKey).setOrigin(0.5);
        belt.setDisplaySize(beltW, beltW * 0.5);
        belt.setAlpha(0);
        belt.y += 20; // för en liten "hopptween"
        belts.push(belt);
        startX += beltW + spacing;
      });
    }

    // --- CTA ---
    const cta = this.add.text(width / 2, height * 0.92, 'Press any key to continue', {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: '#FFFFFF'
    }).setOrigin(0.5);
    cta.setAlpha(0);

    // --- Skip / continue när som helst ---
    const startMatch = () => {
      // Rensa animationer och timers så vi inte dubblar
      if (this.tweens && this.tweens.killAll) this.tweens.killAll();
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

    // 3) Purse + counter + coins
    steps.push({
      targets: purseContainer,
      alpha: 1,
      duration: 280,
      onStart: () => {
        this.sound?.play?.('coin_jingle', { volume: 0.6 });
        emitter.explode(38, width / 2, height * 0.68);
        countUp(0, data.purse || 0, 1100, (v) => {
          purseText.setText(formatMoney(v));
        });
        if (bonusText) {
          bonusText.setText(`Winner bonus: ${formatMoney(data.winnerBonus)}`);
        }
      }
    });

    // 4) Bälten en och en + shine
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

    // 5) CTA + blink
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
    const { name = 'Unknown', nick = '', record = { w: 0, l: 0, d: 0 }, rank = 0, country = '' } = boxer;
    const c = this.add.container(0, 0);

    // Panelbild (preloadad som 'fight_card'). Faller tillbaka till grafik om saknas.
    let panel;
    if (this.textures.exists('fight_card')) {
      panel = this.add.image(0, 0, 'fight_card').setOrigin(0.5);
      panel.setDisplaySize(520, 300);
    } else {
      const g = this.add.graphics();
      g.fillStyle(0x0b0b0f, 0.85);
      g.fillRoundedRect(-260, -150, 520, 300, 12);
      g.lineStyle(2, 0xC1A44A, 0.9);
      g.strokeRoundedRect(-260, -150, 520, 300, 12);
      panel = g;
    }
    c.add(panel);

    const headline = [name, nick ? `“${nick}”` : ''].filter(Boolean).join(' ');
    const tName = this.add.text(0, -78, headline, {
      fontFamily: 'Arial',
      fontSize: '30px',
      color: '#FFFFFF',
      align: 'center',
      wordWrap: { width: 480 }
    }).setOrigin(0.5);
    c.add(tName);

    const tRecord = this.add.text(0, -20, `Record: ${record.w || 0}-${record.l || 0}-${record.d || 0}`, {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#BEE3DB',
      align: 'center'
    }).setOrigin(0.5);
    c.add(tRecord);

    const tRank = this.add.text(0, 20, `Rank: ${rank || 0}`, {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#FFD166',
      align: 'center'
    }).setOrigin(0.5);
    c.add(tRank);

    const tClass = this.add.text(0, 64, `${weightClass || ''}${country ? '  •  ' + country : ''}`, {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: '#FFFFFF',
      align: 'center'
    }).setOrigin(0.5);
    c.add(tClass);

    // Spegla lite om högerkort för variation (valfritt)
    if (!isLeft) {
      c.list.forEach((child) => {
        if (child.setScale) child.setScale(1.0);
      });
    }

    // Hjälp-egenskaper
    c.displayWidth = 520;
    c.displayHeight = 300;

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
