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
    } else if (Math.random() < 0.1) {
      // back off occasionally to recover
      if (boxer.sprite.x < opponent.sprite.x) {
        actions.moveLeft = true;
      } else {
        actions.moveRight = true;
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
    } else if (Math.random() < 0.2) {
      // step forward occasionally
      if (boxer.sprite.x < opponent.sprite.x) {
        actions.moveRight = true;
      } else {
        actions.moveLeft = true;
      }
    }
    actions.block = Math.random() < 0.6;
    actions.jabRight = Math.random() < 0.1;
    actions.jabLeft = Math.random() < 0.1;
    actions.uppercut = Math.random() < 0.05;
    return actions;
  }
}

export class NeutralStrategy {
  decide(boxer, opponent) {
    const actions = baseActions();
    const distance = Math.abs(opponent.sprite.x - boxer.sprite.x);
    const approachDistance = 170;
    const retreatDistance = 130;
    if (distance > approachDistance) {
      if (boxer.sprite.x < opponent.sprite.x) {
        actions.moveRight = true;
      } else {
        actions.moveLeft = true;
      }
    } else if (distance < retreatDistance) {
      if (boxer.sprite.x < opponent.sprite.x) {
        actions.moveLeft = true;
      } else {
        actions.moveRight = true;
      }
    } else if (Math.random() < 0.15) {
      // random small steps
      if (Math.random() < 0.5) {
        actions.moveLeft = true;
      } else {
        actions.moveRight = true;
      }
    }
    actions.block = Math.random() < 0.3;
    actions.jabRight = Math.random() < 0.25;
    actions.jabLeft = Math.random() < 0.25;
    actions.uppercut = Math.random() < 0.1;
    return actions;
  }
}

export function createBaseActions() {
  return baseActions();
}
