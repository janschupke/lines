package eu.janschupke.lines.actions;

import eu.janschupke.lines.Lang;
import eu.janschupke.lines.StaticMethods;
import eu.janschupke.lines.Values.FileSystemValues;
import eu.janschupke.lines.config.Configurator;
import eu.janschupke.lines.file.FileManipulator;
import eu.janschupke.lines.gui.BoardPanel;
import eu.janschupke.lines.gui.StatusBar;
import eu.janschupke.lines.gui.dialogs.ConfigDialog;
import eu.janschupke.lines.gui.dialogs.CustomDialogs;
import eu.janschupke.lines.model.Board;
import eu.janschupke.lines.model.MetadataContainer;
import eu.janschupke.lines.model.ScoreBoard;

/**
 *
 * Provides configuration controls.
 *
 */
public class ConfigActions {
    private ActionProvider provider;

    public ConfigActions(ActionProvider provider) {
        this.provider = provider;
    }

    /**
     * Takes the values from the configuration
     * dialog and applies them to the game.
     */
    public void applySettings() {
        StaticMethods.printMethodName(this);

        ConfigDialog dialog = provider.getWindow().getConfigDialog();

        boolean hideAtEnd = true;
        boolean restartConfirmed = false;

        if(dialog.hasBoardSizeChanged()) {
            restartConfirmed = handleBoardChange();

            /*
             * If the board size change was not confirmed,
             * dialog will be kept visible.
             */
            hideAtEnd = restartConfirmed;

            /*
             * If any of the configuration changes require a game restart,
             * is id done here.
             */
            if(restartConfirmed) {
                executeGameRestart();
            } else {
                return;
            }
        }

        updateConfigValues();
        updateApplicationValues();

        /*
         * If any errors occur during the file saving,
         * the dialog will remain open.
         */
        hideAtEnd = performSaving();

        // Game restart requirement notification.
        if(dialog.isRestartRequired()) {
            StaticMethods.debug("Restart is required.");

            CustomDialogs.showRestartNotification(provider.getWindow());
            dialog.setRestartRequired(false);
        }

        provider.getWindow().toggleUI();

        if(hideAtEnd) {
            dialog.setVisible(false);
        }
    }

    /**
     * Board size change needs to be confirmed
     * by the user since it results in a game restart.
     * However, if the game is in its initial state,
     * restart will not matter and the confirmation
     * is not necessary.
     */
    private boolean handleBoardChange() {
        StaticMethods.printMethodName(this);

        MetadataContainer meta = provider.getGame().getModel().getMeta();

        boolean confirmed = true;

        if(!meta.getFreshStatus()) {
            StaticMethods.debug("Board change confirm required.");

            confirmed = provider.getWindowActions().showBoardChangePrompt();
        }

        return confirmed;
    }

    /**
     * Updates values within objects that represent
     * the actual game model or its GUI.
     */
    private void updateApplicationValues() {
        StaticMethods.printMethodName(this);

        BoardPanel boardPanel = provider.getWindow().getBoardPanel();
        ConfigDialog dialog = provider.getWindow().getConfigDialog();

        // Applies the tooltip visibility configuration.
        provider.getWindowActions().toggleTooltips(
                dialog.getTooltipsCheck().isSelected());

        /*
         * Removes any already-painted incoming balls,
         * if this feature gets disabled.
         */
        if(!dialog.getIncomingPositionsCheck().isSelected()) {
            boardPanel.removeIncomingBalls();
        }
    }

    /**
     * Updates configuration values that will
     * be saved later.
     */
    private void updateConfigValues() {
        StaticMethods.printMethodName(this);

        Configurator config = provider.getWindow().getGame().getConfigProvider().getConfig();
        MetadataContainer meta = provider.getGame().getModel().getMeta();
        ConfigDialog dialog = provider.getWindow().getConfigDialog();

        /*
         * Updates information about the application
         * as a whole.
         */
        config.saveLanguage(
                dialog.getLanguageCombo().getSelectedIndex());
        config.saveTooltips(
                dialog.getTooltipsCheck().isSelected());
        config.saveConfirms(
                dialog.getConfirmsCheck().isSelected());
        config.saveGradient(
                dialog.getGradientCheck().isSelected());

        /*
         * Updates information relevant to the game itself.
         */
        meta.toggleIncomingColors(
                dialog.getIncomingColorsCheck().isSelected());
        meta.toggleIncomingPositions(
                dialog.getIncomingPositionsCheck().isSelected());

        meta.toggleTurnTime(
                dialog.getTimeLimitCheck().isSelected());
        meta.setTurnTimeLimit(
                (Integer)dialog.getTimeLimitSpinner().getValue());

        meta.toggleHighlighting(
                dialog.getHighlightCheck().isSelected());

        /*
         * Needed in case of cell background style change.
         */
        provider.getWindow().invalidate();
        provider.getWindow().validate();
        provider.getWindow().repaint();
    }

    /**
     * Restart the game and applies the newly selected {@link BoardPanel}.
     */
    private void executeGameRestart() {
        StaticMethods.printMethodName(this);

        ConfigDialog dialog = provider.getWindow().getConfigDialog();
        Board board = provider.getGame().getModel().getBoard();

        // Changes the size in model.
        board.setSize((Integer)dialog.getBoardSizeSpinner().getValue());

        // Redraws the GUI board.
        provider.getGame().getView().setBoardPanel(
                new BoardPanel(provider.getGame().getView()));

        provider.getGameActions().startNewGame();

        dialog.setBoardSizeChanged(false);
    }

    /**
     * Takes the updated configuration and saves
     * it into a file. Notifies the user
     * about the saving result.
     */
    private boolean performSaving() {
        StaticMethods.printMethodName(this);

        StatusBar statusBar = provider.getWindow().getStatusBar();

        boolean state = true;

        /*
         * Notifies the user about the configuration saving result.
         */
        if(saveConfig()) {
            StaticMethods.debug("Config save OK.");

            statusBar.setStatus(Lang.write("file.config.save.success"));
        } else {
            StaticMethods.debug("Config save failed.");

            statusBar.setStatus(Lang.write("file.config.save.error"));

            state = false;

            /*
             * No error pop-up here. That is done by file handler,
             * for some reason...
             */
        }

        return state;
    }

    /**
     * Calls the file handler in order to save
     * the configuration file.
     * @return  true if the saving was successful, false otherwise
     */
    public boolean saveConfig() {
        StaticMethods.printMethodName(this);

        String message;

        boolean status = true;

        if(!provider.getGame().getConfigProvider().getConfigHandler().save()) {
            message = "Failed to save config.";

            StaticMethods.debug(message);

            // Saves the error message into a file.
            provider.getWindow().getGame().getErrorHandler()
            .saveError(StaticMethods.getMethodName(this), message);

            status = false;
        }

        return status;
    }

    /**
     * Calls the file handler in order to save
     * all object files.
     * @return  true if the saving of all files was successful,
     * false if any of them failed otherwise
     */
    public boolean saveObjects() {
        StaticMethods.printMethodName(this);

        MetadataContainer meta = provider.getGame().getModel().getMeta();
        Board board = provider.getGame().getModel().getBoard();
        ScoreBoard scoreBoard = provider.getGame().getModel().getScoreBoard();

        String message;

        boolean status = true;

        final long gameInstance = System.currentTimeMillis();

        StaticMethods.debug("Setting the game instance ID to " + gameInstance + ".");

        /*
         * Updates the instance ID of objects that depend on each other.
         * If either of them cannot be saved (later in this method),
         * then the newly assigned instance ID will not be applied,
         * resulting in desynchronized state, which will force the game
         * to be restarted during the next application load procedure.
         */
        board.setGameInstance(gameInstance);
        meta.setGameInstance(gameInstance);

        if(!FileManipulator.writeObj(FileSystemValues.BOARD_FILE.getValue(), board)) {
            message = "Failed to save board.";

            StaticMethods.debug(message);

            // Saves the error message into a file.
            provider.getWindow().getGame().getErrorHandler()
            .saveError(StaticMethods.getMethodName(this), message);

            status = false;
        }

        if(!FileManipulator.writeObj(FileSystemValues.SCORE_FILE.getValue(), scoreBoard)) {
            message = "Failed to save score once.";

            StaticMethods.debug(message);

            // Saves the error message into a file.
            provider.getWindow().getGame().getErrorHandler()
            .saveError(StaticMethods.getMethodName(this), message);

            /*
             * If the Score Board object is damaged, a new one is created.
             */
            scoreBoard = new ScoreBoard(provider.getGame().getModel());

            /*
             * Attempts to save the new instance. If that fails too,
             * saving is considered unsuccessful.
             */
            if(!FileManipulator.writeObj(FileSystemValues.SCORE_FILE.getValue(), scoreBoard)) {
                message = "Failed to save score twice.";

                StaticMethods.debug(message);

                // Saves the error message into a file.
                provider.getWindow().getGame().getErrorHandler()
                .saveError(StaticMethods.getMethodName(this), message);

                status = false;
            }
        }

        if(!FileManipulator.writeObj(FileSystemValues.META_FILE.getValue(), meta)) {
            message = "Failed to save meta.";

            StaticMethods.debug(message);

            // Saves the error message into a file.
            provider.getWindow().getGame().getErrorHandler()
            .saveError(StaticMethods.getMethodName(this), message);

            status = false;
        }

        return status;
    }

    /**
     * Calls all configuration-saving methods.
     */
    public boolean saveAll() {
        StaticMethods.printMethodName(this);

        boolean status = true;

        if(!saveObjects() || !saveConfig()) {
            StaticMethods.debug("saveAll() failed.");
            status = false;
        }

        return status;
    }

    /**
     * A hot-fix method that displays restart requirement notification
     * if the application language is changed during the configuration
     * reset process.
     */
    private void displayRestartNotification() {
        Configurator config = provider.getGame().getConfigProvider().getConfig();

        String key, value;

        key = Configurator.Keys.LANGUAGE.toString();
        value = config.getDefaultValues().get(key);
        int defLang = Integer.parseInt(value);

        value = config.getProperties().getProperty(key);
        int currentLang = Integer.parseInt(value);

        if(defLang != currentLang) {
            CustomDialogs.showRestartNotification(provider.getWindow());
        }
    }

    /**
     * Resets the configuration, if confirmed.
     */
    public void resetConfiguration() {
        StaticMethods.printMethodName(this);

        Configurator config = provider.getGame().getConfigProvider().getConfig();

        displayRestartNotification();

        config.setDefaultConfig();
        provider.getGame().getModel().getMeta().setDefaultConfigValues();

        /*
         * Objects will be saved when the application exits.
         * Only saving configuration properties now.
         */
        performSaving();

        provider.getWindow().toggleUI();

        /*
         * Needed to properly repaint cells' backgrounds.
         */
        provider.getWindow().invalidate();
        provider.getWindow().validate();
        provider.getWindow().repaint();
    }
}
