package eu.janschupke.lines.model;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;
import java.util.Queue;

import eu.janschupke.lines.StaticMethods;
import eu.janschupke.lines.Values.Debug;
import eu.janschupke.lines.Values.GlobalLimits;
import eu.janschupke.lines.gui.BoardPanel;

/**
 *
 * The model of the game board.
 * @see BoardPanel
 *
 */
public class Board implements Serializable {
    private static final long serialVersionUID = 1L;
    private long gameInstance;

    private GameModel model;

    private int boardSize;

    private Cell [][] cells;

    private Cell [] incomingPositions;

    /*
     * Matrices that are used for path calculations.
     */
    private boolean [][] reachabilityMatrix;
    private boolean [][] checked;

    /**
     * Holds pointers to Cells that are yet
     * to be checked for path availability
     * during the path finding process.
     * @see Cell
     */
    private Queue<Cell> pathQueue;

    /**
     * Holds pointers to Cells that contain
     * newly spawned balls that have not been
     * checked for popping yet.
     * @see Cell
     */
    private Queue<Cell> spawnedBalls;

    public static final int DEFAULT_SIZE = GlobalLimits.DEFAULT_BOARD_SIZE.getValue();

    public Board(GameModel model, int boardSize, long gameInstance) {
        this.gameInstance = gameInstance;
        this.boardSize = boardSize;

        incomingPositions = new Cell [GlobalLimits.BALLS_PER_TURN.getValue()];
        reachabilityMatrix = new boolean [boardSize][boardSize];

        spawnedBalls = new LinkedList<Cell>();

        initCells();
    }

    public Board(GameModel model) {
        this(model, DEFAULT_SIZE, 0);
    }

    public long getGameInstance() { return gameInstance; }

    public void setGameInstance(long gameInstance) {
        this.gameInstance = gameInstance;
    }

    public void setReachabilityMatrix(boolean [][] matrix) {
        reachabilityMatrix = matrix;
    }

    /**
     * Initializes empty cells for the entire board.
     * @see Cell
     */
    private void initCells() {
        cells = new Cell[boardSize][boardSize];

        for(int x = 0; x < boardSize; x++) {
            for(int y = 0; y < boardSize; y++) {
                cells[x][y] = new Cell(this, x, y);
            }
        }
    }

    /**
     * Changes the board's size, which results
     * in re-initialization of the board.
     * @param size new size
     */
    public void setSize(int size) {
        this.boardSize = size;

        initCells();
    }

    /**
     * Removes balls, deactivates all cells
     * and clear the queue.
     * @see Cell
     * @see Balls
     */
    public void clear() {
        for(Cell [] row : cells) {
            for(Cell c : row) {
                c.setBall(null);
                c.setActive(false);
            }
        }

        spawnedBalls.clear();
    }

    public boolean isFull() {
        for(Cell [] row : cells) {
            for(Cell c : row) {
                if(c.isEmpty()) return false;
            }
        }

        return true;
    }

    /**
     * Returns a random empty {@link Cell} that is currently on the board.
     * @return a random empty {@link Cell}
     */
    public Cell getRandomEmptyCell() {
        if(isFull()) return null;

        List<Cell> emptyCells = new ArrayList<Cell>();

        // Searches for all cells that are currently empty.
        for(int y = 0; y < boardSize; y++) {
            for(int x = 0; x < boardSize; x++) {
                Cell c = cells[x][y];

                if(c.isEmpty()) {
                    emptyCells.add(c);
                }
            }
        }

        return getRandom(emptyCells);
    }

    /**
     * Returns a random empty {@link Cell} that is currently
     * on the board, and is not already expecting a ball.
     * @return a random empty {@link Cell}, that is not expecting a ball
     * @see Balls
     */
    public Cell getRandomAvailableEmptyCell() {
        if(isFull()) return null;

        List<Cell> availableCells = new ArrayList<Cell>();

        /*
         * Searches for all cells that are currently empty
         * and are not expecting a ball.
         */
        for(int y = 0; y < boardSize; y++) {
            for(int x = 0; x < boardSize; x++) {
                Cell c = cells[x][y];

                /*
                 * The cell is empty, making it a candidate.
                 */
                if(c.isEmpty()) {
                    /*
                     * Checking whether this cell is not already
                     * in the array of assigned cells.
                     */
                    boolean suitable = true;

                    /*
                     * If the same coordinates are spotted inside
                     * the array, this cell is not available.
                     */
                    for(int i = 0; i < incomingPositions.length; i++) {
                        if(incomingPositions[i] != null && incomingPositions[i].equals(c)) {
                            suitable = false;
                        }
                    }

                    /*
                     * Only adding cells that passed
                     * the availability test.
                     */
                    if(suitable) {
                        availableCells.add(c);
                    }
                }
            }
        }

        return getRandom(availableCells);
    }

    /**
     * Returns a random element from the provided list.
     * @param cells a list of cells
     * @return random element from the provided list
     */
    private Cell getRandom(List<Cell> cells) {
        if(cells.isEmpty()) {
            return null;
        }

        int min = 0;
        int max = cells.size() - 1;

        int index = min + (int)(Math.random() * ((max - min) + 1));

        return cells.get(index);
    }

    /**
     * Sets the provided {@link Cell}'s state.
     * An active state indicates that the player has clicked this {@link Cell}
     * during his turn and intends to move it's ball.
     * @param cell the {@link Cell} that is being tagged
     * @param state the state into which the {@link Cell} should be set
     * @see Balls
     */
    public void setActive(Cell cell, boolean state) {
        cells[cell.getPosition()[0]][cell.getPosition()[1]].setActive(state);
    }

    public int getSize() { return boardSize; }
    public Cell [][] getCells() { return cells; }

    /**
     * Returns a {@link Cell} instance with provided coordinates.
     * @return requested {@link Cell}, if exists, or null, if the coordinates
     * are out of the board's bounds
     */
    public Cell getCell(int x, int y) {
        if(x < boardSize && y < boardSize) {
            return cells[x][y];
        }

        return null;
    }

    /**
     * Returns an indicator about the reachability
     * to the provided {@link Cell}.
     * @return true if the {@link Cell} is reachable, false otherwise
     */
    public boolean getReachability(Cell c) {
        int x = c.getPosition()[0];
        int y = c.getPosition()[1];

        if(x < boardSize && y < boardSize) {
            return reachabilityMatrix[x][y];
        }

        return false;
    }

    /**
     * Calculates reachability from the provided {@link Cell}
     * to every other empty {@link Cell} on the Board.
     * @param cell originating {@link Cell}
     */
    public void calculateReachabilityMatrix(Cell cell) {
        StaticMethods.printMethodName(this);

        // A matrix that hold information about reachability.
        reachabilityMatrix = new boolean[boardSize][boardSize];

        // A matrix that holds information about already checked cells.
        checked = new boolean[boardSize][boardSize];

        // A queue of cells that need to be processed.
        pathQueue = new LinkedList<Cell>();

        /*
         * Initial step. Calculates reachability
         * to the adjacent cells.
         */
        calculateCell(cell);

        /*
         * If there are any empty adjacent cells,
         * they were put into the queue. The process
         * is repeated until the queue gets empty.
         */
        while(!pathQueue.isEmpty()) {
            calculateCell(pathQueue.poll());
        }
    }

    /**
     * Checks all adjacent {@link Cell}s to the provided parameter.
     * If the adjacent {@link Cell} is empty, it is considered reachable.
     * If this reachable {@link Cell} has not yet been checked, it is
     * added into the queue in order to call this method on it.
     * All adjacent {@link Cell}s processed by this method are flagged
     * as checked, regardless of whether they are empty or not.
     * @param cell originating {@link Cell}
     */
    private void calculateCell(Cell cell) {
        int x = cell.getPosition()[0];
        int y = cell.getPosition()[1];

        // Checks the cell to the top.
        if(y - 1 >= 0) {
            if(cells[x][y - 1].isEmpty() && !checked[x][y - 1]) {
                pathQueue.add(cells[x][y - 1]);
                reachabilityMatrix[x][y - 1] = true;
            }

            checked[x][y - 1] = true;
        }

        // Checks the cell to the right.
        if(x + 1 < boardSize) {
            if(cells[x + 1][y].isEmpty() && !checked[x + 1][y]) {
                pathQueue.add(cells[x + 1][y]);
                reachabilityMatrix[x + 1][y] = true;
            }

            checked[x + 1][y] = true;
        }

        // Checks the cell to the bottom.
        if(y + 1 < boardSize) {
            if(cells[x][y + 1].isEmpty() && !checked[x][y + 1]) {
                pathQueue.add(cells[x][y + 1]);
                reachabilityMatrix[x][y + 1] = true;
            }

            checked[x][y + 1] = true;
        }

        // Checks the cell to the left.
        if(x - 1 >= 0) {
            if(cells[x - 1][y].isEmpty() && !checked[x - 1][y]) {
                pathQueue.add(cells[x - 1][y]);
                reachabilityMatrix[x - 1][y] = true;
            }

            checked[x - 1][y] = true;
        }
    }

    /**
     * Removes any leftover incoming position
     * flags that might have persisted
     * and are no longer accurate.
     */
    private void wipeIncomingPositions() {
        StaticMethods.printMethodName(this);

        for(int x = 0; x < boardSize; x++) {
            for(int y = 0; y < boardSize; y++) {
                cells[x][y].setIncomingBall(null);
            }
        }
    }

    /**
     * Calculates new incoming positions.
     */
    public void calculateIncomingPositions() {
        StaticMethods.printMethodName(this);

        // Removes any old values.
        wipeIncomingPositions();

        /*
         * Populates the array with pointers
         * to empty cells.
         */
        for(int i = 0; i < incomingPositions.length; i++) {
            incomingPositions[i] = getRandomAvailableEmptyCell();

            // Skips debug printout.
            if(!Debug.BOARD.getValue()) continue;

            if(incomingPositions[i] == null) {
                StaticMethods.debug("Could not find available incoming position.");
            } else {
                StaticMethods.debug("Setting incoming position [" + i + "] to "
                        + incomingPositions[i]);
            }
        }
    }

    /**
     * Checks whether all positions for incoming balls
     * are still available for spawning.
     * @return true if all positions are available, false otherwise
     */
    public boolean incomingPositionsAvailable() {
        StaticMethods.printMethodName(this);

        for(int i = 0; i < incomingPositions.length; i++) {
            /*
             * If any cell contains a ball or is not available,
             * the check fails.
             */
            if(incomingPositions[i] == null || !incomingPositions[i].isEmpty()) {
                if(Debug.BOARD.getValue()) {
                    StaticMethods.debug("Cell " +
                            incomingPositions[i] +
                            " is no longer available.");
                }

                return false;
            }
        }

        return true;
    }

    /**
     * Checks all {@link Cell}s that are expecting a ball.
     * If any of them is no longer empty, it gets replaced
     * by another empty {@link Cell}.
     * @see Balls
     */
    public void recalculateIncomingPositions() {
        StaticMethods.printMethodName(this);

        for(int i = 0; i < incomingPositions.length; i++) {
            /*
             * If any of the cells is null while re-assigning,
             * the board is full and no additional cells are available.
             */
            if(incomingPositions[i] == null) {
                if(Debug.BOARD.getValue()) {
                    StaticMethods.debug("Could not re-assign available incoming position.");
                }

                continue;
            }

            /*
             * If any cell contains a ball,
             * new empty cell is assigned as a replacement.
             */
            if(!incomingPositions[i].isEmpty()) {
                if(Debug.BOARD.getValue()) {
                    StaticMethods.debug("Calculating new position for "
                            + incomingPositions[i] + ".");
                }

                incomingPositions[i] = getRandomAvailableEmptyCell();

                if(Debug.BOARD.getValue()) {
                    StaticMethods.debug("New position is "
                            + incomingPositions[i]);
                }
            }
        }
    }

    public Cell [] getIncomingPositions() {
        return incomingPositions;
    }

    public Queue<Cell> getSpawnedBalls() { return spawnedBalls; }

    public GameModel getModel() { return model; }
}
