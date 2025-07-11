package io.schupke.lines.gui.dialogs;

import java.awt.Dimension;
import java.awt.FlowLayout;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.awt.event.ItemEvent;
import java.awt.event.ItemListener;
import java.util.Properties;

import javax.swing.BorderFactory;
import javax.swing.JButton;
import javax.swing.JCheckBox;
import javax.swing.JComboBox;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JSpinner;
import javax.swing.SpinnerNumberModel;
import javax.swing.event.ChangeEvent;
import javax.swing.event.ChangeListener;

import io.schupke.lines.Behaviour;
import io.schupke.lines.Lang;
import io.schupke.lines.StaticMethods;
import io.schupke.lines.Values.Borders;
import io.schupke.lines.Values.FileSystemValues;
import io.schupke.lines.Values.GlobalLimits;
import io.schupke.lines.Values.Padding;
import io.schupke.lines.actions.ActionProvider;
import io.schupke.lines.config.Configurator;
import io.schupke.lines.gui.MainView;
import io.schupke.lines.gui.StatusBar;
import io.schupke.lines.model.MetadataContainer;

/**
 *
 * Represents a dialog window that contains user interface
 * for the game configuration.
 *
 */
public class ConfigDialog extends GeneralDialog {
    private static final long serialVersionUID = 1L;

    private final String [] languageOptions = new String [] {
        Lang.write("dialog.config.languages.english"),
        Lang.write("dialog.config.languages.czech")
    };

    private JPanel windowFieldset;
    private JPanel gameFieldset;

    private JLabel languageLabel;
    private JComboBox<String> languageCombo;

    private JCheckBox incomingColorsCheck;
    private JCheckBox incomingPositionsCheck;
    private JCheckBox highlightCheck;
    private JCheckBox tooltipsCheck;
    private JCheckBox confirmsCheck;
    private JCheckBox gradientCheck;

    private JCheckBox timeLimitCheck;
    private SpinnerNumberModel timeLimitModel;
    private JSpinner timeLimitSpinner;

    private JLabel boardSizeLabel;
    private SpinnerNumberModel boardSizeModel;
    private JSpinner boardSizeSpinner;

    private JButton resetButton;

    private JLabel configPathLabel;

    private boolean restartRequired;
    private boolean boardSizeChanged;

    public ConfigDialog(MainView win) {
        super(win, Lang.write("dialog.config.title"));

        restartRequired = false;
        boardSizeChanged = false;

        initFields();
        setDimensions();
        addFields();
        setTooltips();
        setBehaviour();
        assignListeners();
    }

    private void initFields() {
        String label;

        label = Lang.write("dialog.config.window.title");
        windowFieldset = new JPanel();
        windowFieldset.setBorder(BorderFactory.createTitledBorder(label));

        label = Lang.write("dialog.config.game.title");
        gameFieldset = new JPanel();
        gameFieldset.setBorder(BorderFactory.createTitledBorder(label));

        label = Lang.write("dialog.config.language");
        languageLabel = new JLabel(label);

        languageCombo = new JComboBox<String>(languageOptions);

        label = Lang.write("dialog.config.incoming_colors");
        incomingColorsCheck = new JCheckBox(label);

        label = Lang.write("dialog.config.incoming_positions");
        incomingPositionsCheck = new JCheckBox(label);

        label = Lang.write("dialog.config.pathing");
        highlightCheck = new JCheckBox(label);

        label = Lang.write("dialog.config.tooltips");
        tooltipsCheck = new JCheckBox(label);

        label = Lang.write("dialog.config.confirms");
        confirmsCheck = new JCheckBox(label);

        label = Lang.write("dialog.config.gradient");
        gradientCheck = new JCheckBox(label);

        label = Lang.write("dialog.config.time_limit");
        timeLimitCheck = new JCheckBox(label);

        // init, min,  max, step
        timeLimitModel = new SpinnerNumberModel(
                GlobalLimits.DEFAULT_TURN_LENGTH.getValue(),
                GlobalLimits.MINIMUM_TURN_LENGTH.getValue(),
                GlobalLimits.MAXIMUM_TURN_LENGTH.getValue(),
                5);

        timeLimitSpinner = new JSpinner(timeLimitModel);
        timeLimitSpinner.setEditor(new JSpinner.NumberEditor(timeLimitSpinner));

        label = Lang.write("dialog.config.board_size_label");
        boardSizeLabel = new JLabel(label);

        // init, min,  max, step
        boardSizeModel = new SpinnerNumberModel(
                GlobalLimits.DEFAULT_BOARD_SIZE.getValue(),
                GlobalLimits.MINIMUM_BOARD_SIZE.getValue(),
                GlobalLimits.MAXIMUM_BOARD_SIZE.getValue(),
                1);

        boardSizeSpinner = new JSpinner(boardSizeModel);
        boardSizeSpinner.setEditor(new JSpinner.NumberEditor(boardSizeSpinner));

        label = Lang.write("dialog.config.reset_button");
        resetButton = new JButton(label, win.getImageProvider().getRemoveIcon());

        label = "<html><b>" +
                Lang.write("dialog.config.conf.folder") +
                "</b><br>";
        String value =
                FileSystemValues.FULL_CONFIG_PATH.getValue() +
                System.getProperty("file.separator");

        configPathLabel = new JLabel(label + value);
    }

    private void setTooltips() {
        StatusBar sb = win.getStatusBar();
        String label;

        label = Lang.write("dialog.config.language.tooltip");
        Behaviour.setTooltip(languageLabel, label, sb);
        Behaviour.setTooltip(languageCombo, label, sb);

        label = Lang.write("dialog.config.incoming_colors.tooltip");
        Behaviour.setTooltip(incomingColorsCheck, label, sb);

        label = Lang.write("dialog.config.incoming_positions.tooltip");
        Behaviour.setTooltip(incomingPositionsCheck, label, sb);

        label = Lang.write("dialog.config.pathing.tooltip");
        Behaviour.setTooltip(highlightCheck, label, sb);

        label = Lang.write("dialog.config.tooltips.tooltip");
        Behaviour.setTooltip(tooltipsCheck, label, sb);

        label = Lang.write("dialog.config.confirms.tooltip");
        Behaviour.setTooltip(confirmsCheck, label, sb);

        label = Lang.write("dialog.config.gradient.tooltip");
        Behaviour.setTooltip(gradientCheck, label, sb);

        label = Lang.write("dialog.config.time_limit.tooltip");
        Behaviour.setTooltip(timeLimitCheck, label, sb);

        Behaviour.setTooltip(
                ((JSpinner.DefaultEditor)timeLimitSpinner.getEditor()).getTextField(),
                label,
                sb);

        label = Lang.write("dialog.config.board_size_label.tooltip");
        Behaviour.setTooltip(boardSizeLabel, label, sb);

        Behaviour.setTooltip(
                ((JSpinner.DefaultEditor)boardSizeSpinner.getEditor()).getTextField(),
                label,
                sb);

        label = Lang.write("dialog.config.reset_button.tooltip");
        Behaviour.setTooltip(resetButton, label, sb);

        label = Lang.write("dialog.conf.folder.tooltip");

        Behaviour.setTooltip(configPathLabel, label, sb);
    }

    private void setDimensions() {
        final int itemHeight = 25;

        setSize(310, 465);

        windowFieldset.setPreferredSize(new Dimension(300, 140));
        gameFieldset.setPreferredSize(new Dimension(300, 170));

        configPathLabel.setPreferredSize(new Dimension(300, 40));
        languageLabel.setPreferredSize(new Dimension(150, itemHeight));
        languageCombo.setPreferredSize(new Dimension(120, itemHeight));
        incomingColorsCheck.setPreferredSize(new Dimension(270, itemHeight));
        incomingPositionsCheck.setPreferredSize(new Dimension(270, itemHeight));
        highlightCheck.setPreferredSize(new Dimension(270, itemHeight));
        tooltipsCheck.setPreferredSize(new Dimension(270, itemHeight));
        confirmsCheck.setPreferredSize(new Dimension(270, itemHeight));
        gradientCheck.setPreferredSize(new Dimension(270, itemHeight));
        timeLimitCheck.setPreferredSize(new Dimension(200, itemHeight));
        timeLimitSpinner.setPreferredSize(new Dimension(70, itemHeight));
        boardSizeLabel.setPreferredSize(new Dimension(200, itemHeight));
        boardSizeSpinner.setPreferredSize(new Dimension(70, itemHeight));

        resetButton.setPreferredSize(new Dimension(300, itemHeight));

        resetButton.setBorder(Borders.SIDE_PADDING.getValue());
    }

    private void addFields() {
        mainPanel.add(windowFieldset);
        mainPanel.add(gameFieldset);
        mainPanel.add(resetButton);
        mainPanel.add(configPathLabel);

        windowFieldset.setLayout(new FlowLayout(FlowLayout.LEFT,
                Padding.FIELDSET_H_PADDING.getValue(),
                Padding.FIELDSET_V_PADDING.getValue()));

        gameFieldset.setLayout(new FlowLayout(FlowLayout.LEFT,
                Padding.FIELDSET_H_PADDING.getValue(),
                Padding.FIELDSET_V_PADDING.getValue()));

        windowFieldset.add(languageLabel);
        windowFieldset.add(languageCombo);
        windowFieldset.add(gradientCheck);
        windowFieldset.add(tooltipsCheck);
        windowFieldset.add(confirmsCheck);

        gameFieldset.add(incomingColorsCheck);
        gameFieldset.add(incomingPositionsCheck);
        gameFieldset.add(highlightCheck);
        gameFieldset.add(timeLimitCheck);
        gameFieldset.add(timeLimitSpinner);
        gameFieldset.add(boardSizeLabel);
        gameFieldset.add(boardSizeSpinner);
    }

    private void setBehaviour() {
        Behaviour.setCombo(languageCombo);

        Behaviour.setSpinner(timeLimitSpinner);
        Behaviour.setSpinner(boardSizeSpinner);
    }

    /**
     * Toggles the time limit spinner when the time limit
     * check box is clicked.
     */
    private void setAvailability() {
        timeLimitSpinner.setEnabled(timeLimitCheck.isSelected());
    }

    @Override
    protected void assignListeners() {
        final ActionProvider actionProvider = win.getGame().getActionProvider();

        timeLimitCheck.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                setAvailability();
            }
        });

        /*
         * Language changes require application restart
         * in order to reassign all string values.
         */
        languageCombo.addItemListener(new ItemListener() {
            @Override
            public void itemStateChanged(ItemEvent e) {
                setRestartRequired(true);
            }
        });

        boardSizeSpinner.addChangeListener(new ChangeListener() {
            @Override
            public void stateChanged(ChangeEvent e) {
                StaticMethods.debug("Board changed.");

                // Spinner value.
                Integer value = (Integer) boardSizeSpinner.getValue();

                // Actual board size value.
                int size = win.getGame().getModel().getBoard().getSize();

                /*
                 * Whenever the spinner value changes into something
                 * different, this boolean is tagged.
                 * Whenever it returns back to the current size value,
                 * the flag is removed to prevent unnecessary
                 * pop-up warnings if the user returns the spinner
                 * into its former state.
                 */
                if(value != size) {
                    boardSizeChanged = true;
                } else {
                    boardSizeChanged = false;
                }
            }
        });

        okButton.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                actionProvider.getConfigActions().applySettings();
            }
        });

        resetButton.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                actionProvider.getWindowActions().showConfigResetPrompt();
            }
        });
    }

    @Override
    public void toggleUI() {
        super.toggleUI();

        Properties properties = win.getGame().getConfigProvider().getConfig().getProperties();
        MetadataContainer meta = win.getGame().getModel().getMeta();
        String value;
        boolean state;
        int numberValue;

        value = properties.getProperty(Configurator.Keys.LANGUAGE.toString());
        numberValue = Integer.parseInt(value);
        languageCombo.setSelectedIndex(numberValue);

        state = meta.getIncomingColorsFlag();
        incomingColorsCheck.setSelected(state);

        state = meta.getIncomingPositionsFlag();
        incomingPositionsCheck.setSelected(state);

        state = meta.isHighlightEnabled();
        highlightCheck.setSelected(state);

        value = properties.getProperty(Configurator.Keys.TOOLTIPS.toString());
        state = Boolean.parseBoolean(value);
        tooltipsCheck.setSelected(state);

        value = properties.getProperty(Configurator.Keys.DISABLE_CONFIRMS.toString());
        state = Boolean.parseBoolean(value);
        confirmsCheck.setSelected(state);

        value = properties.getProperty(Configurator.Keys.PAINT_GRADIENT.toString());
        state = Boolean.parseBoolean(value);
        gradientCheck.setSelected(state);

        state = meta.isTurnTimeEnabled();
        timeLimitCheck.setSelected(state);

        int time = meta.getTurnTimeLimit();
        timeLimitSpinner.setValue(time);

        numberValue = win.getGame().getModel().getBoard().getSize();
        boardSizeSpinner.setValue(numberValue);

        setAvailability();

        restartRequired = false;
    }

    public JComboBox<String> getLanguageCombo() { return languageCombo; }
    public JCheckBox getIncomingColorsCheck() { return incomingColorsCheck; }
    public JCheckBox getIncomingPositionsCheck() { return incomingPositionsCheck; }
    public JCheckBox getHighlightCheck() { return highlightCheck; }
    public JCheckBox getTooltipsCheck() { return tooltipsCheck; }
    public JCheckBox getConfirmsCheck() { return confirmsCheck; }
    public JCheckBox getGradientCheck() { return gradientCheck; }
    public JCheckBox getTimeLimitCheck() { return timeLimitCheck; }
    public JSpinner getTimeLimitSpinner() { return timeLimitSpinner; }
    public JSpinner getBoardSizeSpinner() { return boardSizeSpinner; }
    public JButton getResetButton() { return resetButton; }

    public boolean isRestartRequired() { return restartRequired; }
    public boolean hasBoardSizeChanged() { return boardSizeChanged; }

    public void setRestartRequired(boolean state) {
        restartRequired = state;
    }

    public void setBoardSizeChanged(boolean state) {
        boardSizeChanged = state;
    }
}
