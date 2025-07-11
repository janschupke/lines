package io.schupke.lines.gui.menu;

import javax.swing.JMenuBar;

import io.schupke.lines.Lang;
import io.schupke.lines.gui.ImageProvider;
import io.schupke.lines.gui.MainView;

/**
 *
 * Main menu bar for the application.
 *
 */
public class MainMenuBar extends JMenuBar {
    private static final long serialVersionUID = 1L;

    private MainView win;

    private MainMenu mainMenu;
    private HelpMenu helpMenu;

    public MainMenuBar(MainView win) {
        this.win = win;

        initFields();
        addFields();
        setIcons();
    }

    private void initFields() {
        String title;

        title = Lang.write("menu.main.title");
        mainMenu = new MainMenu(this, title);

        title = Lang.write("menu.help.title");
        helpMenu = new HelpMenu(this, title);
    }

    private void addFields() {
        add(mainMenu);
        add(helpMenu);
    }

    private void setIcons() {
        final ImageProvider images = getWindow().getImageProvider();

        mainMenu.setIcon(images.getGameMenuIcon());
        helpMenu.setIcon(images.getHelpIcon());
    }

    public MainView getWindow() { return win; }
}
