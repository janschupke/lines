package eu.janschupke.lines.gui;

import java.awt.Graphics;

import javax.swing.JPanel;

import eu.janschupke.lines.StaticMethods;

/**
 *
 * A superclass that provides access to the super.paintComponent(g);
 * for any classes that extend GradientComponent.
 * This enables their background to be painted in gradient,
 * using external static method.
 * @see StaticMethods
 *
 */
public abstract class GradientComponent extends JPanel {
    private static final long serialVersionUID = 1L;

    public void superPaint(Graphics g) {
        super.paintComponent(g);
    }
}
