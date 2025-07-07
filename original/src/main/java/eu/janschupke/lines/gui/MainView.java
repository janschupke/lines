package eu.janschupke.lines.gui;

import java.awt.BorderLayout;
import java.awt.Dimension;
import java.awt.event.ComponentAdapter;
import java.awt.event.ComponentEvent;
import java.awt.event.KeyAdapter;
import java.awt.event.KeyEvent;
import java.awt.event.WindowAdapter;
import java.awt.event.WindowEvent;
import java.util.Properties;

import javax.swing.JFrame;

import eu.janschupke.lines.Game;
import eu.janschupke.lines.StaticMethods;
import eu.janschupke.lines.Values.ApplicationValues;
import eu.janschupke.lines.Values.Padding;
import eu.janschupke.lines.actions.ActionProvider;
import eu.janschupke.lines.config.Configurator;
import eu.janschupke.lines.gui.dialogs.AboutDialog;
import eu.janschupke.lines.gui.dialogs.ConfigDialog;
import eu.janschupke.lines.gui.dialogs.GameEndDialog;
import eu.janschupke.lines.gui.dialogs.GuideDialog;
import eu.janschupke.lines.gui.dialogs.ScoreDialog;
import eu.janschupke.lines.gui.menu.MainMenuBar;

/**
 *
 * Represents the main application frame.
 *
 */
public class MainView extends JFrame {
    private static final long serialVersionUID = 1L;

    private Game game;

    private ImageProvider imageProvider;

    private MainMenuBar mainMenu;
    private BoardPanel boardPanel;
    private InfoPanel infoPanel;
    private StatusBar statusBar;

    private ScoreDialog scoreDialog;
    private ConfigDialog configDialog;
    private AboutDialog aboutDialog;
    private GuideDialog guideDialog;
    private GameEndDialog gameEndDialog;

    public MainView(Game game) {
        this.game = game;

        game.getActionProvider().getWindowActions().setLAF();
        initFields();
        addComponents();
        setWindow();
        assignListeners();
        setVisible(true);
    }

    public void toggleUI() {
        Properties properties = game.getConfigProvider().getConfig().getProperties();

        String value = properties.getProperty(Configurator.Keys.TOOLTIPS.toString());
        boolean state = Boolean.parseBoolean(value);
        game.getActionProvider().getWindowActions().toggleTooltips(state);

        boardPanel.toggleUI();
        infoPanel.toggleUI();
        statusBar.toggleUI();

        scoreDialog.toggleUI();
        configDialog.toggleUI();
        aboutDialog.toggleUI();
        guideDialog.toggleUI();
        gameEndDialog.toggleUI();
    }

    private void setWindow() {
        setDefaultCloseOperation(JFrame.DO_NOTHING_ON_CLOSE);
        setTitle(ApplicationValues.NAME.getValue() + " v" + ApplicationValues.SHORT_VERSION.getValue());
        setResizable(false);
        setIconImage(imageProvider.getWindowIcon().getImage());
        setSizeAndLocation(false);
    }

    private void initFields() {
        imageProvider = new ImageProvider(game.getClassLoader());

        statusBar = new StatusBar(this);

        configDialog = new ConfigDialog(this);
        aboutDialog = new AboutDialog(this);
        guideDialog = new GuideDialog(this);
        gameEndDialog = new GameEndDialog(this);
        scoreDialog = new ScoreDialog(this);

        mainMenu = new MainMenuBar(this);

        boardPanel = new BoardPanel(this);
        infoPanel = new InfoPanel(this);

    }

    private void addComponents() {
        final int padding = Padding.DEFAULT_PADDING.getValue();

        setJMenuBar(mainMenu);

        setLayout(new BorderLayout(padding, padding));
        add(infoPanel, BorderLayout.NORTH);
        add(boardPanel, BorderLayout.CENTER);
        add(statusBar, BorderLayout.SOUTH);
    }

    private void setSizeAndLocation(boolean forceCentering) {
        Properties properties = game.getConfigProvider().getConfig().getProperties();
        String key;

        key = Configurator.Keys.POSITION_X.toString();
        int px = Integer.parseInt(properties.getProperty(key));

        key = Configurator.Keys.POSITION_Y.toString();
        int py = Integer.parseInt(properties.getProperty(key));

        /*
         * Board size is calculated from the amount of cells
         * and their side size.
         */
        int boardCells = game.getModel().getBoard().getSize();
        int boardSize = boardCells * getBoardPanel().getCellSize();

        boardPanel.setPreferredSize(new Dimension(boardSize, boardSize));

        pack();

        /*
         *  Makes the window centered if the default
         *  configuration is spotted, or force is set.
         */
        if(px == 0 || forceCentering) {
            setLocationRelativeTo(null);
        } else {
            setLocation(px, py);
        }
    }

    private void assignListeners() {
        final ActionProvider provider = getGame().getActionProvider();

        addKeyListener(new KeyAdapter() {
            @Override
            public void keyReleased(KeyEvent e) {
                StaticMethods.debug("Button pressed.");

                if(e.getKeyCode() == KeyEvent.VK_ESCAPE) {
                    StaticMethods.debug("Escape pressed.");
                    provider.getGameActions().cancelTurn();

                    toggleUI();
                }

                if(e.getKeyCode() == KeyEvent.VK_N) {
                    StaticMethods.debug("N pressed.");
                    provider.getGameActions().startNewTurn(true);

                    toggleUI();
                }
            }
        });

        this.addWindowListener(new WindowAdapter() {
            @Override
            public void windowClosing(WindowEvent windowEvent) {
                game.getActionProvider().getWindowActions().invokeExit();
            }
        });

        this.addComponentListener(new ComponentAdapter() {
            /*
             * Updates positions of all subwindows when the main window moves.
             */
            @Override
            public void componentMoved(ComponentEvent e) {
                try {
                    game.getActionProvider().getWindowActions().updateDialogPositions();
                } catch(Exception ex) {}
            }

            /*
             * Updates positions of all subwindows when the main window is resized.
             */
            @Override
            public void componentResized(ComponentEvent e) {
                try {
                    game.getActionProvider().getWindowActions().updateDialogPositions();
                } catch(Exception ex) {}
            }
        });
    }

    /**
     * Whenever a new {@link BoardPanel} is created (when changing size),
     * this is called in order to put it into the frame.
     * @param panel newly created {@link BoardPanel}
     */
    public void setBoardPanel(BoardPanel panel) {
        remove(boardPanel);
        boardPanel = panel;
        add(boardPanel, BorderLayout.CENTER);

        // The true flag forces the window to be centered.
        setSizeAndLocation(true);
    }

    public ScoreDialog getScoreDialog() { return scoreDialog; }
    public ConfigDialog getConfigDialog() { return configDialog; }
    public AboutDialog getAboutDialog() { return aboutDialog; }
    public GuideDialog getGuideDialog() { return guideDialog; }
    public GameEndDialog getGameEndDialog() { return gameEndDialog; }

    public InfoPanel getInfoPanel() { return infoPanel; }
    public BoardPanel getBoardPanel() { return boardPanel; }
    public StatusBar getStatusBar() { return statusBar; }

    public ImageProvider getImageProvider() { return imageProvider; }
    public Game getGame() { return game; }
}
