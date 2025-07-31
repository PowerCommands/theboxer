// AI strategies controlling boxer behaviour

function baseActions() {
  return {
    moveLeft: false,
    moveRight: false,
    moveUp: false,
    moveDown: false,
    block: false,
    jabRight: false,
    jabLeft: false,
    uppercut: false,
    turnLeft: false,
    turnRight: false,
    hurt1: false,
    hurt2: false,
    dizzy: false,
    idle: false,
    ko: false,
    win: false,
  };
}

export class OffensiveStrategy {
  decide(boxer, opponent) {
    const actions = baseActions();
    const distance = Math.abs(opponent.sprite.x - boxer.sprite.x);
    const approachDistance = 150;
    if (distance > approachDistance) {
      if (boxer.sprite.x < opponent.sprite.x) {
        actions.moveRight = true;
      } else {
        actions.moveLeft = true;
      }
    }
    actions.block = Math.random() < 0.05;
    actions.jabRight = Math.random() < 0.4;
    actions.jabLeft = Math.random() < 0.4;
    actions.uppercut = Math.random() < 0.2;
    return actions;
  }
}

export class DefensiveStrategy {
  decide(boxer, opponent) {
    const actions = baseActions();
    const distance = Math.abs(opponent.sprite.x - boxer.sprite.x);
    const retreatDistance = 200;
    if (distance < retreatDistance) {
      if (boxer.sprite.x < opponent.sprite.x) {
        actions.moveLeft = true;
      } else {
        actions.moveRight = true;
      }
    }
    actions.block = Math.random() < 0.6;
    actions.jabRight = Math.random() < 0.1;
    actions.jabLeft = Math.random() < 0.1;
    actions.uppercut = Math.random() < 0.05;
    return actions;
  }
}

export function createBaseActions() {
  return baseActions();
}
