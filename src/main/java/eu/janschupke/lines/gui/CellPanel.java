package eu.janschupke.lines.gui;

import java.awt.Color;
import java.awt.Graphics;
import java.util.Properties;

import javax.swing.BorderFactory;
import javax.swing.ImageIcon;
import javax.swing.JLabel;

import eu.janschupke.lines.StaticMethods;
import eu.janschupke.lines.Values.Borders;
import eu.janschupke.lines.Values.Colors;
import eu.janschupke.lines.config.Configurator;
import eu.janschupke.lines.model.Balls;
import eu.janschupke.lines.model.Cell;

/**
 *
 * Represents the graphical view of one {@link Cell}.
 *
 */
public class CellPanel extends GradientComponent {
    private static final long serialVersionUID = 1L;

    /**
     * Different displaying options for balls
     * inside a cell panel.
     */
    public enum Styles {
        /**
         * Standard ball on the main game board.
         */
        NORMAL,
        /**
         * A smaller ball inside an Info Panel cells.
         */
        DIMINISHED,
        /**
         * A standard-size, partially transparent ball
         * for displaying incoming balls on the board.
         */
        INCOMING;
    }

    /**
     * The board to which this panel
     * is associated to.
     */
    private BoardPanel board;

    /**
     * An instance from the model,
     * which is encapsulated by this panel.
     * @see Cell
     */
    private Cell cell;

    /**
     * Pixel size of the cell panel.
     */
    private int cellSize;

    /**
     * Ball style for this specific cell.
     */
    private Styles style;

    /**
     * A label on which the ball is painted.
     */
    private JLabel ballLabel;

    /**
     * A value that represents the background color that this Panel
     * is supposed to have. Since global repaints happen, during which
     * the default background color is set even to the CellPanel that is currently
     * being hovered over by the mouse cursor, inconsistencies may occur.
     * These panels would suffer from having even brighter background set
     * when the cursor actually leaves. To prevent this, a check is performed
     * before changing mouse-over background.
     * @see CellPanel#highlightHover(boolean state)
     * @see CellPanel#highlightReachable(boolean state)
     * @see CellPanel#highlightUnreachable(boolean state)
     */
    private Color expectedBackground;

    /**
     * Creates a new {@link CellPanel} with custom displaying ball style.
     * @param board the {@link BoardPanel} into which this {@link CellPanel} belongs to
     * @param cell the {@link Cell} model that is associated with this panel
     * @param style specific display style of the ball within this cell panel
     * @see Styles
     */
    public CellPanel(BoardPanel board, Cell cell, Styles style) {
        this.board = board;
        this.style = style;
        this.cell = cell;

        setBackground(Colors.DEFAULT_CELL.getValue());

        initFields();
        addFields();
    }

    /**
     * Creates a new {@link CellPanel} with default displaying ball style.
     * @param board the {@link BoardPanel} into which this cell belongs to
     * @param cell the {@link Cell} model that is associated with this panel
     */
    public CellPanel(BoardPanel board, Cell cell) {
        this(board, cell, Styles.NORMAL);
    }

    /**
     * Paints the background of the cell
     * based on the configured background style.
     */
    @Override
    protected void paintComponent(Graphics g) {
        Properties properties = board.getWindow().getGame().getConfigProvider().getConfig().getProperties();
        String key = properties.getProperty(Configurator.Keys.PAINT_GRADIENT.toString());
        boolean paintGradient = Boolean.parseBoolean(key);

        if(paintGradient) {
            StaticMethods.setGradient(this, g);
        } else {
            StaticMethods.removeGradient(this, g);
        }
    }

    private void initFields() {
        highlightActive(false);

        expectedBackground = Colors.DEFAULT_CELL.getValue();

        /*
         * Does not actually change style.
         * Only called to set cell size, which is done
         * inside setStyle().
         */
        setStyle(style);

        ballLabel = new JLabel();
    }

    private void addFields() {
        add(ballLabel);
    }

    private void setStyle(Styles s) {
        this.style = s;

        /*
         * Adjusts cell sized according to the display style.
         */
        switch(style) {
            case DIMINISHED:
                cellSize = 35;
                break;

            case INCOMING:
                cellSize = 55;
                break;

            default:
            case NORMAL:
                cellSize = 55;
                break;
        }
    }

    /**
     * Paints or removes a ball according to the current
     * state of the associated {@link Cell} model.
     */
    public void setBall(boolean state) {
        // Explicitly removing everything.
        if(!state) {
            ballLabel.setIcon(null);
            return;
        }

        Balls ballID;

        /*
         * Diminished style is used for the Info Panel
         * and should not ever change for any panels
         * initiated with this style.
         */
        if(style != Styles.DIMINISHED) {
            if(cell.getIncomingBall() != null) {
                this.setStyle(Styles.INCOMING);
            } else {
                this.setStyle(Styles.NORMAL);
            }
        }

        // Current ball information in the model.
        if(style == Styles.INCOMING) {
            ballID = cell.getIncomingBall();
        } else {
            ballID = cell.getBall();
        }

        /*
         * Removes the ball icon if the model
         * does not contain any ball information.
         */
        if(ballID == null) {
            ballLabel.setIcon(null);
            return;
        }

        ImageIcon ball;

        // Does the painting.
        ball = assignImage(ballID);
        paintBall(ball);
    }

    /**
     * Retrieves the actual image based on the provided ball
     * information from the model.
     */
    private ImageIcon assignImage(Balls ballID) {
        ImageProvider iProvider = board.getWindow().getImageProvider();
        ImageIcon ball;

        switch(ballID) {
            case BLUE:
                ball = iProvider.getBlueBall();
                break;

            case GREEN:
                ball = iProvider.getGreenBall();
                break;

            case ORANGE:
                ball = iProvider.getOrangeBall();
                break;

            case PURPLE:
                ball = iProvider.getPurpleBall();
                break;

            case RED:
                ball = iProvider.getRedBall();
                break;

            case YELLOW:
                ball = iProvider.getYellowBall();
                break;

            case BLACK:
                ball = iProvider.getBlackBall();
                break;

            default:
                ball = iProvider.getOrangeBall();
                break;
        }

        return ball;
    }

    /**
     * Adjusts the ball size. Incoming balls are displayed smaller.
     * They are also indented from the top by assigning a border
     * to the JLabel that holds the image.
     * Takes care of the painting itself.
     */
    private void paintBall(ImageIcon ball) {
        switch(style) {
            /*
             * Incoming ball are smaller and opaque images.
             * They need to be adjusted before painting,
             * since the ImageProvider only holds references
             * to standard ball images.
             */
            case INCOMING:
                // 1.0f makes the image opaque.
                float alpha = 0.7f;

                ball = board.getWindow().getImageProvider().resizeImage(ball, cellSize - 33);

                AlphaImageIcon smallBall = new AlphaImageIcon(ball, alpha);

                ballLabel.setBorder(Borders.SMALL_BALL_PADDING.getValue());
                ballLabel.setIcon(smallBall);
                break;

            /*
             * Normal Game Board balls are already resized so that
             * they fit the cell. No resizing is done here
             * to speed up the rendering.
             */
            case NORMAL:
                ballLabel.setBorder(null);
                ballLabel.setIcon(ball);
                break;

            /*
             * In all other cases, the ball size is adjusted according to the
             * current cell size.
             */
            default:
                ball = board.getWindow().getImageProvider().resizeImage(ball, cellSize - 12);

                ballLabel.setBorder(null);
                ballLabel.setIcon(ball);
                break;
        }
    }

    /**
     * Changes the panels' border appearance according to the provided state.
     * @param state the state into which the CellPanel should switch
     */
    public void highlightActive(boolean state) {
        if(state) {
            setBorder(BorderFactory.createLoweredBevelBorder());
        } else {
            setBorder(BorderFactory.createRaisedBevelBorder());
        }
    }

    /**
     * Changes the background of a {@link CellPanel} according to its state.
     * @param state the state in which to highlight the given CellPanel
     */
    public void highlightHover(boolean state) {
        if(state) {
            if(getBackground().equals(expectedBackground)) {
                setBackground(getBackground().darker());
            }
        } else {
            if(getBackground().equals(expectedBackground.darker())) {
                setBackground(getBackground().brighter());
            }
        }
    }

    /**
     * Changes the background color of this panel
     * so that it represents a reachable cell.
     * @param state the state in which to highlight the given CellPanel
     */
    public void highlightReachable(boolean state) {
        if(state) {
            expectedBackground = Colors.REACHABLE_CELL.getValue();
        } else {
            expectedBackground = Colors.DEFAULT_CELL.getValue();
        }

        setBackground(expectedBackground);
    }

    /**
     * Changes the background color of this panel
     * so that it represents an unreachable cell.
     * @param state the state in which to highlight the given CellPanel
     */
    public void highlightUnreachable(boolean state) {
        if(state) {
            expectedBackground = Colors.UNREACHABLE_CELL.getValue();
        } else {
            expectedBackground = Colors.DEFAULT_CELL.getValue();
        }

        setBackground(expectedBackground);
    }

    public Cell getCell() { return cell; }
    public int getCellSize() { return cellSize; }
}
