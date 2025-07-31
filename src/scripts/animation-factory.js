import { animKey } from './helpers.js';

export const ANIM_DEFS = {
  idle: { frameCount: 10, repeat: -1 },
  forward: { frameCount: 10, repeat: -1 },
  backward: { frameCount: 10, repeat: -1 },
  block: { frameCount: 10, repeat: -1 },
  jabRight: { frameCount: 8, repeat: 0 },
  jabLeft: { frameCount: 8, repeat: 0 },
  uppercut: { frameCount: 8, repeat: 0 },
  hurt1: { frameCount: 8, repeat: 0 },
  hurt2: { frameCount: 8, repeat: 0 },
  dizzy: { frameCount: 10, repeat: 0 },
  ko: { frameCount: 8, repeat: 0 },
  win: { frameCount: 4, repeat: -1 },
};

export function createBoxerAnimations(scene, prefix) {
  Object.entries(ANIM_DEFS).forEach(([key, { frameCount, repeat }]) => {
    const frames = [];
    for (let i = 0; i < frameCount; i++) {
      const frame = i.toString().padStart(3, '0');
      frames.push({ key: `${key}_${frame}` });
    }
    scene.anims.create({
      key: animKey(prefix, key),
      frames,
      frameRate: 10,
      repeat,
    });
  });
}
