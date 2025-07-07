package eu.janschupke.lines.model;

import java.io.Serializable;

import eu.janschupke.lines.StaticMethods;
import eu.janschupke.lines.Values.Debug;
import eu.janschupke.lines.gui.BoardPanel;
import eu.janschupke.lines.gui.CellPanel;

/**
 *
 * The model of one game board cell.
 * @see Board
 * @see BoardPanel
 * @see CellPanel
 *
 */
public class Cell implements Serializable {
    private static final long serialVersionUID = 1L;

    private Board board;
    private Balls ball;
    private Balls incomingBall;

    private int positionX, positionY;

    /**
     * Indicates whether there is a ball
     * on this cell.
     * @see Balls
     */
    private boolean isEmpty;

    /**
     * Indicates whether this cell is currently clicked
     * during the game turn process.
     */
    private boolean isActive;

    public Cell(Board board, int x, int y) {
        this.board = board;

        positionX = x;
        positionY = y;

        isEmpty = true;
        isActive = false;

        ball = null;
        incomingBall = null;
    }

    /**
     * Sets the cell's ball information. If the ball is not null,
     * also adds this cell into a queue for later line checking.
     * @param ball one of possible ball colors, or null, if removing
     * the current ball
     * @see Balls
     */
    public void setBall(Balls ball) {
        isEmpty = false;

        if(ball == null) {
            isEmpty = true;
            this.ball = null;

            return;
        }

        /*
         * Incoming and real ball
         * cannot be assigned simultaneously.
         */
        this.incomingBall = null;

        this.ball = ball;

        /*
         * Since a ball has been set, this cell is added
         * to the queue so it can be checked for line popping.
         * Only done for cells that belong to a board.
         */
        if(board != null) {
            if(Debug.BOARD.getValue()) {
                StaticMethods.debug("Adding cell " + this + " into the queue.");
            }

            board.getSpawnedBalls().add(this);
        }
    }

    public void setIncomingBall(Balls ball) {
        if(isEmpty()) {
            this.incomingBall = ball;

            return;
        }

        /*
         * If the cell is not empty, incoming ball
         * reference is not allowed.
         */
        this.incomingBall = null;
    }

    public Balls getBall() { return ball; }
    public Balls getIncomingBall() { return incomingBall; }

    public boolean isEmpty() { return isEmpty; }
    public boolean isActive() { return isActive; }

    /**
     * This is intentionally not accessible.
     * Only the cell itself should set its empty status
     * within the setBall() method. This way, inconsistencies
     * should not occur.
     */
    @SuppressWarnings("unused")
    private void setEmpty(boolean state) {}

    public void setActive(boolean state) {
        isActive = state;
    }

    public int [] getPosition() {
        return new int [] {
            positionX,
            positionY
        };
    }

    @Override
    public String toString() {
        return "[" + positionX + ", " + positionY + "]";
    }

    @Override
    public boolean equals(Object o) {
        Cell c = (Cell) o;

        if(c == null) return false;
        if(this.positionX != c.getPosition()[0]) return false;
        if(this.positionY != c.getPosition()[1]) return false;

        return true;
    }
}
