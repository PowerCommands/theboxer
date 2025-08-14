// health-manager.js
import { eventBus } from './event-bus.js';

/**
 * @typedef {'p1'|'p2'} PlayerKey
 *
 * Events emitted on the eventBus:
 *  - 'health-changed'     : { player, value, current, max }
 *  - 'boxer-damaged'      : { player, amount, effective, previous, current, wasCritical }
 *  - 'boxer-healed'       : { player, amount, previous, current }
 *  - 'boxer-ko'           : { player }
 *  - 'health-warning'     : { player, level: 'warning'|'critical', entering: boolean }
 */

/** Clamp helper */
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** Small epsilon to reduce noisy repeated emissions */
const EPS = 1e-6;

export class HealthManager {
  /**
   * @param {{health:number,maxHealth:number,takeDamage?:(n:number)=>void,adjustHealth?:(n:number)=>void}|object} boxer1
   * @param {{health:number,maxHealth:number,takeDamage?:(n:number)=>void,adjustHealth?:(n:number)=>void}|object} boxer2
   * @param {{warning?:number,critical?:number}=} thresholds Health ratio thresholds for warnings
   */
  constructor(boxer1, boxer2, thresholds = { warning: 0.5, critical: 0.2 }) {
    this.boxer1 = boxer1;
    this.boxer2 = boxer2;

    // Thresholds (fractions of max health)
    this.thresholds = {
      warning: clamp(thresholds.warning ?? 0.5, 0, 1),
      critical: clamp(thresholds.critical ?? 0.2, 0, 1),
    };

    // Track last emitted health ratios to avoid spam
    this._lastRatio = new Map([
      ['p1', this._ratio('p1')],
      ['p2', this._ratio('p2')],
    ]);

    // Track KO state so we emit 'boxer-ko' only once per KO
    this._ko = new Map([
      ['p1', false],
      ['p2', false],
    ]);

    // Timed effects & guards
    /** @type {Map<string, number>} */
    this._timers = new Map(); // id -> interval handle
    /** @type {Map<PlayerKey, {reduction:number, until:number}|null>} */
    this._guard = new Map([
      ['p1', null],
      ['p2', null],
    ]);
  }

  // ----------------------- Existing API (kept & enhanced) -----------------------

  reset() {
    this.boxer1.health = this.boxer1.maxHealth;
    this.boxer2.health = this.boxer2.maxHealth;

    this._ko.set('p1', false);
    this._ko.set('p2', false);

    // Clear timed effects / guards
    this._clearAllEffects();

    // Maintain original event shape { player, value }
    eventBus.emit('health-changed', { player: 'p1', value: 1, current: this.boxer1.health, max: this.boxer1.maxHealth });
    eventBus.emit('health-changed', { player: 'p2', value: 1, current: this.boxer2.health, max: this.boxer2.maxHealth });

    this._lastRatio.set('p1', 1);
    this._lastRatio.set('p2', 1);
  }

  /**
   * Damage target by raw amount. Keeps original signature.
   * Applies active guard reduction if set.
   * @param {PlayerKey} targetKey
   * @param {number} amount
   */
  damage(targetKey, amount) {
    const { boxer, key } = this._getBoxer(targetKey);
    const prev = boxer.health;

    const effAmount = this._applyGuard(key, amount);
    if (typeof boxer.takeDamage === 'function') {
      boxer.takeDamage(effAmount);
    } else {
      boxer.health = clamp(boxer.health - effAmount, 0, boxer.maxHealth);
    }

    const curr = boxer.health;
    this._postChange(key, prev, curr, -effAmount);
  }

  /**
   * Adjust health by delta (+ heal / - damage). Keeps original signature.
   * Applies guard if delta is negative.
   * @param {PlayerKey} targetKey
   * @param {number} delta
   */
  adjustHealth(targetKey, delta) {
    const { boxer, key } = this._getBoxer(targetKey);
    const prev = boxer.health;

    const change = delta < 0 ? -this._applyGuard(key, -delta) : delta;

    if (typeof boxer.adjustHealth === 'function') {
      boxer.adjustHealth(change);
      boxer.health = clamp(boxer.health, 0, boxer.maxHealth);
    } else {
      boxer.health = clamp(boxer.health + change, 0, boxer.maxHealth);
    }

    const curr = boxer.health;
    this._postChange(key, prev, curr, change);
  }

  // ----------------------------- New Utilities -----------------------------

  /**
   * Set a temporary damage reduction ("guard/block") effect.
   * @param {PlayerKey} targetKey
   * @param {number} reduction Fraction in [0,1], e.g. 0.3 = 30% less damage
   * @param {number} durationSec Duration in seconds
   */
  setGuard(targetKey, reduction, durationSec) {
    const key = targetKey === 'p1' ? 'p1' : 'p2';
    this._guard.set(key, {
      reduction: clamp(reduction, 0, 0.95),
      until: performance.now() + Math.max(0, durationSec) * 1000,
    });
  }

  /**
   * Heal instantly by amount (sugar over adjustHealth).
   * @param {PlayerKey} targetKey
   * @param {number} amount
   */
  heal(targetKey, amount) {
    this.adjustHealth(targetKey, Math.abs(amount));
  }

  /**
   * Apply a heal-over-time or damage-over-time effect.
   * @param {PlayerKey} targetKey
   * @param {{ id?:string, total:number, duration:number, interval?:number, type?:'heal'|'damage' }} opts
   * @returns {() => void} cancel function
   */
  applyOverTime(targetKey, opts) {
    const { boxer, key } = this._getBoxer(targetKey);
    const id = opts.id ?? `${key}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const duration = Math.max(0.01, opts.duration);
    const interval = Math.max(0.05, opts.interval ?? 0.2);
    const ticks = Math.ceil(duration / interval);
    const perTick = (opts.total / ticks) * (opts.type === 'damage' ? -1 : 1);

    let done = 0;
    const handle = setInterval(() => {
      // Stop if KO
      if (this._ko.get(key)) {
        this._clearTimer(id);
        return;
      }
      done++;
      this.adjustHealth(key, perTick);

      if (done >= ticks) {
        this._clearTimer(id);
      }
    }, interval * 1000);

    this._timers.set(id, handle);
    return () => this._clearTimer(id);
  }

  /**
   * Revive a KO'd boxer with a fraction of max health (default 1.0 = full).
   * @param {PlayerKey} targetKey
   * @param {number} ratio
   */
  revive(targetKey, ratio = 1.0) {
    const { boxer, key } = this._getBoxer(targetKey);
    boxer.health = clamp(ratio, 0, 1) * boxer.maxHealth;
    this._ko.set(key, false);
    this._emitHealth(key);
  }

  /**
   * Change max health. Optionally preserve current ratio when resizing.
   * @param {PlayerKey} targetKey
   * @param {number} newMax
   * @param {{ preserveRatio?: boolean }} [opts]
   */
  setMaxHealth(targetKey, newMax, opts = { preserveRatio: true }) {
    const { boxer, key } = this._getBoxer(targetKey);
    const ratio = boxer.maxHealth > 0 ? boxer.health / boxer.maxHealth : 1;
    boxer.maxHealth = Math.max(1, Math.floor(newMax));
    boxer.health = opts.preserveRatio ? clamp(ratio, 0, 1) * boxer.maxHealth : clamp(boxer.health, 0, boxer.maxHealth);
    this._emitHealth(key);
  }

  /**
   * Get a snapshot of both players' health states.
   */
  getSnapshot() {
    return {
      p1: { current: this.boxer1.health, max: this.boxer1.maxHealth, ratio: this._ratio('p1') },
      p2: { current: this.boxer2.health, max: this.boxer2.maxHealth, ratio: this._ratio('p2') },
    };
  }

  // ----------------------------- Internals -----------------------------

  /** @private */
  _getBoxer(targetKey) {
    const key = targetKey === 'p1' ? 'p1' : 'p2';
    const boxer = key === 'p1' ? this.boxer1 : this.boxer2;
    if (!boxer) throw new Error(`HealthManager: unknown boxer key "${targetKey}"`);
    return { boxer, key };
  }

  /** @private */
  _ratio(key) {
    const b = key === 'p1' ? this.boxer1 : this.boxer2;
    return b.maxHealth > 0 ? b.health / b.maxHealth : 0;
  }

  /** @private */
  _emitHealth(key) {
    const ratio = clamp(this._ratio(key), 0, 1);
    const boxer = key === 'p1' ? this.boxer1 : this.boxer2;
    const last = this._lastRatio.get(key) ?? -1;

    if (Math.abs(ratio - last) > EPS) {
      this._lastRatio.set(key, ratio);
      eventBus.emit('health-changed', {
        player: key,
        value: ratio,              // keep legacy field
        current: boxer.health,
        max: boxer.maxHealth,
      });

      // Threshold detection
      this._maybeEmitThreshold(key, last, ratio);
    }

    // KO check
    if (ratio <= 0 && !this._ko.get(key)) {
      this._ko.set(key, true);
      eventBus.emit('boxer-ko', { player: key });
    }
  }

  /** @private */
  _maybeEmitThreshold(key, oldR, newR) {
    // Enter/exit warning or critical bands
    const { warning, critical } = this.thresholds;
    const enteringCritical = oldR > critical && newR <= critical;
    const leavingCritical = oldR <= critical && newR > critical;
    const enteringWarn = oldR > warning && newR <= warning;
    const leavingWarn = oldR <= warning && newR > warning;

    if (enteringCritical || leavingCritical) {
      eventBus.emit('health-warning', { player: key, level: 'critical', entering: enteringCritical });
    } else if (enteringWarn || leavingWarn) {
      eventBus.emit('health-warning', { player: key, level: 'warning', entering: enteringWarn });
    }
  }

  /** @private */
  _postChange(key, previous, current, delta) {
    // Fine-grained events
    if (delta < 0) {
      const wasCritical = previous / (key === 'p1' ? this.boxer1.maxHealth : this.boxer2.maxHealth) <= this.thresholds.critical;
      eventBus.emit('boxer-damaged', {
        player: key,
        amount: Math.abs(delta),
        effective: Math.abs(delta),
        previous,
        current,
        wasCritical,
      });
    } else if (delta > 0) {
      eventBus.emit('boxer-healed', { player: key, amount: delta, previous, current });
    }

    // Always emit aggregate after change
    this._emitHealth(key);
  }

  /** @private */
  _applyGuard(key, rawDamage) {
    const g = this._guard.get(key);
    if (!g) return Math.max(0, rawDamage);

    // Expire guard if time has passed
    if (performance.now() > g.until) {
      this._guard.set(key, null);
      return Math.max(0, rawDamage);
    }

    const reduced = rawDamage * (1 - g.reduction);
    return Math.max(0, reduced);
  }

  /** @private */
  _clearTimer(id) {
    const h = this._timers.get(id);
    if (h) {
      clearInterval(h);
      this._timers.delete(id);
    }
  }

  /** @private */
  _clearAllEffects() {
    for (const h of this._timers.values()) clearInterval(h);
    this._timers.clear();
    this._guard.set('p1', null);
    this._guard.set('p2', null);
  }

  /**
   * Clean up any timers/effects (call when unloading a match/scene).
   */
  dispose() {
    this._clearAllEffects();
  }
}
