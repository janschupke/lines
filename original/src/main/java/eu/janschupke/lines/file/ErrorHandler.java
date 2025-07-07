package eu.janschupke.lines.file;

import java.io.File;
import java.io.FileOutputStream;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Calendar;

import eu.janschupke.lines.StaticMethods;

/**
 *
 * Takes care of saving error logs.
 *
 */
public class ErrorHandler extends FileHandler {
    private FileOutputStream out;

    public ErrorHandler() {
        super();

        file = new File(this.folder +
                System.getProperty("file.separator") +
                "error.log");
    }

    /**
     * Attempts to save the error log.
     * @param where location of the error occurrence in the application
     * @param message message received from the error occurrence
     */
    public boolean saveError(String where, String message) {
        StaticMethods.printMethodName(this);

        init.prepareFolders();

        /*
         * Tries to log the error.
         */
        try{
            out = new FileOutputStream(file, true);

            /*
             * Formats a string that represents the exact
             * DateTime of the error occurrence.
             */
            DateFormat dateFormat = new SimpleDateFormat("yyyy/MM/dd HH:mm:ss");
            Calendar cal = Calendar.getInstance();
            String now = dateFormat.format(cal.getTime());

            /*
             * Prints the error log information into the file.
             */
            out.write(( now + "\n" ).getBytes());
            out.write( ("\t>>> " + where + "\n").getBytes() );
            out.write( ("\t>>> " + message + "\n").getBytes() );
            out.write( ("\n").getBytes() );

            out.flush();
            out.close();

            return true;

        } catch (Exception e) {

            // Returns an unsuccessful state.
            return false;

        /*
         * Makes sure the file is closed.
         */
        } finally {
            try {
                if(out != null) {
                    out.close();
                }

            } catch (Exception e) {}
        }
    }
}