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
| Move left | `A` |
| Move right | `D` |
| Move up | Up Arrow |
| Move down | Down Arrow |
| Turn left | `Shift` + `A` |
| Turn right | `Shift` + `D` |
| Block | `S` |
| Jab right | `E` |
| Jab left | `Q` |
| Uppercut | `W` |
| Hurt 1 | `1` |
| Hurt 2 | `2` |
| Dizzy | `3` |
| Idle | `7` |
| KO | Numpad 8 |
| Win | `0` |

Press `Shift` + `P` to pause the match.

## Available Boxers

| Name | Country | Stamina | Power | Health | Speed |
|------|------|---------|-------|--------|-------|
| Glass Joe | France | 1.0 | 1.0 | 1.0 | 1.0 |
| Von Kaiser | Germany | 1.2 | 1.2 | 1.0 | 1.0 |
| Piston Honda | Japan | 1.3 | 1.3 | 1.2 | 1.0 |
| Don Flamenco | Spain | 1.3 | 1.5 | 1.0 | 1.2 |
| King Hippo | Hippo Island | 1.0 | 1.6 | 1.8 | 1.0 |
| Great Tiger | India | 1.4 | 1.0 | 1.0 | 1.5 |
| Bald Bull | Turkey | 1.5 | 2.0 | 2.0 | 1.2 |
| Soda Popinski | Russia | 1.0 | 2.0 | 1.5 | 2.0 |
| Mr. Sandman | USA | 2.0 | 2.0 | 2.0 | 2.0 |
| Mike Tyson | USA | 2.5 | 2.5 | 2.2 | 2.5 |

## Creating a Boxer

Select **Start new game** on the ranking screen to build your own fighter.
You will be presented with a form where you can customise the boxer:

- **Identity** – Choose the name, nickname, country and age.
- **Difficulty** – Easy, Normal and Hard determine how many attribute points you
  can spend and which rulesets are available.
- **Ruleset** – Pick the ruleset for your matches. Higher difficulties offer
  fewer options.
- **Attributes** – Distribute points among Health, Stamina, Power and Speed.
  The total number of points depends on your chosen difficulty and age (older
  fighters get a small bonus).

After creating the boxer they are added to the rankings with the next available
position and become your player character.

## Rankings and Opponents

Rankings shift as matches are played. If a lower‑ranked boxer defeats a higher
one the two swap positions. You may challenge any boxer ranked below you, but
when moving up you can only select opponents up to three places above your
current rank. Winning fights moves you toward the top of the leaderboard.

The ultimate goal is to climb the ladder and become the number one ranked
boxer.
