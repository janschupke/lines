import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import GameEndDialog from "./GameEndDialog";
import type { SubmissionState } from "@/game/controller";

const stats = { turns: 30, linesPopped: 4, longestLine: 6, ballsCleared: 22 };

const submission = (over: Partial<SubmissionState>): SubmissionState => ({
  status: "casual",
  switched: false,
  threshold: null,
  rank: null,
  scoreId: null,
  errorCode: null,
  casualBest: 50,
  ...over,
});

const renderDialog = (sub: SubmissionState, onSubmit = vi.fn()) => {
  render(
    <GameEndDialog
      isOpen
      score={42}
      currentGameBeatHighScore={false}
      stats={stats}
      elapsedMs={90_000}
      submission={sub}
      onSubmit={onSubmit}
      onRetry={vi.fn()}
      onNewGame={vi.fn()}
      onPlayRanked={vi.fn()}
      onClose={vi.fn()}
    />,
  );
  return onSubmit;
};

beforeEach(() => localStorage.clear());

describe("GameEndDialog submission section", () => {
  it("casual: local best, play-ranked action, no name field, no failure look", () => {
    renderDialog(submission({ status: "casual" }));
    expect(screen.getByTestId("submission-casual")).toBeInTheDocument();
    expect(screen.getByText("Play ranked")).toBeInTheDocument();
    expect(screen.queryByLabelText(/name for the leaderboard/i)).toBeNull();
    expect(screen.getByText("50")).toBeInTheDocument(); // local best
  });

  it("casual + switched names the destination board honestly", () => {
    renderDialog(submission({ status: "casual", switched: true }));
    expect(
      screen.getByText(/switched to Casual, so it isn't eligible/),
    ).toBeInTheDocument();
  });

  it("not-qualified shows the threshold and no name field", () => {
    renderDialog(submission({ status: "not-qualified", threshold: 120 }));
    expect(screen.getByTestId("submission-not-qualified")).toBeInTheDocument();
    expect(screen.getByText(/not quite the top 20/)).toBeInTheDocument();
    expect(screen.getByText(/starts at 120/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/name for the leaderboard/i)).toBeNull();
  });

  it("unreachable offers retry", () => {
    renderDialog(submission({ status: "unreachable" }));
    expect(screen.getByText(/Couldn't reach the server/)).toBeInTheDocument();
    expect(screen.getByText("Retry")).toBeInTheDocument();
  });

  it("idle: a profane name disables submit with the generic message", () => {
    renderDialog(submission({ status: "idle" }));
    const input = screen.getByLabelText(/name for the leaderboard/i);
    fireEvent.change(input, { target: { value: "admin" } });
    expect(
      screen.getByText("Please choose a different name."),
    ).toBeInTheDocument();
    expect(screen.getByTestId("submit-score")).toBeDisabled();
  });

  it("idle: Enter submits a valid name", () => {
    const onSubmit = renderDialog(submission({ status: "idle" }));
    const input = screen.getByLabelText(/name for the leaderboard/i);
    fireEvent.change(input, { target: { value: "Jan" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSubmit).toHaveBeenCalledWith("Jan");
  });

  it("the grapheme counter counts CJK and combining characters correctly", () => {
    renderDialog(submission({ status: "idle" }));
    const input = screen.getByLabelText(/\(0\/16\)/);
    fireEvent.change(input, { target: { value: "日本語" } });
    expect(screen.getByText(/\(3\/16\)/)).toBeInTheDocument();
    fireEvent.change(input, { target: { value: "éé" } }); // é é decomposed
    expect(screen.getByText(/\(2\/16\)/)).toBeInTheDocument();
  });

  it("rejected keeps the input editable and maps the error code", () => {
    renderDialog(submission({ status: "rejected", errorCode: "rate_limited" }));
    expect(
      screen.getByText("Too many submissions. Try again later."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/name for the leaderboard/i)).toBeEnabled();
  });

  it("accepted shows the rank and the links", () => {
    renderDialog(submission({ status: "accepted", rank: 3, scoreId: "abc" }));
    expect(screen.getByText(/at #3/)).toBeInTheDocument();
    expect(screen.getByText("Watch replay")).toHaveAttribute(
      "href",
      "/replay/abc",
    );
  });

  it("prefills the remembered name", () => {
    localStorage.setItem("lines:lastName:v1", "Returning");
    renderDialog(submission({ status: "idle" }));
    expect(screen.getByLabelText(/name for the leaderboard/i)).toHaveValue(
      "Returning",
    );
  });
});
