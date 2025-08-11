export function createGloveButton(scene, x, y, label, onClick, opts = {}) {
  const width = opts.width || 500;
  const height = opts.height || 80;
  const bgColor = opts.bgColor || 0x001b44;
  const bgAlpha = opts.bgAlpha || 0.4;
  const container = scene.add.container(x, y);
  container.setSize(width, height);
  const bg = scene.add.rectangle(0, 0, width, height, bgColor, bgAlpha);
  const text = scene.add.text(0, 0, label, {
    font: '32px Arial',
    color: '#ffffff',
  }).setOrigin(0.5);
  const gloveStart = width / 2 + 50;
  const gloveEnd = width / 2 - 100;
  const gloveL = scene.add.image(-gloveStart, 0, 'glove_horizontal').setDisplaySize(100, 70);
  const gloveR = scene.add.image(gloveStart, 0, 'glove_horizontal').setDisplaySize(100, 70).setFlipX(true);
  container.add([bg, text, gloveL, gloveR]);
  scene.tweens.add({ targets: gloveL, x: -gloveEnd, duration: 800, ease: 'Sine.Out' });
  scene.tweens.add({ targets: gloveR, x: gloveEnd, duration: 800, ease: 'Sine.Out' });
  container.setInteractive({ useHandCursor: true }).on('pointerup', () => { if (onClick) onClick(); });
  return container;
}
