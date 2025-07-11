package io.schupke.lines.actions;

import java.text.SimpleDateFormat;
import java.util.Date;

import io.schupke.lines.Lang;
import io.schupke.lines.StaticMethods;
import io.schupke.lines.Values.Debug;
import io.schupke.lines.Values.GlobalLimits;
import io.schupke.lines.gui.CellPanel;
import io.schupke.lines.gui.dialogs.GameEndDialog;
import io.schupke.lines.model.Balls;
import io.schupke.lines.model.Board;
import io.schupke.lines.model.Cell;
import io.schupke.lines.model.MetadataContainer;
import io.schupke.lines.model.ScoreBoard;
import io.schupke.lines.model.ScoreEntry;

/**
 *
 * Provides all executive methods that are relevant
 * to the game and it's logic.
 *
 */
public class GameActions {
    private ActionProvider provider;

    private boolean [][] cellsToPop;

    public GameActions(ActionProvider provider) {
        this.provider = provider;
    }

    public boolean [][] getCellsToPop() {
        return cellsToPop;
    }

    /**
     * Sets all game timers to their default values.
     */
    private void resetGameTimers() {
        StaticMethods.printMethodName(this);

        MetadataContainer meta = provider.getGame().getModel().getMeta();

        long now = System.currentTimeMillis();

        meta.setGameStartTime(now);
        meta.setSessionStartTime(now);
        meta.setPreviousSessionTime(0);
        meta.setCurrentSessionTime(0);
    }

    /**
     * Sets all meta information into their default values.
     */
    private void resetMeta() {
        StaticMethods.printMethodName(this);

        MetadataContainer meta = provider.getGame().getModel().getMeta();

        resetGameTimers();
        meta.setScore(0);
        meta.cancelTurn();
        meta.setGameStatus(true);
    }

    /**
     * Spawns new balls onto the game {@link Board}.
     */
    private void populateBoard() {
        StaticMethods.printMethodName(this);

        Board board = provider.getGame().getModel().getBoard();
        MetadataContainer meta = provider.getGame().getModel().getMeta();

        for(int i = 0; i < GlobalLimits.BALLS_PER_TURN.getValue(); i++) {
            Balls b = meta.getIncomingBalls()[i].getBall();

            /*
             * If not empty cells are available, the board is full
             * and the game will be restarted upon returning
             * from this method.
             */
            if(board.getRandomEmptyCell() == null) {
                StaticMethods.debug("Could not find an empty cell.");
                return;
            }

            if(Debug.BOARD.getValue()) {
                StaticMethods.debug("Spawning ball [" + i + "] onto the " +
                        board.getIncomingPositions()[i]);
            }

            /*
             * Sets the ball from 'incoming colors' array
             * into the position saved in the board model array.
             */
            board.getIncomingPositions()[i].setBall(b);
        }
    }

    /**
     * Executes all procedures that are necessary
     * in order to start a new game.
     */
    public void startNewGame() {
        StaticMethods.printMethodName(this);

        MetadataContainer meta = provider.getGame().getModel().getMeta();
        Board board = provider.getGame().getModel().getBoard();

        // Score handling etc.
        checkScoreForSaving();

        // Sets all meta information into their default values.
        resetMeta();

        provider.getGame().getModel().getMeta().setNewBalls();

        board.clear();
        board.calculateIncomingPositions();

        // Starts a new turn in order to spawn some balls.
        startNewTurn(true);

        // Indicates that there is a game currently going on.
        meta.setGameStatus(true);

        meta.setFreshStatus(true);
    }

    /**
     * Starts a new game turn. In the process, this method checks
     * whether the {@link Board} is filled up. If so, game is ended.
     * @param   addBalls    an indicator whether new balls should be spawned
     */
    public void startNewTurn(boolean addBalls) {
        StaticMethods.printMethodName(this);

        MetadataContainer meta = provider.getGame().getModel().getMeta();
        Board board = provider.getGame().getModel().getBoard();

        meta.setFreshStatus(false);

        resetTurnTimer();

        /*
         * If a ball was moved into a cell that was expecting
         * a ball spawn next turn, positions must be recalculated.
         */
        if(!board.incomingPositionsAvailable()) {
            board.recalculateIncomingPositions();
        }

        if(addBalls) {
            populateBoard();
        }

        /*
         * Starts a new game if the board fill up.
         * Score assigning is called inside the startNewGame() method
         * instead of here, since this is only one of several
         * places from where the game can be ended.
         */
        if(board.isFull()) {
            StaticMethods.debug("The Board is full.");
            startNewGame();

            return;

        } else {
            /*
             * If the board was not filled up and the game continues,
             * another check is performed to remove any additional
             * lines that might have been formed during the spawn process.
             */
            popLines();
        }

        /*
         * If balls are spawned, new incoming colors and positions
         * are set for the next turn.
         */
        if(addBalls) {
            StaticMethods.debug("Calculating new incoming balls.");

            provider.getGame().getModel().getMeta().setNewBalls();
            board.calculateIncomingPositions();
        }

        /*
         * Cancels any turn that might have been in process
         * when startNewTurn() was called.
         * Canceling turn effectively means that if there was
         * an active ball, it is deactivated.
         */
        cancelTurn();

        /*
         * Refreshes the scene.
         */
        provider.getWindow().getBoardPanel().toggleUI();
        provider.getWindow().getInfoPanel().toggleUI();
    }

    /**
     * Creates a new {@link ScoreEntry} that can be added into the {@link ScoreBoard}.
     * @return  new {@link ScoreEntry}
     */
    private ScoreEntry createScoreEntry() {
        StaticMethods.printMethodName(this);

        MetadataContainer meta = provider.getGame().getModel().getMeta();
        Board board = provider.getGame().getModel().getBoard();

        /*
         * Converts the timestamp into a more readable format.
         */
        Date gst = new Date(Long.valueOf(meta.getGameStartTime()));
        SimpleDateFormat gameStartFormat = new SimpleDateFormat("yyyy-MM-dd");

        String turnTime;

        if(meta.isTurnTimeEnabled()) {
            turnTime = String.valueOf(meta.getTurnTimeLimit());
        } else {
            turnTime = Lang.write("misc.na");
        }

        /*
         * Creates a String array that represents
         * the score entry.
         */
        String [] values = new String [] {
            meta.getUsername().toString(),
            meta.getCurrentScore().toString(),
            String.valueOf(board.getSize()),
            turnTime,
            StaticMethods.parseTime(Long.valueOf(meta.getTotalGameTime())),
            gameStartFormat.format(gst)
        };

        return new ScoreEntry(values);
    }

    /**
     * Creates a new {@link ScoreEntry} and adds it into the {@link ScoreBoard}.
     */
    public void updateScoreBoard() {
        StaticMethods.printMethodName(this);

        MetadataContainer meta = provider.getGame().getModel().getMeta();
        ScoreBoard scoreBoard = provider.getGame().getModel().getScoreBoard();
        GameEndDialog dialog = provider.getGame().getView().getGameEndDialog();

        /*
         * User name could have been changed during the dialog.
         */
        meta.setUsername(dialog.getUsernameField().getText());

        /*
         * Adds the entry into the board.
         */
        ScoreEntry entry = createScoreEntry();
        scoreBoard.addEntry(entry);

        dialog.setVisible(false);
    }

    /**
     * If the score achieved during this currently ending game was high enough,
     * a dialog is displayed that allows the player to save this score.
     */
    private void checkScoreForSaving() {
        StaticMethods.printMethodName(this);

        MetadataContainer meta = provider.getGame().getModel().getMeta();
        ScoreBoard scoreBoard = provider.getGame().getModel().getScoreBoard();
        Board board = provider.getGame().getModel().getBoard();

        int score = meta.getCurrentScore();
        int boardSize = board.getSize();

        /*
         * Displays the dialog, if requirements are met.
         */
        if(score > 0 && scoreBoard.isScoreSuitable(score, boardSize)) {
            StaticMethods.debug("Score is sufficient.");

            provider.getGame().getView().getGameEndDialog().toggleUI();
            provider.getGame().getView().getGameEndDialog().setVisible(true);
        }
    }

    /**
     * Sets the turn timer to zero.
     */
    private void resetTurnTimer() {
        StaticMethods.printMethodName(this);

        MetadataContainer meta = provider.getGame().getModel().getMeta();

        meta.resetTurnTime();
    }

    /**
     * Increases the current score based on the amount of balls
     * that that player managed to get rid of during last turn.
     * @param   total   total amount of balls that were popped this turn
     */
    private void updateScore(int total) {
        StaticMethods.printMethodName(this);

        MetadataContainer meta = provider.getGame().getModel().getMeta();

        /*
         * Given minimum line length m,
         * total amount of balls t
         * and amount of balls above minimum (t - m),
         * the score will be increased by
         * m +  2^(t - m)
         */
        double score = 0;
        int min = GlobalLimits.MINIMUM_LINE_LENGTH.getValue();
        int above = total - GlobalLimits.MINIMUM_LINE_LENGTH.getValue();

        if(total == 0) {
            StaticMethods.debug("Score == 0.");
            return;
        }

        if(total == GlobalLimits.MINIMUM_LINE_LENGTH.getValue()) {
            StaticMethods.debug("Assigning minimum score");

            score = GlobalLimits.MINIMUM_LINE_LENGTH.getValue();
        } else {
            StaticMethods.debug("Assigning score by formula.");

            score = min + Math.pow(2, above);
        }

        meta.updateScore((int) score);
    }

    /**
     * Removes a ball from the originating {@link Cell}
     * and places it into the destination {@link Cell}.
     * @param   from    originating {@link Cell}
     * @param   to      destination {@link Cell}
     */
    private void move(Cell from, Cell to) {
        StaticMethods.printMethodName(this);

        to.setBall(from.getBall());

        from.setBall(null);

        provider.getGame().getView().getBoardPanel().toggleUI();

        if(Debug.BOARD.getValue()) {
            StaticMethods.debug("Moved to " + to);
        }
    }

    /**
     * Determines whether the path between two cells exists.
     * @param   to destination {@link Cell}
     * @return  true is a path exists, false otherwise
     */
    private boolean pathExists(Cell to) {
        StaticMethods.printMethodName(this);

        Board board = provider.getGame().getModel().getBoard();

        if(board.getReachability(to)) {
            return true;
        }

        return false;
    }

    /**
     * Compares two cells and determines whether they are equal
     * based on their coordinates.
     * @return  true if the cells are equal, false otherwise
     */
    private boolean comparePositions(Cell from, Cell to) {
        return from == to;
    }

    /**
     * Cancels a turn that may have been going on.
     */
    public void cancelTurn() {
        StaticMethods.printMethodName(this);

        Board board = provider.getGame().getModel().getBoard();
        MetadataContainer meta = provider.getGame().getModel().getMeta();

        // Deactivates currently active cell on the board.
        if(meta.getOriginatingCell() != null) {
            StaticMethods.debug("Removing originating cell.");
            board.setActive(meta.getOriginatingCell(), false);
        }

        // Sets meta information accordingly.
        meta.setTurnStatus(false);
        meta.setOriginatingCell(null);
    }

    /**
     * Removes all balls that were flagged for popping
     * at the end of the turn.
     * @return  amount of balls that have been removed
     */
    private int removeFlaggedBalls() {
        StaticMethods.printMethodName(this);

        Board board = provider.getGame().getModel().getBoard();

        int popped = 0;

        /*
         * Goes through the boolean array
         * that represents popping flags for every
         * cell on the board.
         */
        for(int x = 0; x < cellsToPop.length; x++) {
            for(int y = 0; y < cellsToPop.length; y++) {
                /*
                 * If a true value is spotted, the ball on that position
                 * on the board is removed and the amount
                 * of popped balls is increased.
                 */
                if(cellsToPop[x][y]) {
                    if(Debug.BOARD.getValue()) {
                        StaticMethods.debug("Removing " + board.getCell(x, y));
                    }

                    popped++;
                    board.getCell(x, y).setBall(null);

                    /*
                     * Sets the flag back to its default value
                     * for future re-use. Not exactly needed,
                     * since the array is re-created every time.
                     */
                    cellsToPop[x][y] = false;
                }
            }
        }

        return popped;
    }

    /**
     * Checks every newly spawned ball on the board to determine
     * whether any sufficiently long lines have formed
     * during last turn. Calls checking methods that
     * flag the cells for popping.
     * @return  the amount of balls that have been removed from the board
     */
    private int popLines() {
        StaticMethods.printMethodName(this);

        Board board = provider.getGame().getModel().getBoard();

        /*
         * Contains pop flags for every available cell.
         */
        cellsToPop = new boolean[board.getSize()][board.getSize()];

        /*
         * Goes through all unchecked newly spawned cells
         * and checks for newly formed lines.
         */
        while(!board.getSpawnedBalls().isEmpty()) {
            Cell c = board.getSpawnedBalls().poll();

            if(Debug.BOARD.getValue()) {
                StaticMethods.debug("Polling cell " + c + " from the queue.");
            }

            checkCell(c);
        }

        /*
         * Removes flagged balls from the board
         * and returns their amount.
         */
        int popAmount = removeFlaggedBalls();

        /*
         * Increases score according to the amount of balls
         * that have been popped.
         */
        updateScore(popAmount);

        return popAmount;
    }

    /**
     * Parses all directions starting at the provided {@link Cell}.
     * Looks for any newly created lines that need to be removed.
     * @param   cell    the {@link Cell} to be checked
     */
    private void checkCell(Cell cell) {
        if(Debug.BOARD.getValue()) {
            StaticMethods.printMethodName(this);
        }

        parseHorizontalLine(cell);
        parseVerticalLine(cell);
        parseDecreasingDiagonal(cell);
        parseIncreasingDiagonal(cell);
    }

    /**
     * Searching for lines horizontally.
     */
    private void parseHorizontalLine(Cell cell) {
        if(Debug.BOARD.getValue()) {
            StaticMethods.printMethodName(this);
        }

        Board board = provider.getGame().getModel().getBoard();
        LineChecker checker = provider.getLineChecker();

        int y = cell.getPosition()[1];

        /*
         * Checks horizontally aligned cells,
         * starting at the left-most cell.
         */
        for(int i = 0; i < board.getSize(); i++) {
            Cell c;

            c = board.getCell(i, y);

            if(Debug.BOARD.getValue()) {
                StaticMethods.debug("Checking cell " + c + " horizontally.");
            }

            checker.checkHorizontalLine(c);
        }
    }


    /**
     * Searching for lines vertically.
     */
    private void parseVerticalLine(Cell cell) {
        if(Debug.BOARD.getValue()) {
            StaticMethods.printMethodName(this);
        }

        Board board = provider.getGame().getModel().getBoard();
        LineChecker checker = provider.getLineChecker();

        int x = cell.getPosition()[0];

        /*
         * Checks vertically aligned cells,
         * starting at the top.
         */
        for(int i = 0; i < board.getSize(); i++) {
            Cell c;

            c = board.getCell(x, i);

            if(Debug.BOARD.getValue()) {
                StaticMethods.debug("Checking cell " + c + " vertically.");
            }

            checker.checkVerticalLine(c);
        }
    }


    /**
     * Searching for lines on the decreasing diagonal.
     */
    private void parseDecreasingDiagonal(Cell cell) {
        if(Debug.BOARD.getValue()) {
            StaticMethods.printMethodName(this);
        }

        Board board = provider.getGame().getModel().getBoard();
        LineChecker checker = provider.getLineChecker();

        /*
         * Prepares coordinates of a starting cell
         * for the decreasing diagonal check.
         */
        int i = cell.getPosition()[0];
        int j = cell.getPosition()[1];

        int s = board.getSize();

        while(i > 0 && j > 0) {
            i--;
            j--;
        }

        /*
         * Checks the decreasing diagonal that goes through
         * the cell in question.
         */
        for(; i < s && j < s; i++, j++) {
            Cell c;

            c = board.getCell(i, j);

            if(Debug.BOARD.getValue()) {
                StaticMethods.debug("Checking cell " + c + "\'s decreasing diagonal.");
            }

            checker.checkDecreasingDiagonal(c);
        }
    }


    /**
     * Searching for lines on the increasing diagonal.
     */
    private void parseIncreasingDiagonal(Cell cell) {
        if(Debug.BOARD.getValue()) {
            StaticMethods.printMethodName(this);
        }

        Board board = provider.getGame().getModel().getBoard();
        LineChecker checker = provider.getLineChecker();

        /*
         * Prepares coordinates of a starting cell
         * for the increasing diagonal check.
         */
        int i = cell.getPosition()[0];
        int j = cell.getPosition()[1];

        int s = board.getSize();

        while(i > 0 && j < s - 1) {
            i--;
            j++;
        }

        /*
         * Checks the increasing diagonal that goes through
         * the cell in question.
         */
        for(; i < s && j >= 0; i++, j--) {
            Cell c;

            c = board.getCell(i, j);

            if(Debug.BOARD.getValue()) {
                StaticMethods.debug("Checking cell " + c + "\'s increasing diagonal.");
            }

            checker.checkIncreasingDiagonal(c);
        }
    }

    /**
     * Takes appropriate actions every time the player clicks a cell ({@link CellPanel}).
     * @param   cell    the actual {@link Cell} inside the {@link CellPanel} that was clicked
     */
    public void handleCellClick(Cell cell) {
        StaticMethods.printMethodName(this);

        MetadataContainer meta = provider.getGame().getModel().getMeta();
        Board board = provider.getGame().getModel().getBoard();

        /*
         * Tries to start a new turn
         * if there is not one in process already.
         */
        if(!meta.isTurnInProcess()) {
            StaticMethods.debug("Attempting to start a new turn.");
            /*
             * Initiates a turn if the clicked
             * cell is not empty.
             */
            if(!cell.isEmpty()) {
                StaticMethods.debug("Cell contains a ball. Starting a turn.");

                meta.setTurnStatus(true);

                board.setActive(cell, true);
                meta.setOriginatingCell(cell);

                board.calculateReachabilityMatrix(cell);
            } else {
                StaticMethods.debug("The cell is empty.");
            }
        /*
         *  Continues the ongoing turn.
         */
        } else {
            /*
             * A cell with a ball was clicked.
             */
            if(!cell.isEmpty()) {
                /*
                 * Second click on the originating cell
                 * will cancel the turn.
                 */
                if(comparePositions(meta.getOriginatingCell(), cell)) {
                    StaticMethods.debug("Clicked the same cell again.");

                    cancelTurn();
                /*
                 * Clicking another ball will make this
                 * ball active.
                 */
                } else {
                    StaticMethods.debug("Clicked another ball.");

                    board.setActive(meta.getOriginatingCell(), false);
                    board.setActive(cell, true);

                    meta.setOriginatingCell(cell);

                    board.calculateReachabilityMatrix(cell);
                }
            /*
             * An empty cell was clicked.
             */
            } else {
                StaticMethods.debug("Attempting to move the ball.");
                /*
                 * Ball is moved if a path exists.
                 */
                if(pathExists(cell)) {
                    StaticMethods.debug("Path exists.");
                    move(meta.getOriginatingCell(), cell);

                    board.setActive(meta.getOriginatingCell(), false);

                    /*
                     * No additional balls are spawned
                     * on successful turn (lines popped).
                     */
                    if(popLines() > 0) {
                        startNewTurn(false);
                    } else {
                        startNewTurn(true);
                    }

                    /*
                     * Ends the current turn.
                     */
                    meta.setTurnStatus(false);
                } else {
                    StaticMethods.debug("Path does not exist.");
                }
            }
        }
    }

    /**
     * Wipes the {@link ScoreBoard} if the user confirms this action.
     */
    public void resetScore() {
        StaticMethods.printMethodName(this);

        ScoreBoard scoreBoard = provider.getGame().getModel().getScoreBoard();

        scoreBoard.reset();
    }
}
