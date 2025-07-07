package eu.janschupke.lines.gui;

import java.awt.GridLayout;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;

import javax.swing.JPanel;
import javax.swing.SwingUtilities;

import eu.janschupke.lines.Behaviour;
import eu.janschupke.lines.Lang;
import eu.janschupke.lines.StaticMethods;
import eu.janschupke.lines.Values.Debug;
import eu.janschupke.lines.actions.ActionProvider;
import eu.janschupke.lines.model.Balls;
import eu.janschupke.lines.model.Board;
import eu.janschupke.lines.model.Cell;
import eu.janschupke.lines.model.MetadataContainer;

/**
 *
 * Represents the graphical view for the game
 * board. Consists of an array of cell panels.
 * @see Board
 * @see CellPanel
 *
 */
public class BoardPanel extends JPanel {
    private static final long serialVersionUID = 1L;

    private MainView win;

    /**
     * A pointer to the board's model.
     * @see Board
     */
    private Board board;

    /**
     * An array of cell GUI panels.
     * @see CellPanel
     */
    private CellPanel [][] cells;

    /**
     * Number of cells in each direction,
     * taken from the model for convenience.
     * Is final, since the entire board GUI
     * is recreated when the model's size changes.
     * @see Board
     */
    private final int boardSize;

    public BoardPanel(MainView win) {
        this.win = win;
        this.board = win.getGame().getModel().getBoard();

        boardSize = board.getSize();

        initFields();
        populateCells();
        addFields();
    }

    private void initFields() {
        StatusBar sb = win.getStatusBar();
        String label;

        board = win.getGame().getModel().getBoard();

        cells = new CellPanel[boardSize][boardSize];

        /*
         * Initialization of all cell panels.
         */
        for(int x = 0; x < boardSize; x++) {
            for(int y = 0; y < boardSize; y++) {
                /*
                 * Cell panels hold information about their board panel
                 * as well as the actual cell model itself.
                 */
                cells[x][y] = new CellPanel(this, board.getCell(x, y));

                // Assigns listeners that react to the mouse clicks.
                assignCellListeners(cells[x][y]);

                // Sends the hint to the status bar.
                label = Lang.write("gui.board.cell.tooltip");
                // Also includes coordinates.
                label += " " + cells[x][y].getCell();

                Behaviour.setTooltip(cells[x][y], label, sb);
                // Overriding Behaviour - disabling floating tooltip.
                cells[x][y].setToolTipText(null);
            }
        }
    }

    /**
     * Iterates through the entire BoardPanel and updates
     * balls in each {@link CellPanel}.
     */
    private void populateCells() {
        for(int x = 0; x < boardSize; x++) {
            for(int y = 0; y < boardSize; y++) {
                cells[x][y].setBall(true);
            }
        }
    }

    private void addFields() {
        setLayout(new GridLayout(boardSize, boardSize, 0, 0));

        // Y first, X then...
        /*
         * Adds all cell panels into the board.
         */
        for(int y = 0; y < boardSize; y++) {
            for(int x = 0; x < boardSize; x++) {
                add(cells[x][y]);
            }
        }
    }

    private void assignCellListeners(final CellPanel cellPanel) {
        final ActionProvider provider = getWindow().getGame().getActionProvider();

        cellPanel.addMouseListener(new MouseAdapter() {
            @Override
            public void mousePressed(MouseEvent e) {
                // Right click cancels the turn.
                if(SwingUtilities.isRightMouseButton(e)) {
                    StaticMethods.debug("Cell was right-clicked.");

                    provider.getGameActions().cancelTurn();
                } else {
                    // Only left clicks are processed.
                    if(!SwingUtilities.isLeftMouseButton(e)) {
                        return;
                    } else {
                        // Left click is processed as a game action.
                        provider.getGameActions().handleCellClick(cellPanel.getCell());
                    }
                }

                /*
                 * Mouse-over highlight is disabled during the UI toggling,
                 * since that process contains other highlighting methods
                 * that result on unwanted behavior in conjunction with
                 * the mouse-over background highlight.
                 */
                cellPanel.highlightHover(false);
                toggleUI();
                cellPanel.highlightHover(true);
            }

            @Override
            public void mouseEntered(MouseEvent e) {
                cellPanel.highlightHover(true);
            }

            @Override
            public void mouseExited(MouseEvent e) {
                cellPanel.highlightHover(false);
            }
        });
    }

    /**
     * Graphically highlights each {@link CellPanel} on the board
     * according to its status.
     */
    private void highlight() {
        StaticMethods.printMethodName(this);

        // The entire board is parsed.
        for(int y = 0; y < boardSize; y++) {
            for(int x = 0; x < boardSize; x++) {
                CellPanel p = cells[x][y];

                // Changes the border style for the active cell.
                boolean state = p.getCell().isActive();
                p.highlightActive(state);

                /*
                 * If highlighting is not wanted,
                 * any currently applied highlights are removed
                 * and the loop skips to the next cell.
                 * Break is not possible, since the active cell
                 * might not have been found yet.
                 */
                if(!isHighlightEligible(p)) continue;

                // Only empty cells are highlighted.
                if(!checkEmpty(p)) continue;

                /*
                 * If the cell is reachable, there is no need
                 * to verify that it is not unreachable - continue.
                 */
                if(checkReachable(p)) continue;
                checkUnreachable(p);
            }
        }
    }

    /**
     * Reachability highlighting must be enabled
     * in the configuration, and a turn must be
     * in progress. Not checking the turn progress
     * status might result in null pointers.
     * @return true if highlighting is enabled in the configuration
     * and a turn is currently in progress
     * @see MetadataContainer
     */
    private boolean isHighlightEligible(CellPanel p) {
        MetadataContainer meta = win.getGame().getModel().getMeta();

        if(!meta.isHighlightEnabled() || !meta.isTurnInProcess()) {
            if(Debug.PATHING.getValue()) {
                StaticMethods.debug("Highlight is not enabled or no turn is in process.");
            }

            p.highlightReachable(false);
            p.highlightUnreachable(false);

            return false;
        }

        return true;
    }

    /**
     * Cell panels that contain balls are not
     * highlighted, since they are obviously
     * not reachable.
     * @see CellPanel
     */
    private boolean checkEmpty(CellPanel p) {
        if(!p.getCell().isEmpty()) {
            if(Debug.PATHING.getValue()) {
                StaticMethods.debug("The cell " +
                        p.getCell() +
                        "contains a ball. Skipping the highlight.");
            }

            p.highlightReachable(false);
            p.highlightUnreachable(false);

            return false;
        }

        return true;
    }

    /**
     * If the {@link CellPanel} is reachable, it is highlighted accordingly.
     */
    private boolean checkReachable(CellPanel p) {
        Cell c = p.getCell();

        if(board.getReachability(c)) {
            if(Debug.PATHING.getValue()) {
                StaticMethods.debug("Highlighting " +
                        p.getCell() + " as reachable.");
            }
            p.highlightReachable(true);

            return true;
        }

        return false;
    }

    /**
     * If the {@link CellPanel} is not reachable, it is highlighted accordingly.
     */
    private boolean checkUnreachable(CellPanel p) {
        Cell c = p.getCell();

        if(!board.getReachability(c)) {
            if(Debug.PATHING.getValue()) {
                StaticMethods.debug("Highlighting " +
                        p.getCell() + " as unreachable.");
            }
            p.highlightUnreachable(true);

            return true;
        }

        return false;
    }

    /**
     * Takes incoming balls' colors and paints smaller balls
     * of these colors into the Game Board
     * on the appropriate positions.
     */
    private void setIncomingBalls() {
        CellPanel [] colors = getWindow().getInfoPanel().getIncomingBalls();
        Cell [] pos = board.getIncomingPositions();

        /*
         * Iterates through the array of incoming positions
         * in order to parse all balls.
         */
        for(int i = 0; i < pos.length; i++) {
            /*
             * If incoming position is not available,
             * then the board is probably full.
             * In any case, cannot paint balls at this point.
             */
            if(pos[i] == null) {
                continue;
            }

            // Gets current coordinates.
            int x = pos[i].getPosition()[0];
            int y = pos[i].getPosition()[1];

            // The cell on the board is located based on received coordinates.
            Cell c = cells[x][y].getCell();

            // Appropriate ball is retrieved from the array of incoming colors.
            Balls ball = colors[i].getCell().getBall();

            // The cell on the board is flagged with the retrieved color.
            c.setIncomingBall(ball);

            // The image is added to the GUI.
            cells[x][y].setBall(true);
        }
    }

    /**
     * Removes all icons of incoming balls from the Game Board GUI.
     * @see CellPanel
     */
    public void removeIncomingBalls() {
        for(int x = 0; x < boardSize; x++) {
            for(int y = 0; y < boardSize; y++) {
                // If this cell contains incoming ball, it gets removed.
                if(cells[x][y].getCell().getIncomingBall() != null) {
                    cells[x][y].setBall(false);
                }
            }
        }
    }

    public void toggleUI() {
        MetadataContainer meta = win.getGame().getModel().getMeta();

        populateCells();

        /*
         * Incoming positions are only shown
         * when this feature is enabled in the configuration.
         */
        if(meta.getIncomingPositionsFlag()) {
            setIncomingBalls();
        } else {
            removeIncomingBalls();
        }

        highlight();
    }

    /**
     * Returns the size on {@link CellPanel}'s side.
     * @return the actual pixel size on the {@link CellPanel}
     */
    public int getCellSize() {
        return cells[0][0].getCellSize();
    }

    public MainView getWindow() { return win; }
}
