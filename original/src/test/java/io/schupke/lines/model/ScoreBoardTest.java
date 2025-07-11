package io.schupke.lines.model;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;

/**
 *
 * Tests the adding and sorting of the entries
 * within the Score Board model.
 *
 */
public class ScoreBoardTest {
    private ScoreBoard emptyBoard;
    private ScoreBoard boardWithEntries;

    private ScoreEntry mainEntry;
    private ScoreEntry highEntry;
    private ScoreEntry lowEntry;

    private final String mainScore = "15";
    private final String highScore = "155";
    private final String lowScore = "5";
    private final String mainBoardSize = "9";

    private final String [] mainValues = {
            "Player Name",
            mainScore,
            mainBoardSize,
            "N/A",
            "N/A",
            "N/A"
    };

    private final String [] highValues = {
            "Player Name",
            highScore,
            mainBoardSize,
            "N/A",
            "N/A",
            "N/A"
    };

    private final String [] lowValues = {
            "Player Name",
            lowScore,
            mainBoardSize,
            "N/A",
            "N/A",
            "N/A"
    };

    @Before
    public void create() {
        mainEntry = new ScoreEntry(mainValues);
        highEntry = new ScoreEntry(highValues);
        lowEntry = new ScoreEntry(lowValues);

        emptyBoard = new ScoreBoard(null);

        // Entries are added in its test.
        boardWithEntries = new ScoreBoard(null);
    }

    @After
    public void clean() {
        emptyBoard.reset();
        boardWithEntries.reset();
    }

    /**
     * Fills the entire board up to its capacity
     * with testing entries.
     */
    private ScoreBoard fillBoard(ScoreBoard board) {
        for(int i = 0; i < ScoreBoard.CAPACITY; i++) {
            board.addEntry(mainEntry);
        }

        return board;
    }

    /**
     * Default ScoreBoard state should be empty.
     */
    @Test
    public void testIsEmpty() {
        assertEquals(true, emptyBoard.isEmpty());
    }

    @Test
    public void testIsFull() {
        boardWithEntries = fillBoard(boardWithEntries);

        assertEquals(true, boardWithEntries.isFull());
    }

    @Test
    public void testReset() {
        assertFalse("Not empty.", !emptyBoard.isEmpty());

        emptyBoard.addEntry(mainEntry);
        assertFalse("Is empty after add attempt.", emptyBoard.isEmpty());

        emptyBoard.reset();
        assertFalse("Not empty after reset.", !emptyBoard.isEmpty());
    }

    /**
     * Testing full board situation, adding the same entry.
     */
    @Test
    public void testIsScoreSuitable1() {
        boardWithEntries = fillBoard(boardWithEntries);

        int score = Integer.parseInt(mainEntry.getScore());
        int board = Integer.parseInt(mainEntry.getBoardSize());

        assertFalse("Board is full, should not be suitable.",
                boardWithEntries.isScoreSuitable(score, board));
    }

    /**
     * Testing insertion of higher score into a full board.
     */
    @Test
    public void testIsScoreSuitable2() {
        boardWithEntries = fillBoard(boardWithEntries);

        int score = Integer.parseInt(highEntry.getScore());
        int board = Integer.parseInt(highEntry.getBoardSize());

        assertFalse("Score is higher, should be suitable.",
                !boardWithEntries.isScoreSuitable(score, board));
    }

    /**
     * Testing insertion of lower score into a full board.
     */
    @Test
    public void testIsScoreSuitable3() {
        boardWithEntries = fillBoard(boardWithEntries);

        int score = Integer.parseInt(lowEntry.getScore());
        int board = Integer.parseInt(lowEntry.getBoardSize());

        assertFalse("Score is lower, should not be suitable.",
                boardWithEntries.isScoreSuitable(score, board));
    }

    /**
     * Testing insertion of lower score into a board
     * that is not yet completely filled up.
     */
    @Test
    public void testIsScoreSuitable4() {
        for(int i = 0; i < ScoreBoard.CAPACITY - 2; i++) {
            boardWithEntries.addEntry(mainEntry);
        }

        int score = Integer.parseInt(lowEntry.getScore());
        int board = Integer.parseInt(lowEntry.getBoardSize());

        assertFalse("Board is not fulll yet, should be suitable.",
                !boardWithEntries.isScoreSuitable(score, board));
    }
}
