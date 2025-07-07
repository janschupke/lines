package eu.janschupke.lines.gui;

import java.awt.BorderLayout;
import java.awt.Cursor;
import java.awt.Dimension;
import java.awt.FlowLayout;
import java.awt.Graphics;
import java.awt.event.FocusAdapter;
import java.awt.event.FocusEvent;
import java.awt.event.KeyAdapter;
import java.awt.event.KeyEvent;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;

import javax.swing.BorderFactory;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JTextField;
import javax.swing.SwingConstants;

import eu.janschupke.lines.Behaviour;
import eu.janschupke.lines.Lang;
import eu.janschupke.lines.StaticMethods;
import eu.janschupke.lines.Values.BorderWidths;
import eu.janschupke.lines.Values.Borders;
import eu.janschupke.lines.Values.Colors;
import eu.janschupke.lines.Values.Fonts;
import eu.janschupke.lines.Values.GlobalLimits;
import eu.janschupke.lines.model.Balls;
import eu.janschupke.lines.model.Cell;
import eu.janschupke.lines.model.MetadataContainer;

/**
 *
 * Represents an Info Panel positioned on the top
 * of the game window. Contains information
 * about the currently ongoing game.
 *
 */
public class InfoPanel extends GradientComponent {
    private static final long serialVersionUID = 1L;

    private MainView win;

    /**
     * Displays a user name.
     */
    private JLabel userNameLabel;

    /**
     * Displayed when the userNameLabel is clicked.
     * Allows for user name editing.
     */
    private JTextField userNameField;

    /**
     * Displays balls that will be spawned
     * onto the board at the start
     * of the next turn.
     */
    private JPanel incomingBallsPanel;
    private JLabel scoreLabel;

    /**
     * An array of cell panel that holds balls
     * for the incomingBallsPanel.
     * @see CellPanel
     * @see Cell
     * @see Balls
     */
    private CellPanel [] incomingBalls;

    public InfoPanel(MainView win) {
        this.win = win;

        this.setBorder(BorderFactory.createMatteBorder(
                0, 0, BorderWidths.DEFAULT_PANEL.getValue(), 0,
                Colors.BORDER_DEFAULT.getValue()));

        initFields();
        setDimensions();
        addFields();
        setTooltips();
        assignListeners();
    }

    public void toggleUI() {
        MetadataContainer meta = win.getGame().getModel().getMeta();
        String title;

        for(int i = 0; i < incomingBalls.length; i++) {
            incomingBalls[i].setBall(true);
        }

        /*
         * Both the field and the label must contain
         * the same value.
         */
        title = meta.getUsername();
        userNameLabel.setText(title);
        userNameField.setText(title);

        title = meta.getCurrentScore().toString();
        scoreLabel.setText(title);

        boolean showColors = meta.getIncomingColorsFlag();

        /*
         * This feature can be disabled in the configuration.
         * Testing status.
         */
        if(showColors) {
            incomingBallsPanel.setVisible(true);
        } else {
            incomingBallsPanel.setVisible(false);
        }

        invalidate();
        validate();
        repaint();
    }

    /**
     * Renders the gradient background transition
     * for the panel.
     * @see GradientComponent
     */
    @Override
    protected void paintComponent(Graphics g) {
        StaticMethods.setGradient(this, g);
    }

    private void initFields() {
        userNameLabel = new JLabel();
        userNameLabel.setBorder(Borders.LEFT_PADDING.getValue());
        userNameLabel.setFont(Fonts.INFOPANEL_TEXT.getValue());
        userNameLabel.setCursor(Cursor.getPredefinedCursor(Cursor.TEXT_CURSOR));

        userNameField = new JTextField();
        userNameField.setFont(Fonts.INFOPANEL_TEXT.getValue());

        incomingBallsPanel = new JPanel();
        incomingBallsPanel.setOpaque(false);

        scoreLabel = new JLabel();
        scoreLabel.setBorder(Borders.RIGHT_PADDING.getValue());
        scoreLabel.setFont(Fonts.INFOPANEL_TEXT.getValue());
        scoreLabel.setHorizontalAlignment(SwingConstants.RIGHT);

        incomingBalls = new CellPanel[GlobalLimits.BALLS_PER_TURN.getValue()];

        /*
         * Initiates cell panels that indicate incoming colors.
         */
        for(int i = 0; i < incomingBalls.length; i++) {
            incomingBalls[i] = new CellPanel(win.getBoardPanel(),
                    win.getGame().getModel().getMeta().getIncomingBalls()[i], CellPanel.Styles.DIMINISHED);

            /*
             * Default Cell Panel appearance features border.
             * This in not wanted here.
             */
            incomingBalls[i].setBorder(null);

            /*
             * Cell Panels in the Info Panel should also
             * have transparent background.
             */
            incomingBalls[i].setOpaque(false);
        }

        toggleUI();
    }

    private void setTooltips() {
        StatusBar sb = win.getStatusBar();
        String label;

        label = Lang.write("gui.board.info.username.tooltip");
        Behaviour.setTooltip(userNameLabel, label, sb);

        label = Lang.write("gui.board.info.score.tooltip");
        Behaviour.setTooltip(scoreLabel, label, sb);

        label = Lang.write("gui.board.info.balls.tooltip");
        for(int i = 0; i < incomingBalls.length; i++) {
            Behaviour.setTooltip(incomingBalls[i], label, sb);
        }
    }

    private void setDimensions() {
        final int sideFieldWidth = 160;
        final int height = 35;

        userNameLabel.setPreferredSize(new Dimension(sideFieldWidth, height));
        userNameField.setPreferredSize(new Dimension(sideFieldWidth, height));
        scoreLabel.setPreferredSize(new Dimension(sideFieldWidth, height));
    }

    private void addFields() {
        setLayout(new BorderLayout(0, 0));

        add(userNameLabel, BorderLayout.WEST);
        add(incomingBallsPanel, BorderLayout.CENTER);
        add(scoreLabel, BorderLayout.EAST);

        incomingBallsPanel.setLayout(new FlowLayout(FlowLayout.CENTER, 0, 0));
        for(int i = 0; i < incomingBalls.length; i++) {
            incomingBallsPanel.add(incomingBalls[i]);
        }
    }

    /**
     * This is triggered when the userNameLabel is clicked.
     * It removes the label and shows the fieldset
     * in order to allow the user to change their name.
     */
    private void triggerNameChange() {
        StaticMethods.printMethodName(this);

        remove(userNameLabel);
        add(userNameField, BorderLayout.WEST);
        userNameField.requestFocus();

        toggleUI();
    }

    /**
     * When the name change has to be confirmed,
     * it is saved into the Meta Container
     * and the label is displayed again instead
     * of the text field.
     * @see MetadataContainer
     */
    private void confirmNameChange() {
        StaticMethods.printMethodName(this);

        win.getGame().getModel().getMeta().setUsername(userNameField.getText());

        remove(userNameField);
        add(userNameLabel, BorderLayout.WEST);

        toggleUI();
    }

    /**
     * Hides the text field and shows back the label
     * without saving any changes to the user name
     * configuration variable.
     */
    private void rollbackNameChange() {
        StaticMethods.printMethodName(this);

        userNameField.setText(userNameLabel.getText());

        remove(userNameField);
        add(userNameLabel, BorderLayout.WEST);

        toggleUI();
    }

    private void assignListeners() {
        userNameLabel.addMouseListener(new MouseAdapter() {
            @Override
            public void mouseClicked(MouseEvent e) {
                StaticMethods.debug("User Name label - clicked.");
                triggerNameChange();
            }
        });

        userNameField.addKeyListener(new KeyAdapter() {
            @Override
            public void keyReleased(KeyEvent e) {
                if((e.getKeyCode() == KeyEvent.VK_ENTER)) {
                    StaticMethods.debug("User Name field - enter pressed.");

                    confirmNameChange();

                    // The frame listens for keys as well, should get the focus back.
                    win.requestFocus();
                }

                if((e.getKeyCode() == KeyEvent.VK_ESCAPE)) {
                    StaticMethods.debug("User Name field - escape pressed.");

                    rollbackNameChange();

                    // The frame listens for keys as well, should get the focus back.
                    win.requestFocus();
                }
            }
        });

        userNameField.addFocusListener(new FocusAdapter() {
            @Override
            public void focusLost(FocusEvent e) {
                StaticMethods.debug("User Name field - focus lost.");
                confirmNameChange();

                // The frame listens for keys as well, should get the focus back.
                win.requestFocus();
            }
        });
    }

    public CellPanel [] getIncomingBalls() { return incomingBalls; }
    public MainView getWindow() { return win; }
}
