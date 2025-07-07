package eu.janschupke.lines.gui.dialogs;

import java.awt.BorderLayout;
import java.awt.Dimension;
import java.awt.FlowLayout;
import java.awt.Frame;
import java.awt.event.ActionEvent;

import javax.swing.AbstractAction;
import javax.swing.Action;
import javax.swing.JButton;
import javax.swing.JComponent;
import javax.swing.JDialog;
import javax.swing.JPanel;
import javax.swing.JRootPane;
import javax.swing.SwingUtilities;

import eu.janschupke.lines.Behaviour;
import eu.janschupke.lines.Lang;
import eu.janschupke.lines.Values.Borders;
import eu.janschupke.lines.Values.Hotkeys;
import eu.janschupke.lines.Values.Padding;
import eu.janschupke.lines.gui.MainView;
import eu.janschupke.lines.gui.StatusBar;

/**
 *
 * Represents a general abstract dialog class
 * from which all other dialogs used in the project derive.
 *
 */
public abstract class GeneralDialog extends JDialog {
    private static final long serialVersionUID = 1L;

    protected MainView win;

    /**
     * All other dialog subclasses should put
     * their GUI fields into this panel.
     */
    protected JPanel mainPanel;

    /**
     * A panel that contains control buttons
     * and is positioned at the bottom
     * of the dialog.
     */
    protected JPanel buttonPanel;

    protected JButton cancelButton, okButton;

    protected int SIZE_X;
    protected int SIZE_Y;

    public GeneralDialog(Frame owner, String title) {
        super(owner, title, true);

        this.win = (MainView)owner;

        SIZE_X = 350;
        SIZE_Y = 475;

        setWindow();
        initFields();
        setDimensions();
        setTooltips();
        addFields();
        assignHotkeys();
        setIcons();
    }

    /**
     * main dialog setup.
     */
    private void setWindow() {
        setDefaultCloseOperation(JDialog.HIDE_ON_CLOSE);
        this.getContentPane().setLayout(new BorderLayout(
                Padding.DEFAULT_PADDING.getValue(),
                Padding.LITTLE_PADDING.getValue()));

        setIconImage(win.getImageProvider().getMainIcon().getImage());
        this.setSize(SIZE_X, SIZE_Y);
        this.setResizable(false);
    }

    /**
     * Positioning of fields inside the dialog.
     */
    private void setDimensions() {
        cancelButton.setPreferredSize(new Dimension(100, 25));
        okButton.setPreferredSize(new Dimension(100, 25));
    }

    /**
     * Sets the tooltips for all the fields.
     */
    private void setTooltips() {
        StatusBar statusBar = win.getStatusBar();
        String label;

        label = Lang.write("dialog.button.cancel.tooltip");
        Behaviour.setTooltip(cancelButton, label, statusBar);

        label = Lang.write("dialog.button.ok.tooltip");
        Behaviour.setTooltip(okButton, label, statusBar);
    }

    /**
     * Initializes fields.
     */
    private void initFields() {
        mainPanel = new JPanel();
        buttonPanel = new JPanel();
        buttonPanel.setBorder(Borders.VERTICAL_PADDING.getValue());

        /*
         * Bottom buttons.
         */
        cancelButton = new JButton();
        okButton = new JButton(Lang.write("dialog.button.ok"));
    }

    /**
     * Sets icons for components. Done separately to ensure compatibility
     * with the hotkey assignment procedure that replaces the component's value.
     */
    private void setIcons() {
        cancelButton.setIcon(win.getImageProvider().getCancelIcon());
        okButton.setIcon(win.getImageProvider().getOKIcon());
    }

    /*
     * Adds fields to the dialog
     */
    private void addFields() {
        /*
         * main content pane populating
         */
        add(mainPanel, BorderLayout.CENTER);
        add(buttonPanel, BorderLayout.SOUTH);

        /*
         * main panel populating
         */
        mainPanel.setLayout(new FlowLayout(FlowLayout.LEFT,
                Padding.DIALOG_H_PADDING.getValue(),
                Padding.DIALOG_V_PADDING.getValue()));

        /*
         * button panel populating
         */
        buttonPanel.setLayout(new FlowLayout(FlowLayout.RIGHT,
                Padding.LITTLE_PADDING.getValue(),
                Padding.LITTLE_PADDING.getValue()));
        buttonPanel.add(cancelButton);
        buttonPanel.add(okButton);
    }

    /**
     * Assigns fields' hotkeys.
     */
    private void assignHotkeys() {
        int focused = JComponent.WHEN_IN_FOCUSED_WINDOW;

        assignHideHotkey(focused);

        // Sets the enter hotkey.
        JRootPane rootPane = SwingUtilities.getRootPane(okButton);
        rootPane.setDefaultButton(okButton);
    }

    /**
     * Assigns a hotkey that hides the dialog.
     * Same action as the cancel button.
     */
    private void assignHideHotkey(int focused) {
        Action action = new AbstractAction(Lang.write("dialog.button.cancel")) {
            private static final long serialVersionUID = 1L;
            {
                putValue(Action.ACTION_COMMAND_KEY, getValue(Action.NAME));
            }
            @Override
            public void actionPerformed(ActionEvent e) {
                // Resets the values according to configuration values.
                toggleUI();

                // Hides the dialog.
                setVisible(false);
            }
        };

        cancelButton.setAction(action);

        cancelButton.getInputMap(focused).put(Hotkeys.HIDE_DIALOG.getValue(), "HIDE_DIALOG");
        cancelButton.getActionMap().put("HIDE_DIALOG", cancelButton.getAction());
    }

    protected abstract void assignListeners();

    /**
     * By default, toggling the dialog's UI only positions
     * it to the center of the main window. Derived classes
     * should override this.
     */
    public void toggleUI() {
        updatePosition();
    }

    /**
     * Dialog position.
     */
    public void updatePosition() {
        setLocationRelativeTo(win);
    }

}
