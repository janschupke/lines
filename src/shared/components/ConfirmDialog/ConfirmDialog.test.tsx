import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ConfirmDialog from "./ConfirmDialog";

describe("ConfirmDialog", () => {
  let onConfirm: ReturnType<typeof vi.fn>;
  let onCancel: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onConfirm = vi.fn();
    onCancel = vi.fn();
  });

  const renderDialog = (open = true) =>
    render(
      <ConfirmDialog
        open={open}
        title="Start a new game?"
        confirmLabel="Start a new game"
        cancelLabel="Keep playing"
        onConfirm={onConfirm}
        onCancel={onCancel}
        testId="confirm-new-game"
      >
        <p>This game is still going.</p>
      </ConfirmDialog>,
    );

  it("renders nothing while closed", () => {
    renderDialog(false);
    expect(screen.queryByTestId("confirm-new-game")).toBeNull();
  });

  it("opens focused on the safe choice, so a stray Enter keeps the game", () => {
    renderDialog();
    expect(screen.getByText("Keep playing")).toHaveFocus();
  });

  it("confirms only when the destructive button is pressed", () => {
    renderDialog();
    fireEvent.click(screen.getByText("Start a new game"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  describe("backing out", () => {
    it("cancels on the safe button", () => {
      renderDialog();
      fireEvent.click(screen.getByText("Keep playing"));
      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it("cancels on Escape — never confirms", () => {
      renderDialog();
      fireEvent.keyDown(document, { key: "Escape" });
      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it("cancels on a press outside the panel — never confirms", () => {
      renderDialog();
      fireEvent(
        screen.getByTestId("confirm-new-game"),
        new Event("pointerdown", { bubbles: true }),
      );
      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it("ignores a press on the panel itself", () => {
      renderDialog();
      fireEvent(
        screen.getByText("This game is still going."),
        new Event("pointerdown", { bubbles: true }),
      );
      expect(onCancel).not.toHaveBeenCalled();
    });
  });

  it("is announced as a modal dialog named by its title", () => {
    renderDialog();
    const dialog = screen.getByRole("dialog", { name: "Start a new game?" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });
});
