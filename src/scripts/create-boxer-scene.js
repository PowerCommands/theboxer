import { BOXERS, addBoxer, defaultStrategyForRanking } from './boxer-data.js';
import { setPlayerBoxer } from './player-boxer.js';

// Scene that lets the player create their own boxer.
export class CreateBoxerScene extends Phaser.Scene {
  constructor() {
    super('CreateBoxer');
  }

  create() {
    const width = this.sys.game.config.width;
    const height = this.sys.game.config.height;

    const formHTML = `
      <form id="boxerForm" style="color:white">
        <div><label>Name <input type="text" id="name" /></label></div>
        <div><label>Nickname <input type="text" id="nick" /></label></div>
        <div><label>Country <input type="text" id="country" /></label></div>
        <div><label>Age <input type="number" id="age" min="18" max="30" value="18" /></label></div>
        <div><label>Difficulty
          <select id="difficulty">
            <option value="easy">Easy</option>
            <option value="normal">Normal</option>
            <option value="hard">Hard</option>
          </select>
        </label></div>
        <div><label>Ruleset <select id="ruleset"></select></label></div>
        <div>Points left: <span id="points">0</span></div>
        <div><label>Health <input type="range" id="health" min="0" max="3" step="0.1" value="0" /></label></div>
        <div><label>Stamina <input type="range" id="stamina" min="0" max="3" step="0.1" value="0" /></label></div>
        <div><label>Power <input type="range" id="power" min="0" max="3" step="0.1" value="0" /></label></div>
        <div><label>Speed <input type="range" id="speed" min="0" max="3" step="0.1" value="0" /></label></div>
        <div style="margin-top:10px"><button type="button" id="createBtn">Create</button></div>
      </form>
    `;

    const dom = this.add.dom(width / 2, height / 2).createFromHTML(formHTML);

    const nameInput = dom.getChildByID('name');
    const nickInput = dom.getChildByID('nick');
    const countryInput = dom.getChildByID('country');
    const ageInput = dom.getChildByID('age');
    const diffSelect = dom.getChildByID('difficulty');
    const rulesetSelect = dom.getChildByID('ruleset');
    const pointsSpan = dom.getChildByID('points');
    const healthSlider = dom.getChildByID('health');
    const staminaSlider = dom.getChildByID('stamina');
    const powerSlider = dom.getChildByID('power');
    const speedSlider = dom.getChildByID('speed');
    const sliders = [healthSlider, staminaSlider, powerSlider, speedSlider];

    function allowedPoints() {
      const age = parseInt(ageInput.value) || 18;
      const over = Math.max(0, age - 18);
      switch (diffSelect.value) {
        case 'easy':
          return 6 + over * 0.3;
        case 'normal':
          return 5 + over * 0.2;
        case 'hard':
        default:
          return 4 + over * 0.1;
      }
    }

    function updateRulesets() {
      const diff = diffSelect.value;
      rulesetSelect.innerHTML = '';
      const addOpt = (v) => {
        const o = document.createElement('option');
        o.value = v; o.text = v; rulesetSelect.appendChild(o);
      };
      if (diff === 'easy') { addOpt('1'); addOpt('2'); addOpt('3'); }
      else if (diff === 'normal') { addOpt('1'); addOpt('2'); }
      else { addOpt('1'); }
    }

    function updatePoints() {
      const total = allowedPoints();
      const spent = sliders.reduce((s, el) => s + parseFloat(el.value), 0);
      pointsSpan.textContent = (total - spent).toFixed(1);
    }

    diffSelect.addEventListener('change', () => { updateRulesets(); updatePoints(); });
    ageInput.addEventListener('input', () => { updatePoints(); });
    sliders.forEach((s) => s.addEventListener('input', updatePoints));

    updateRulesets();
    updatePoints();

    dom.getChildByID('createBtn').addEventListener('click', () => {
      const remaining = parseFloat(pointsSpan.textContent);
      if (remaining < -0.01) {
        // not enough points
        return;
      }
      const age = parseInt(ageInput.value) || 18;
      const ranking = BOXERS.reduce((m, b) => Math.max(m, b.ranking), 0) + 1;
      const boxer = {
        name: nameInput.value || 'Player',
        nickName: nickInput.value || '',
        country: countryInput.value || '',
        age,
        stamina: parseFloat(staminaSlider.value),
        power: parseFloat(powerSlider.value),
        health: parseFloat(healthSlider.value),
        speed: parseFloat(speedSlider.value),
        ranking,
        matches: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        winsByKO: 0,
        defaultStrategy: defaultStrategyForRanking(ranking),
        ruleset: parseInt(rulesetSelect.value, 10),
      };
      addBoxer(boxer);
      setPlayerBoxer(boxer);
      dom.destroy();
      this.scene.start('Ranking');
    });
  }
}
