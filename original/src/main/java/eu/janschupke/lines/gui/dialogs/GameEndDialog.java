package eu.janschupke.lines.gui.dialogs;

import java.awt.Dimension;
import java.awt.FlowLayout;
import java.awt.Graphics;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;

import javax.swing.BorderFactory;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JTextField;
import javax.swing.SwingConstants;

import eu.janschupke.lines.Behaviour;
import eu.janschupke.lines.Lang;
import eu.janschupke.lines.Values.Fonts;
import eu.janschupke.lines.Values.Padding;
import eu.janschupke.lines.actions.ActionProvider;
import eu.janschupke.lines.gui.AlphaImageIcon;
import eu.janschupke.lines.gui.MainView;
import eu.janschupke.lines.gui.StatusBar;
import eu.janschupke.lines.model.Balls;
import eu.janschupke.lines.model.MetadataContainer;

/**
 *
 * Represents a dialog window that shows up
 * whenever the game ends and the player has reached
 * high enough score to be saved into the Score Board.
 *
 */
public class GameEndDialog extends GeneralDialog {
    private static final long serialVersionUID = 1L;

    /**
     * An extension to the JPanel that handles
     * the drawing of some icons into the panel.
     */
    private class InfoFieldset extends JPanel {
        private static final long serialVersionUID = 1L;

        /**
         * Picks two balls at random and paints them into the panel.
         * One to the left, one to the right.
         */
        @Override
        public void paintComponent(Graphics g) {
            super.paintComponent(g);

            int y = 90;
            float a = 0.4f;

            Balls leftBall = Balls.getRandom();
            Balls rightBall = Balls.getRandom();

            AlphaImageIcon leftIcon;
            AlphaImageIcon rightIcon;

            // Assigns an image to the left icon.
            switch(leftBall) {
                case BLUE:      leftIcon = new AlphaImageIcon(
                                    win.getImageProvider().getBlueBall(), a);
                                break;

                case GREEN:     leftIcon = new AlphaImageIcon(
                                    win.getImageProvider().getGreenBall(), a);
                                break;

                case ORANGE:    leftIcon = new AlphaImageIcon(
                                    win.getImageProvider().getOrangeBall(), a);
                                break;

                case PURPLE:    leftIcon = new AlphaImageIcon(
                                    win.getImageProvider().getPurpleBall(), a);
                                break;

                case RED:       leftIcon = new AlphaImageIcon(
                                    win.getImageProvider().getRedBall(), a);
                                break;

                case YELLOW:    leftIcon = new AlphaImageIcon(
                                    win.getImageProvider().getYellowBall(), a);
                                break;

                default:
                case BLACK:     leftIcon = new AlphaImageIcon(
                                    win.getImageProvider().getBlackBall(), a);
                                break;
            }

            // Assigns an image to the right icon.
            switch(rightBall) {
                case BLUE:      rightIcon = new AlphaImageIcon(
                                    win.getImageProvider().getBlueBall(), a);
                                break;

                case GREEN:     rightIcon = new AlphaImageIcon(
                                    win.getImageProvider().getGreenBall(), a);
                                break;

                case ORANGE:    rightIcon = new AlphaImageIcon(
                                    win.getImageProvider().getOrangeBall(), a);
                                break;

                case PURPLE:    rightIcon = new AlphaImageIcon(
                                    win.getImageProvider().getPurpleBall(), a);
                                break;

                case RED:       rightIcon = new AlphaImageIcon(
                                    win.getImageProvider().getRedBall(), a);
                                break;

                case YELLOW:    rightIcon = new AlphaImageIcon(
                                    win.getImageProvider().getYellowBall(), a);
                                break;

                default:
                case BLACK:     rightIcon = new AlphaImageIcon(
                                    win.getImageProvider().getBlackBall(), a);
                                break;
            }

            leftIcon.paintIcon(this, g, 20, y);
            rightIcon.paintIcon(this, g, 235, y);
        }
    }

    private InfoFieldset infoFieldset;

    private JLabel scoreTitleLabel;
    private JLabel scoreValueLabel;

    private JLabel usernameLabel;
    private JTextField usernameField;

    private JLabel confirmTextLabel;

    public GameEndDialog(MainView win) {
        super(win, Lang.write("dialog.game_end.title"));

        initFields();
        setDimensions();
        addFields();
        setTooltips();
        assignListeners();
    }

    private void initFields() {
        String label;

        label = Lang.write("dialog.game_end.title");
        infoFieldset = new InfoFieldset();
        infoFieldset.setBorder(BorderFactory.createTitledBorder(label));

        label = Lang.write("dialog.game_end.score");
        scoreTitleLabel = new JLabel(label);
        scoreTitleLabel.setFont(Fonts.SUBTITLE.getValue());

        scoreValueLabel = new JLabel();
        scoreValueLabel.setFont(Fonts.SUBTITLE.getValue());

        label = Lang.write("dialog.game_end.username");
        usernameLabel = new JLabel(label);
        usernameLabel.setFont(Fonts.SUBTITLE.getValue());

        usernameField = new JTextField();
        usernameField.setFont(Fonts.SUBTITLE.getValue());

        label = Lang.write("dialog.game_end.confirm");
        confirmTextLabel = new JLabel("<html><center>" + label);
        confirmTextLabel.setFont(Fonts.SUBTITLE.getValue());

        label = Lang.write("dialog.button.no");
        cancelButton.setText(label);

        label = Lang.write("dialog.button.yes");
        okButton.setText(label);
    }

    private void setDimensions() {
        final int itemHeight = 25;
        final int itemWidth = 135;

        setSize(310, 220);

        infoFieldset.setPreferredSize(new Dimension(300, 150));

        scoreTitleLabel.setPreferredSize(new Dimension(itemWidth, itemHeight));
        scoreValueLabel.setPreferredSize(new Dimension(itemWidth, itemHeight));

        usernameLabel.setPreferredSize(new Dimension(itemWidth, itemHeight));
        usernameField.setPreferredSize(new Dimension(itemWidth, itemHeight));

        confirmTextLabel.setPreferredSize(new Dimension(270, 55));
        confirmTextLabel.setHorizontalAlignment(SwingConstants.CENTER);
        confirmTextLabel.setVerticalAlignment(SwingConstants.BOTTOM);
    }

    private void addFields() {
        mainPanel.add(infoFieldset);

        infoFieldset.setLayout(new FlowLayout(FlowLayout.LEFT,
                Padding.FIELDSET_H_PADDING.getValue(),
                Padding.FIELDSET_V_PADDING.getValue()));

        infoFieldset.add(scoreTitleLabel);
        infoFieldset.add(scoreValueLabel);
        infoFieldset.add(usernameLabel);
        infoFieldset.add(usernameField);
        infoFieldset.add(confirmTextLabel);
    }

    private void setTooltips() {
        StatusBar sb = win.getStatusBar();
        String label;

        label = Lang.write("dialog.game_end.score.tooltip");
        Behaviour.setTooltip(scoreTitleLabel, label, sb);
        Behaviour.setTooltip(scoreValueLabel, label, sb);

        label = Lang.write("dialog.game_end.username.tooltip");
        Behaviour.setTooltip(usernameLabel, label, sb);
        Behaviour.setTooltip(usernameField, label, sb);
    }

    @Override
    protected void assignListeners() {
        final ActionProvider actionProvider = win.getGame().getActionProvider();

        okButton.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                actionProvider.getGameActions().updateScoreBoard();
            }
        });
    }

    @Override
    public void toggleUI() {
        super.toggleUI();

        String value;
        MetadataContainer meta = win.getGame().getModel().getMeta();

        value = meta.getCurrentScore().toString();
        scoreValueLabel.setText(value);

        value = meta.getUsername();
        usernameField.setText(value);
    }

    public JTextField getUsernameField() { return usernameField; }
}
