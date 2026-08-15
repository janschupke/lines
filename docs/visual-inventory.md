# Visual behaviour inventory — Phase 0 baseline

Written before any refactor work. This is the reference for the Phase 2 drift
resolutions: what the app _looks like and does today_, beyond what the pixel
baselines capture.

## Layout

- Board: 9×9 grid of 56px cells, 8px gap, 8px board padding (desktop).
  Per-breakpoint overrides via the Tailwind `addBase` plugin:
  - ≤768px: cell 48px, gap 4px, ball 36px
  - 769–1024px: cell 64px, gap 6px, ball 48px, padding 12px
  - Note `spacing.cell = "56px"` is a _literal_ in `tailwind.config.cjs` while
    `--cell-size` is overridden per breakpoint — so the JS-computed positions
    (`getGameSizing()` reads the CSS vars) and Tailwind's `w-cell` class
    disagree at every breakpoint except desktop. Invisible today only because
    the app refuses to render below 600px.
- Below 600px viewport width: `SmallScreenWarning` replaces the game entirely
  (favicon ball image, copy naming the 600px minimum, live current-width
  readout). The sub-600px Playwright baselines capture this screen.
- Balls 40px with a 2px border (44px actual), ghosts (incoming previews) 28px
  at 50% opacity.

## Animations and observed durations

Ten animations, two infinite loops. Sources: `index.css` (durations as
`--animation-duration-*` vars), `tailwind.config.cjs` (keyframes + some
hardcoded durations), `features/game/config.ts` (`ANIMATION_DURATIONS`, the
values JS timing actually uses).

| Animation           | Keyframes                                                   | CSS duration                                     | JS (`ANIMATION_DURATIONS`)               | Notes                                                                                                                                      |
| ------------------- | ----------------------------------------------------------- | ------------------------------------------------ | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Board gradient      | `gradientShift`                                             | 8s, ease-in-out, **infinite**                    | `GRADIENT_SHIFT: 8000`                   | agrees                                                                                                                                     |
| Selected-ball pulse | `pulseBall` (`animate-bounce-ball`)                         | `--…-selected-ball-pulse` 1.5s, **infinite**     | `SELECTED_BALL_PULSE: 1500`              | agrees                                                                                                                                     |
| Ball move step      | `moveBall` (`animate-move-ball`)                            | **0.4s hardcoded** in tailwind config            | `MOVING_STEP: 100`                       | **drifted** — JS advances the path every 100ms; the 0.4s scale/opacity keyframe re-runs per cell and never completes. Eye sees ~100ms/cell |
| Ball pop            | `popBall` (`animate-pop-ball`)                              | 0.3s hardcoded                                   | `POP_BALL: 300`                          | agrees. Applied to the _ball_ span                                                                                                         |
| Cell pop            | `animate-pop` (class on the cell div)                       | **no such utility exists**                       | —                                        | **dead class** — the cell pop animation never runs today                                                                                   |
| Ghost grow          | `growBallTransition` / `growBallNew`                        | `var(--grow-ball-duration)` = **0.6s** (addBase) | `GROW_BALL: 100`                         | **drifted** — CSS animates 0.6s; JS clears the growing state after 100ms                                                                   |
| Floating score      | `floatScore` (`animate-float-score`… used as `float-score`) | **1s** `forwards`                                | `FLOATING_SCORE: 2000`                   | **drifted** — element lives 2s but the keyframe ends (opacity 0) at 1s: the floating score is invisible for its second second              |
| Score flash         | `scoreFlash`                                                | `--…-score-flash` 1s                             | `SCORE_FLASH: 1000`                      | agrees                                                                                                                                     |
| Fade in/out         | `fadeIn`                                                    | `--…-fade` 0.3s                                  | `FADE: 300`                              | agrees                                                                                                                                     |
| Button hover/shine  | transition                                                  | 0.3s / 0.5s                                      | `BUTTON_HOVER: 300`, `BUTTON_SHINE: 500` | agrees                                                                                                                                     |

Dead CSS duration vars in `:root` (declared, never consumed):
`--animation-duration-pop-ball`, `--animation-duration-floating-score`,
`--animation-duration-moving-step`, `--animation-duration-grow-ball`
(superseded by `--grow-ball-duration`), `--animation-duration-high-score-flash`.

Dead Tailwind pieces: `float` keyframes/`animation.float` (unused),
`animate-pop` and `border-game-border` (referenced in code, not generated).

## The visible turn sequence

1. Click a ball → it pulses (`pulseBall`, infinite until deselected).
2. Hover empty cell → path preview (blue `path` cells) or an × + red border on
   unreachable cells.
3. Click destination → ball hops cell-to-cell along the path, ~100ms per step.
4. If a line of 5+ forms → the popped balls scale to 1.3 then shrink to 0
   (0.3s), a floating score rises from the line's centroid (visible ~1s), the
   score flashes green.
5. Otherwise the three ghosts materialise (grow from 30% scale/opacity), and
   three new ghosts appear. If a materialised ball completes a line, that pops
   too.
6. Ball travel shows the ball at the destination _before_ popping (the
   `turnFlowController.ts:59` mid-turn state push).

## Oddities to preserve until explicitly resolved (Phase 2)

- Floating score invisible for its second second (`FLOATING_SCORE: 2000` vs 1s
  keyframe) — the eye sees the 1s version; resolve to what the eye sees.
- Cell pop animation (`animate-pop`) does not run — only the ball pops.
- Ghost materialise: the eye sees the 0.6s CSS grow (JS 100ms just clears
  bookkeeping state).
- Ball move: the eye sees ~100ms per cell.
- The board gradient shifts over 8s; `animations: 'disabled'` in Playwright
  freezes it at frame 0, which is what the baselines contain.
- No reduced-motion handling exists anywhere today.

## Baselines

`e2e/visual.spec.ts-snapshots/` — six viewports (desktop 1280×900, tablet
768×1024, phone 390×844, phone-small 320×568, phone-short 320×480,
phone-landscape 844×390), all seeded from `e2e/fixtures/savedGame.ts`
(deterministic restored game: 8 balls, 3 ghosts, score 13, high score 34,
timer 0:42 paused). Desktop/tablet/phone-landscape show the game;
phone/phone-small/phone-short show the warning screen — proving the gate is
gone is Phase 2's rebaseline of exactly those three.
