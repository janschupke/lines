package eu.janschupke.lines.model;

import java.io.Serializable;

import eu.janschupke.lines.Values.GlobalLimits;

/**
 *
 * A container that holds all meta information
 * about the current game.
 *
 */
public class MetadataContainer implements Serializable {
    private static final long serialVersionUID = 1L;
    private long gameInstance;

    /**
     * Indicates whether any turn was finished in this
     * game instance, excluding the initial turn
     * that is issued by the application and not the user.
     */
    private boolean freshStatus;

    /**
     * A flag that indicates whether
     * to show incoming balls in the Info Panel.
     */
    private boolean showIncomingColors;

    /**
     * A flag that indicates whether
     * to hint positions of incoming balls
     * on the board.
     */
    private boolean showIncomingPositions;

    /**
     * A flag that indicates whether
     * the cell reachability highlighting
     * is enabled.
     */
    private boolean isHighlightEnabled;

    /**
     * An array of balls' colors for the next turn.
     */
    private Cell [] incomingBalls;

    private Integer currentScore;
    private String username;

    /**
     * A flag that indicates whether
     * there is currently a game in process.
     * Should only be false for a moment
     * when initializing the model.
     */
    private boolean isGameInProcess;

    /**
     * Indicates that there is a turn currently in process,
     * meaning that user has activated a ball.
     */
    private boolean isTurnInProcess;

    /**
     * When there is a turn in process, this points
     * to a cell that was clicked by the user.
     * Should be null otherwise.
     */
    private Cell originatingCell;

    /**
     * Time stamp of the moment in which
     * the game was started.
     */
    private long gameStartTime;

    /**
     * Time stamp of the moment in which
     * the current session was started.
     */
    private long sessionStartTime;

    /**
     * Amount of milliseconds that represents
     * the duration of previous session.
     */
    private long previousSessionTime;

    /**
     * Amount of milliseconds that represents
     * the duration of current session.
     */
    private long currentSessionTime;

    /**
     * Indicates that the user has enabled
     * the feature that automatically ends turns.
     */
    private boolean isTurnTimeEnabled;

    /**
     * Time stamp that represents the moment
     * in which the current turn started.
     */
    private long turnStartTime;

    /**
     * Amount of seconds that is provided
     * for the player each turn.
     */
    private int turnTimeLimit;

    public MetadataContainer(long gameInstance) {
        this.gameInstance = gameInstance;

        initFields();
    }

    public long getGameInstance() { return gameInstance; }

    public void setGameInstance(long gameInstance) {
        this.gameInstance = gameInstance;
    }

    /**
     * Sets all fields into their default values
     * that represent the fresh game start
     * in default configuration.
     */
    private void initFields() {
        initBallArray();

        // Gets random ball color for each of the cells.
        setNewBalls();

        setDefaultConfigValues();
        setDefaultGameValues();
    }

    private void initBallArray() {
        incomingBalls = new Cell [GlobalLimits.BALLS_PER_TURN.getValue()];

        for(int i = 0; i < incomingBalls.length; i++) {
            incomingBalls[i] = new Cell(null, 0, 0);
        }
    }

    /**
     * Sets initial values for fields that should
     * be reset only when a new game starts.
     */
    public void setDefaultGameValues() {
        freshStatus = true;

        currentScore = 0;

        isGameInProcess = false;

        isTurnInProcess = false;
        originatingCell = null;

        /*
         * When the new game starts, both these values are same.
         */
        gameStartTime = System.currentTimeMillis();
        sessionStartTime = System.currentTimeMillis();

        previousSessionTime = 0;
        currentSessionTime = 0;
    }

    /**
     * Sets initial values to fields that represent
     * configuration and should be reset whenever
     * the configuration reset button is pressed.
     * This method should not affect the game state itself.
     */
    public void setDefaultConfigValues() {
        showIncomingColors = true;
        showIncomingPositions = true;
        isHighlightEnabled = true;

        username = System.getProperty("user.name");

        isTurnTimeEnabled = false;
        turnTimeLimit = GlobalLimits.DEFAULT_TURN_LENGTH.getValue();
        turnStartTime = System.currentTimeMillis();
    }

    /**
     * Assigns a random ball color for each of the cells.
     * @see Cell
     * @see Balls
     */
    public void setNewBalls() {
        for(int i = 0; i < incomingBalls.length; i++) {
            incomingBalls[i].setBall(Balls.getRandom());
        }
    }

    public boolean getFreshStatus() { return freshStatus; }
    public boolean getIncomingColorsFlag() { return showIncomingColors; }
    public boolean getIncomingPositionsFlag() { return showIncomingPositions; }
    public boolean isHighlightEnabled() { return isHighlightEnabled; }
    public Cell [] getIncomingBalls() { return incomingBalls; }
    public Integer getCurrentScore() { return currentScore; }
    public String getUsername() { return username; }
    public Cell getOriginatingCell() { return originatingCell; }
    public long getGameStartTime() { return gameStartTime; }
    public long getSessionStartTime() { return sessionStartTime; }
    public long getPreviousSessionTime() { return previousSessionTime; }
    public long getCurrentSessionTime() { return currentSessionTime; }
    public long getTurnStartTime() { return turnStartTime; }
    public long getTurnTime() { return (System.currentTimeMillis() - turnStartTime); }

    /**
     * Returns the turn time limit in seconds.
     * @return turn time limit
     */
    public int getTurnTimeLimit() { return turnTimeLimit; }

    /**
     * Returns the sum of times of previous and current session.
     */
    public long getTotalGameTime() {
        return (previousSessionTime + currentSessionTime);
    }

    public boolean isGameInProcess() { return isGameInProcess; }
    public boolean isTurnInProcess() { return isTurnInProcess; }
    public boolean isTurnTimeEnabled() { return isTurnTimeEnabled; }

    public void setFreshStatus(boolean state) {
        freshStatus = state;
    }

    public void toggleIncomingColors(boolean state) {
        showIncomingColors = state;
    }

    public void toggleIncomingPositions(boolean state) {
        showIncomingPositions = state;
    }

    public void toggleHighlighting(boolean state) {
        isHighlightEnabled = state;
    }

    public void setScore(int score) {
        currentScore = score;
    }

    public void updateScore(int modifier) {
        currentScore += modifier;
    }

    public void setUsername(String name) {
        this.username = name;
    }

    public void setGameStatus(boolean state) {
        isGameInProcess = state;
    }

    public void setTurnStatus(boolean state) {
        isTurnInProcess = state;
    }

    public void setOriginatingCell(Cell cell) {
        originatingCell = cell;
    }

    public void setGameStartTime(long time) {
        gameStartTime = time;
    }

    public void setSessionStartTime(long time) {
        sessionStartTime = time;
    }

    public void setPreviousSessionTime(long time) {
        previousSessionTime = time;
    }

    public void setCurrentSessionTime(long time) {
        currentSessionTime = time;
    }

    public void toggleTurnTime(boolean state) {
        isTurnTimeEnabled = state;
    }

    /**
     * Sets the turn time limit, in seconds.
     * @param value time in seconds
     */
    public void setTurnTimeLimit(int value) {
        turnTimeLimit = value;
    }

    public void resetTurnTime() {
        turnStartTime = System.currentTimeMillis();
    }

    public void cancelTurn() {
        setTurnStatus(false);
        setOriginatingCell(null);
    }
}
