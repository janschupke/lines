package eu.janschupke.lines.file;

import java.io.File;

import eu.janschupke.lines.StaticMethods;
import eu.janschupke.lines.Values.FileSystemValues;

/**
 *
 * A class from which all file handling classes derive.
 * Calls the Init class that takes care of folder integrity verification.
 *
 */
public abstract class FileHandler {
    protected Init init;

    protected File file;
    protected File folder;

    public FileHandler() {
        init = new Init();

        folder = new File(FileSystemValues.FULL_CONFIG_PATH.getValue());
    }

    /**
     * File loading method stub. Calls init
     * in order to prepare the folder structure.
     * @return true if successful, false otherwise
     */
    public boolean load() {
        StaticMethods.printMethodName(this);

        init.prepareFolders();

        return true;
    }

    /**
     * File saving method stub. Calls init
     * in order to prepare the folder structure.
     * @return true if successful, false otherwise
     */
    public boolean save() {
        StaticMethods.printMethodName(this);

        init.prepareFolders();

        return true;
    }
}
