"use client";

import React from "react";
import { CELL_COUNT, COLOR_NAMES } from "@/engine";
import type { ColorName } from "@/engine";
import { useGameController } from "@/game/useGameController";
import { BoardCell } from "./BoardCell";

const colorName = (id: number): ColorName | null =>
  id === 0 ? null : (COLOR_NAMES[id] as ColorName);

/**
 * Renders the ViewBoard from the controller snapshot. All turn logic lives
 * in the engine; all timing lives in the effect player.
 */
const Board: React.FC = () => {
  const [snapshot, controller] = useGameController();
  const { view, anim, selected, hovered, pathTrail, unreachable, busy } =
    snapshot;

  const pathSet = pathTrail ? new Set(pathTrail) : null;
  const movingAt =
    anim.moving !== null ? anim.moving.path[anim.moving.step]! : null;
  const movingSource = anim.moving !== null ? anim.moving.path[0]! : null;

  const cells = [];
  for (let index = 0; index < CELL_COUNT; index++) {
    const isSelected = selected === index;
    const isHovered = hovered === index;
    const isUnreachable =
      selected !== null &&
      view.balls[index] === 0 &&
      unreachable !== null &&
      unreachable[index] !== 1;
    cells.push(
      <BoardCell
        key={index}
        index={index}
        ball={colorName(view.balls[index]!)}
        ghost={colorName(view.ghosts[index]!)}
        isSelected={isSelected}
        isHovered={isHovered}
        isInPath={pathSet?.has(index) ?? false}
        isNotReachable={isUnreachable}
        isPopping={anim.popping.has(index)}
        growing={anim.growing.get(index) ?? null}
        movingColor={
          movingAt === index && anim.moving !== null
            ? (COLOR_NAMES[anim.moving.color] as ColorName)
            : null
        }
        hideBall={movingSource === index}
        onClick={() => controller.clickCell(index)}
        onHover={() => controller.hoverCell(index)}
        onLeave={() => controller.leaveBoard()}
      />,
    );
  }

  return (
    <div
      className={`game-board board-grid select-none ${busy ? "pointer-events-none" : ""}`}
      style={{
        gridTemplateColumns: "repeat(9, minmax(0, 1fr))",
        gridTemplateRows: "repeat(9, minmax(0, 1fr))",
        gridAutoFlow: "row",
        touchAction: "manipulation",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {cells}
    </div>
  );
};

export default Board;
