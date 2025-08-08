import { eventBus } from './event-bus.js';
import { showComment } from './comment-manager.js';

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
    
    const match = this.scene.scene.get('Match');
    if (match) {
      const p1 = match.player1;
      const p2 = match.player2;
      const p1Hits = match.hits?.p1 ?? 0;
      const p2Hits = match.hits?.p2 ?? 0;

      let leaderText = '';
      if (p1Hits > p2Hits) {
        leaderText = `${p1.stats.nickName} is in the lead`;
      } else if (p2Hits > p1Hits) {
        leaderText = `${p2.stats.nickName} is in the lead`;
      } else {
        leaderText = 'It\'s a draw so far';
      }

      const comment = `Round over. Score: ${p1Hits} to ${p2Hits}. ${leaderText}`;
      if(p1Hits + p2Hits > 0){
        showComment(comment, 6, true);
      }      
    }
  }

  pause() {
    if (this.timerEvent) {
      this.timerEvent.remove();
      this.timerEvent = null;
    }
    eventBus.emit('timer-tick', this.remaining);
  }

  resume() {
    if (this.timerEvent || this.remaining <= 0) return;
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
}
