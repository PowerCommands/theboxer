import { eventBus } from './event-bus.js';

export class RoundTimer {
  constructor(scene) {
    this.scene = scene;
    this.remaining = 0;
    this.timerEvent = null;
    this.round = 1;
  }

  start(seconds, round = 1) {
    this.stop();
    this.remaining = seconds;
    this.round = round;
    eventBus.emit('round-started', this.round);
    eventBus.emit('timer-tick', this.remaining);
    this.timerEvent = this.scene.time.addEvent({
      delay: 500,
      loop: true,
      callback: () => {
        this.remaining -= 1;
        eventBus.emit('timer-tick', this.remaining);
        if (this.remaining <= 0) {
          this.stop();
          eventBus.emit('round-ended', this.round);
        }
      },
    });
  }

  stop() {
    if (this.timerEvent) {
      this.timerEvent.remove();
      this.timerEvent = null;
    }
    this.remaining = 0;
    eventBus.emit('timer-tick', this.remaining);
  }

  pause() {
    if (this.timerEvent) {
      this.timerEvent.remove();
      this.timerEvent = null;
    }
    eventBus.emit('timer-tick', this.remaining);
  }
}
