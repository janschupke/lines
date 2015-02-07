package eu.janschupke.lines.model;

import java.io.Serializable;

import eu.janschupke.lines.Game;
import eu.janschupke.lines.StaticMethods;
import eu.janschupke.lines.Values.Debug;
import eu.janschupke.lines.Values.FileSystemValues;
import eu.janschupke.lines.file.FileManipulator;

/**
 *
 * Represents the main model class for the game.
 * Encapsulates all model instances and provides
 * access to them.
 *
 */
public class GameModel implements Serializable {
    private static final long serialVersionUID = 1L;

    private Game game;

    private Board board;
    private MetadataContainer meta;
    private ScoreBoard scoreBoard;

    public GameModel(Game game) {
        this.game = game;

        /*
         * Meta + Board:
         * Both must exist and be undamaged in order to load them,
         * since they depend on each other.
         */
        if(FileManipulator.readObj(FileSystemValues.META_FILE.getValue()) != null &&
            FileManipulator.readObj(FileSystemValues.BOARD_FILE.getValue()) != null) {

            // Loads Meta Container from the file.
            meta = (MetadataContainer) FileManipulator.readObj(FileSystemValues.META_FILE.getValue());

            updateMeta();

            // Loads the Board from the file.
            board = (Board) FileManipulator.readObj(FileSystemValues.BOARD_FILE.getValue());

            // Indicates that the game has been loaded and is currently in process.
            meta.setGameStatus(true);

            /*
             * If one of the files was saved during the last session
             * and the other one was not (permissions etc.),
             * the instance numbers do not match and the game is restarted.
             * This prevents desynchronization of the game board state
             * and the meta information.
             */
            if(meta.getGameInstance() != board.getGameInstance()) {
                StaticMethods.debug("The game model is out of synch.");
                StaticMethods.debug("Meta ID:\t" + meta.getGameInstance());
                StaticMethods.debug("Board ID:\t" + board.getGameInstance());

                recreateGame();
            }

        /*
         * If either of the files is missing, both are re-created.
         */
        } else {
            StaticMethods.debug("The game model is damaged.");
            recreateGame();
        }

        /*
         * Score Board model:
         */
        if(FileManipulator.readObj(FileSystemValues.SCORE_FILE.getValue()) != null) {
            scoreBoard = (ScoreBoard) FileManipulator.readObj(FileSystemValues.SCORE_FILE.getValue());
        } else {
            scoreBoard = new ScoreBoard(this, null);
            FileManipulator.writeObj(FileSystemValues.SCORE_FILE.getValue(), scoreBoard);
        }
    }

    /**
     * If either the Meta Container of the Game Board model is damaged
     * or out of synch with the other, a new instance of both is created.
     * @see MetadataContainer
     * @see Board
     */
    private void recreateGame() {
        StaticMethods.printMethodName(this);

        final long gameInstance = System.currentTimeMillis();

        StaticMethods.debug("Setting the game instance ID to " + gameInstance + ".");

        meta = new MetadataContainer(gameInstance);
        FileManipulator.writeObj(FileSystemValues.META_FILE.getValue(), meta);

        board = new Board(this, Board.DEFAULT_SIZE, gameInstance);
        FileManipulator.writeObj(FileSystemValues.BOARD_FILE.getValue(), board);

        /*
         * Setting this to false will result in populating the (now empty)
         * board with default balls, putting the game into its initial state.
         */
        meta.setGameStatus(false);
    }

    /**
     * Tunes some of the Meta Container values
     * that are no longer correct when restarting
     * the game.
     */
    private void updateMeta() {
        StaticMethods.printMethodName(this);

        // Debug timer printout.
        if(Debug.TIMERS.getValue()) {
            StaticMethods.debug("BEFORE RESET:");
            StaticMethods.debug("Game start time:\t\t" +
                    meta.getGameStartTime());
            StaticMethods.debug("Session Start time:\t\t" +
                    meta.getSessionStartTime());
            StaticMethods.debug("Previous session time:\t" +
                    meta.getPreviousSessionTime());
            StaticMethods.debug("Current session time:\t" +
                    meta.getCurrentSessionTime());
            StaticMethods.debug("");
        }

        // Session timer values are merged.
        meta.setPreviousSessionTime(
                meta.getPreviousSessionTime() +
                meta.getCurrentSessionTime());

        // Current session time is set to this moment.
        meta.setSessionStartTime(System.currentTimeMillis());
        meta.setCurrentSessionTime(0);

        // Turn timer starts anew when the game is re-launched.
        meta.resetTurnTime();


        // Debug timer printout.
        if(Debug.TIMERS.getValue()) {
            StaticMethods.debug("AFTER RESET:");
            StaticMethods.debug("Game start time:\t\t" +
                    meta.getGameStartTime());
            StaticMethods.debug("Session Start time:\t\t" +
                    meta.getSessionStartTime());
            StaticMethods.debug("Previous session time:\t" +
                    meta.getPreviousSessionTime());
            StaticMethods.debug("Current session time:\t" +
                    meta.getCurrentSessionTime());
        }
    }

    public Board getBoard() { return board; }
    public MetadataContainer getMeta() { return meta; }
    public ScoreBoard getScoreBoard() { return scoreBoard; }

    public Game getGame() { return game; }
}
