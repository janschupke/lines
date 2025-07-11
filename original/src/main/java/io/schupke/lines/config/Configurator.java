package io.schupke.lines.config;

import java.awt.Point;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;

import io.schupke.lines.StaticMethods;

/**
 *
 * Holds information about all application configuration properties,
 * their names and default values.
 *
 */
public class Configurator {
    ConfigProvider provider;

    /**
     *
     * Each key represents one configuration value
     * that can be stored for this application.
     *
     */
    public enum Keys {
        SIZE_X, SIZE_Y, POSITION_X, POSITION_Y,
        LANGUAGE, TOOLTIPS, DISABLE_CONFIRMS,
        PAINT_GRADIENT
    }

    protected Map<String, String> defaultValues;

    protected Properties properties;
    protected String fileName;

    /*
     * Intentionally set to low values. The actual window size,
     * which is higher than this, will be determined
     * by the minimal dimensions specified in the MainView class.
     */
    public static final Integer DEFAULT_SIZE_X = 100;
    public static final Integer DEFAULT_SIZE_Y = 100;

    public Configurator(ConfigProvider provider) {
        this.provider = provider;

        properties = new Properties();
        defaultValues = new HashMap<String, String>();

        fileName = "app.conf";

        assignDefaultValues();
    }

    /**
     * Assigns a default value to every key.
     */
    private void assignDefaultValues() {
        defaultValues.put(Keys.SIZE_X.toString(), DEFAULT_SIZE_X.toString());
        defaultValues.put(Keys.SIZE_Y.toString(), DEFAULT_SIZE_Y.toString());
        defaultValues.put(Keys.POSITION_X.toString(), "0");
        defaultValues.put(Keys.POSITION_Y.toString(), "0");
        defaultValues.put(Keys.LANGUAGE.toString(), "0");
        defaultValues.put(Keys.TOOLTIPS.toString(), "true");
        defaultValues.put(Keys.DISABLE_CONFIRMS.toString(), "false");
        defaultValues.put(Keys.PAINT_GRADIENT.toString(), "true");
    }

    /**
     * Sets default values in case of missing file or initial setup.
     */
    public void setDefaultConfig() {
        StaticMethods.printMethodName(this);

        for (Map.Entry<String, String> entry : defaultValues.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue().toString();
            properties.setProperty(key, value);
        }
    }

    /**
     * Checks for missing keys in the configuration.
     * @return Result.
     */
    public boolean checkConfigIntegrity() {
        StaticMethods.printMethodName(this);

        for (Keys k : Keys.values()) {
            if(properties.getProperty(k.toString()) == null ||
                !properties.containsKey(k.toString())) {

                return false;
            }
        }

        return true;
    }

    public void saveWindowDimensions(Integer sizeX, Integer sizeY, Point location) {
        properties.setProperty(
                Keys.SIZE_X.toString(),
                sizeX.toString());

        properties.setProperty(
                Keys.SIZE_Y.toString(),
                sizeY.toString());

        properties.setProperty(
                Keys.POSITION_X.toString(),
                Integer.toString((int)location.getX()));

        properties.setProperty(
                Keys.POSITION_Y.toString(),
                Integer.toString((int)location.getY()));
    }

    public void saveLanguage(int value) {
        properties.setProperty(
                Keys.LANGUAGE.toString(),
                Integer.toString(value));
    }

    public void saveTooltips(boolean value) {
        properties.setProperty(
                Keys.TOOLTIPS.toString(),
                Boolean.toString(value));
    }

    public void saveConfirms(boolean value) {
        properties.setProperty(
                Keys.DISABLE_CONFIRMS.toString(),
                Boolean.toString(value));
    }

    public void saveGradient(boolean value) {
        properties.setProperty(
                Keys.PAINT_GRADIENT.toString(),
                Boolean.toString(value));
    }

    /**
     * Returns configuration filename.
     * @return configuration filename
     */
    public String getFileName() {
        return fileName;
    }

    public Properties getProperties() {
        return properties;
    }

    public Map<String, String> getDefaultValues() {
        return defaultValues;
    }

    public ConfigProvider getProvider() { return provider; }
}