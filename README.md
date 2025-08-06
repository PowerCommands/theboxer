# The Boxer

A small boxing game built with Phaser. Two boxers are displayed in the ring.
Each boxer is controlled by a controller object. When the game starts you first
select the boxer you will control with the keyboard, then choose an opponent
that is steered by the computer along with its opening strategy. After picking
a strategy you will be shown a summary of the match setup where you can confirm
or cancel your choices. Because the behaviour is abstracted through controllers
it is trivial to swap a boxer to a different type of controller in the future.

## Keyboard Controls

The table below lists the keys used to control the player boxer. The opponent
is controlled by the AI and has no keyboard controls.

| Action | Player |
|-------|-------|
| Move left | Left Arrow |
| Move right | Right Arrow |
| Move up | Up Arrow |
| Move down | Down Arrow |
| Turn left | `Shift` + Left Arrow |
| Turn right | `Shift` + Right Arrow |
| Block | Numpad 5 |
| Jab right | Page Down |
| Jab left | Delete |
| Uppercut | Numpad 0 |
| Hurt 1 | `1` |
| Hurt 2 | `2` |
| Dizzy | `3` |
| Idle | `7` |
| KO | Numpad 8 |
| Win | `0` |

Press `Shift` + `P` to pause the match.

## Available Boxers

| Namn | Land | Stamina | Power | Health | Speed |
|------|------|---------|-------|--------|-------|
| Glass Joe | Frankrike | 1.0 | 1.0 | 1.0 | 1.0 |
| Von Kaiser | Tyskland | 1.2 | 1.2 | 1.0 | 1.0 |
| Piston Honda | Japan | 1.3 | 1.3 | 1.2 | 1.0 |
| Don Flamenco | Spanien | 1.3 | 1.5 | 1.0 | 1.2 |
| King Hippo | Hippo Island | 1.0 | 1.6 | 1.8 | 1.0 |
| Great Tiger | Indien | 1.4 | 1.0 | 1.0 | 1.5 |
| Bald Bull | Turkiet | 1.5 | 2.0 | 2.0 | 1.2 |
| Soda Popinski | Ryssland | 1.0 | 2.0 | 1.5 | 2.0 |
| Mr. Sandman | USA | 2.0 | 2.0 | 2.0 | 2.0 |
| Mike Tyson | USA | 2.5 | 2.5 | 2.2 | 2.5 |
