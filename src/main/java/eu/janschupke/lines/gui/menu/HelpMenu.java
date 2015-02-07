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
 * A menu that contains support / help items.
 *
 */
public class HelpMenu extends JMenu {
    private static final long serialVersionUID = 1L;

    private MainMenuBar mainMenuBar;

    private JMenuItem aboutItem;
    private JMenuItem guideItem;

    public HelpMenu(MainMenuBar mainMenuBar, String title) {
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

        title = Lang.write("menu.help.about");
        aboutItem = new JMenuItem(title);

        title = Lang.write("menu.help.guide");
        guideItem = new JMenuItem(title);
    }

    private void addFields() {
        add(aboutItem);
        add(guideItem);
    }

    private void addTooltips() {
        StatusBar sb = mainMenuBar.getWindow().getStatusBar();

        String label;

        label = Lang.write("menu.help.about.tooltip");
        Behaviour.setTooltip(aboutItem, label, sb);

        label = Lang.write("menu.help.guide.tooltip");
        Behaviour.setTooltip(guideItem, label, sb);
    }

    private void setIcons() {
        final ImageProvider images = mainMenuBar.getWindow().getImageProvider();

        aboutItem.setIcon(images.getInfoIcon());
        guideItem.setIcon(images.getHelpIcon());
    }

    private void assignHotkeys() {
        aboutItem.setAccelerator(Hotkeys.SHOW_ABOUT_TAB.getValue());
        guideItem.setAccelerator(Hotkeys.SHOW_GUIDE.getValue());
    }

    private void assignListeners() {
        final ActionProvider provider = mainMenuBar.getWindow().getGame().getActionProvider();

        aboutItem.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                mainMenuBar.getWindow().getAboutDialog().setVisible(true);
            }
        });

        guideItem.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                provider.getWindowActions().showGuide();
            }
        });
    }

}
