import { eventBus } from './event-bus.js';

export function showComment(text, roundSeconds) {
  eventBus.emit('show-comment', { text, duration: roundSeconds });
}

export function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US'; // eller 'sv-SE' för svenska
  utterance.volume = 1; // 0 till 1
  utterance.rate = 0.9; // 0.1 till 10
  utterance.pitch = 1; // 0 till 2
  window.speechSynthesis.speak(utterance);
}

export class CommentManager {
  constructor(scene) {
    this.scene = scene;
    this.active = false;
    this.textObject = null;
    this.bgObject = null;

    eventBus.on('show-comment', ({ text, duration }) => {
      this.display(text, duration);
    });

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      eventBus.off('show-comment');
    });
  }  

  display(text, duration, force = false) {
    if (this.active && !force) return;
    this.active = true;

    speak(text);

    const width = this.scene.sys.game.config.width;
    const height = this.scene.sys.game.config.height;
    const y = height - 40;

    // Create the text first to measure dimensions
    this.textObject = this.scene.add
      .text(width / 2, y, text, {
        font: '20px Arial',
        color: '#ffffff',
        fontStyle: 'italic',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(1);

    const bgWidth = this.textObject.width + 20;
    const bgHeight = this.textObject.height + 10;

    this.bgObject = this.scene.add
      .rectangle(width / 2, y, bgWidth, bgHeight, 0x808080, 0.5)
      .setOrigin(0.5)
      .setDepth(0);

    // Ensure text is above background
    this.textObject.setDepth(1);

    this.scene.time.delayedCall(duration * 1000, () => this.hide());
  }

  hide() {
    if (this.textObject) {
      this.textObject.destroy();
      this.textObject = null;
    }
    if (this.bgObject) {
      this.bgObject.destroy();
      this.bgObject = null;
    }
    this.active = false;
  }
}
