package io.schupke.lines.model;

import static org.junit.Assert.assertEquals;

import org.junit.Before;
import org.junit.Test;

/**
 *
 * Mainly comparisons of entries that have different
 * score amounts and board sizes.
 *
 */
public class ScoreEntryTest {
    private ScoreEntry mainEntry;

    private ScoreEntry smallBoardLowScore;
    private ScoreEntry smallBoardHighScore;
    private ScoreEntry largeBoardLowScore;
    private ScoreEntry largeBoardHighScore;

    private final String mainScore = "15";
    private final String mainBoardSize = "9";

    private final String highScore = "50";
    private final String largeBoardSize = "12";

    /*
     * User Name
     * Score
     * Board Size
     * Turn Time
     * Total game Time
     * Date of Game
     */
    private final String [] mainValues = {
            "Player Name",
            mainScore,
            mainBoardSize,
            "N/A",
            "N/A",
            "N/A"
    };

    private final String [] smallBoardLowScoreValues = {
            "N/A",
            mainScore,
            mainBoardSize,
            "N/A",
            "N/A",
            "N/A"
    };

    private final String [] smallBoardHighScoreValues = {
            "N/A",
            highScore,
            mainBoardSize,
            "N/A",
            "N/A",
            "N/A"
    };

    private final String [] largeBoardLowScoreValues = {
            "N/A",
            mainScore,
            largeBoardSize,
            "N/A",
            "N/A",
            "N/A"
    };

    private final String [] largeBoardHighScoreValues = {
            "N/A",
            highScore,
            largeBoardSize,
            "N/A",
            "N/A",
            "N/A"
    };

    @Before
    public void create() {
        mainEntry = new ScoreEntry(mainValues);

        smallBoardLowScore = new ScoreEntry(smallBoardLowScoreValues);
        smallBoardHighScore = new ScoreEntry(smallBoardHighScoreValues);
        largeBoardLowScore = new ScoreEntry(largeBoardLowScoreValues);
        largeBoardHighScore = new ScoreEntry(largeBoardHighScoreValues);
    }

    /**
     * Verifies OutOfBoundsExpection
     */
    @Test (expected = Exception.class)
    public void testGetValue() {
        @SuppressWarnings("unused")
        String value = mainEntry.getValue(6);
    }

    /**
     * Should be tested, since the value within the object
     * is represented as an array index. Array ordering could
     * be re-arranged at some point, resulting in malfunctions.
     */
    @Test
    public void getScore() {
        String expectedValue = mainScore;
        String actualValue = mainEntry.getScore();

        assertEquals(expectedValue, actualValue);
    }

    /**
     * Should be tested, since the value within the object
     * is represented as an array index. Array ordering could
     * be re-arranged at some point, resulting in malfunctions.
     */
    @Test
    public void getBoardSize() {
        String expectedValue = mainBoardSize;
        String actualValue = mainEntry.getBoardSize();

        assertEquals(expectedValue, actualValue);
    }

    /**
     * Higher score should win.
     */
    @Test
    public void testCompareTo1() {
        int value = smallBoardLowScore.compareTo(smallBoardHighScore);

        assertEquals(-1, value);
    }

    /**
     * Higher score should win.
     */
    @Test
    public void testCompareTo2() {
        int value = smallBoardHighScore.compareTo(smallBoardLowScore);

        assertEquals(1, value);
    }

    /**
     * Equal scores and board sizes. Neither should win.
     */
    @Test
    public void testCompareTo3() {
        int value = smallBoardHighScore.compareTo(smallBoardHighScore);

        assertEquals(0, value);
    }

    /**
     * Smaller board should always win.
     */
    @Test
    public void testCompareTo4() {
        int value = smallBoardLowScore.compareTo(largeBoardLowScore);

        assertEquals(1, value);
    }

    /**
     * Smaller board should always win.
     */
    @Test
    public void testCompareTo5() {
        int value = smallBoardLowScore.compareTo(largeBoardHighScore);

        assertEquals(1, value);
    }

    /**
     * Smaller board should always win.
     */
    @Test
    public void testCompareTo6() {
        int value = smallBoardHighScore.compareTo(largeBoardLowScore);

        assertEquals(1, value);
    }

    /**
     * Smaller board should always win.
     */
    @Test
    public void testCompareTo7() {
        int value = smallBoardHighScore.compareTo(largeBoardHighScore);

        assertEquals(1, value);
    }

    /**
     * Smaller board should always win.
     */
    @Test
    public void testCompareTo8() {
        int value = largeBoardLowScore.compareTo(smallBoardLowScore);

        assertEquals(-1, value);
    }

    /**
     * Smaller board should always win.
     */
    @Test
    public void testCompareTo9() {
        int value = largeBoardLowScore.compareTo(smallBoardHighScore);

        assertEquals(-1, value);
    }

    /**
     * Smaller board should always win.
     */
    @Test
    public void testCompareTo10() {
        int value = largeBoardHighScore.compareTo(smallBoardLowScore);

        assertEquals(-1, value);
    }

    /**
     * Smaller board should always win.
     */
    @Test
    public void testCompareTo11() {
        int value = largeBoardHighScore.compareTo(smallBoardHighScore);

        assertEquals(-1, value);
    }

    /**
     * Higher score should win.
     */
    @Test
    public void testCompareTo12() {
        int value = largeBoardHighScore.compareTo(largeBoardLowScore);

        assertEquals(1, value);
    }

    /**
     * Higher score should win.
     */
    @Test
    public void testCompareTo13() {
        int value = largeBoardLowScore.compareTo(largeBoardHighScore);

        assertEquals(-1, value);
    }

    /**
     * Equal scores and board sizes. Neither should win.
     */
    @Test
    public void testCompareTo14() {
        int value = largeBoardHighScore.compareTo(largeBoardHighScore);

        assertEquals(0, value);
    }
}
