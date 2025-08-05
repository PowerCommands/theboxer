# The Boxer

A small boxing game built with Phaser. Two boxers are displayed in the ring.
Each boxer is controlled by a controller object. The current setup uses a
keyboard controller for both boxers so you can play locally with two sets of
keys. Because the behaviour is abstracted through controllers it is trivial to
swap a boxer to a programmatic or AI driven controller in the future.

## Keyboard Controls

The table below lists the keys used to control each boxer.

| Action | Player 1 | Player 2 |
|-------|---------|---------|
| Move left | Left Arrow | `A` |
| Move right | Right Arrow | `D` |
| Move up | Up Arrow | `W` |
| Move down | Down Arrow | `S` |
| Turn left | `Shift` + Left Arrow | `Shift` + `A` |
| Turn right | `Shift` + Right Arrow | `Shift` + `D` |
| Block | Numpad 5 | `X` |
| Jab right | Page Down | `E` |
| Jab left | Delete | `Q` |
| Uppercut | Numpad 0 | `F` |
| Hurt 1 | `1` | `4` |
| Hurt 2 | `2` | `5` |
| Dizzy | `3` | `6` |
| Idle | `7` | `8` |
| KO | Numpad 8 | `G` |
| Win | `0` | `+` |

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
