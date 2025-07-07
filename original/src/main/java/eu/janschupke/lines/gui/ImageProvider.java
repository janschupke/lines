package eu.janschupke.lines.gui;

import java.awt.Image;

import javax.swing.ImageIcon;

/**
 *
 * Contains instances of and pointers to
 * all images used by this application.
 *
 */
public class ImageProvider {
    private ImageIcon blackBall;
    private ImageIcon blueBall;
    private ImageIcon greenBall;
    private ImageIcon orangeBall;
    private ImageIcon purpleBall;
    private ImageIcon redBall;
    private ImageIcon yellowBall;

    private ImageIcon cancelIcon;
    private ImageIcon okIcon;

    private ImageIcon configIcon;
    private ImageIcon exitIcon;
    private ImageIcon removeIcon;
    private ImageIcon scoreIcon;
    private ImageIcon infoIcon;
    private ImageIcon helpIcon;

    private ImageIcon dialogErrorIcon;
    private ImageIcon dialogIcon;
    private ImageIcon dialogWarningIcon;

    private ImageIcon vehicleLogo;
    private ImageIcon aboutVehicleLogo;

    private ImageIcon mainIcon;
    private ImageIcon windowIcon;
    private ImageIcon gameMenuIcon;

    public ImageProvider(ClassLoader loader) {
        final int iconSize = 16;

        /*
         * Default cell size is 55px. Ball size is diminished
         * by 12px to get some padding.
         */
        final int ballSize = 43;

        /*
         * Represents the size of images that are used for
         * dialog windows.
         */
        final int dialogSize = 60;

        // Balls:
        blackBall = resizeImage(new ImageIcon(loader.getResource("images/balls/black.png")), ballSize);
        blueBall = resizeImage(new ImageIcon(loader.getResource("images/balls/blue.png")), ballSize);
        greenBall = resizeImage(new ImageIcon(loader.getResource("images/balls/green.png")), ballSize);
        orangeBall = resizeImage(new ImageIcon(loader.getResource("images/balls/orange.png")), ballSize);
        purpleBall = resizeImage(new ImageIcon(loader.getResource("images/balls/purple.png")), ballSize);
        redBall = resizeImage(new ImageIcon(loader.getResource("images/balls/red.png")), ballSize);
        yellowBall = resizeImage(new ImageIcon(loader.getResource("images/balls/yellow.png")), ballSize);

        // Premade:
        cancelIcon = resizeImage(new ImageIcon(loader.getResource("images/cancel.png")), iconSize);
        okIcon = resizeImage(new ImageIcon(loader.getResource("images/ok.png")), iconSize);
        configIcon = resizeImage(new ImageIcon(loader.getResource("images/config.png")), iconSize);
        exitIcon = resizeImage(new ImageIcon(loader.getResource("images/exit.png")), iconSize);
        removeIcon = resizeImage(new ImageIcon(loader.getResource("images/remove.png")), iconSize);
        scoreIcon = resizeImage(new ImageIcon(loader.getResource("images/score.png")), iconSize);
        infoIcon = resizeImage(new ImageIcon(loader.getResource("images/info.png")), iconSize);
        helpIcon = resizeImage(new ImageIcon(loader.getResource("images/help.png")), iconSize);

        // Logos:
        vehicleLogo = new ImageIcon(loader.getResource("images/logo_vehicle.png"));
        aboutVehicleLogo = resizeImageBoth(vehicleLogo, 100, 89);

        // Various balls used as icons:
        mainIcon = resizeImage(new ImageIcon(loader.getResource("images/icon.gif")), iconSize);
        gameMenuIcon = resizeImage(new ImageIcon(loader.getResource("images/balls/blue.png")), iconSize);
        windowIcon = new ImageIcon(loader.getResource("images/balls/orange.png"));

        // Dialog icons:
        dialogIcon = resizeImage(new ImageIcon(loader.getResource("images/balls/green.png")), dialogSize);
        dialogWarningIcon = resizeImage(new ImageIcon(loader.getResource("images/balls/orange.png")), dialogSize);
        dialogErrorIcon = resizeImage(new ImageIcon(loader.getResource("images/balls/red.png")), dialogSize);
    }

    /**
     * Takes an image and a required size and scales it.
     * @param icon input image
     * @param size required size
     * @return scaled image
     */
    public ImageIcon resizeImage(ImageIcon icon, int size) {
        return resizeImageBoth(icon, size, size);
    }

    /**
     * Takes an image and a required size and scales it.
     * @param icon input image
     * @param w required width
     * @param h required height
     * @return scaled image
     */
    public ImageIcon resizeImageBoth(ImageIcon icon, int w, int h) {
        Image img = icon.getImage();
        Image newImg = img.getScaledInstance(w, h, Image.SCALE_SMOOTH);

        return new ImageIcon(newImg);
    }

    public ImageIcon getBlackBall() { return blackBall; }
    public ImageIcon getBlueBall() { return blueBall; }
    public ImageIcon getGreenBall() { return greenBall; }
    public ImageIcon getOrangeBall() { return orangeBall; }
    public ImageIcon getPurpleBall() { return purpleBall; }
    public ImageIcon getRedBall() { return redBall; }
    public ImageIcon getYellowBall() { return yellowBall; }

    public ImageIcon getConfigIcon() { return configIcon; }
    public ImageIcon getExitIcon() { return exitIcon; }
    public ImageIcon getRemoveIcon() { return removeIcon; }
    public ImageIcon getScoreIcon() { return scoreIcon; }
    public ImageIcon getInfoIcon() { return infoIcon; }
    public ImageIcon getHelpIcon() { return helpIcon; }

    public ImageIcon getVehicleLogo() { return vehicleLogo; }
    public ImageIcon getAboutVehicleLogo() { return aboutVehicleLogo; }

    public ImageIcon getMainIcon() { return mainIcon; }
    public ImageIcon getWindowIcon() { return windowIcon; }
    public ImageIcon getGameMenuIcon() { return gameMenuIcon; }

    public ImageIcon getDialogIcon() { return dialogIcon; }
    public ImageIcon getDialogWarningIcon() { return dialogWarningIcon; }
    public ImageIcon getDialogErrorIcon() { return dialogErrorIcon; }
    public ImageIcon getCancelIcon() { return cancelIcon; }
    public ImageIcon getOKIcon() { return okIcon; }
}
