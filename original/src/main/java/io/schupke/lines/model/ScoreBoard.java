package io.schupke.lines.model;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

import javax.swing.table.AbstractTableModel;

import io.schupke.lines.Lang;

/**
 *
 * A model of the Score Board.
 *
 */
public class ScoreBoard implements Serializable {
    private static final long serialVersionUID = 1L;

    /**
     * Maximum amount of entries in the Score Board.
     */
    public static final int CAPACITY = 10;

    private String [] captions;
    private List<ScoreEntry> items;

    private AbstractTableModel model;

    public ScoreBoard(GameModel gameModel, List<ScoreEntry> items) {

        // If no items are provided, creates an empty list.
        if(items == null) {
            this.items = new ArrayList<ScoreEntry>();
        } else {
            this.items = items;
        }

        /*
         * Sets the table model that disables cell modification
         * and column dragging.
         */
        model = new AbstractTableModel() {
            private static final long serialVersionUID = 1L;

            public String getColumnName(int col) { return getCaptions()[col].toString(); }
            public int getRowCount() { return getData().length; }
            public int getColumnCount() { return getCaptions().length; }
            public Object getValueAt(int row, int col) { return getData()[row][col]; }
            public boolean isCellEditable(int row, int col) { return false; }
            public void setValueAt(Object value, int row, int col) {}
        };
    }

    public ScoreBoard(GameModel gameModel) {
        this(gameModel, null);
    }

    public boolean isEmpty() {
        return items.isEmpty();
    }

    public boolean isFull() {
        return (items.size() == CAPACITY);
    }

    /**
     * Add a new {@link ScoreEntry} into the list. If this action
     * results in exceeding the maximum amount, the entry
     * at the end of the list is removed.
     * @param entry new {@link ScoreEntry}
     */
    public void addEntry(ScoreEntry entry) {
        items.add(entry);

        // Sorts entries based on score values.
        sortEntries();

        // Removes the unwanted entry, if any.
        trim();
    }

    /**
     * Sorts all entries currently in the list,
     * based on their board sizes and score values.
     * Puts higher score entries to the front.
     * @see ScoreEntry
     */
    private void sortEntries() {
        Collections.sort(items, new Comparator<ScoreEntry>() {
            @Override
            public int compare(ScoreEntry item1, ScoreEntry item2) {
                // Reverse order.
                return item2.compareTo(item1);
            }
        });
    }

    /**
     * Deletes entries that are above
     * the ScoreBoard size limit.
     * @see ScoreEntry
     */
    private void trim() {
        if(items.size() >= CAPACITY) {
            for(int i = CAPACITY; i < items.size(); i++) {
                items.remove(i);
            }
        }
    }

    /**
     * Removes all entries from the Score Board.
     */
    public void reset() {
        items.clear();
    }

    /**
     * Checks the provided score value against values that are already
     * in the list. If there is any that is lower, the provided
     * value is evaluated as sufficient.
     * @param score score amount in question
     * @param board the size of currently active board
     * @return true if this values is sufficient, false otherwise
     */
    public boolean isScoreSuitable(int score, int board) {
        if(items.size() < CAPACITY) return true;
        if(items.size() == 0) return true;

        boolean isSuitable = false;

        // Goes through all score entries and compares values.
        for(ScoreEntry i : items) {
            if(Integer.parseInt(i.getScore()) < score &&
                Integer.parseInt(i.getBoardSize()) >= board) {

                isSuitable = true;
                break;
            }
        }

        return isSuitable;
    }

    /**
     * Parses the list of Score Entries into an array of Objects.
     * @return all entries in the form of a two-dimensional array of Objects
     * @see ScoreEntry
     */
    public Object [][] getData() {
        if(items.isEmpty()) {
            /*
             * An empty place holder array is returned
             * if there are no score entries at the moment.
             */
            return new Object [1][captions.length];
        }

        Object [][] data = new Object [items.size()][captions.length];

        for(int i = 0; i < items.size(); i++) {
            for(int j = -1; j < captions.length - 1; j++) {
                if(j == -1) {
                    data[i][0] = i + 1;
                    continue;
                }

                data[i][j + 1] = items.get(i).getValue(j);
            }
        }

        return data;
    }

    // Lang is not available when constructing this. Needs to be called separately.
    /**
     * Sets the table caption strings for the ScoreBoard.
     */
    public void setCaptions() {
        captions = new String [7];

        captions[0] = Lang.write("dialog.score.caption.position");
        captions[1] = Lang.write("dialog.score.caption.name");
        captions[2] = Lang.write("dialog.score.caption.score");
        captions[3] = Lang.write("dialog.score.caption.board_size");
        captions[4] = Lang.write("dialog.score.caption.turn_time");
        captions[5] = Lang.write("dialog.score.caption.total_time");
        captions[6] = Lang.write("dialog.score.caption.date");
    }

    public String [] getCaptions() { return captions; }

    public AbstractTableModel getModel() { return model; }
}
