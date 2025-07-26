Game states:
start - new game state, no turn yet, no selection made
waiting - game running, nothing selected
selected - ball is selected
moving - ball is moving to target cell
popping - line is popping
transitioning - existing incoming balls are transitioning from incoming to actual
spawning - spawning new incoming balls on the board
paused - no turn for INACTIVITY_TIMEOUT_MS
end - board full, timer stopped, endgame view shown

State flow scenarios after a move:
No line formed:

- selected => moving => transitioning => spawning => waiting

Line formed by move:

- selected => moving => popping => [no new balls after line pop] => waiting

Line formed by transitioned balls

- selected => moving => [popping?] => transitioning => popping (possibly multiple lines) => spawning => waiting

Animation assignment:

- selected => pulsating animation of selected ball
- moving => moving ball is hopping to destination
- popping => balls in a line pop and disappear
- transitioning => growing from current size and semi-transparency to full size and no transparency (game logic replaces these balls, but animation should be smooth - refactor needed - have balls hold incoming/real state, instead of using 2 separate objects?)
- spawning => balls are growing from nothing to their target size, which is incoming ball size (small)

edge case (new game):

- fresh board is created, with actual balls that need to grow from nothing to full size immediately

Incoming balls replacement scenarios:

- a moving ball finishes in a cell with incoming ball
  - that one incoming ball needs to have new position calculated so it spawns + transition in a new empty cell
  - other incoming balls transition to full where they were expected to
  - all 3 incoming balls maintain their expected colors

- a moving ball finishes in a cell with incoming ball, but is popped as a result of a line
  - DO NOT recalculate incoming ball position, and transition it where it was supposed to be, which is now empty cell

Transitioning ball causing line pop scenario:

- transition the balls
- afterwards apply line popping animation to formed lines
- show floating score text over popped lines

Implement event queue system so that next ball can be clicked on while previous animations are still taking place, and the selection is applied after animations finish and game would be ready for the next move
