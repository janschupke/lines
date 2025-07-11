package io.schupke.lines;

import java.awt.Color;
import java.awt.GradientPaint;
import java.awt.Graphics;
import java.awt.Graphics2D;

import io.schupke.lines.Values.Debug;
import io.schupke.lines.gui.GradientComponent;

/**
 *
 * Contains methods that are used globally
 * within the application.
 *
 */
public class StaticMethods {
    /**
     * A method used for debugging.
     * Returns a full class path to the method from which it is called.
     */
    public static String getMethodName(Object obj) {
        final StackTraceElement[] st = Thread.currentThread().getStackTrace();

        /*
         * If this method is called from the print method
         * defined below instead of being called directly,
         * stack pointer value is changed to accommodate this.
         */
        int level = 2;

        if(st[level].getMethodName().equals("printMethodName")) {
            level = 3;
        }

        // get the full path
        String path = obj.getClass().getName() + "." + st[level].getMethodName() + "()";

        // cut the 'io.schupke.lines.'
        int charsToCut = 20;
        path = path.substring(charsToCut, path.length());

        return path;
    }

    /**
     * A method used for debugging.
     * Prints out a full class path to the method from which it is called.
     */
    public static void printMethodName(Object obj) {
        if(Debug.STANDARD.getValue()) {
            System.out.println("Calling " + getMethodName(obj));
        }
    }

    /**
     * Prints a String in a specific debug format.
     * @param message the message to be printed
     */
    public static void debug(String message) {
        if(Debug.DETAILED.getValue()) {
            System.out.println("\t>> " + message);
        }
    }

    /**
     * Parses a number value and adds one leading zero
     * if the value is one-digit.
     * @param value the number to be parsed
     * @return If the number >= 10, returns the same value.
     * If the number was < 10, returns it with one leading zero.
     */
    private static String addLeadingZeros(Long value) {
        if(value < 10) {
            return new String("0" + value.toString());
        }

        return new String(value.toString());
    }

    /**
     * Parses a time stamp value into a more readable format
     * of hh:mm:ss.
     * @param time the provided time stamp value
     * @return readable time format
     */
    public static String parseTime(long time) {
        StringBuilder result = new StringBuilder();

        long seconds = time / 1000;
        long minutes = 0;
        long hours = 0;

        if(seconds >= 60) {
            minutes = seconds / 60;
            seconds %= 60;
        }

        if(minutes >= 60) {
            hours = minutes / 60;
            minutes %= 60;
        }

        result.append(addLeadingZeros(hours));
        result.append(":");
        result.append(addLeadingZeros(minutes));
        result.append(":");
        result.append(addLeadingZeros(seconds));

        return result.toString();
    }

    /**
     * Paints the background of the provided component
     * in a gradient color transition.
     */
    public static void setGradient(GradientComponent c, Graphics g) {
        if (!c.isOpaque()) {
            c.superPaint(g);
            return;
        }

        Graphics2D g2d = (Graphics2D) g;

        int w = c.getWidth();
        int h = c.getHeight();

        Color color1 = c.getBackground();
        Color color2 = color1.darker();

        // Paints a gradient background from top to bottom.
        GradientPaint gp = new GradientPaint(0, 0, color1, 0, h, color2);

        g2d.setPaint(gp);
        g2d.fillRect(0, 0, w, h);

        c.setOpaque(false);
        c.superPaint(g);
        c.setOpaque(true);
    }

    /**
     * Removes any possible gradient paint that might
     * have been applied to the component.
     */
    public static void removeGradient(GradientComponent c, Graphics g) {
        if (!c.isOpaque()) {
            c.superPaint(g);
            return;
        }

        Graphics2D g2d = (Graphics2D) g;

        g2d.setPaint(null);

        c.superPaint(g);
        c.setOpaque(true);
    }
}
