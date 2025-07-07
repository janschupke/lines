package eu.janschupke.lines.file;

import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.io.Serializable;

import eu.janschupke.lines.StaticMethods;

/**
 *
 * A class that provides static versions of
 * file-handling methods.
 *
 */
public class FileManipulator implements Serializable {
    private static final long serialVersionUID = 1L;

    /**
     * Object serialization.
     * @param file destination file
     * @param object data structure to be saved
     * @return true if successfully saved, false otherwise
     */
    public static boolean writeObj(String file, Object object) {
        try {
            FileOutputStream fos = new FileOutputStream(file);
            ObjectOutputStream oos = new ObjectOutputStream(fos);
            oos.writeObject(object);
            oos.flush();
            oos.close();

            return true;
        } catch (FileNotFoundException e) {
            StaticMethods.debug(e.getMessage());
        } catch(Exception e) {
            StaticMethods.debug(e.getMessage());
        }

        return false;
    }

    /**
     * Object deserialization.
     * @param file the file to be read from
     * @return data structure that was loaded,
     * or null in case of failure
     */
    public static Object readObj(String file) {
        Object object = null;

        try {
            FileInputStream fis = new FileInputStream(file);
            ObjectInputStream ois = new ObjectInputStream(fis);
            object = ois.readObject();
            ois.close();
        } catch (Exception e) {
            FileManipulator.writeObj(file, null);

            StaticMethods.debug(e.getMessage());
        }

        return object;
    }

    /**
     * Reads a plain text file.
     * @return contents of a text file
     */
    public static String readText(String path) {

        String content = "";
        File f = new File(path);
        FileInputStream fis = null;
        BufferedInputStream bis = null;
        BufferedReader dis = null;

        String inputLine = "";

        try {

            fis = new FileInputStream(f);
            bis = new BufferedInputStream(fis);
            dis = new BufferedReader(new InputStreamReader(bis));

            /*
             * Reads lines.
             */
            while ((inputLine = dis.readLine()) != null) {
                content += inputLine + System.getProperty("line.separator");
            }

            /*
             * Disposes of all the resources after using them.
             */
            fis.close();
            bis.close();
            dis.close();

        } catch (FileNotFoundException e) {
            StaticMethods.debug(e.getMessage());
        } catch (IOException e) {
            StaticMethods.debug(e.getMessage());
        }

        return content;
    }
}
