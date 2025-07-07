package eu.janschupke.lines.actions;

import eu.janschupke.lines.StaticMethods;
import eu.janschupke.lines.Values.Debug;
import eu.janschupke.lines.Values.GlobalLimits;
import eu.janschupke.lines.model.Balls;
import eu.janschupke.lines.model.Board;
import eu.janschupke.lines.model.Cell;

/**
 *
 * Provides implementation for line checking
 * in all directions. While being logically a part of the
 * GameActions, these methods were moved into
 * a separate class for easier readability.
 * @see GameActions
 *
 */
public class LineChecker {
    private ActionProvider provider;

    /**
     * Does not create new instances of this, only assigns
     * pointer to the instance within GameActions.
     */
    private boolean [][] cellsToPop;

    public LineChecker(ActionProvider provider) {
        this.provider = provider;
    }

    /**
     * Checks all cells to the right of the given {@link Cell}
     * to determine whether there is a sufficiently long
     * line that can be popped in this direction.
     * @param c the {@link Cell} from which the checking occurs
     */
    public void checkHorizontalLine(Cell c) {
        if(Debug.BOARD.getValue()) {
            StaticMethods.printMethodName(this);
        }

        cellsToPop = provider.getGameActions().getCellsToPop();
        Board board = provider.getGame().getModel().getBoard();

        Balls currentBall = c.getBall();

        /*
         * Enough space in this direction,
         * checking colors.
         */
        if(board.getSize() - c.getPosition()[0] >=
            GlobalLimits.MINIMUM_LINE_LENGTH.getValue()) {

            // Initial length.
            int length = 0;

            int y = c.getPosition()[1];

            /*
             * Needs to stay within bounds.
             */
            for(int i = c.getPosition()[0]; i < board.getSize(); i++) {
                if(Debug.BOARD.getValue()) {
                    StaticMethods.debug("Checking " + board.getCell(i, y) + ".");
                }

                /*
                 * Parsing the following balls in given direction
                 */
                if(board.getCell(i, y).getBall() != null &&
                    board.getCell(i, y).getBall().equals(currentBall)) {
                    length++;

                    if(Debug.BOARD.getValue()) {
                        StaticMethods.debug("Increasing length to " + length + ".");
                    }
                }

                boolean boardEnd = false;
                boolean lineEnd = false;

                /*
                 * This is the last cell on the board in this direction.
                 */
                if(i + 1 == board.getSize()) {
                    boardEnd = true;
                /*
                 * The next cell is either empty or contains a ball of different color.
                 */
                } else if(board.getCell(i + 1, y).getBall() == null ||
                    !board.getCell(i + 1, y).getBall().equals(currentBall)) {

                    lineEnd = true;
                }

                if(boardEnd || lineEnd) {
                    if(Debug.BOARD.getValue()) {
                        StaticMethods.debug("Reached the end.");
                    }

                    /*
                     * If the minimum line length is reached,
                     * all relevant cells / balls are flagged for popping.
                     */
                    if(length >= GlobalLimits.MINIMUM_LINE_LENGTH.getValue()) {
                        if(Debug.BOARD.getValue()) {
                            StaticMethods.debug("Length " + length + " is sufficient.");
                        }

                        /*
                         * Goes from the break-point back to the originating cell.
                         */
                        for(int j = i; j >= c.getPosition()[0]; j--) {
                            cellsToPop[j][y] = true;
                        }
                    }

                    // No need to parse following balls.
                    break;
                }
            }
        }
    }

    /**
     * Checks all cells below the given {@link Cell}
     * to determine whether there is a sufficiently long
     * line that can be popped in this direction.
     * @param c the {@link Cell} from which the checking occurs
     */
    public void checkVerticalLine(Cell c) {
        if(Debug.BOARD.getValue()) {
            StaticMethods.printMethodName(this);
        }

        cellsToPop = provider.getGameActions().getCellsToPop();
        Board board = provider.getGame().getModel().getBoard();

        Balls currentBall = c.getBall();

        /*
         * Enough space in this direction,
         * checking colors.
         */
        if(board.getSize() - c.getPosition()[1] >=
            GlobalLimits.MINIMUM_LINE_LENGTH.getValue()) {

            // Initial length.
            int length = 0;

            int x = c.getPosition()[0];

            /*
             * Needs to stay within bounds.
             */
            for(int i = c.getPosition()[1]; i < board.getSize(); i++) {
                if(Debug.BOARD.getValue()) {
                    StaticMethods.debug("Checking " + board.getCell(x, i) + ".");
                }

                /*
                 * Parsing the following balls in given direction
                 */
                if(board.getCell(x, i).getBall() != null &&
                    board.getCell(x, i).getBall().equals(currentBall)) {
                    length++;

                    if(Debug.BOARD.getValue()) {
                        StaticMethods.debug("Increasing length to " + length + ".");
                    }
                }

                boolean boardEnd = false;
                boolean lineEnd = false;

                /*
                 * This is the last cell on the board in this direction.
                 */
                if(i + 1 == board.getSize()) {
                    boardEnd = true;
                /*
                 * The next cell is either empty or contains a ball of different color.
                 */
                } else if(board.getCell(x, i + 1).getBall() == null ||
                    !board.getCell(x, i + 1).getBall().equals(currentBall)) {

                    lineEnd = true;
                }

                if(boardEnd || lineEnd) {
                    if(Debug.BOARD.getValue()) {
                        StaticMethods.debug("Reached the end.");
                    }

                    /*
                     * If the minimum line length is reached,
                     * all relevant cells / balls are flagged for popping.
                     */
                    if(length >= GlobalLimits.MINIMUM_LINE_LENGTH.getValue()) {
                        if(Debug.BOARD.getValue()) {
                            StaticMethods.debug("Length " + length + " is sufficient.");
                        }

                        /*
                         * Goes from the break-point back to the originating cell.
                         */
                        for(int j = i; j >= c.getPosition()[1]; j--) {
                            cellsToPop[x][j] = true;
                        }
                    }

                    // No need to parse following balls.
                    break;
                }
            }
        }
    }

    /**
     * Checks all cells in the direction of the right diagonal
     * from the given {@link Cell} to determine whether there is a sufficiently long
     * line that can be popped in this direction.
     * @param c the {@link Cell} from which the checking occurs
     */
    public void checkDecreasingDiagonal(Cell c) {
        if(Debug.BOARD.getValue()) {
            StaticMethods.printMethodName(this);
        }

        cellsToPop = provider.getGameActions().getCellsToPop();
        Board board = provider.getGame().getModel().getBoard();

        Balls currentBall = c.getBall();

        /*
         * Enough space in this direction,
         * checking colors.
         */
        if(board.getSize() - c.getPosition()[0] >=
            GlobalLimits.MINIMUM_LINE_LENGTH.getValue() &&
            board.getSize() - c.getPosition()[1] >=
            GlobalLimits.MINIMUM_LINE_LENGTH.getValue()) {

            // Initial length.
            int length = 0;

            int x = c.getPosition()[0];
            int y = c.getPosition()[1];
            int s = board.getSize();

            /*
             * Needs to stay within bounds.
             */
            for(int i = x, j = y; i < s && j < s; i++, j++) {
                if(Debug.BOARD.getValue()) {
                    StaticMethods.debug("Checking " + board.getCell(i, j) + ".");
                }

                /*
                 * Parsing the following balls in given direction
                 */
                if(board.getCell(i, j).getBall() != null &&
                    board.getCell(i, j).getBall().equals(currentBall)) {
                    length++;

                    if(Debug.BOARD.getValue()) {
                        StaticMethods.debug("Increasing length to " + length + ".");
                    }
                }

                boolean boardEnd = false;
                boolean lineEnd = false;

                /*
                 * This is the last cell on the board in this direction.
                 */
                if(i + 1 == board.getSize() || j + 1 == board.getSize()) {
                    boardEnd = true;
                /*
                 * The next cell is either empty or contains a ball of different color.
                 */
                } else if(board.getCell(i + 1, j + 1).getBall() == null ||
                    !board.getCell(i + 1, j + 1).getBall().equals(currentBall)) {

                    lineEnd = true;
                }

                if(boardEnd || lineEnd) {
                    if(Debug.BOARD.getValue()) {
                        StaticMethods.debug("Reached the end.");
                    }

                    /*
                     * If the minimum line length is reached,
                     * all relevant cells / balls are flagged for popping.
                     */
                    if(length >= GlobalLimits.MINIMUM_LINE_LENGTH.getValue()) {
                        if(Debug.BOARD.getValue()) {
                            StaticMethods.debug("Length " + length + " is sufficient.");
                        }

                        /*
                         * Goes from the break-point back to the originating cell.
                         */
                        for(int k = i, l = j; k >= x && l >= y; k--, l--) {
                            cellsToPop[k][l] = true;
                        }
                    }

                    // No need to parse following balls.
                    break;
                }
            }
        }
    }

    /**
     * Checks all cells in the direction of the left diagonal
     * from the given {@link Cell} to determine whether there is a sufficiently long
     * line that can be popped in this direction.
     * @param c the {@link Cell} from which the checking occurs
     */
    public void checkIncreasingDiagonal(Cell c) {
        if(Debug.BOARD.getValue()) {
            StaticMethods.printMethodName(this);
        }

        cellsToPop = provider.getGameActions().getCellsToPop();
        Board board = provider.getGame().getModel().getBoard();

        Balls currentBall = c.getBall();

        /*
         * Enough space in this direction,
         * checking colors.
         */
        // Decreasing x; Increasing y:
        if(c.getPosition()[0] >=
            GlobalLimits.MINIMUM_LINE_LENGTH.getValue() - 1 &&
            board.getSize() - c.getPosition()[1] >=
            GlobalLimits.MINIMUM_LINE_LENGTH.getValue()) {

            // Initial length.
            int length = 0;

            int x = c.getPosition()[0];
            int y = c.getPosition()[1];
            int s = board.getSize();

            /*
             * Needs to stay within bounds.
             */
            for(int i = x, j = y; i >= 0 && j < s; i--, j++) {
                if(Debug.BOARD.getValue()) {
                    StaticMethods.debug("Checking " + board.getCell(i, j) + ".");
                }

                /*
                 * Parsing the following balls in given direction
                 */
                if(board.getCell(i, j).getBall() != null &&
                    board.getCell(i, j).getBall().equals(currentBall)) {
                    length++;

                    if(Debug.BOARD.getValue()) {
                        StaticMethods.debug("Increasing length to " + length + ".");
                    }
                }

                boolean boardEnd = false;
                boolean lineEnd = false;

                /*
                 * This is the last cell on the board in this direction.
                 */
                if(i == 0 || j + 1 == board.getSize()) {
                    boardEnd = true;
                /*
                 * The next cell is either empty or contains a ball of different color.
                 */
                } else if(board.getCell(i - 1, j + 1).getBall() == null ||
                    !board.getCell(i - 1, j + 1).getBall().equals(currentBall)) {

                    lineEnd = true;
                }

                if(boardEnd || lineEnd) {
                    if(Debug.BOARD.getValue()) {
                        StaticMethods.debug("Reached the end.");
                    }

                    /*
                     * If the minimum line length is reached,
                     * all relevant cells / balls are flagged for popping.
                     */
                    if(length >= GlobalLimits.MINIMUM_LINE_LENGTH.getValue()) {
                        if(Debug.BOARD.getValue()) {
                            StaticMethods.debug("Length " + length + " is sufficient.");
                        }

                        /*
                         * Goes from the break-point back to the originating cell.
                         */
                        for(int k = i, l = j; k <= x && l >= y; k++, l--) {
                            cellsToPop[k][l] = true;
                        }
                    }

                    // No need to parse following balls.
                    break;
                }
            }
        }
    }
}
