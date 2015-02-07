package eu.janschupke.lines.model;

import java.io.Serializable;

import eu.janschupke.lines.StaticMethods;

/**
 *
 * A model of a single score entry.
 * @see ScoreBoard
 *
 */
public class ScoreEntry implements Serializable, Comparable<ScoreEntry> {
    private static final long serialVersionUID = 1L;

    /*
     * User Name
     * Score
     * Board Size
     * Turn Time
     * Total game Time
     * Date of Game
     */
    private String [] values;

    public ScoreEntry(String [] values) {
        this.values = values;
    }

    public String [] getValues() { return values; }

    public String getValue(int index) {
        if(index >= values.length) {
            StaticMethods.printMethodName(this);
            StaticMethods.debug("Index out of bounds.");

            /*
             * This should not ever happen.
             * There is always the same amount of indexes.
             */
            throw new ArrayIndexOutOfBoundsException("ScoreItem.getValue() out of bounds.");
        }

        return values[index];
    }

    public String getScore() { return values[1]; }
    public String getBoardSize() { return values[2]; }

    /**
     * Compares two score entries. The entry with smaller board size
     * is always considered better (higher). If the sizes are equal,
     * score amount is compared. The entry with higher amount of score
     * points is then considered higher.
     */
    @Override
    public int compareTo(ScoreEntry e) {
        int thisScore = Integer.parseInt(this.getScore());
        int thisSize = Integer.parseInt(this.getBoardSize());

        int entryScore = Integer.parseInt(e.getScore());
        int entrySize = Integer.parseInt(e.getBoardSize());

        // Smaller board size is prioritized.
        if(thisSize < entrySize) return 1;
        if(thisSize > entrySize) return -1;

        // If sizes are the same, higher score wins.
        if(thisScore > entryScore) return 1;
        if(thisScore < entryScore) return -1;

        return 0;
    }
}
