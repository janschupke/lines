package io.schupke.lines.actions;

import io.schupke.lines.Game;
import io.schupke.lines.gui.MainView;

/**
 *
 * Represents a boundary class between actions / controllers
 * and the rest of the application. Creates and keeps instances
 * of all Actions classes.
 *
 */
public class ActionProvider {
    private Game game;

    private WindowActions windowActions;
    private ConfigActions configActions;
    private GameActions gameActions;
    private LineChecker lineChecker;

    public ActionProvider(Game game) {
        this.game = game;

        windowActions = new WindowActions(this);
        configActions = new ConfigActions(this);
        gameActions = new GameActions(this);
        lineChecker = new LineChecker(this);
    }

    public WindowActions getWindowActions() { return windowActions; }
    public ConfigActions getConfigActions() { return configActions; }
    public GameActions getGameActions() { return gameActions; }
    public LineChecker getLineChecker() { return lineChecker; }

    public Game getGame() { return game; }
    public MainView getWindow() { return game.getView(); }
}
