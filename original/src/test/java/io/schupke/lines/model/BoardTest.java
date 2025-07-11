package io.schupke.lines.model;

import static org.junit.Assert.fail;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;

/**
 *
 * Tests the behaviour of the Game Board model.
 * Mainly pathfinding, board clearing etc.
 *
 */
public class BoardTest {
    private Board board;
    private final Balls ball = Balls.BLACK;

    private final int iterations = 10000;

    /* Default scenario for all tests:
     * 0 0 1 0 0 0 1 0 0
     * 0 0 1 0 0 0 1 0 0
     * 0 0 1 0 0 0 0 1 1
     * 0 0 0 0 0 0 0 0 0
     * 0 0 0 0 0 0 0 0 0
     * 0 0 0 0 0 0 0 0 0
     * 1 1 1 1 1 1 1 1 1
     * 0 0 0 0 0 0 0 0 0
     * 0 0 0 0 0 0 0 0 0
     */
    @Before
    public void create() {
        board = new Board(null);

        board.getCell(2, 0).setBall(ball);
        board.getCell(2, 1).setBall(ball);
        board.getCell(2, 2).setBall(ball);

        board.getCell(6, 0).setBall(ball);
        board.getCell(6, 1).setBall(ball);

        board.getCell(7, 2).setBall(ball);
        board.getCell(8, 2).setBall(ball);

        board.getCell(0, 6).setBall(ball);
        board.getCell(1, 6).setBall(ball);
        board.getCell(2, 6).setBall(ball);
        board.getCell(3, 6).setBall(ball);
        board.getCell(4, 6).setBall(ball);
        board.getCell(5, 6).setBall(ball);
        board.getCell(6, 6).setBall(ball);
        board.getCell(7, 6).setBall(ball);
        board.getCell(8, 6).setBall(ball);
    }

    @After
    public void clean() {
        board = null;
    }

    /**
     * Checks each cell on the board to verify that it is empty.
     */
    @Test
    public void testClear() {
        board.clear();

        for(int x = 0; x < board.getSize(); x++) {
            for(int y = 0; y < board.getSize(); y++) {
                if(!board.getCell(x, y).isEmpty()) {
                    fail("Clearing failed.");
                }
            }
        }
    }

    /**
     * Attempts to fill the entire board. Then, checks whether
     * all cells really contain a ball.
     */
    @Test
    public void testIsFull() {
        // Filling process.
        for(int x = 0; x < board.getSize(); x++) {
            for(int y = 0; y < board.getSize(); y++) {
                board.getCell(x, y).setBall(ball);
            }
        }

        // Testing.
        if(!board.isFull()) {
            fail("Should be full.");
        }
    }

    /**
     * Calls the method for retrieving random empty cell
     * multiple times. Checks the cell to verify that
     * it is really empty.
     */
    @Test
    public void testGetRandomEmptyCell() {
        Cell cell;

        for(int i = 0; i < iterations; i++) {
            cell = board.getRandomEmptyCell();

            if(!cell.isEmpty()) {
                fail("Returned a cell that is not empty.");
            }
        }
    }

    /**
     * Call the method for retrieving available
     * empty cell for incoming position assignment.
     * Each cell gets checked to verify that
     * it is indeed available.
     */
    @Test
    public void testGetRandomAvailableEmptyCell() {
        Cell cell;

        for(int i = 0; i < iterations; i++) {
            cell = board.getRandomAvailableEmptyCell();

            if(!cell.isEmpty() || cell.getIncomingBall() != null) {
                fail("Returned a cell that is not available.");
            }
        }
    }

    /**
     * Expecting available path.
     */
    @Test
    public void testGetReachability1() {
        Cell source = board.getCell(0, 0);

        // This cell should be reachable according to the preset scenario.
        Cell destination = board.getCell(0, 4);

        board.calculateReachabilityMatrix(source);

        if(!board.getReachability(destination)) {
            fail("Should be reachable.");
        }
    }

    /**
     * Expecting unavailable path.
     */
    @Test
    public void testGetReachability2() {
        Cell source = board.getCell(0, 0);

        // This cell should not be reachable according to the preset scenario.
        Cell destination = board.getCell(0, 7);

        board.calculateReachabilityMatrix(source);

        if(board.getReachability(destination)) {
            fail("Should not be reachable.");
        }
    }

    /**
     * Tests that all incoming positions have been assigned
     * to empty cells and that every incoming position is unique.
     */
    @Test
    public void testCalculateIncomingPositions() {
        for(int k = 0; k < iterations; k++) {
            board.calculateIncomingPositions();

            int len = board.getIncomingPositions().length;

            Cell [] positions = new Cell [len];

            // Gets all the positions for testing purposes.
            for(int i = 0; i < len; i++) {
                positions[i] = board.getIncomingPositions()[i];
            }

            // Testing emptiness.
            for(Cell c : positions) {
                if(!c.isEmpty()) {
                    fail("Incoming position has to be empty.");
                }
            }

            // Testing duplicate values.
            for(int i = 0; i < positions.length; i++) {
                for(int j = i + 1; j < positions.length; j++) {
                    if(positions[i].equals(positions[j])) {
                        fail("Coordinate collision.");
                    }
                }
            }
        }
    }

    /**
     * Assigns incoming positions, then puts a ball
     * into one of assigned cells. This should be noticed
     * by the tested method.
     */
    @Test
    public void testIncomingPositionsAvailable() {
        board.calculateIncomingPositions();

        // Just to be sure... This should work as intended, if the previous test succeeds.
        if(!board.incomingPositionsAvailable()) {
            fail("Positions should be available after calculation.");
        }

        // The first assigned cell.
        Cell inc = board.getIncomingPositions()[0];
        int x = inc.getPosition()[0];
        int y = inc.getPosition()[1];

        // Putting a ball into that cell.
        board.getCell(x, y).setBall(ball);

        // That cell should no longer be considered available.
        if(board.incomingPositionsAvailable()) {
            fail("Collision should have been spotted.");
        }
    }

    /**
     * Makes one of the incoming positions unavailable
     * and executes recalculations. Tests that the affected
     * cell has been replaced.
     */
    @Test
    public void testRecalculateIncomingPositions() {
        for(int i = 0; i < iterations; i++) {
            board.calculateIncomingPositions();

            // Gets the first assigned incoming position.
            Cell incBefore = board.getIncomingPositions()[0];
            int x = incBefore.getPosition()[0];
            int y = incBefore.getPosition()[1];

            // Puts a ball into the cell.
            board.getCell(x, y).setBall(ball);

            // That positions should be reassigned here.
            board.recalculateIncomingPositions();

            // Gets the first assigned position after the calculations
            Cell incAfter = board.getIncomingPositions()[0];

            /*
             * Position before the calculation should not be
             * the same as the position after.
             */
            if(incBefore.equals(incAfter)) {
                fail("Recalculation was not successful.");
            }

            // Removes the ball so the board does not fill up during the iteration.
            board.getCell(x, y).setBall(null);
        }
    }
}
