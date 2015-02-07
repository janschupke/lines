package eu.janschupke.lines;

import java.util.Timer;

import eu.janschupke.lines.actions.ActionProvider;
import eu.janschupke.lines.config.ConfigProvider;
import eu.janschupke.lines.file.ErrorHandler;
import eu.janschupke.lines.gui.MainView;
import eu.janschupke.lines.model.GameModel;
import eu.janschupke.lines.time.TimeRefresher;

/**
 *
 * Represents the game that is created
 * when the application starts.
 *
 */
public class Game {
    private GameModel model;
    private MainView view;
    private ActionProvider actionProvider;

    private ClassLoader classLoader;
    private ConfigProvider configProvider;
    private ErrorHandler errorHandler;

    /**
     * The main timer that refreshes game time values.
     */
    private Timer gameTimerTask;

    public Game() {
        classLoader = this.getClass().getClassLoader();

        model = new GameModel(this);
        configProvider = new ConfigProvider(this);

        actionProvider = new ActionProvider(this);

        /*
         * Needs to be called from here since the caption strings
         * are not available while constructing the model.
         */
        model.getScoreBoard().setCaptions();

        view = new MainView(this);

        errorHandler = new ErrorHandler();

        /*
         * A game should be in process at all times.
         * If there is no game, a new one is started.
         */
        if(!model.getMeta().isGameInProcess()) {
            actionProvider.getGameActions().startNewGame();
        }

        /*
         * Turns in process should not be preserved throughout application restart.
         * However, the state itself is saved, so it needs to be nullified.
         */
        actionProvider.getGameActions().cancelTurn();

        view.toggleUI();

        /*
         * Starts the task that refreshes game time
         * and takes care of turn ending upon reaching
         * the turn time limit.
         */
        gameTimerTask = new Timer();
        gameTimerTask.schedule(new TimeRefresher(view), 0, 500);
    }

    public ActionProvider getActionProvider() { return actionProvider; }
    public GameModel getModel() { return model; }
    public MainView getView() { return view; }

    public Timer getGameTimer() { return gameTimerTask; }

    public ClassLoader getClassLoader() { return classLoader; }
    public ErrorHandler getErrorHandler() { return errorHandler; }
    public ConfigProvider getConfigProvider() { return configProvider; }
}
