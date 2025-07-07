package eu.janschupke.lines.gui.dialogs;

import java.awt.Dimension;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;

import javax.swing.AbstractAction;
import javax.swing.Action;
import javax.swing.JButton;
import javax.swing.JComponent;
import javax.swing.JScrollPane;
import javax.swing.JTable;
import javax.swing.table.AbstractTableModel;

import eu.janschupke.lines.Behaviour;
import eu.janschupke.lines.Lang;
import eu.janschupke.lines.Values.Hotkeys;
import eu.janschupke.lines.actions.ActionProvider;
import eu.janschupke.lines.gui.MainView;
import eu.janschupke.lines.gui.StatusBar;
import eu.janschupke.lines.model.ScoreBoard;

/**
 *
 * Represents a dialog that shows the Score Board.
 *
 */
public class ScoreDialog extends GeneralDialog {
    private static final long serialVersionUID = 1L;

    private JTable scoreTable;
    private JScrollPane tableScroller;

    private JButton resetScoreButton;

    public ScoreDialog(MainView win) {
        super(win, Lang.write("dialog.score.title"));

        initFields();
        setDimensions();
        addFields();
        setTooltips();
        assignListeners();
        assignHideHotkey();
        setIcons();
    }

    private void initFields() {
        final ScoreBoard scoreBoard = win.getGame().getModel().getScoreBoard();
        String label;

        scoreTable = new JTable(scoreBoard.getData(), scoreBoard.getCaptions());
        scoreTable.setModel(scoreBoard.getModel());
        scoreTable.getTableHeader().setReorderingAllowed(false);
        scoreTable.setRowSelectionAllowed(false);
        scoreTable.setFillsViewportHeight(true);

        scoreTable.getColumnModel().getColumn(0).setPreferredWidth(20);
        scoreTable.getColumnModel().getColumn(2).setPreferredWidth(20);
        scoreTable.getColumnModel().getColumn(3).setPreferredWidth(20);
        scoreTable.getColumnModel().getColumn(4).setPreferredWidth(20);

        tableScroller = new JScrollPane(scoreTable);

        label = Lang.write("dialog.score.reset_button");
        resetScoreButton = new JButton(label, win.getImageProvider().getRemoveIcon());
    }

    private void setDimensions() {
        setSize(670, 300);

        tableScroller.setPreferredSize(new Dimension(660, 190));
        resetScoreButton.setPreferredSize(new Dimension(200, 25));

    }

    private void addFields() {
        mainPanel.add(tableScroller);
        mainPanel.add(resetScoreButton);

        buttonPanel.remove(cancelButton);
    }

    private void setTooltips() {
        StatusBar sb = win.getStatusBar();
        String label;

        label = Lang.write("dialog.score.reset_button.tooltip");
        Behaviour.setTooltip(resetScoreButton, label, sb);
    }

    /**
     * Assigns a hotkey that hides the dialog.
     * Same action as the cancel button.
     */
    private void assignHideHotkey() {
        int focused = JComponent.WHEN_IN_FOCUSED_WINDOW;

        Action action = new AbstractAction(Lang.write("dialog.button.ok")) {
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

        okButton.setAction(action);

        okButton.getInputMap(focused).put(Hotkeys.HIDE_DIALOG.getValue(), "HIDE_DIALOG");
        okButton.getActionMap().put("HIDE_DIALOG", okButton.getAction());
    }

    /**
     * Sets icons for components. Done separately to ensure compatibility
     * with the hotkey assignment procedure that replaces the component's value.
     */
    private void setIcons() {
        okButton.setIcon(win.getImageProvider().getOKIcon());
    }

    @Override
    protected void assignListeners() {
        final ActionProvider actionProvider = win.getGame().getActionProvider();

        resetScoreButton.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                actionProvider.getWindowActions().showScoreResetPrompt();
            }
        });
    }

    @Override
    public void toggleUI() {
        super.toggleUI();

        AbstractTableModel dm = (AbstractTableModel)scoreTable.getModel();
        dm.fireTableDataChanged();

    }
}
