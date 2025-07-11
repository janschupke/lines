package io.schupke.lines.gui.dialogs;

import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;

import javax.swing.Icon;
import javax.swing.JButton;
import javax.swing.JDialog;
import javax.swing.JOptionPane;
import javax.swing.JRootPane;
import javax.swing.SwingUtilities;

import io.schupke.lines.Lang;
import io.schupke.lines.Values.ApplicationValues;
import io.schupke.lines.gui.MainView;


/**
 *
 * Contains static methods for creating custom PopUp dialogs.
 *
 */
public class CustomDialogs {
    /**
     * Creates the basis for the custom option pane.
     */
    private static JOptionPane createCustomOptionPane(
            MainView win,
            String message,
            Icon icon) {

        JOptionPane optionPane = new JOptionPane();

        /*
         *  Sets the dialog.
         */
        optionPane.setMessage("<html>" + message);
        optionPane.setMessageType(JOptionPane.INFORMATION_MESSAGE);
        optionPane.setIcon(icon);

        return optionPane;
    }

    /**
     * Creates a dialog out of the provided OptionPane and an array of JButtons.
     */
    private static int createCustomDialog(
            final MainView win,
            final JOptionPane optionPane,
            final JButton [] options,
            int defaultOptionIndex) {

        /*
         *  Assigns listeners to the buttons.
         */
        for(final JButton option : options) {
            ActionListener actionListener = new ActionListener() {
                @Override
                public void actionPerformed(ActionEvent actionEvent) {
                    /*
                     *  Returns the index of the selected option.
                     */
                    for(int i = 0; i < options.length; i++) {
                        if(options[i] == option) {
                            optionPane.setValue(i);
                        }
                    }
                }
            };

            option.addActionListener(actionListener);
        }

        // Adds the buttons.
        optionPane.setOptions(options);

        /*
         *  Creates the dialog.
         */
        JDialog dialog = optionPane.createDialog(
                optionPane.getParent(),
                ApplicationValues.NAME.getValue());

        /*
         *  Sets the default 'enter' response.
         */
        JRootPane rootPane = SwingUtilities.getRootPane(options[defaultOptionIndex]);
        rootPane.setDefaultButton(options[defaultOptionIndex]);

        dialog.setLocationRelativeTo(win);
        dialog.setVisible(true);

        if(optionPane.getValue() == null) {
            return -1;
        } else {
            return ((Integer)optionPane.getValue()).intValue();
        }

    }

    /**
     * Shows a customized error dialog.
     */
    public static void showErrorDialog(MainView win, String message) {
        JButton[] options = {
                new JButton(Lang.write("dialog.button.close"), win.getImageProvider().getCancelIcon())
        };

        JOptionPane optionPane = createCustomOptionPane(win,
                message,
                win.getImageProvider().getDialogErrorIcon());

        createCustomDialog(win, optionPane, options, 0);
    }

    /**
     * Shows a customized warning/confirm dialog.
     */
    public static int showWarningDialog(MainView win, String message) {
        JButton [] options = {
                new JButton(Lang.write("dialog.button.no"),
                        win.getImageProvider().getCancelIcon()),
                new JButton(Lang.write("dialog.button.yes"),
                        win.getImageProvider().getOKIcon())
        };

        JOptionPane optionPane = createCustomOptionPane(win,
                message,
                win.getImageProvider().getDialogWarningIcon());

        return createCustomDialog(win, optionPane, options, 0);
    }

    /**
     * Shows a customizes question dialog with 'Yes' and 'No' options.
     */
    public static int showYesNoDialog(MainView win, String message) {
        JButton [] options = {
                new JButton(Lang.write("dialog.button.no"),
                        win.getImageProvider().getCancelIcon()),
                new JButton(Lang.write("dialog.button.yes"),
                        win.getImageProvider().getOKIcon())
        };

        return showQuestionDialog(
                win,
                message,
                options, 0);
    }

    /**
     * Shows a dialog that notifies the user that the application restart is required.
     */
    public static void showRestartNotification(MainView win) {
        JButton[] options = {
                new JButton(Lang.write("dialog.button.ok"), win.getImageProvider().getOKIcon())
        };

        // The message and icon are predefined.
        JOptionPane optionPane = createCustomOptionPane(win,
                Lang.write("dialog.popup.restart_required.text"),
                win.getImageProvider().getDialogIcon());

        createCustomDialog(win, optionPane, options, 0);
    }

    /**
     * Shows a customized question dialog with custom amount of options.
     */
    public static int showQuestionDialog(
            MainView win,
            String message,
            JButton [] options,
            int defaultOptionIndex) {

        JOptionPane optionPane = createCustomOptionPane(
                win,
                message,
                win.getImageProvider().getDialogIcon());

        return createCustomDialog(win, optionPane, options, defaultOptionIndex);
    }
}