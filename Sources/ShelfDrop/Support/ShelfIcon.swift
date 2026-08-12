import AppKit

enum ShelfIcon {
    static func templateImage() -> NSImage {
        loadTemplateImage(withExtension: "png", pointSize: 18)
    }

    static func vectorTemplateImage() -> NSImage {
        loadTemplateImage(withExtension: "svg", pointSize: 16)
    }

    private static func loadTemplateImage(
        withExtension fileExtension: String,
        pointSize: CGFloat
    ) -> NSImage {
        guard
            let url = Bundle.main.url(forResource: "MenuBarTemplate", withExtension: fileExtension),
            let image = NSImage(contentsOf: url)
        else {
            if fileExtension != "png" {
                return loadTemplateImage(withExtension: "png", pointSize: pointSize)
            }
            return NSImage(systemSymbolName: "tray", accessibilityDescription: "temoto") ?? NSImage()
        }

        image.isTemplate = true
        image.size = NSSize(width: pointSize, height: pointSize)
        image.accessibilityDescription = "temoto"
        return image
    }
}
