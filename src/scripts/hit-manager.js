import { eventBus } from './event-bus.js';
import { animKey } from './helpers.js';

export class HitManager {
  constructor(healthManager, hitLimit, hits) {
    this.healthManager = healthManager;
    this.hitLimit = hitLimit;
    this.hits = hits;
  }

  isFacingCorrectly(attacker, defender) {
    return !(
      (attacker.facingRight && defender.sprite.x < attacker.sprite.x) ||
      (!attacker.facingRight && defender.sprite.x > attacker.sprite.x)
    );
  }

  isColliding(attacker, defender) {
    const aBounds = attacker.sprite.getBounds();
    const dBounds = defender.sprite.getBounds();
    return Phaser.Geom.Intersects.RectangleToRectangle(aBounds, dBounds);
  }

  handleHit(attacker, defender, defenderKey) {
    if (!attacker.isAttacking() || attacker.hasHit) return;
    if (!this.isFacingCorrectly(attacker, defender)) return;

    const distance = Phaser.Math.Distance.Between(
      attacker.sprite.x,
      attacker.sprite.y,
      defender.sprite.x,
      defender.sprite.y
    );
    if (distance > this.hitLimit) return;
    if (!this.isColliding(attacker, defender)) return;

    attacker.hasHit = true;
    const current = attacker.sprite.anims.currentAnim?.key;
    let punch = '';
    if (current === animKey(attacker.prefix, 'uppercut')) punch = 'uppercut';
    else if (current === animKey(attacker.prefix, 'jabRight')) punch = 'jabRight';
    else if (current === animKey(attacker.prefix, 'jabLeft')) punch = 'jabLeft';

    if(punch == 'jabLeft' && distance > (this.hitLimit*0.75)){
      return;
    }

    let damage = Math.max(0.009, 0.05 * attacker.power);
    if (punch === 'uppercut') damage *= 2;
    if (punch === 'jabLeft') damage *= 1.5;
    if (distance >= 265) damage *= 0.5;

    let blocked = false;
    if (defender.isBlocking()) {
      const penalty = punch === 'uppercut' ? 0.12 : 0.06;
      attacker.adjustPower(-penalty);
      attacker.adjustStamina(-penalty);
      damage *= 0.5;
      blocked = true;
    }

    this.healthManager.damage(defenderKey, damage);
    if (!blocked) {
      const attackerKey = defenderKey === 'p1' ? 'p2' : 'p1';
      this.hits[attackerKey] += 1;
      eventBus.emit('hit-update', { p1: this.hits.p1, p2: this.hits.p2 });
    }
  }
}

