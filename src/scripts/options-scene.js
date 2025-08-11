import { SoundManager } from './sound-manager.js';
import { resetSavedData } from './save-system.js';
import { getTestMode, setTestMode } from './config.js';

function createTextButton(scene, x, y, label, onClick) {
  const btn = scene.add
    .text(x, y, label, { font: 'bold 32px Arial', color: '#ffffff' })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });
  const setColor = (hover) => btn.setColor(hover ? '#ffff00' : '#ffffff');
  btn.on('pointerover', () => setColor(true));
  btn.on('pointerout', () => setColor(false));
  btn.on('pointerdown', () => onClick && onClick());
  return btn;
}

// Phaser is loaded globally via a script tag in index.html

export class OptionsScene extends Phaser.Scene {
  constructor() {
    super('OptionsScene');
  }

  create() {
    const { width, height } = this.sys.game.config;

    const formHTML = `
      <div id="opts" style="color:white;font-family:Arial">
        <div id="soundsGroup">
          <h2>Sounds</h2>
          <div id="soundControls"></div>
        </div>
        <div id="dataGroup" style="margin-top:20px;">
          <h2>Data</h2>
        </div>
        <div id="debugGroup" style="margin-top:20px;">
          <h2>Debug</h2>
          <label><input type="checkbox" id="testModeChk"/> Test mode</label>
        </div>
      </div>`;

    const dom = this.add.dom(width / 2, 0).createFromHTML(formHTML);
    dom.setOrigin(0.5, 0);

    const soundContainer = dom.getChildByID('soundControls');
    const sliders = {};
    Object.entries(SoundManager.sounds || {}).forEach(([key, snd]) => {
      const row = document.createElement('div');
      row.textContent = key + ': ';
      const input = document.createElement('input');
      input.type = 'range';
      input.min = '0';
      input.max = '1';
      input.step = '0.1';
      input.value = snd.volume.toFixed(1);
      input.id = `vol_${key}`;
      row.appendChild(input);
      soundContainer.appendChild(row);
      sliders[key] = input;
    });

    const soundsGroup = dom.getChildByID('soundsGroup');
    const saveY = soundsGroup.offsetTop + soundsGroup.offsetHeight + 40;
    createTextButton(this, width / 2, saveY, 'Save', () => {
      Object.entries(sliders).forEach(([k, el]) => {
        const v = parseFloat(el.value);
        const snd = SoundManager.sounds[k];
        if (snd) snd.setVolume(v);
      });
      SoundManager.saveVolumes();
    });

    const dataGroup = dom.getChildByID('dataGroup');
    const clearY = dataGroup.offsetTop + dataGroup.offsetHeight + 40;
    createTextButton(this, width / 2, clearY, 'Clear data', () => {
      resetSavedData();
    });

    const chk = dom.getChildByID('testModeChk');
    chk.checked = getTestMode();
    chk.addEventListener('change', () => setTestMode(chk.checked));

    const goBack = () => {
      dom.destroy();
      this.scene.start('StartScene');
    };
    const back = createTextButton(this, width / 2, height - 40, 'Back', goBack);

    this.input.keyboard.on('keydown-ESC', goBack);
    this.input.keyboard.on('keydown-ENTER', goBack);
  }
}
