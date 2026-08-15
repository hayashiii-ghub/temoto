import AppKit

enum ShelfIcon {
    static func templateImage() -> NSImage {
        loadTemplateImage(pointSize: 20)
    }

    static func vectorTemplateImage() -> NSImage {
        loadTemplateImage(pointSize: 16)
    }

    private static func loadTemplateImage(pointSize: CGFloat) -> NSImage {
        guard
            let url = Bundle.main.url(forResource: "MenuBarTemplate", withExtension: "svg"),
            let image = NSImage(contentsOf: url)
        else {
            return NSImage(systemSymbolName: "tray", accessibilityDescription: "temoto") ?? NSImage()
        }

        image.isTemplate = true
        image.size = NSSize(width: pointSize, height: pointSize)
        image.accessibilityDescription = "temoto"
        return image
    }
}
