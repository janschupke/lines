package io.schupke.lines;

import java.io.UnsupportedEncodingException;
import java.util.Locale;
import java.util.Properties;
import java.util.ResourceBundle;
import java.util.Set;

import io.schupke.lines.Values.Debug;

/**
 *
 * Takes care of loading required resource files and returning text strings.
 *
 */
public class Lang {
    private static ResourceBundle defaultLanguage, selectedLanguage;
    private static Properties activeLanguage;

    /**
     * Loads the correct values.
     */
    public static void loadLang(Integer lang) {
        // Default language that is guaranteed to contain all the required keys.
        defaultLanguage = ResourceBundle.getBundle("languages/Language", new Locale("en", "GB"));

        // This properties object contains all currently active keys.
        activeLanguage = new Properties();

        // Tries to load a language selected by user. This bundle may be incomplete.
        switch(lang) {
            case 1:
                selectedLanguage = ResourceBundle.getBundle("languages/Language", new Locale("cs", "CZ"));
                break;

            default:
            case 0:
                selectedLanguage = null;
                break;
        }

        // A set of all keys in the defaultLanguage bundle.
        Set<String> set = defaultLanguage.keySet();

        // No custom language was selected. Default language will be used.
        if(selectedLanguage == null) {
            for(String key : set) {
                activeLanguage.setProperty(key, defaultLanguage.getString(key));
            }
        /*
         * Iterates through all the defaultLanguage keys is performed.
         * If the key is present in the selectedLanguage, its value is prioritized.
         * If the key is missing, default value is used.
         * The result is used as the active language.
         */
        } else {
            for(String key : set) {
                if(selectedLanguage.containsKey(key)) {
                    activeLanguage.setProperty(key, selectedLanguage.getString(key));
                } else {
                    activeLanguage.setProperty(key, defaultLanguage.getString(key));
                }
            }
        }
    }

    /**
     * Displays required string.
     */
    // Suppressing to ignore 'Dead code' when DEBUG is disabled.
    @SuppressWarnings("all")
    public static String write(String key) {
        /*
         * If the key is not found, warning is printed.
         */
        if(Debug.STANDARD.getValue() && !activeLanguage.containsKey(key)) {
            System.out.println("LANGUAGE WARNING:\n\t" + key);
        }

        try {
            return new String(activeLanguage.getProperty(key).getBytes("ISO-8859-1"), "UTF-8");
        } catch(UnsupportedEncodingException e) {
            return "";
        } catch(NullPointerException e) {
            return "";
        }
    }
}
