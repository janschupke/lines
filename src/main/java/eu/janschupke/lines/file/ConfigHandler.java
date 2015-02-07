package eu.janschupke.lines.file;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;

import eu.janschupke.lines.Lang;
import eu.janschupke.lines.StaticMethods;
import eu.janschupke.lines.config.Configurator;
import eu.janschupke.lines.gui.dialogs.CustomDialogs;

/**
 *
 * Handles the operation with configuration files.
 * Takes care of creating files and loading and saving of config. properties.
 * @see Configurator
 *
 */
public class ConfigHandler extends FileHandler {
    //File with properties and names is specified in extended classes.
    private Configurator config;

    private FileOutputStream out;

    public ConfigHandler(Configurator config) {
        super();

        this.config = config;

        // A path to the application configuration file.
        file = new File(this.folder + System.getProperty("file.separator") + config.getFileName());
    }

    private void storeData() throws IOException {
        out = new FileOutputStream(file);
        config.getProperties().store(out, "");
        out.close();
    }

    /**
     * Tries to load values. Sets defaults if the file is not available.
     */
    @Override
    public boolean load() {
        super.load();

        try {
            if(file.exists()) {
                // Loads from existing.
                config.getProperties().load(new FileInputStream(file));

                if(!config.checkConfigIntegrity()) {
                    config.setDefaultConfig();
                    storeData();
                }

            } else {
                /*
                 * Creates a new config. file and saves defaults.
                 */
                config.setDefaultConfig();
                storeData();
            }

            return true;

        } catch (Exception e) {
            StaticMethods.debug("Exception in " + StaticMethods.getMethodName(this));

            /*
             * Cannot even log the error here.
             * Should be called from somewhere else.
             */

            return false;
        }
    }

    /**
     * Tries to save new values into the file.
     * @return success state
     */
    @Override
    public boolean save() {
        super.save();

        try {
            /*
             * Save the config. file.
             */
            storeData();

            return true;

        } catch (Exception e) {
            StaticMethods.debug("Exception in " + StaticMethods.getMethodName(this));

            // Logs the error.
            config.getProvider().getWindow().getGame().getErrorHandler()
                .saveError(StaticMethods.getMethodName(this), e.getMessage());

            // Shows error message on the screen.
            CustomDialogs.showErrorDialog(config.getProvider().getWindow(),
                    Lang.write("file.config.save.error"));

            return false;
        }
    }
}
