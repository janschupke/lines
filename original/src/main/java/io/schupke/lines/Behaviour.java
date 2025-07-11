package io.schupke.lines;

import java.awt.event.KeyEvent;
import java.awt.event.KeyListener;
import java.awt.event.MouseEvent;
import java.awt.event.MouseListener;
import java.awt.event.MouseWheelEvent;
import java.awt.event.MouseWheelListener;

import javax.swing.JComboBox;
import javax.swing.JComponent;
import javax.swing.JSpinner;
import javax.swing.JTextField;
import javax.swing.SpinnerNumberModel;

import io.schupke.lines.gui.StatusBar;

public class Behaviour {
    /**
     * Adds a mouse listener to the component in order
     * to display its ToolTip in StatusBar
     * when mouse cursor enters the component's area.
     * Also adds an ordinary ToolTip.
     * @see StatusBar
     */
    public static void setTooltip(JComponent field, final String tooltip, final StatusBar statusBar) {
        field.setToolTipText(tooltip);

        field.addMouseListener(new MouseListener() {
            @Override
            public void mouseClicked(MouseEvent e) {}
            @Override
            public void mousePressed(MouseEvent e) {}
            @Override
            public void mouseReleased(MouseEvent e) {}

            @Override
            public void mouseEntered(MouseEvent e) {
                statusBar.setStatus(tooltip);
            }

            @Override
            public void mouseExited(MouseEvent e) {
                statusBar.setStatus("");
            }
        });
    }

    /**
     * Assigns an unified behavior for number JSpinner components:
     * 1] Listens to mouse wheel.
     * 2] Returns the value into allowed interval if it gets out.
     * 3] Ignores characters.
     */
    @SuppressWarnings("unchecked")
    public static void setSpinner(final JSpinner spinner) {
        final SpinnerNumberModel model = (SpinnerNumberModel)spinner.getModel();

        ((JSpinner.DefaultEditor)spinner.getEditor()).getTextField().addKeyListener(new KeyListener() {
            @Override
            public void keyTyped(KeyEvent e) {}
            @Override
            public void keyReleased(KeyEvent e) {}
            @Override
            public void keyPressed(KeyEvent e) {
                /*
                 * Editing disabled components should not be possible.
                 */
                if(!spinner.isEnabled()) {
                    return;
                }

                /*
                 * When the enter is pressed, values are checked and actions are taken.
                 */
                if (e.getKeyCode() == KeyEvent.VK_ENTER) {
                    JTextField editor = ((JSpinner.DefaultEditor)spinner.getEditor()).getTextField();

                    try {
                        Integer value = Integer.parseInt(editor.getText());

                        /*
                         * Checks whether the requested value is within allowed range.
                         */
                        if(((Integer)model.getMaximum()).compareTo(value) < 0) {
                            model.setValue(model.getMaximum());
                        } else if(((Integer)model.getMinimum()).compareTo(value) > 0) {
                            model.setValue(model.getMinimum());
                        } else {
                            model.setValue(value);
                        }

                    // Ignores the request, if it's not a number.
                    } catch(NumberFormatException ex) {
                        editor.setText(model.getValue().toString());
                        return;
                    }
                }
            }
        });

        spinner.addMouseWheelListener(new MouseWheelListener() {
            @Override
            public void mouseWheelMoved(MouseWheelEvent e) {
                /*
                 * Editing disabled components should not be possible.
                 */
                if(!spinner.isEnabled()) {
                    return;
                }

                if(e.getScrollType() != MouseWheelEvent.WHEEL_UNIT_SCROLL) {
                    return;
                }

                Integer value = (Integer)model.getValue();

                // Each scroll action represents one step based on the model.
                value -= e.getUnitsToScroll() / e.getScrollAmount() * (Integer)model.getStepSize();

                // The value keeps changing until it reaches the allowed limit.
                if(((Integer)model.getMaximum()).compareTo(value) >= 0 && ((Integer)model.getMinimum()).compareTo(value) <= 0) {
                    model.setValue(value);
                } else {
                    return;
                }

            }
        });
    }

    /**
     * Enables the ComboBoxes to respond to the mouse wheel.
     */
    public static void setCombo(final JComboBox<String> combo) {
        combo.addMouseWheelListener(new MouseWheelListener() {
            @Override
            public void mouseWheelMoved(MouseWheelEvent e) {
                /*
                 * Editing disabled components should not be possible.
                 */
                if(!combo.isEnabled()) {
                    return;
                }

                if(e.getScrollType() != MouseWheelEvent.WHEEL_UNIT_SCROLL) {
                    return;
                }

                Integer value = (Integer)combo.getSelectedIndex();

                // Each scroll action represents one step based on the model.
                value += e.getUnitsToScroll() / e.getScrollAmount();

                // The value keeps changing until it reaches the allowed limit.
                if(value < combo.getItemCount() && value >= 0) {
                    combo.setSelectedIndex(value);
                } else {
                    return;
                }
            }
        });
    }
}
