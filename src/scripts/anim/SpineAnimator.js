// Spine-only animator stub. Keep this API stable while you wire a Spine runtime plugin later.
export class SpineAnimator {
  /** @param {any} armature - Spine object from your chosen runtime (to be integrated later). */
  constructor(armature) { this.arm = armature; }

  /** @param {string} key */
  play(key) {
    // Example when runtime is wired:
    // this.arm?.state?.setAnimation?.(0, key, true);
  }

  /** @param {string} key @param {(void)=>void=} onDone */
  playOnce(key, onDone) {
    // Example when runtime is wired:
    // const entry = this.arm?.state?.setAnimation?.(0, key, false);
    // const state = this.arm?.state;
    // if (entry && state?.addListener) {
    //   const listener = { complete: (_, te) => {
    //     if (te === entry) { onDone && onDone(); state.removeListener(listener); }
    //   }};
    //   state.addListener(listener);
    // }
  }

  /** @param {boolean} on */
  flipX(on) {
    if (!this.arm) return;
    this.arm.scaleX = Math.abs(this.arm.scaleX || 1) * (on ? -1 : 1);
  }

  /** @param {number} x @param {number} y */
  setPosition(x, y) {
    if (!this.arm) return;
    this.arm.x = x; this.arm.y = y;
  }

  /** @param {string} skinName */
  setSkin(skinName) {
    // Example when runtime is wired:
    // this.arm?.skeleton?.setSkinByName?.(skinName);
    // this.arm?.skeleton?.setSlotsToSetupPose?.();
  }

  destroy() {
    this.arm?.destroy?.();
  }
}
