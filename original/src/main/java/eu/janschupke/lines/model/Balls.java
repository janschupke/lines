package eu.janschupke.lines.model;

import java.util.Random;

/**
 *
 * A list of all different ball colors used in the game.
 *
 */
public enum Balls {
    BLUE(0),
    GREEN(1),
    ORANGE(2),
    PURPLE(3),
    RED(4),
    YELLOW(5),
    BLACK(6);

    private final int value;
    Balls(int value) { this.value = value; }
    public int getValue() { return value; }

    /**
     * Returns a Ball with the provided value.
     * @return a Ball that is associated with the provided value,
     * or null, if such a Ball does not exist
     */
    public static Balls getName(int value) {
        for(Balls b : Balls.values()) {
            if(b.getValue() == value) {
                return b;
            }
        }

        return null;
    }

    /**
     * Gets a random Ball.
     * @return randomly selected Ball.
     */
    public static Balls getRandom() {
        Random random = new Random();
        return values()[random.nextInt(values().length)];
    }
}
