package io.schupke.lines.config;

import io.schupke.lines.Game;
import io.schupke.lines.Lang;
import io.schupke.lines.config.Configurator.Keys;
import io.schupke.lines.file.ConfigHandler;
import io.schupke.lines.gui.MainView;

/**
 *
 * Contains instances of configuration
 * file-handling and values-holding classes.
 * Loads the configuration upon creation.
 *
 */
public class ConfigProvider {
    private Game game;

    private ConfigHandler configHandler;
    private Configurator config;

    public ConfigProvider(Game game) {
        this.game = game;

        config = new Configurator(this);

        /*
         * File handler:
         */
        configHandler = new ConfigHandler(config);

        /*
         * Attempts to load the configuration from
         * previously saved file. If that fails,
         * default configuration is set.
         */
        if(!configHandler.load()) {
            config.setDefaultConfig();
        }

        // Loads a language file according to the configuration.
        int language = Integer.parseInt(config.getProperties().getProperty(
                Keys.LANGUAGE.toString()));
        Lang.loadLang(language);
    }

    public Configurator getConfig() { return config; }
    public ConfigHandler getConfigHandler() { return configHandler; }

    public MainView getWindow() { return game.getView(); }
}
