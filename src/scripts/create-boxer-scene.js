// create-boxer-scene.js
import { BOXERS, addBoxer } from './boxers.js';
import { setPlayerBoxer } from './player-boxer.js';

function defaultStrategyForRanking(ranking) {
  if (ranking >= 80)  return Math.floor(Math.random() * 4) + 1;
  if (ranking >= 50)  return Math.floor(Math.random() * 3) + 2;
  if (ranking >= 11)  return Math.floor(Math.random() * 4) + 3;
  return Math.floor(Math.random() * 4) + 4;
}

export class CreateBoxerScene extends Phaser.Scene {
  constructor() {
    super('CreateBoxer');
    this._domInputs = [];
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    this._leaving = false;

    // ----- Panel -----
    const panelX = Math.max(16, W * 0.05);
    const panelY = 30;
    const panelW = Math.min(W - panelX * 2, 1060);
    const panelH = H - panelY - 30;

    const frame = this.add.graphics();
    frame.fillStyle(0x0a0f14, 0.72).fillRoundedRect(panelX, panelY, panelW, panelH, 14);
    frame.lineStyle(2, 0xE1C66A, 0.95).strokeRoundedRect(panelX, panelY, panelW, panelH, 14);

    this.add.text(panelX + panelW / 2, panelY + 18, 'Create Boxer', {
      fontFamily: 'Arial', fontSize: '32px', color: '#FFFFFF'
    }).setOrigin(0.5, 0);

    // ----- State -----
    const state = {
      name: 'Player',
      nick: '',
      country: '',
      continent: 'Europe',
      age: 18,
      difficulty: 0,  // 0=Easy,1=Normal,2=Hard
      ruleset: 1,
      health: 0, stamina: 0, power: 0, speed: 0
    };

    const diffTextOf  = (d) => ['Easy','Normal','Hard'][d] || 'Easy';
    const diffKeyOf   = (d) => ['easy','normal','hard'][d] || 'easy';
    const rulesetsFor = (d) => (d===0 ? [1,2,3] : d===1 ? [1,2] : [1]);
    const fmt1        = (v) => (Math.round(v*10)/10).toFixed(1);

    const allowedPoints = () => {
      const over = Math.max(0, state.age - 18);
      switch (diffKeyOf(state.difficulty)) {
        case 'easy':   return 6 + over * 0.3;
        case 'normal': return 5 + over * 0.2;
        default:       return 4 + over * 0.1;
      }
    };
    const spentPoints     = () => state.health + state.stamina + state.power + state.speed;
    const remainingPoints = () => allowedPoints() - spentPoints();

    // ----- Layout -----
    let y = panelY + 72;
    const rowH  = 40;
    const leftX = panelX + 24;
    const valX  = panelX + panelW * 0.60 - 200; // ~200px närmare etiketterna

    // ----- Länkar längst ned skapas FÖRST (så vi kan toggla Create under slider-drag) -----
    const linkStyle = { fontFamily:'Arial', fontSize:'28px', color:'#FFD166', fontStyle:'bold' };
    const linkY = panelY + panelH - 28;

    const makeLink = (txt, x, onClick) => {
      const t = this.add.text(x, linkY, txt, linkStyle).setOrigin(0.5);
      t.setInteractive({ useHandCursor:true })
        .on('pointerover', () => t.setScale(1.06))
        .on('pointerout',  () => t.setScale(1.00))
        .on('pointerdown', onClick);
      return t;
    };

    const goBack = () => {
      if (this._leaving) return;
      this._leaving = true;
      this._domInputs.forEach(d => { try { d.destroy(); } catch(_){} });
      this._domInputs.length = 0;
      this.scene.start('StartScene');
    };

    const doCreate = () => {
      if (this._leaving) return;
      if (remainingPoints() < -0.01) return;

      const ranking = (BOXERS.reduce((m, b) => Math.max(m, b.ranking), 0) || 0) + 1;
      const boxer = {
        name: state.name || 'Player',
        nickName: state.nick || '',
        country: state.country || '',
        continent: state.continent || '',
        age: state.age,
        stamina: state.stamina, power: state.power, health: state.health, speed: state.speed,
        ranking, matches: 0, wins: 0, losses: 0, draws: 0, winsByKO: 0,
        defaultStrategy: defaultStrategyForRanking(ranking),
        ruleset: state.ruleset, userCreated: true, titles: [], earnings: 0
      };
      addBoxer(boxer);
      setPlayerBoxer(boxer);

      this._domInputs.forEach(d => { try { d.destroy(); } catch(_){} });
      this._domInputs.length = 0;

      this._leaving = true;
      this.scene.start('Ranking');
    };

    const backLink = makeLink('Back', panelX + panelW * 0.25, () => goBack());

    let createLink = null; // IMPORTANT: deklarerad innan setCreateEnabled används
    const setCreateEnabled = (enabled) => {
      if (!createLink) return; // säkert innan den finns
      createLink.setAlpha(enabled ? 1 : 0.35);
      createLink.disableInteractive();
      if (enabled) createLink.setInteractive({ useHandCursor:true });
    };

    const createLinkX = panelX + panelW * 0.75;
    createLink = makeLink('Create', createLinkX, () => doCreate());

    // ----- Helper: DOM textinput -----
    const makeDomInput = (x, cy, initial, placeholder, onInput) => {
      const html = `
        <input type="text" placeholder="${placeholder}"
               style="
                 width: 280px;
                 padding: 6px 10px;
                 border-radius: 6px;
                 border: 1px solid #E1C66A;
                 background: rgba(255,255,255,0.10);
                 color: #FFD166;
                 outline: none;
                 font-family: Arial, sans-serif;
                 font-size: 18px;
               ">
      `;
      const dom = this.add.dom(x, cy).createFromHTML(html);
      dom.setOrigin(0, 0.5);
      const el = dom.node.tagName === 'INPUT' ? dom.node : dom.node.querySelector('input');
      if (el) {
        el.value = initial ?? '';
        el.addEventListener('input', () => onInput(el.value));
      }
      this._domInputs.push(dom);
      return dom;
    };

    // Name / Nickname / Country
    const addInputRow = (label, getter, setter) => {
      const cy = y + rowH / 2;
      this.add.text(leftX, cy, label, { fontFamily:'Arial', fontSize:'20px', color:'#FFFFFF' }).setOrigin(0,0.5);
      makeDomInput(valX, cy, getter(), label, (v) => setter(v));
      y += rowH;
    };
    addInputRow('Name',     () => state.name,    v => state.name = v || 'Player');
    addInputRow('Nickname', () => state.nick,    v => state.nick = v);
    addInputRow('Country',  () => state.country, v => state.country = v);

    // Continent med ◀ value ▶
    const continents = ['Africa','Asia','Europe','North America','Oceania','South America'];
    {
      const cy = y + rowH / 2;
      this.add.text(leftX, cy, 'Continent', { fontFamily:'Arial', fontSize:'20px', color:'#FFFFFF' }).setOrigin(0,0.5);

      const left  = this.add.text(valX - 22, cy, '◀', { fontFamily:'Arial', fontSize:'22px', color:'#FFD166' })
        .setOrigin(0.5).setInteractive({ useHandCursor:true });
      const value = this.add.text(valX, cy, state.continent, { fontFamily:'Arial', fontSize:'20px', color:'#FFD166' })
        .setOrigin(0,0.5).setInteractive({ useHandCursor:true });
      const right = this.add.text(valX + value.width + 14, cy, '▶', { fontFamily:'Arial', fontSize:'22px', color:'#FFD166' })
        .setOrigin(0.5).setInteractive({ useHandCursor:true });

      const redraw = () => { value.setText(state.continent); right.x = value.x + value.width + 14; };
      const prev   = () => { const i = continents.indexOf(state.continent); state.continent = continents[(i-1+continents.length)%continents.length]; redraw(); };
      const next   = () => { const i = continents.indexOf(state.continent); state.continent = continents[(i+1)%continents.length]; redraw(); };

      left.on('pointerdown', prev);
      right.on('pointerdown', next);
      value.on('pointerdown', next);
      redraw();
      y += rowH;
    }

    // Slider helper
    const makeSlider = ({ label, min, max, step, get, set, showRightText, width = 460 }) => {
      const cy = y + rowH / 2;
      this.add.text(leftX, cy, label, { fontFamily:'Arial', fontSize:'20px', color:'#FFFFFF' }).setOrigin(0,0.5);

      const trackX = valX;
      const maxTrackW = panelX + panelW - trackX - 60;
      const trackW = Math.min(width, maxTrackW);

      const track = this.add.graphics();
      const drawTrack = (n) => {
        track.clear();
        track.lineStyle(10, 0x444444, 1).lineBetween(trackX, cy, trackX + trackW, cy);
        track.lineStyle(10, 0xA0A0A0, 1).lineBetween(trackX, cy, trackX + trackW * n, cy);
      };

      const rightText = this.add.text(trackX + trackW + 18, cy, '', {
        fontFamily:'Arial', fontSize:'18px', color:'#FFFFFF'
      }).setOrigin(0,0.5);

      const valueToNorm = (v) => (v - min) / (max - min);
      const normToValue = (n) => min + n * (max - min);
      const snap = (v) => {
        if (!step || step <= 0) return v;
        const s = Math.round((v - min) / step) * step + min;
        const p = Math.pow(10, (step >= 1 ? 0 : String(step).split('.')[1]?.length || 0));
        return Math.max(min, Math.min(max, Math.round(s * p) / p));
      };

      const handle = this.add.circle(trackX + trackW * valueToNorm(get()), cy, 10, 0xFFFFFF, 1)
        .setStrokeStyle(2, 0x222222).setInteractive({ useHandCursor:true });
      this.input.setDraggable(handle);

      const redraw = () => {
        const v = get();
        const n = valueToNorm(v);
        drawTrack(n);
        handle.x = trackX + trackW * n;
        rightText.setText(showRightText ? showRightText(v) : String(v));
      };

      const hit = this.add.rectangle(trackX + trackW / 2, cy, trackW, 24, 0x000000, 0.001)
        .setOrigin(0.5).setInteractive({ useHandCursor:true });
      hit.on('pointerdown', (p) => {
        const rel = Phaser.Math.Clamp((p.x - trackX) / trackW, 0, 1);
        const next = snap(normToValue(rel));
        set(next); redraw(); updatePointsAndCreateState();
      });

      handle.on('drag', (pointer, dragX) => {
        const clampedX = Phaser.Math.Clamp(dragX, trackX, trackX + trackW);
        const rel = (clampedX - trackX) / trackW;
        const next = snap(normToValue(rel));
        set(next); redraw(); updatePointsAndCreateState();
      });

      redraw(); y += rowH;
    };

    // Age + Difficulty
    makeSlider({ label:'Age', min:18, max:30, step:1, get:()=>state.age, set:(v)=>state.age=v, showRightText:(v)=>String(v) });
    makeSlider({
      label:'Difficulty', min:0, max:2, step:1,
      get:()=>state.difficulty,
      set:(v)=>{ state.difficulty=v; const allowed = rulesetsFor(v); if (!allowed.includes(state.ruleset)) state.ruleset = allowed[0]; rulesetValue?.setText(String(state.ruleset)); },
      showRightText:(v)=>diffTextOf(v)
    });

    // Ruleset ◀/▶
    let rulesetValue = null;
    {
      const cy = y + rowH / 2;
      this.add.text(leftX, cy, 'Ruleset', { fontFamily:'Arial', fontSize:'20px', color:'#FFFFFF' }).setOrigin(0,0.5);

      const left  = this.add.text(valX - 22, cy, '◀', { fontFamily:'Arial', fontSize:'22px', color:'#FFD166' })
        .setOrigin(0.5).setInteractive({ useHandCursor:true });
      rulesetValue = this.add.text(valX, cy, String(state.ruleset), {
        fontFamily:'Arial', fontSize:'20px', color:'#FFD166'
      }).setOrigin(0,0.5).setInteractive({ useHandCursor:true });
      const right = this.add.text(valX + rulesetValue.width + 14, cy, '▶', { fontFamily:'Arial', fontSize:'22px', color:'#FFD166' })
        .setOrigin(0.5).setInteractive({ useHandCursor:true });

      const redraw = () => { rulesetValue.setText(String(state.ruleset)); right.x = rulesetValue.x + rulesetValue.width + 14; };
      const prev   = () => { const arr = rulesetsFor(state.difficulty); const i = Math.max(0, arr.indexOf(state.ruleset)); state.ruleset = arr[(i-1+arr.length)%arr.length]; redraw(); };
      const next   = () => { const arr = rulesetsFor(state.difficulty); const i = Math.max(0, arr.indexOf(state.ruleset)); state.ruleset = arr[(i+1)%arr.length]; redraw(); };

      left.on('pointerdown', prev);
      right.on('pointerdown', next);
      rulesetValue.on('pointerdown', next);
      redraw();
      y += rowH;
    }

    // Points kvar
    const pointsText = this.add.text(leftX, y + 6, '', { fontFamily:'Arial', fontSize:'20px', color:'#BEE3DB' }).setOrigin(0,0);
    y += rowH;

    // Attributes
    const clampAttr = (v) => Phaser.Math.Clamp(Math.round(v*10)/10, 0, 3);
    const makeAttr = (label, key) => makeSlider({
      label, min:0, max:3, step:0.1,
      get:()=>state[key],
      set:(v)=>{ const prev=state[key]; state[key]=clampAttr(v); if (remainingPoints()<-0.051 && state[key]>prev) state[key]=prev; },
      showRightText:(v)=>fmt1(v)
    });
    makeAttr('Health','health');
    makeAttr('Stamina','stamina');
    makeAttr('Power','power');
    makeAttr('Speed','speed');

    // Uppdaterare (nu ok – createLink finns redan)
    const updatePointsAndCreateState = () => {
      const rem = remainingPoints();
      pointsText.setText(`Points left: ${fmt1(rem)}`);
      setCreateEnabled(rem >= -0.01);
    };
    updatePointsAndCreateState();

    // Hotkeys
    this.input.keyboard.on('keydown-ESC',   goBack);
    this.input.keyboard.on('keydown-ENTER', doCreate);

    // Städning
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard.removeAllListeners();
      this.input.removeAllListeners('drag');
      this.input.removeAllListeners();
      this._domInputs.forEach(d => { try { d.destroy(); } catch(_){} });
      this._domInputs.length = 0;
    });
  }
}
