package io.schupke.lines.actions;

import java.util.Properties;

import javax.swing.ToolTipManager;
import javax.swing.UIManager;
import javax.swing.UIManager.LookAndFeelInfo;

import io.schupke.lines.Lang;
import io.schupke.lines.StaticMethods;
import io.schupke.lines.Values.Debug;
import io.schupke.lines.Values.FileSystemValues;
import io.schupke.lines.config.Configurator;
import io.schupke.lines.gui.BoardPanel;
import io.schupke.lines.gui.dialogs.CustomDialogs;
import io.schupke.lines.gui.dialogs.GuideDialog;
import io.schupke.lines.gui.dialogs.ScoreDialog;
import io.schupke.lines.model.MetadataContainer;
import io.schupke.lines.model.ScoreBoard;

/**
 *
 * Contains all methods that in some way
 * involve window manipulation.
 *
 */
public class WindowActions {
    private ActionProvider provider;

    public WindowActions(ActionProvider provider) {
        this.provider = provider;
    }

    /**
     * Sets all application values into a desired state
     * so that the application can be exited.
     */
    private boolean executeCleanup() {
        StaticMethods.printMethodName(this);

        Configurator config = provider.getWindow().getGame().getConfigProvider().getConfig();
        MetadataContainer meta = provider.getWindow().getGame().getModel().getMeta();

        boolean success = true;

        /*
         * Updates the window dimensions for future.
         */
        config.saveWindowDimensions(
                provider.getWindow().getWidth(),
                provider.getWindow().getHeight(),
                provider.getWindow().getLocation());

        // Saves the configuration.
        if(!provider.getConfigActions().saveAll()) {
            StaticMethods.debug("Cleanup failed.");
            success = false;
        }

        // Debug timer printout.
        if(Debug.TIMERS.getValue()) {
            StaticMethods.debug("Game start time:\t\t" +
                    meta.getGameStartTime());
            StaticMethods.debug("Session Start time:\t\t" +
                    meta.getSessionStartTime());
            StaticMethods.debug("Previous session time:\t" +
                    meta.getPreviousSessionTime());
            StaticMethods.debug("Current session time:\t" +
                    meta.getCurrentSessionTime());
        }

        return success;
    }

    /**
     * Checks that the application state was saved
     * and exits.
     */
    public void invokeExit() {
        StaticMethods.printMethodName(this);

        if(!executeCleanup()) {
            StaticMethods.debug("Invoking exit confirm request.");

            /*
             * If the cleanup (config. saving) is unsuccessful,
             * require confirmation to exit the application.
             */
            String message = String.format(
                    Lang.write("dialog.popup.exit.unsaved_config"),
                    FileSystemValues.FULL_CONFIG_PATH.getValue());

            int i = CustomDialogs.showWarningDialog(
                    provider.getWindow(),
                    message);

            /*
             * Does not exit if the 'no' option is selected.
             */
            if(i != 1) {
                StaticMethods.debug("Exit not confirmed.");
                return;
            }
        }

        System.exit(0);
    }

    /**
     * Tries to set the Nimbus Look and Feel,
     * or defaults to system LaF if Nimbus was not found.
     */
    public void setLAF() {
        StaticMethods.printMethodName(this);

        try {
            for (LookAndFeelInfo info : UIManager.getInstalledLookAndFeels()) {
                if ("Nimbus".equals(info.getName())) {
                    UIManager.setLookAndFeel(info.getClassName());
                    break;
                }
            }
        } catch (Exception e) {
            StaticMethods.debug("Nimbus not found.");
            try {
                UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
            } catch (Exception e2) {
                StaticMethods.debug("System LaF setup failed.");
                StaticMethods.debug(e2.getMessage());

                System.exit(1);
            }
        }
    }

    /**
     * Updates the positions of all dialogs
     * so that they are centered relative
     * to the main window.
     */
    public void updateDialogPositions() {
        provider.getWindow().getConfigDialog().updatePosition();
        provider.getWindow().getScoreDialog().updatePosition();
        provider.getWindow().getAboutDialog().updatePosition();
        provider.getWindow().getGuideDialog().updatePosition();
        provider.getWindow().getGameEndDialog().updatePosition();
    }

    /**
     * Displays a confirmation dialog for the game restart
     * when user attempts to change the size of the game board ({@link BoardPanel}).
     * @return true if the dialog was confirmed, false otherwise
     */
    public boolean showBoardChangePrompt() {
        StaticMethods.printMethodName(this);

        Properties properties = provider.getGame().getConfigProvider().getConfig().getProperties();
        String key = properties.getProperty(Configurator.Keys.DISABLE_CONFIRMS.toString());
        boolean confirmsDisabled = Boolean.parseBoolean(key);

        /*
         * If the confirmation dialogs are disabled,
         * board change is automatically confirmed.
         */
        if(confirmsDisabled) {
            return true;
        }

        boolean confirmed = false;

        /*
         *  Shows confirmation dialog.
         */
        int i = CustomDialogs.showWarningDialog(
                provider.getWindow(),
                Lang.write("dialog.popup.change_board.confirm"));

        /*
         * Confirmation will result in the game restart.
         */
        if (i == 1) {
            StaticMethods.debug("Confirmed.");

            confirmed = true;
        } else {
            StaticMethods.debug("Not confirmed.");

            confirmed = false;
        }

        return confirmed;
    }

    /**
     * Displays a confirmation dialog before
     * allowing the game to be restarted.
     */
    public void showNewGamePrompt() {
        StaticMethods.printMethodName(this);

        Properties properties = provider.getGame().getConfigProvider().getConfig().getProperties();
        String key = properties.getProperty(Configurator.Keys.DISABLE_CONFIRMS.toString());
        boolean confirmsDisabled = Boolean.parseBoolean(key);

        MetadataContainer meta = provider.getGame().getModel().getMeta();

        int i;

        /*
         * Game restart confirmation is only necessary
         * if the game is in progress, meaning that some turns
         * have already been issued by the user.
         * This way, game can be restarted in its initial state
         * without pointless pop-ups.
         */
        if(meta.getFreshStatus() || confirmsDisabled) {
            i = 1;
        } else {
            /*
             * Shows confirmation dialog.
             */
            i = CustomDialogs.showWarningDialog(
                    provider.getWindow(),
                    Lang.write("dialog.popup.new_game.confirm"));

        }

        // Resets if confirmed.
        if (i == 1) {
            StaticMethods.debug("Game restart confirmed.");

            provider.getGameActions().startNewGame();
        }
    }

    /**
     * Displays a confirmation dialog before
     * allowing the {@link ScoreBoard} to be cleared.
     */
    public void showScoreResetPrompt() {
        StaticMethods.printMethodName(this);

        ScoreDialog scoreDialog = provider.getGame().getView().getScoreDialog();
        ScoreBoard scoreBoard = provider.getGame().getModel().getScoreBoard();

        Properties properties = provider.getGame().getConfigProvider().getConfig().getProperties();
        String key = properties.getProperty(Configurator.Keys.DISABLE_CONFIRMS.toString());
        boolean confirmsDisabled = Boolean.parseBoolean(key);

        /*
         * Reset is not relevant if there are no entries.
         */
        if(scoreBoard.isEmpty()) return;

        int i;

        /*
         * Shows confirmation dialog.
         */
        if(confirmsDisabled) {
            i = 1;
        } else {
            i = CustomDialogs.showWarningDialog(
                    provider.getWindow(),
                    Lang.write("dialog.popup.reset_score.confirm"));
        }

        // Resets if confirmed.
        if (i == 1) {
            StaticMethods.debug("Reset confirmed.");

            provider.getGameActions().resetScore();
            scoreDialog.toggleUI();
        }
    }

    /**
     * Displays a confirmation dialog before
     * allowing the configuration to be reset.
     * @see Configurator
     */
    public void showConfigResetPrompt() {
        StaticMethods.printMethodName(this);

        Properties properties = provider.getGame().getConfigProvider().getConfig().getProperties();
        String key = properties.getProperty(Configurator.Keys.DISABLE_CONFIRMS.toString());
        boolean confirmsDisabled = Boolean.parseBoolean(key);

        int i;

        /*
         * Shows confirmation dialog.
         */
        if(confirmsDisabled) {
            i = 1;
        } else {
            i = CustomDialogs.showWarningDialog(
                    provider.getWindow(),
                    Lang.write("dialog.popup.reset_config.confirm"));
        }

        /*
         * Resets if confirmed.
         */
        if(i == 1) {
            StaticMethods.debug("Confirmed.");

            provider.getConfigActions().resetConfiguration();
        }
    }

    /**
     * Changes the visibility state for floating tooltips.
     * @param state tooltips' visibility state
     */
    public void toggleTooltips(boolean state) {
        StaticMethods.printMethodName(this);

        ToolTipManager.sharedInstance().setEnabled(state);
    }

    /**
     * Verifies that the guide file has been loaded
     * and open the dialog, if it's not empty.
     * Shows an error message otherwise.
     */
    public void showGuide() {
        GuideDialog dialog = provider.getWindow().getGuideDialog();

        if(dialog.isAvailable()) {
            dialog.setVisible(true);
        } else {
            CustomDialogs.showErrorDialog(provider.getWindow(),
                    Lang.write("dialog.popup.guide.empty"));
        }
    }
}
