// options-scene.js
import { SoundManager } from './sound-manager.js';
import { resetSavedData } from './save-system.js';
import { getTestMode, setTestMode } from './config.js';

// Phaser laddas globalt via script-tag

export class OptionsScene extends Phaser.Scene {
  constructor() {
    super('OptionsScene');
  }

  create(data) {
    this._leaving = false;
    this.returnScene = data?.fromScene;
    this.overlayActive = data?.overlayActive;

    const W = this.scale.width;
    const H = this.scale.height;

    // ----- Panel: 30 px från toppen, stor ram -----
    const panelX = Math.max(16, W * 0.05);
    const panelY = 30;
    const panelW = Math.min(W - panelX * 2, 900);
    const panelH = H - panelY - 30;

    const frame = this.add.graphics();
    frame.fillStyle(0x0a0f14, 0.72).fillRoundedRect(panelX, panelY, panelW, panelH, 14);
    frame.lineStyle(2, 0xE1C66A, 0.95).strokeRoundedRect(panelX, panelY, panelW, panelH, 14);

    this.add.text(panelX + panelW / 2, panelY + 18, 'Options', {
      fontFamily: 'Arial', fontSize: '32px', color: '#FFFFFF'
    }).setOrigin(0.5, 0);

    // ----- Sliders (endast Phaser-objekt, inga globala drag-listeners) -----
    const sounds = SoundManager.sounds || {};
    const entries = Object.entries(sounds);   // [key, snd]
    const sliders = [];                       // { setValue(v) }

    let y = panelY + 72;
    const rowH = 44;
    const leftLabelX = panelX + 24;
    const trackW = Math.min(480, panelW - 260);
    const trackX = panelX + panelW - trackW - 110; // högerjusterat spår

    const makeSlider = (label, initial, onChange, addToList = true) => {
      const cy = y + rowH / 2;

      this.add.text(leftLabelX, cy, label, {
        fontFamily: 'Arial', fontSize: '20px', color: '#FFFFFF'
      }).setOrigin(0, 0.5);

      const track = this.add.graphics();
      const draw = (v) => {
        track.clear();
        track.lineStyle(10, 0x444444, 1).lineBetween(trackX, cy, trackX + trackW, cy);
        track.lineStyle(10, 0xA0A0A0, 1).lineBetween(trackX, cy, trackX + trackW * v, cy);
      };

      // hit-area för klick
      const hit = this.add.rectangle(trackX + trackW / 2, cy, trackW, 24, 0x000000, 0.001)
        .setOrigin(0.5).setInteractive({ useHandCursor: true });

      // handtag (per-objekt drag-handler, INTE global this.input.on('drag'))
      const handle = this.add.circle(trackX + trackW * initial, cy, 10, 0xFFFFFF, 1)
        .setStrokeStyle(2, 0x222222).setInteractive({ useHandCursor: true });
      this.input.setDraggable(handle);

      const valTxt = this.add.text(trackX + trackW + 12, cy, initial.toFixed(1), {
        fontFamily: 'Arial', fontSize: '18px', color: '#FFFFFF'
      }).setOrigin(0, 0.5);

      const setValue = (v) => {
        let vv = Phaser.Math.Clamp(v, 0, 1);
        vv = Math.round(vv * 10) / 10;
        handle.x = trackX + trackW * vv;
        valTxt.setText(vv.toFixed(1));
        draw(vv);
        onChange(vv);
      };

      hit.on('pointerdown', (p) => setValue((p.x - trackX) / trackW));

      // per-handtag drag (viktigt: ingen global lyssnare som överlever scenen)
      handle.on('drag', (pointer, dragX /*, dragY */) => {
        const clampedX = Phaser.Math.Clamp(dragX, trackX, trackX + trackW);
        setValue((clampedX - trackX) / trackW);
      });

      draw(Phaser.Math.Clamp(initial, 0, 1));
      if (addToList) sliders.push({ setValue });
      y += rowH;
      return { setValue };
    };

    const mainInitial = Phaser.Math.Clamp(entries[0]?.[1]?.volume ?? 1.0, 0, 1);
    const mainSlider = makeSlider('Main Volume', mainInitial, (v) => {
      sliders.forEach(s => s.setValue(v));
    }, false);
    y += 10;

    entries.forEach(([key, snd]) => {
      const init = Phaser.Math.Clamp(snd?.volume ?? 1.0, 0, 1);
      makeSlider(key, init, (v) => {
        const s = sounds[key];
        if (s?.setVolume) s.setVolume(v);
      });
    });

    // ----- Test mode -----
    y += 10;
    const chkX = leftLabelX, chkY = y + 18;
    const box = this.add.rectangle(chkX, chkY, 22, 22, 0x101010)
      .setStrokeStyle(2, 0xCCCC66).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
    const mark = this.add.text(chkX + 11, chkY, '✓', {
      fontFamily: 'Arial', fontSize: '18px', color: '#FFFFFF'
    }).setOrigin(0.5).setAlpha(getTestMode() ? 1 : 0);
    const lbl = this.add.text(chkX + 32, chkY, 'Test mode', {
      fontFamily: 'Arial', fontSize: '20px', color: '#FFFFFF'
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

    const toggleTest = () => {
      const next = !(mark.alpha > 0.5);
      mark.setAlpha(next ? 1 : 0);
      setTestMode(next);
    };
    box.on('pointerup', toggleTest);
    lbl.on('pointerup', toggleTest);

    // ----- Gula länkar längst ned -----
    const linkStyle = { fontFamily: 'Arial', fontSize: '28px', color: '#FFD166', fontStyle: 'bold' };
    const linkY = panelY + panelH - 28;

    const makeLink = (txt, x, onClick) => {
      const t = this.add.text(x, linkY, txt, linkStyle).setOrigin(0.5, 0.5);
      t.setInteractive({ useHandCursor: true })
        .on('pointerover', () => t.setScale(1.06))
        .on('pointerout', () => t.setScale(1.00))
        .on('pointerdown', onClick);
      return t;
    };

    makeLink('Save', panelX + panelW * 0.22, () => SoundManager.saveVolumes?.());
    makeLink('Clear data', panelX + panelW * 0.50, () => {
      resetSavedData();
      // Rita om sliders med aktuella volymer efter reset
      let i = 0;
      let firstVal = 1;
      entries.forEach(([k], idx) => {
        const v = Phaser.Math.Clamp(sounds[k]?.volume ?? 1.0, 0, 1);
        if (idx === 0) firstVal = v;
        sliders[i++].setValue(v);
      });
      mainSlider.setValue(firstVal);
    });

    const back = () => {
      if (this._leaving) return; // skydda mot dubbelklick
      this._leaving = true;
      this.scene.stop();
      if (this.overlayActive) {
        this.scene.resume('OverlayUI');
      }
      if (this.returnScene) {
        this.scene.resume(this.returnScene);
      } else {
        this.scene.start('StartScene');
      }
    };
    makeLink('Back', panelX + panelW * 0.78, back);

    this.input.keyboard.on('keydown-ESC', back);
    this.input.keyboard.on('keydown-ENTER', back);

    // Städa alla lyssnare vid shutdown (säkerhetsnät)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard.removeAllListeners();
      this.input.removeAllListeners('drag');
      this.input.removeAllListeners();
    });
  }
}
