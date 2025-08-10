import { eventBus } from './event-bus.js';

export class BackdropManager {
  static init() {
    if (this.initialized) return;
    this.initialized = true;

    const setBackground = (file) => {
      document.body.style.background = `url('assets/arena/${file}') no-repeat center center fixed`;
      document.body.style.backgroundSize = 'cover';
    };

    eventBus.on('round-started', () => {
      setBackground('backdrop-dark.png');
    });

    eventBus.on('match-winner', () => {
      setBackground('backdrop.png');
    });
  }
}
