import { SoundManager } from './sound-manager.js';
import { resetSavedData } from './save-system.js';
import { getTestMode, setTestMode } from './config.js';
import { createGloveButton } from './glove-button.js';

// Phaser is loaded globally via a script tag in index.html

export class OptionsScene extends Phaser.Scene {
  constructor() {
    super('OptionsScene');
  }

  create() {
    const width = this.sys.game.config.width;
    const height = this.sys.game.config.height;

    const soundRows = Object.entries(SoundManager.sounds || {})
      .map(
        ([key, snd]) =>
          `<tr><td>${key}</td><td><input type="range" id="vol_${key}" min="0" max="1" step="0.1" value="${snd.volume.toFixed(
            1,
          )}"/></td></tr>`,
      )
      .join('');

    const formHTML = `
      <form id="opts" style="color:white">
        <table>
          <tr><th colspan="2">Sounds</th></tr>
          ${soundRows}
          <tr><th colspan="2">Debug</th></tr>
          <tr><td colspan="2"><label><input type="checkbox" id="testModeChk"/> Test mode</label></td></tr>
        </table>
      </form>`;

    const dom = this.add.dom(width / 2, height / 2).createFromHTML(formHTML);

    const sliders = {};
    Object.keys(SoundManager.sounds || {}).forEach((key) => {
      sliders[key] = dom.getChildByID(`vol_${key}`);
    });

    const save = () => {
      Object.entries(sliders).forEach(([k, el]) => {
        const v = parseFloat(el.value);
        const snd = SoundManager.sounds[k];
        if (snd) snd.setVolume(v);
      });
      SoundManager.saveVolumes();
    };

    const clear = () => {
      resetSavedData();
      Object.entries(sliders).forEach(([k, el]) => {
        const snd = SoundManager.sounds[k];
        if (snd) el.value = snd.volume.toFixed(1);
      });
    };

    const chk = dom.getChildByID('testModeChk');
    chk.checked = getTestMode();
    chk.addEventListener('change', () => setTestMode(chk.checked));

    const goBack = () => {
      dom.destroy();
      this.scene.start('StartScene');
    };

    const btnY = height * 0.75;
    createGloveButton(this, width / 2, btnY, 'Save', () => {
      save();
      SoundManager.playClick();
    });
    createGloveButton(this, width / 2, btnY + 90, 'Clear data', () => {
      clear();
      SoundManager.playClick();
    });
    createGloveButton(this, width / 2, btnY + 180, 'Back', () => {
      SoundManager.playClick();
      goBack();
    });

    this.input.keyboard.on('keydown-ESC', goBack);
    this.input.keyboard.on('keydown-ENTER', goBack);
  }
}
