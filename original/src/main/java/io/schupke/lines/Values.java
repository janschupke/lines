package io.schupke.lines;

import java.awt.Color;
import java.awt.Font;
import java.awt.event.InputEvent;
import java.awt.event.KeyEvent;

import javax.swing.KeyStroke;
import javax.swing.border.Border;
import javax.swing.border.EmptyBorder;

/**
 *
 * Contains constant values that are publicly available
 * to the entire application.
 *
 */
public class Values {
    /**
     * Flags that toggle debugging printouts
     * on various levels.
     */
    public enum Debug {
        /**
         * Toggles the method name printouts.
         */
        STANDARD(false),

        /**
         * Toggles detailed printouts for specific
         * steps within methods.
         * Setting this to false will also disable
         * all of the following debug levels.
         */
        DETAILED(false),

        /**
         * Toggles messages that are displayed
         * when determining path availability.
         */
        PATHING(false),

        /**
         * Toggles messages that are displayed
         * when calculating lines and balls to remove.
         */
        BOARD(false),

        /**
         * Toggles messages that print
         * current timers.
         */
        TIMERS(false);

        private final boolean value;
        Debug(boolean value) { this.value = value; }
        public boolean getValue() { return value; }
    }

    public enum ApplicationValues {
        NAME("Lines"),
        VERSION("1.0.20140426"),
        SHORT_VERSION("1.0"),
        LICENSE("GPL"),
        AUTHOR("Jan Schupke"),
        CONTACT("jan.schupke@gmail.com"),
        SITE("www.janschupke.eu");

        private final String value;
        ApplicationValues(String value) { this.value = value; }
        public String getValue() { return value; }
    }

    public enum FileSystemValues {
        DOCS_ROOT("docs"),
        APP_FILENAME("lines"),
        MAIN_FOLDER(".schupke"),
        APP_FOLDER("lines"),
        FULL_CONFIG_PATH(
                System.getProperty("user.home") +
                System.getProperty("file.separator") +
                FileSystemValues.MAIN_FOLDER.getValue() +
                System.getProperty("file.separator") +
                FileSystemValues.APP_FOLDER.getValue()),
        BOARD_FILE(FileSystemValues.FULL_CONFIG_PATH.getValue() +
                System.getProperty("file.separator") +
                "board.bin"),
        SCORE_FILE(FileSystemValues.FULL_CONFIG_PATH.getValue() +
                System.getProperty("file.separator") +
                "score.bin"),
        META_FILE(FileSystemValues.FULL_CONFIG_PATH.getValue() +
                System.getProperty("file.separator") +
                "meta.bin");

        private final String value;
        FileSystemValues(String value) { this.value = value; }
        public String getValue() { return value; }
    }

    public enum Colors {
        BORDER_DEFAULT(new Color(100, 100, 100)),

        DEFAULT_CELL(new Color(200, 200, 200)),
        REACHABLE_CELL(new Color(100, 200, 100)),
        UNREACHABLE_CELL(new Color(220, 70, 70));

        private final Color value;
        Colors(Color value) { this.value = value; }
        public Color getValue() { return value; }
    }

    public enum FontSizes {
        TITLE(18),
        SUBTITLE(16),

        STANDARD(12);

        private final int value;
        FontSizes(int value) { this.value = value; }
        public int getValue() { return value; }
    }

    public enum Fonts {
        TITLE(new Font("Sans", Font.PLAIN, FontSizes.TITLE.getValue())),
        SUBTITLE(new Font("Sans", Font.BOLD, FontSizes.SUBTITLE.getValue())),

        INFOPANEL_TEXT(new Font("Sans", Font.BOLD, FontSizes.SUBTITLE.getValue()));

        private final Font value;
        Fonts(Font value) { this.value = value; }
        public Font getValue() { return value; }
    }

    /**
     * Various borders, mostly used as an indentation
     * for GUI components.
     */
    public enum Borders {
        SIDE_PADDING(new EmptyBorder(0, 5, 0, 5)),
        VERTICAL_PADDING(new EmptyBorder(5, 0, 5, 0)),
        TOP_PADDING(new EmptyBorder(5, 0, 0, 0)),
        LEFT_PADDING(new EmptyBorder(0, 5, 0, 0)),
        RIGHT_PADDING(new EmptyBorder(0, 0, 0, 5)),
        BOTTOM_PADDING(new EmptyBorder(0, 0, 5, 0)),

        SMALL_BALL_PADDING(new EmptyBorder(10, 0, 0, 0)),
        TEXT_PADDING(new EmptyBorder(0, 15, 0, 5)),

        MESSAGE_PADDING(new EmptyBorder(10, 15, 50, 15));

        private final Border value;
        Borders(Border value) { this.value = value; }
        public Border getValue() { return value; }
    }

    public enum BorderWidths {
        DEFAULT_PANEL(1);

        private final int value;
        BorderWidths(int value) { this.value = value; }
        public int getValue() { return value; }
    }

    /**
     * Padding values represented as numbers. Used mainly
     * during the GUI layout setup.
     */
    public enum Padding {
        DEFAULT_PADDING(0),
        LITTLE_PADDING(2),
        DIALOG_H_PADDING(5),
        DIALOG_V_PADDING(5),
        FIELDSET_H_PADDING(0),
        FIELDSET_V_PADDING(0);

        private final int value;
        Padding(int value) { this.value = value; }
        public int getValue() { return value; }
    }

    public enum GlobalLimits {
        BALLS_PER_TURN(3),
        MINIMUM_LINE_LENGTH(5),
        DEFAULT_BOARD_SIZE(9),
        MINIMUM_BOARD_SIZE(9),
        MAXIMUM_BOARD_SIZE(12),
        DEFAULT_TURN_LENGTH(30),
        MINIMUM_TURN_LENGTH(5),
        MAXIMUM_TURN_LENGTH(60),
        SCROLLBAR_SPEED(16);

        private final int value;
        GlobalLimits(int value) { this.value = value; }
        public int getValue() { return value; }
    }

    public enum Hotkeys {
        HIDE_DIALOG(KeyStroke.getKeyStroke(KeyEvent.VK_ESCAPE, 0)),

        NEW_GAME(KeyStroke.getKeyStroke(KeyEvent.VK_F1, 0)),
        SHOW_CONFIG_DIALOG(KeyStroke.getKeyStroke(KeyEvent.VK_F2, 0)),
        SHOW_SCORE_DIALOG(KeyStroke.getKeyStroke(KeyEvent.VK_F3, 0)),
        SHOW_ABOUT_TAB(KeyStroke.getKeyStroke(KeyEvent.VK_F4, 0)),
        SHOW_GUIDE(KeyStroke.getKeyStroke(KeyEvent.VK_F5, 0)),

        EXIT_APPLICATION(KeyStroke.getKeyStroke(KeyEvent.VK_Q, InputEvent.ALT_DOWN_MASK | InputEvent.CTRL_DOWN_MASK));

        // Some additional hotkeys are assigned inside the MainView's listener method.

        private final KeyStroke value;
        Hotkeys(KeyStroke value) { this.value = value; }
        public KeyStroke getValue() { return value; }
    }
}
