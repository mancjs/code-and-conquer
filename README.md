# Code & Conquer

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

  1. `attack` takes 1 health point off the specified square. If this causes the square's health to drop to 0, the attacker becomes the new owner and the square's health is set to 120.

    Each `attack` command uses 1 request.

  2. `defend` adds 1 health point to the specified square. A square's health is capped at 120. Any square on the grid can be defended, including squares not owned by the defender.

    Each `defend` command uses 1 request.

  3. `query` retrieves the state of the entire grid, or a specific square. Each square holds a state which shows:

    * The square's current owner
    * The square's current health
    * The square's bonux (x1, x2 or x3)
    * The entire attack and defend history since its last acquisition.

    Each `query` command is free, but rate limited, so avoid heavy polling.

## Special Roles

Each team can select a special role during registration. There are 3 special roles to choose from. A special role can be played at any point during the game, but only once.

### Minelayer
A minelayer can place one mine on a square of their choice. The team that triggers it loses all their current requests.

### Cloaker
A cloaker can mask the health of 3 squares for 5 minutes of gameplay, making them appear to have maximum health to other players.

### Spy
A spy can place a redirect on a player, causing their next 15 requests to be sent to a different grid location.

## Rules

1. All squares are initially owned by the game (a `query` command will show the owner as `cpu`).

2. All `cpu` owned squares start with a health of 60.

3. The team behind the `attack` command that causes the health of a square to drop to 0 will become the new owner of the square, and the square's health will be set at 120.

4. A `defend` restores 1 health point to a square. Health cannot be restored above 120.

5. A team may `attack` their own squares, and `defend` the squares of other teams.

6. A special role may be played only once during the game.

7. A team that sends an `attack` or `defend` command to a square that has a mine layed will cause the mine to be triggered. A triggered mine wipes the remaining requests of the team that triggers it. Triggering a mine effectively causes a team to be blocked from playing until the next batch of requests is given out (every minute). A mine can only be triggered once.

8. Laying a mine on top of another mine will cause the first mine to trigger as normal, and the second mine to be ineffective. The second mine is wasted.

9. A team that has been spied on will have their subsequent 15 requests (`attack` or `defend`) sent to the grid location selected by the team that spied upon them.

10. A cloak may be enabled on up to 3 squares, but no more. A cloak lasts for 5 minutes of gameplay, causing `query` commands to report the health of the specified squares as 120, regardless of their true health.

## Replays

After each MancJS session we run this game at, we take a snapshot of the way the game played out on the evening. Here are our previous replays:

[October 2015](http://mancjs.com/code-and-conquer/october-2015/replay.html)