import { eventBus } from './event-bus.js';

export class HealthManager {
  constructor(boxer1, boxer2) {
    this.boxer1 = boxer1;
    this.boxer2 = boxer2;
  }

  reset() {
    this.boxer1.health = this.boxer1.maxHealth;
    this.boxer2.health = this.boxer2.maxHealth;
    eventBus.emit('health-changed', { player: 'p1', value: 1 });
    eventBus.emit('health-changed', { player: 'p2', value: 1 });
  }

  damage(targetKey, amount) {
    const boxer = targetKey === 'p1' ? this.boxer1 : this.boxer2;
    boxer.takeDamage(amount);
    eventBus.emit('health-changed', {
      player: targetKey,
      value: boxer.health / boxer.maxHealth,
    });
  }
}
