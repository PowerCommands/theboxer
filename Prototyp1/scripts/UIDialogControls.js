export function createPlaybookLevelSelector(
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
    fightPlans = null,
    startFightPlan = 1,
    defaultFightPlan = 1,
  } = {},
) {
  const width = scene.sys.game.config.width;
  const height = scene.sys.game.config.height;
  const posX = x ?? width / 2;
  const posY = y ?? height / 2;

  const capRaw = parseInt(maxLevel, 10);
  const cap = Number.isFinite(capRaw) ? Math.max(1, capRaw) : 4;
  const startVal = Phaser.Math.Clamp(parseInt(start, 10) || 1, 1, cap);

  const planIndex = fightPlans
    ? Math.max(0, fightPlans.findIndex((p) => p.id === startFightPlan))
    : 0;
  const planMax = fightPlans ? fightPlans.length - 1 : 0;
  const planLocked = locked || !fightPlans || fightPlans.length <= 1;

  const fightPlanHTML = fightPlans
    ? `
      <div style="font-size:18px;margin-bottom:8px;">
        Fight plan: <span id="fightplan-value">${
          fightPlans[planIndex]?.name || ''
        }</span>
      </div>
      <input id="fightplan-slider" type="range" min="0" max="${planMax}" step="1" value="${planIndex}" style="width:320px;margin-bottom:12px;" ${planLocked ? 'disabled' : ''}>
    `
    : '';

  const panelHTML = `
    <div style="background:rgba(0,0,0,0.6);padding:16px 18px;text-align:center;border-radius:10px;color:#fff;min-width:360px;font-family:Arial,sans-serif;">
      <div style="font-size:18px;margin-bottom:8px;">
        Playbook level: <span id="playbook-value" style="color:#fff;">${startVal}</span>
      </div>
      <input id="playbook-slider" type="range" min="1" max="${cap}" step="1" value="${startVal}" style="width:320px;margin-bottom:12px;" ${locked ? 'disabled' : ''}>
      ${fightPlanHTML}
      <div style="display:flex;gap:12px;justify-content:center;">
        ${locked ? '' : `<button id="playbook-default" type="button" style="padding:6px 12px;">${defaultLabel}</button>`}
        <button id="playbook-select" type="button" style="padding:6px 12px;">${selectLabel}</button>
      </div>
    </div>
  `;

  const dom = scene.add.dom(posX, posY).createFromHTML(panelHTML);
  dom.setOrigin(0.5);

  const slider = dom.getChildByID('playbook-slider');
  const valueLabel = dom.getChildByID('playbook-value');
  const selectBtn = dom.getChildByID('playbook-select');
  const defaultBtn = dom.getChildByID('playbook-default');
  const planSlider = fightPlans ? dom.getChildByID('fightplan-slider') : null;
  const planValueLabel = fightPlans ? dom.getChildByID('fightplan-value') : null;

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
  if (planSlider && !planLocked) {
    planSlider.addEventListener('input', () => {
      const idx = parseInt(planSlider.value, 10);
      if (fightPlans[idx]) planValueLabel.textContent = fightPlans[idx].name;
    });
  }

  const proceed = (level, plan) => {
    dom.destroy();
    if (typeof onSelect === 'function') {
      const lvl =
        level === 'default'
          ? 'default'
          : Phaser.Math.Clamp(parseInt(level, 10) || 1, 1, cap);
      const fp =
        plan === 'default'
          ? 'default'
          : fightPlans
          ? fightPlans[Phaser.Math.Clamp(parseInt(plan, 10) || 0, 0, planMax)]?.id
          : undefined;
      onSelect({ level: lvl, fightPlan: fp });
    }
  };

  selectBtn.addEventListener('click', () => {
    const lvl = locked ? startVal : slider.value;
    const plan = planSlider ? planSlider.value : undefined;
    proceed(lvl, plan);
  });
  if (defaultBtn) {
    defaultBtn.addEventListener('click', () => proceed('default', 'default'));
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
