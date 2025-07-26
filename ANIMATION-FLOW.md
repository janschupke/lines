Game turn sequence:

- a ball is selected, it starts pulsating
- a ball is moved, it animates towards its destination
- if a line is formed, it is popped, with an animation
- new balls are spawned from previews, with growing animation, at the same time, new preview are placed, with a growing animation
- if previous step forms any new lines, it pops them an animation

During this:

- no ball must be relocated if temporarily stepped on by a ball that gets popped, so that now the cell is empty and valid
- no balls that haven't been interfered with must be changed, and they must spawn exactly where they were supposed to
- if a ball steps on a preview cell, only that one preview must be relocated and spawned when spawning other previews

New game sequence:

- when a new game button is pressed, a new game is initiated
- existing old balls get removed
- new game state is generated, and balls are placed, using growing animation. from zero size to final size.

Currently broken, to be fixed:

- transition from preview to a full ball has popping animation, not growing
- starting new game doesn't properly animate new balls - pops full ones, instead of growing
- new balls have popping animation when transitioning from previews
