package io.schupke.lines.gui;

import java.awt.BorderLayout;
import java.awt.Dimension;
import java.awt.Graphics;

import javax.swing.BorderFactory;
import javax.swing.JLabel;

import io.schupke.lines.Behaviour;
import io.schupke.lines.Lang;
import io.schupke.lines.StaticMethods;
import io.schupke.lines.Values.BorderWidths;
import io.schupke.lines.Values.Borders;
import io.schupke.lines.Values.Colors;

/**
 *
 * Represents a support information bar
 * located at the bottom of the frame.
 *
 */
public class StatusBar extends GradientComponent {
    private static final long serialVersionUID = 1L;

    private MainView win;

    private JLabel statusLabel;
    private JLabel timeLabel;

    public StatusBar(MainView win) {
        this.win = win;

        this.setBorder(BorderFactory.createMatteBorder(
                BorderWidths.DEFAULT_PANEL.getValue(), 0, 0, 0,
                Colors.BORDER_DEFAULT.getValue()));

        this.setPreferredSize(new Dimension(this.getWidth(), 18));

        initFields();
        addFields();
        setTooltips();
    }

    public void toggleUI() {}

    @Override
    protected void paintComponent(Graphics g) {
        StaticMethods.setGradient(this, g);
    }

    private void initFields() {
        statusLabel = new JLabel();
        statusLabel.setBorder(Borders.LEFT_PADDING.getValue());

        timeLabel = new JLabel();
        timeLabel.setBorder(Borders.RIGHT_PADDING.getValue());
    }

    private void addFields() {
        setLayout(new BorderLayout());
        add(statusLabel, BorderLayout.CENTER);
        add(timeLabel, BorderLayout.EAST);
    }

    private void setTooltips() {
        String label;

        label = Lang.write("gui.status.timer.tooltip");
        Behaviour.setTooltip(timeLabel, label, this);
    }

    public void setStatus(String text) {
        statusLabel.setText(text);
    }

    public JLabel getTimeLabel() { return timeLabel; }

    public MainView getWindow() { return win; }
}
