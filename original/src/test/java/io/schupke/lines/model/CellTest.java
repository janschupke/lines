package io.schupke.lines.model;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.fail;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;

/**
 *
 * Tests the Cell model. Mostly ball assignments.
 *
 */
public class CellTest {
    private Cell cell;
    private final Balls ball = Balls.BLACK;

    // Default position for the tested cell.
    private final int x = 1;
    private final int y = 1;

    @Before
    public void create() {
        cell = new Cell(null, x, y);
    }

    @After
    public void clean() {
        cell = null;
    }

    /**
     * Verifies the default values after the cell
     * is constructed.
     */
    @Test
    public void testCell() {
        if(!cell.isEmpty()) {
            fail("Default state should be empty.");
        }

        if(cell.isActive()) {
            fail("Default state should not be active.");
        }

        if(cell.getBall() != null) {
            fail("Cells should be constructed without balls.");
        }

        if(cell.getIncomingBall() != null) {
            fail("Cells should be constructed without incoming balls.");
        }
    }

    /**
     * Adding a ball.
     */
    @Test
    public void testSetBall1() {
        cell.setBall(ball);

        if(cell.isEmpty()) {
            fail("The cell is empty after adding a ball.");
        }

        if(cell.getBall() != ball) {
            fail("The cell has a different ball set.");
        }

        if(cell.getIncomingBall() != null) {
            fail("The cell is still flagged for incoming position" +
                    "after setting a real ball.");
        }
    }

    /**
     * Removing a ball.
     */
    @Test
    public void testSetBall2() {
        cell.setBall(null);

        if(!cell.isEmpty()) {
            fail("The cell should be empty after removing its ball.");
        }

        if(cell.getBall() != null) {
            fail("The cell's ball reference should not be pointing anywhere.");
        }
    }

    /**
     * Adding an incoming ball.
     */
    @Test
    public void testSetIncomingBall1() {
        cell.setIncomingBall(ball);

        if(!cell.isEmpty()) {
            fail("The cell should still be considered empty," +
                    "even while having an incoming ball.");
        }

        if(cell.getIncomingBall() != ball) {
            fail("The pointer to the incoming ball is not properly set.");
        }
    }

    /**
     * Removing an incoming ball.
     */
    @Test
    public void testSetIncomingBall2() {
        cell.setIncomingBall(null);

        if(cell.getIncomingBall() != null) {
            fail("Could not remove the incoming ball reference.");
        }
    }

    /**
     * Attempting to add an incoming ball into a cell
     * that is not empty.
     */
    @Test
    public void testSetIncomingBall3() {
        cell.setBall(ball);

        cell.setIncomingBall(ball);

        if(cell.getIncomingBall() != null) {
            fail("Real and incoming balls conflict.");
        }
    }

    @Test
    public void testIsEmpty() {
        assertEquals(true, cell.isEmpty());
    }

    @Test
    public void testIsActive() {
        if(cell.isActive()) {
            fail("Cells should not be initialized as active.");
        }
    }

    /**
     * Testing default state
     */
    @Test
    public void testSetActive1() {
        assertEquals(false, cell.isActive());
    }

    @Test
    public void testSetActive2() {
        cell.setActive(true);

        assertEquals(true, cell.isActive());

    }

    @Test
    public void testSetActive3() {
        cell.setActive(false);

        assertEquals(false, cell.isActive());
    }

    @Test
    public void testGetPosition() {
        int x = cell.getPosition()[0];
        int y = cell.getPosition()[1];

        if(this.x != x || this.y != y) {
            fail("Coordinates do not match.");
        }
    }
}
