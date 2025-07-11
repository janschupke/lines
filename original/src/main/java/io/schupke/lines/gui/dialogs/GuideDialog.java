package io.schupke.lines.gui.dialogs;

import java.awt.Insets;
import java.awt.event.ActionEvent;
import java.io.File;

import javax.swing.AbstractAction;
import javax.swing.Action;
import javax.swing.JComponent;
import javax.swing.JEditorPane;
import javax.swing.JScrollPane;

import io.schupke.lines.Lang;
import io.schupke.lines.Values.FileSystemValues;
import io.schupke.lines.Values.GlobalLimits;
import io.schupke.lines.Values.Hotkeys;
import io.schupke.lines.file.FileManipulator;
import io.schupke.lines.gui.MainView;

/**
 *
 * Represents a Guide / Help window for the application.
 * Consists of one big ScrollPane, containing a HTML file.
 *
 */
public class GuideDialog extends GeneralDialog {
    private static final long serialVersionUID = 1L;

    private JEditorPane textArea;
    private JScrollPane areaScroller;

    private boolean isAvailable;

    public GuideDialog(MainView win) {
        super(win, Lang.write("dialog.guide.title"));

        initFields();
        setDimensions();
        addFields();
        assignListeners();
        assignHideHotkey();
        openDocs();
        setIcons();
    }

    private void initFields() {
        isAvailable = true;

        textArea = new JEditorPane();
        textArea.setContentType("text/html");
        textArea.setEditable(false);
        textArea.setMargin(new Insets(0, 0, 0, 0));

        areaScroller = new JScrollPane(textArea,
                JScrollPane.VERTICAL_SCROLLBAR_ALWAYS,
                JScrollPane.HORIZONTAL_SCROLLBAR_NEVER);
        areaScroller.getVerticalScrollBar().setUnitIncrement(GlobalLimits.SCROLLBAR_SPEED.getValue());
    }

    private void setDimensions() {
        setSize(800, 600);
    }

    private void addFields() {
        add(areaScroller);

        buttonPanel.remove(cancelButton);
    }

    /**
     * Attempts to read the HTML documentation file,
     * which should be positioned in the same directory
     * as the executable file.
     */
    private void openDocs() {
        // Represents a full path to the folder where the .jar file is located.
        String jarDir = new File(GuideDialog.class.getProtectionDomain().getCodeSource().
                getLocation().getPath()).getParent();

        // Represents a full path to the folder where the documentation HTML file is located.
        String docDir = jarDir +
                System.getProperty("file.separator") +
                FileSystemValues.DOCS_ROOT.getValue();

        // Represents a full path to the HTML file itself.
        String guideText = FileManipulator.readText(docDir +
                System.getProperty("file.separator") +
                "index.html");

        /*
         * A hot-fix solution for displaying the images inside the JTextPane.
         */
        String imgPath, imgTag;

        imgPath = docDir + System.getProperty("file.separator") + "hint.png";
        imgTag = "<img src=\"file:" + imgPath + "\" alt=\"Hint\">";
        guideText = guideText.replace("[hint]", imgTag);

        imgPath = docDir + System.getProperty("file.separator") + "ball.png";
        imgTag = "<img src=\"file:" + imgPath + "\" alt=\"Ball\">";
        guideText = guideText.replace("[ball]", imgTag);

        textArea.setText(guideText);

        if(guideText.isEmpty()) {
            isAvailable = false;
        }

//      ClassLoader loader = win.getGame().getClassLoader();
//
//      String docDir = FileSystemValues.DOCS_ROOT.getValue() +
//              System.getProperty("file.separator");
//
//      String docIndex = docDir + "index.html";
//
//      URL guidePath = loader.getResource(docIndex);
//
//      try {
//          textArea.setPage(guidePath);
//      } catch(Exception e) {
//          isAvailable = false;
//      }
    }

    /**
     * Sets icons for components. Done separately to ensure compatibility
     * with the hotkey assignment procedure that replaces the component's value.
     */
    private void setIcons() {
        okButton.setIcon(win.getImageProvider().getOKIcon());
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

    @Override
    protected void assignListeners() {}

    public boolean isAvailable() { return isAvailable; }
}
