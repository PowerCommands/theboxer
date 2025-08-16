// scripts/scenes/PreloadScene.js
export class PreloadScene extends window.Phaser.Scene {
  constructor() { super('Preload'); }

  init() {
    // Om scenen saknar plugin (ska inte behövas nu), installera det här:
    if (!this.spine) {
      this.plugins.installScenePlugin('spine.SpinePlugin', spine.SpinePlugin, 'spine', this);
    }
  }

  preload() {
    // Spineboy-demo (Spine 4.2). Allt via URL – inga lokala assets behövs.
    this.load.spineJson('spineboy-data',
      'https://esotericsoftware.com/files/examples/4.2/spineboy/export/spineboy-pro.json');
    this.load.spineAtlas('spineboy-atlas',
      'https://esotericsoftware.com/files/examples/4.2/spineboy/export/spineboy-pma.atlas');
  }

  create() {
    const boy = this.add.spine(480, 600, 'spineboy-data', 'spineboy-atlas');
    boy.skeleton.setSlotsToSetupPose();

    // Mjukare övergångar mellan animationer
    if (boy.animationState?.data) {
      boy.animationState.data.defaultMix = 0.12;
    }

    // Hjälpare: spela bas-animation på track 0 (loop)
    const playBase = (name) => {
      const ok = !!boy.skeleton?.data?.findAnimation?.(name);
      if (ok) boy.animationState.setAnimation(0, name, true);
      else console.warn('No such animation:', name);
    };

    // Hjälpare: overlay på track 1 (spelas en gång)
    const overlay = (name) => {
      const ok = !!boy.skeleton?.data?.findAnimation?.(name);
      if (!ok) return console.warn('No such animation:', name);
      const entry = boy.animationState.setAnimation(1, name, false);
      // Rensa track 1 när den är klar (så bas-loopen syns igen)
      const listener = {
        complete: (_, te) => {
          if (te === entry) {
            boy.animationState.clearTrack(1);
            boy.animationState.removeListener(listener);
          }
        }
      };
      boy.animationState.addListener(listener);
    };

    // Start: idle
    playBase('idle');

    // Tangenter för snabbtest:
    this.add.text(12, 12,
      'I: idle   W: walk   J: shoot(overlay)   F: flip   +/-: speed',
      { color: '#fff', fontFamily: 'monospace', fontSize: 14 });

    this.input.keyboard.on('keydown-I', () => playBase('idle'));
    this.input.keyboard.on('keydown-W', () => playBase('walk'));
    this.input.keyboard.on('keydown-J', () => overlay('shoot'));
    this.input.keyboard.on('keydown-F', () => { boy.scaleX *= -1; });

    // Justera global animationshastighet
    this.input.keyboard.on('keydown-PLUS', () => { boy.animationState.timeScale = (boy.animationState.timeScale || 1) + 0.25; });
    this.input.keyboard.on('keydown-ADD',  () => { boy.animationState.timeScale = (boy.animationState.timeScale || 1) + 0.25; });
    this.input.keyboard.on('keydown-MINUS',() => { boy.animationState.timeScale = Math.max(0.25, (boy.animationState.timeScale || 1) - 0.25); });
    this.input.keyboard.on('keydown-SUBTRACT',() => { boy.animationState.timeScale = Math.max(0.25, (boy.animationState.timeScale || 1) - 0.25); });
  }
}
