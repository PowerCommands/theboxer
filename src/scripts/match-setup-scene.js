import { getTestMode } from './config.js';
import { getMaxPlaybookLevel, getPlayerBoxer } from './player-boxer.js';
import { RULESETS } from './ruleset-data.js';
import { SoundManager } from './sound-manager.js';

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
      <div style="background:rgba(0,0,0,0.6);padding:20px;color:#fff;display:flex;flex-direction:column;gap:20px;min-width:400px;">
        <div>
          <span>Control:</span>
          <label><input type="radio" name="control" value="ai" checked> Computer</label>
          <label style="margin-left:40px;"><input type="radio" name="control" value="human"> Keyboard</label>
        </div>
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
        <button id="next_btn">Select boxer</button>
      </div>
    `;
    const dom = this.add.dom(width / 2, height / 2).createFromHTML(optionsHtml);
    dom.setOrigin(0.5);
    const controlRadios = dom.node.querySelectorAll('input[name="control"]');
    const pb1Div = dom.getChildByID('pb1');
    controlRadios.forEach((r) => {
      r.addEventListener('change', () => {
        pb1Div.style.display = r.value === 'ai' ? 'block' : 'none';
      });
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

    const nextBtn = dom.getChildByID('next_btn');
    nextBtn.addEventListener('click', () => {
      SoundManager.playClick();
      const control = dom.node.querySelector('input[name="control"]:checked').value;
      const playbook1 = control === 'human' ? 'default' : pb1Slider.value;
      const fightPlan1 = control === 'human' ? 'default' : dom.getChildByID('fp1_sel').value;
      const playbook2 = testMode ? pb2Slider.value : 'default';
      const fightPlan2 = testMode ? dom.getChildByID('fp2_sel').value : 'default';
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
    });
  }
}
