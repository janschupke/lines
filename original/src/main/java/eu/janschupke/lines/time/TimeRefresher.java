package eu.janschupke.lines.time;

import java.util.TimerTask;

import javax.swing.JLabel;

import eu.janschupke.lines.StaticMethods;
import eu.janschupke.lines.Values.Debug;
import eu.janschupke.lines.actions.GameActions;
import eu.janschupke.lines.gui.MainView;
import eu.janschupke.lines.model.MetadataContainer;

/**
 *
 * The main task that updates time values
 * and starts new turns, if turn time limit
 * feature is enabled.
 * @see MetadataContainer
 *
 */
public class TimeRefresher extends TimerTask {
    private MainView win;

    private MetadataContainer meta;
    private GameActions actions;
    private JLabel timeLabel;

    public TimeRefresher(MainView win) {
        this.win = win;
    }

    /**
     * Called twice a second.
     */
    public void run() {
        meta = win.getGame().getModel().getMeta();
        actions = win.getGame().getActionProvider().getGameActions();
        timeLabel = win.getStatusBar().getTimeLabel();

        long start = meta.getSessionStartTime();
        long now = System.currentTimeMillis();
        long elapsed = now - start;

        /*
         * Total elapsed time is calculated by adding
         * previous session time to the currently elapsed time.
         */
        meta.setCurrentSessionTime(elapsed);

        long totalTime = meta.getTotalGameTime();

        String gameTime = StaticMethods.parseTime(totalTime);

        /*
         * Turn time can be retrieved directly from Meta.
         */
        long turnTimeNumber = meta.getTurnTime();
        String turnTime = StaticMethods.parseTime(turnTimeNumber);

        // Both times are shown in the Status Bar.
        timeLabel.setText(turnTime + " / " + gameTime);

        /*
         * If turn time limit is enabled, current turn time
         * is compared to the limit.
         */
        if(meta.isTurnTimeEnabled()) {
            /*
             * Limit value is represented in seconds; needs to be multiplied.
             */
            if(turnTimeNumber >= meta.getTurnTimeLimit() * 1000) {
                actions.startNewTurn(true);
            }
        }

        if(Debug.TIMERS.getValue()) {
            StaticMethods.debug("Previous session time:\t" + meta.getPreviousSessionTime());
            StaticMethods.debug("Current session time:\t" + meta.getCurrentSessionTime());
        }
    }
}
