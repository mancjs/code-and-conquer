# Code & Conquer

## Game
Code & Conquer is a programming game in which teams compete to capture squares from a shared grid.

## Objective

The game starts with a square grid. The winning team is the team who, by the end of the game, has captured the most number of squares. Once a team owns a square, they must protect it from other teams attempting to steal it.

Some squares are worth x2 and x3 points (denoted as the taller squares on the grid). Once a square is owned by a player, it'll change to the team's respective colour.

## Gameplay

1. Open the game server's address in your browser, port 9000, and register your team:

  1. Select your team's special role (see Special Roles below for more info).

  2. Enter your email (used for gravatar image) and team name.

  3. Click `Register`

  4. Make a note of your account `Key`.

2. Download the [game client](#) and update the `serverUrl` and `clientKey` variables to the address of the game server, and your account key respectively.

3. Your team will be allocated 30 requests every minute. Requests don't roll-over – you lose what you don't use in each minute period.

4. All squares are initially owned by the CPU, each with a health of 60.

5. Using the client, you must send commands to the game server in real time to play your particular strategy. You can send `attack`, `defend` and `query` commands:

  1. `attack` takes 1 health point off the specified cell. If this causes the cell's health to drop to 0, the sender becomes the new owner and the cell's health is set to 120.

    Each `attack` command uses 1 request.

  2. `defend` adds 1 health point to the specified cell. A cell's health is capped at 120. Any cell on the grid can be defended, including cells not owned by the sender.

    Each `defend` command uses 1 request.

  3. `query` retrieves the state of the grid, or a specific cell to be queried. Each cell holds a state which shows:

    * The cell's current owner
    * The cell's current health
    * The cell's bonux (x1, x2 or x3)
    * The entire attack and defend history since its last acquisition.

    Each `query` command is free, but rate limited, so avoid heavy polling.

## Special Roles

Each team can select a special role during registration. There are 3 special roles to choose from. A special role can be played at any point during the game, but only once.

### Minelayer
...

### Cloaker
...

### Spy
...

## Rules

...

## Replays

After each MancJS session we run this game at, we take a snapshot of the way the game played out on the evening, called replays. Here are our previous replays:

[October 2015](http://mancjs.com/code-and-conquer/october-2015/replay.html)