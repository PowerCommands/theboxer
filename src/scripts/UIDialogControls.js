export function createStrategyLevelSelector(
  scene,
  {
    maxLevel = 10,
    start = 1,
    selectLabel = 'Select',
    defaultLabel = 'Default',
    onSelect = () => {},
    locked = false,
    x = null,
    y = null,
  } = {}
) {
  const width = scene.sys.game.config.width;
  const height = scene.sys.game.config.height;
  const posX = x ?? width / 2;
  const posY = y ?? height / 2;

  const capRaw = parseInt(maxLevel, 10);
  const cap = Number.isFinite(capRaw) ? Math.max(1, capRaw) : 4;
  const startVal = Phaser.Math.Clamp(parseInt(start, 10) || 1, 1, cap);

  const panelHTML = `
    <div style="background:rgba(0,0,0,0.6);padding:16px 18px;text-align:center;border-radius:10px;color:#fff;min-width:360px;font-family:Arial,sans-serif;">
      <div style="font-size:18px;margin-bottom:8px;">
        Strategy level: <span id="strategy-value" style="color:#fff;">${startVal}</span>
      </div>
      <input id="strategy-slider" type="range" min="1" max="${cap}" step="1" value="${startVal}" style="width:320px;margin-bottom:12px;" ${locked ? 'disabled' : ''}>
      <div style="display:flex;gap:12px;justify-content:center;">
        ${locked ? '' : `<button id="strategy-default" type="button" style="padding:6px 12px;">${defaultLabel}</button>`}
        <button id="strategy-select" type="button" style="padding:6px 12px;">${selectLabel}</button>
      </div>
    </div>
  `;

  const dom = scene.add.dom(posX, posY).createFromHTML(panelHTML);
  dom.setOrigin(0.5);

  const slider = dom.getChildByID('strategy-slider');
  const valueLabel = dom.getChildByID('strategy-value');
  const selectBtn = dom.getChildByID('strategy-select');
  const defaultBtn = dom.getChildByID('strategy-default');

  slider.min = '1';
  slider.max = String(cap);
  slider.step = '1';
  slider.value = String(startVal);
  valueLabel.textContent = String(startVal);

  if (!locked) {
    slider.addEventListener('input', () => {
      valueLabel.textContent = slider.value;
    });
  }

  const proceed = (level) => {
    dom.destroy();
    if (typeof onSelect === 'function') {
      const lvl =
        level === 'default'
          ? 'default'
          : Phaser.Math.Clamp(parseInt(level, 10) || 1, 1, cap);
      onSelect(lvl);
    }
  };

  selectBtn.addEventListener('click', () => {
    proceed(locked ? startVal : slider.value);
  });
  if (defaultBtn) {
    defaultBtn.addEventListener('click', () => proceed('default'));
  }

  return dom;
}

export function createRoundSelector(
  scene,
  {
    maxRounds = 13,
    start = 1,
    selectLabel = 'Select',
    onSelect = () => {},
    x = null,
    y = null,
  } = {},
) {
  const width = scene.sys.game.config.width;
  const height = scene.sys.game.config.height;
  const posX = x ?? width / 2;
  const posY = y ?? height / 2;

  const capRaw = parseInt(maxRounds, 10);
  const cap = Number.isFinite(capRaw) ? Math.max(1, capRaw) : 13;
  const startVal = Phaser.Math.Clamp(parseInt(start, 10) || 1, 1, cap);

  const panelHTML = `
    <div style="background:rgba(0,0,0,0.6);padding:16px 18px;text-align:center;border-radius:10px;color:#fff;min-width:360px;font-family:Arial,sans-serif;">
      <div style="font-size:18px;margin-bottom:8px;">
        Rounds: <span id="round-value">${startVal}</span>
      </div>
      <input id="round-slider" type="range" min="1" max="${cap}" step="1" value="${startVal}" style="width:320px;margin-bottom:12px;">
      <div>
        <button id="round-select" type="button" style="padding:6px 12px;">${selectLabel}</button>
      </div>
    </div>
  `;

  const dom = scene.add.dom(posX, posY).createFromHTML(panelHTML);
  dom.setOrigin(0.5);

  const slider = dom.getChildByID('round-slider');
  const valueLabel = dom.getChildByID('round-value');
  const selectBtn = dom.getChildByID('round-select');

  slider.addEventListener('input', () => {
    valueLabel.textContent = slider.value;
  });

  selectBtn.addEventListener('click', () => {
    const val = Phaser.Math.Clamp(parseInt(slider.value, 10) || 1, 1, cap);
    dom.destroy();
    if (typeof onSelect === 'function') onSelect(val);
  });

  return dom;
}
