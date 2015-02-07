package eu.janschupke.lines.gui.dialogs;

import java.awt.Dimension;
import java.awt.FlowLayout;
import java.awt.event.ActionEvent;

import javax.swing.AbstractAction;
import javax.swing.Action;
import javax.swing.BorderFactory;
import javax.swing.JComponent;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.SwingConstants;

import eu.janschupke.lines.Lang;
import eu.janschupke.lines.Values.ApplicationValues;
import eu.janschupke.lines.Values.Borders;
import eu.janschupke.lines.Values.Hotkeys;
import eu.janschupke.lines.gui.MainView;

/**
 *
 * Represents a dialog window with description
 * and information about the application.
 *
 */
public class AboutDialog extends GeneralDialog {
    private static final long serialVersionUID = 1L;

    private JPanel aboutFieldset;
    private JPanel specificsFieldset;
    private JPanel logoFieldset;
    private JLabel infoLabel;
    private JLabel specificsLabel;
    private JLabel vehicleLogoLabel;

    public AboutDialog(MainView win) {
        super(win, Lang.write("dialog.about.title"));

        initFields();
        setDimensions();
        addFields();
        assignHideHotkey();
        setIcons();
    }

    private void initFields() {
        aboutFieldset = new JPanel();
        aboutFieldset.setBorder(BorderFactory.createTitledBorder(
                Lang.write("dialog.about.title_inner")));

        specificsFieldset = new JPanel();
        specificsFieldset.setBorder(BorderFactory.createTitledBorder(
                Lang.write("dialog.about.subtitle")));

        logoFieldset = new JPanel();

        infoLabel = new JLabel("<html><div width=\"230\">" + Lang.write("dialog.about.info"));

        specificsLabel = new JLabel("<html><div width=\"230\">" +
                formatItem(
                        Lang.write("dialog.about.author"),
                        ApplicationValues.AUTHOR.getValue()) +
                formatItem(
                        Lang.write("dialog.about.version"),
                        ApplicationValues.VERSION.getValue()) +
                formatItem(
                        Lang.write("dialog.about.license"),
                        ApplicationValues.LICENSE.getValue()) +
                formatItem(
                        Lang.write("dialog.about.contact"),
                        ApplicationValues.CONTACT.getValue()) +
                formatItem(
                        Lang.write("dialog.about.site"),
                        ApplicationValues.SITE.getValue()));

        infoLabel.setVerticalAlignment(SwingConstants.TOP);
        infoLabel.setHorizontalAlignment(SwingConstants.LEFT);
        infoLabel.setBorder(Borders.TEXT_PADDING.getValue());

        specificsLabel.setVerticalAlignment(SwingConstants.TOP);
        specificsLabel.setHorizontalAlignment(SwingConstants.LEFT);
        specificsLabel.setBorder(Borders.TEXT_PADDING.getValue());

        vehicleLogoLabel = new JLabel(win.getImageProvider().getAboutVehicleLogo());
    }

    private void setDimensions() {
        setSize(270, 430);

        aboutFieldset.setPreferredSize(new Dimension(260, 110));
        specificsFieldset.setPreferredSize(new Dimension(260, 140));
        logoFieldset.setPreferredSize(new Dimension(260, 90));
    }

    private void addFields() {
        mainPanel.add(aboutFieldset);
        mainPanel.add(specificsFieldset);
        mainPanel.add(logoFieldset);

        aboutFieldset.setLayout(new FlowLayout());
        aboutFieldset.add(infoLabel);

        specificsFieldset.setLayout(new FlowLayout());
        specificsFieldset.add(specificsLabel);

        logoFieldset.setLayout(new FlowLayout());
        logoFieldset.add(vehicleLogoLabel);

        buttonPanel.remove(cancelButton);
    }

    /**
     * Applies some HTML formatting to the dialog text.
     * @param label the label that will be printed in bold
     * @param value value itself
     * @return formatted string
     */
    private String formatItem(String label, String value) {
        String output = "<b>" + label + "</b> " + value + "<br>";

        return output;
    }

    /**
     * Assigns a hotkey that hides the dialog.
     * Same action as the cancel button.
     */
    private void assignHideHotkey() {
        int focused = JComponent.WHEN_IN_FOCUSED_WINDOW;

        Action action = new AbstractAction(Lang.write("dialog.button.ok")) {
            private static final long serialVersionUID = 1L;
            {
                putValue(Action.ACTION_COMMAND_KEY, getValue(Action.NAME));
            }
            @Override
            public void actionPerformed(ActionEvent e) {
                // Resets the values according to configuration values.
                toggleUI();

                // Hides the dialog.
                setVisible(false);
            }
        };

        okButton.setAction(action);

        okButton.getInputMap(focused).put(Hotkeys.HIDE_DIALOG.getValue(), "HIDE_DIALOG");
        okButton.getActionMap().put("HIDE_DIALOG", okButton.getAction());
    }

    /**
     * Sets icons for components. Done separately to ensure compatibility
     * with the hotkey assignment procedure that replaces the component's value.
     */
    private void setIcons() {
        okButton.setIcon(win.getImageProvider().getOKIcon());
    }

    @Override
    protected void assignListeners() {}

    @Override
    public void toggleUI() {
        super.toggleUI();
    }
}
