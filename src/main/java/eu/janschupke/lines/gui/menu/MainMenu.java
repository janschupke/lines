package eu.janschupke.lines.gui.menu;

import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;

import javax.swing.JMenu;
import javax.swing.JMenuItem;

import eu.janschupke.lines.Behaviour;
import eu.janschupke.lines.Lang;
import eu.janschupke.lines.Values.Hotkeys;
import eu.janschupke.lines.actions.ActionProvider;
import eu.janschupke.lines.gui.ImageProvider;
import eu.janschupke.lines.gui.StatusBar;

/**
 *
 * A menu that contains all main
 * navigation links.
 *
 */
public class MainMenu extends JMenu {
    private static final long serialVersionUID = 1L;

    private MainMenuBar mainMenuBar;

    private JMenuItem newGameItem;
    private JMenuItem configItem;
    private JMenuItem scoreItem;
    private JMenuItem exitItem;

    public MainMenu(MainMenuBar mainMenuBar, String title) {
        super(title);

        this.mainMenuBar = mainMenuBar;

        initFields();
        addFields();
        addTooltips();
        setIcons();
        assignHotkeys();
        assignListeners();
    }

    private void initFields() {
        String title;

        title = Lang.write("menu.main.new_game");
        newGameItem = new JMenuItem(title);

        title = Lang.write("menu.main.config");
        configItem = new JMenuItem(title);

        title = Lang.write("menu.main.score");
        scoreItem = new JMenuItem(title);

        title = Lang.write("menu.main.exit");
        exitItem = new JMenuItem(title);
    }

    private void addFields() {
        add(newGameItem);
        addSeparator();
        add(configItem);
        add(scoreItem);
        addSeparator();
        add(exitItem);
    }

    private void addTooltips() {
        StatusBar sb = mainMenuBar.getWindow().getStatusBar();

        String label;

        label = Lang.write("menu.main.new_game.tooltip");
        Behaviour.setTooltip(newGameItem, label, sb);

        label = Lang.write("menu.main.config.tooltip");
        Behaviour.setTooltip(configItem, label, sb);

        label = Lang.write("menu.main.score.tooltip");
        Behaviour.setTooltip(scoreItem, label, sb);

        label = Lang.write("menu.main.exit.tooltip");
        Behaviour.setTooltip(exitItem, label, sb);
    }

    private void setIcons() {
        final ImageProvider images = mainMenuBar.getWindow().getImageProvider();

        newGameItem.setIcon(images.getOKIcon());
        configItem.setIcon(images.getConfigIcon());
        scoreItem.setIcon(images.getScoreIcon());
        exitItem.setIcon(images.getExitIcon());
    }

    private void assignHotkeys() {
        newGameItem.setAccelerator(Hotkeys.NEW_GAME.getValue());
        configItem.setAccelerator(Hotkeys.SHOW_CONFIG_DIALOG.getValue());
        scoreItem.setAccelerator(Hotkeys.SHOW_SCORE_DIALOG.getValue());
        exitItem.setAccelerator(Hotkeys.EXIT_APPLICATION.getValue());
    }

    private void assignListeners() {
        final ActionProvider actionProvider = mainMenuBar.getWindow().getGame().getActionProvider();

        newGameItem.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                actionProvider.getWindowActions().showNewGamePrompt();
            }
        });

        configItem.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                mainMenuBar.getWindow().getConfigDialog().setVisible(true);
            }
        });

        scoreItem.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                mainMenuBar.getWindow().getScoreDialog().setVisible(true);
            }
        });

        exitItem.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                actionProvider.getWindowActions().invokeExit();
            }
        });
    }
}
