New game button

- reset the game
- N hotkey works

guide

- G hotkey toggles it
- renders ove rthe game board

current score

- updates on ball pop

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
- unreachable auto grey out after ball select
- cells are unselected after a move

turn

- each turn spawns 3 new balls
- popping a line does not spawn balls
- longer lines yield more points

incoming balls

- 3 are places on next turn
- are not places if a line was popped this turn
- if stepped on, only the one ball is recalculated, maintianing color
- if empty cells are less than the amount of incoming balls, only that amount of balls is calculated to spawn
- top panel and board colors match
- recalculating only spawn 3 balls on next turn

Timer

- initializes as stopped
- start after first move, keeps tickting
- stops after 10 secs of inactivity
- resumes with next turn
