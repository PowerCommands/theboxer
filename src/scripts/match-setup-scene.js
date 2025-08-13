import { getTestMode } from './config.js';
import { getMaxPlaybookLevel, getPlayerBoxer } from './player-boxer.js';
import { RULESETS } from './ruleset-data.js';
import { SoundManager } from './sound-manager.js';
import { createGloveButton } from './glove-button.js';

export class MatchSetupScene extends Phaser.Scene {
  constructor() {
    super('MatchSetup');
  }

  create() {
    const width = this.sys.game.config.width;
    const height = this.sys.game.config.height;
    const testMode = getTestMode();
    const boxer1 = getPlayerBoxer();
    const maxLevel = getMaxPlaybookLevel(boxer1);
    const plans1 = Object.values(RULESETS).filter(
      (p) => !p.perk || boxer1?.perks?.some((r) => r.Name === p.perk)
    );
    const plans2 = Object.values(RULESETS);

    const optionsHtml = `
        <div style="background:rgba(0,0,0,0.6);padding:20px;color:#fff;display:flex;flex-direction:column;min-width:400px;">
          <div style="display:flex;align-items:center;gap:20px;margin-bottom:10px;">
            <img id="control_ai" src="assets/arena/computer.png" style="width:80px;height:80px;cursor:pointer;" />
            <img id="control_human" src="assets/arena/keyboard.png" style="width:80px;height:80px;cursor:pointer;" />
            <span id="control_label">Computer</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:20px;">
            <div id="pb1">
              <div>Playbook level: <span id="pb1_val">1</span></div>
              <input id="pb1_slider" type="range" min="1" max="${maxLevel}" value="1" />
              <div>Fight plan:
                <select id="fp1_sel">
                  ${plans1.map((p) => `<option value="${p.id}">${p.name}</option>`).join('')}
                </select>
              </div>
            </div>
            ${testMode ? `
            <div id="pb2">
              <div>Playbook level boxer2: <span id="pb2_val">1</span></div>
              <input id="pb2_slider" type="range" min="1" max="10" value="1" />
              <div>Fight plan:
                <select id="fp2_sel">
                  ${plans2.map((p) => `<option value="${p.id}">${p.name}</option>`).join('')}
                </select>
              </div>
            </div>` : ''}
            <div>
              <div>Rounds: <span id="round_val">1</span></div>
              <input id="round_slider" type="range" min="1" max="13" value="1" />
            </div>
          </div>
        </div>
      `;
      const dom = this.add.dom(width / 2, height / 2).createFromHTML(optionsHtml);
      dom.setOrigin(0.5);

      let control = 'ai';
      const pb1Div = dom.getChildByID('pb1');
      const controlLabel = dom.getChildByID('control_label');
      const aiImg = dom.getChildByID('control_ai');
      const humanImg = dom.getChildByID('control_human');
      aiImg.addEventListener('click', () => {
        control = 'ai';
        controlLabel.textContent = 'Computer';
        pb1Div.style.display = 'block';
      });
      humanImg.addEventListener('click', () => {
        control = 'human';
        controlLabel.textContent = 'Keyboard';
        pb1Div.style.display = 'none';
      });

    const pb1Slider = dom.getChildByID('pb1_slider');
    const pb1Val = dom.getChildByID('pb1_val');
    if (pb1Slider) {
      pb1Slider.addEventListener('input', () => {
        pb1Val.textContent = pb1Slider.value;
      });
    }

    const pb2Slider = dom.getChildByID('pb2_slider');
    const pb2Val = dom.getChildByID('pb2_val');
    if (pb2Slider) {
      pb2Slider.addEventListener('input', () => {
        pb2Val.textContent = pb2Slider.value;
      });
    }

    const roundSlider = dom.getChildByID('round_slider');
    const roundVal = dom.getChildByID('round_val');
    roundSlider.addEventListener('input', () => {
      roundVal.textContent = roundSlider.value;
    });

    const proceed = () => {
      SoundManager.playClick();
      const playbook1 = control === 'human' ? 'default' : pb1Slider.value;
      const fightPlan1 = control === 'human' ? 'default' : dom.getChildByID('fp1_sel').value;
      const playbook2 = testMode ? pb2Slider?.value : 'default';
      const fightPlan2 = testMode ? dom.getChildByID('fp2_sel')?.value : 'default';
      const rounds = parseInt(roundSlider.value, 10) || 1;
      dom.destroy();
      this.scene.start('SelectBoxer', {
        isBoxer1Human: control === 'human',
        playbook1,
        fightPlan1,
        playbook2,
        fightPlan2,
        rounds,
      });
    };
    createGloveButton(this, width / 2, height - 80, 'Select boxer', proceed);

    const back = () => {
      dom.destroy();
      this.scene.start('Ranking');
    };
    this.add
      .text(20, height - 40, 'Back', { font: '24px Arial', color: '#ffff00' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', back);
    this.input.keyboard.on('keydown-BACKSPACE', back);
  }
}
