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

    const maxNameLen = BOXERS.reduce((m, b) => Math.max(m, b.name.length), 0);
    const inputSize = Math.max(12, maxNameLen);

    const formHTML = `
      <form id="boxerForm" style="color:white">
        <table>
          <tr><th colspan="2">Boxer</th></tr>
          <tr><td>Name</td><td><input type="text" id="name" size="${inputSize}" /></td></tr>
          <tr><td>Nickname</td><td><input type="text" id="nick" size="${inputSize}" /></td></tr>
          <tr><td>Country</td><td><input type="text" id="country" size="${inputSize}" /></td></tr>
          <tr><td>Age <span id="ageVal">18</span></td><td><input type="range" id="age" min="18" max="30" value="18" /></td></tr>
          <tr><th colspan="2">Difficulty &amp; Ruleset</th></tr>
          <tr><td>Difficulty <span id="diffText">Easy</span></td><td><input type="range" id="difficulty" min="0" max="2" step="1" value="0" /></td></tr>
          <tr><td>Ruleset</td><td><select id="ruleset"></select></td></tr>
          <tr><th colspan="2">Attributes</th></tr>
          <tr><td colspan="2">Points left: <span id="points">0</span></td></tr>
          <tr><td>Health</td><td><input type="range" id="health" min="0" max="3" step="0.1" value="0" /></td></tr>
          <tr><td>Stamina</td><td><input type="range" id="stamina" min="0" max="3" step="0.1" value="0" /></td></tr>
          <tr><td>Power</td><td><input type="range" id="power" min="0" max="3" step="0.1" value="0" /></td></tr>
          <tr><td>Speed</td><td><input type="range" id="speed" min="0" max="3" step="0.1" value="0" /></td></tr>
          <tr><td colspan="2" style="text-align:center;padding-top:10px"><button type="button" id="createBtn">Create</button></td></tr>
        </table>
      </form>
    `;

    const dom = this.add.dom(width / 2, height / 2).createFromHTML(formHTML);

    const nameInput = dom.getChildByID('name');
    const nickInput = dom.getChildByID('nick');
    const countryInput = dom.getChildByID('country');
    const ageInput = dom.getChildByID('age');
    const ageVal = dom.getChildByID('ageVal');
    const diffSlider = dom.getChildByID('difficulty');
    const diffText = dom.getChildByID('diffText');
    const rulesetSelect = dom.getChildByID('ruleset');
    const pointsSpan = dom.getChildByID('points');
    const healthSlider = dom.getChildByID('health');
    const staminaSlider = dom.getChildByID('stamina');
    const powerSlider = dom.getChildByID('power');
    const speedSlider = dom.getChildByID('speed');
    const sliders = [healthSlider, staminaSlider, powerSlider, speedSlider];
    const lastValues = new Map();
    sliders.forEach((s) => lastValues.set(s, s.value));

    function currentDifficulty() {
      return ['easy', 'normal', 'hard'][parseInt(diffSlider.value, 10)];
    }

    function allowedPoints() {
      const age = parseInt(ageInput.value) || 18;
      const over = Math.max(0, age - 18);
      switch (currentDifficulty()) {
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
      const diff = currentDifficulty();
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

    diffSlider.addEventListener('input', () => {
      diffText.textContent = ['Easy', 'Normal', 'Hard'][parseInt(diffSlider.value, 10)];
      updateRulesets();
      updatePoints();
    });

    ageInput.addEventListener('input', () => {
      ageVal.textContent = ageInput.value;
      updatePoints();
    });

    sliders.forEach((s) => s.addEventListener('input', () => {
      const prev = parseFloat(lastValues.get(s));
      const curr = parseFloat(s.value);
      const total = allowedPoints();
      const spent = sliders.reduce((sum, el) => sum + parseFloat(el.value), 0);
      const epsilon = 0.001;
      if (spent - total > epsilon && curr > prev) {
        s.value = prev;
      } else {
        lastValues.set(s, s.value);
      }
      updatePoints();
    }));

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
