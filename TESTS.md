New game button

- reset the game
- N hotkey works
- new game trigger closes any overlays

guide

- G hotkey toggles it
- renders over the game board

current score

- updates on line pop

high score

- updates after every turn that beats it
- initiates with 0 if not in storage
- load from storage on init

end game UI

- triggers when board is full

Game board

- can only select cell with a ball
- path is showing
- unreachable cells indicate X
- unreachable auto grey out after ball select, with a background color transition (implement)
- cells are unselected after a move
- Do not allow selecting cells without a ball unless it's a move target.

turn

- each turn spawns 3 new balls, i.e. turns preview balls into real ones
- popping a line does not spawn balls
- longer lines yield more points
- forming a line in any direction pops the balls
- longer lines yield more points
- spawning balls do trigger line pop and yield points (differs from current logic)

preview balls

- 3 are places on next turn
- are not placed if a line was popped this turn
- if stepped on, only the one ball is recalculated, maintianing color
- if empty cells are less than the amount of incoming balls, only that amount of balls is calculated to spawn
- top panel and board colors match
- recalculating only spawn 3 balls on next turn

Timer

- initializes as stopped
- start after first move, keeps tickting
- stops after 10 secs of inactivity
- resumes with next turn
