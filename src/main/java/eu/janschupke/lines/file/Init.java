package eu.janschupke.lines.file;

import java.io.File;

import eu.janschupke.lines.StaticMethods;
import eu.janschupke.lines.Values.FileSystemValues;

/**
 *
 * Runs the initial checks and fixes any problems
 * that might have occurred in the configuration folder hierarchy.
 *
 */
public class Init {
    private File appFolder;

    public Init() {
        appFolder = new File(FileSystemValues.FULL_CONFIG_PATH.getValue());
    }

    /*
     * Checks for the existence of config. folders.
     * Creates the path if needed.
     */
    public void prepareFolders() {
        StaticMethods.printMethodName(this);

        /*
         * Creates the application folder structure.
         */
        if(!appFolder.exists()) {
            appFolder.mkdirs();
        }
    }
}
