import AppKit
import OSLog

private let finderImportLogger = Logger(
    subsystem: "work.hayashigoto.ShelfDrop",
    category: "FinderImport"
)

@main
@MainActor
final class ShelfDropApplication: NSObject, NSApplicationDelegate, NSMenuDelegate {
    private static let bundleIdentifier = "work.hayashigoto.ShelfDrop"
    private static let shared = ShelfDropApplication()
    private static var singleInstanceGuard: SingleInstanceGuard?
    private static let latestDownloadURL = URL(
        string: "https://github.com/hayashiii-ghub/temoto/releases/latest/download/temoto-macos.zip"
    )!
    private static let releasesURL = URL(
        string: "https://github.com/hayashiii-ghub/temoto/releases/latest"
    )!

    private let store = ShelfStore()
    private let finderSelectionReader = FinderSelectionReader()
    private lazy var shelfWindowController = ShelfWindowController(store: store)
    private var addFinderSelectionHotKey: GlobalHotKey?
    private var toggleShelfHotKey: GlobalHotKey?
    private var statusItem: NSStatusItem?
    private var copyMenuItem: NSMenuItem?
    private var moveMenuItem: NSMenuItem?
    private var zipMenuItem: NSMenuItem?
    private var clearMenuItem: NSMenuItem?

    static func main() {
        guard let instanceGuard = SingleInstanceGuard(identifier: bundleIdentifier) else {
            activateRunningInstance()
            return
        }
        singleInstanceGuard = instanceGuard

        let app = NSApplication.shared
        app.setActivationPolicy(.accessory)
        app.delegate = shared
        terminateLegacyInstances()
        app.run()
    }

    private static func activateRunningInstance() {
        let runningInstance = NSWorkspace.shared.runningApplications.first {
            $0.bundleIdentifier == bundleIdentifier
        }
        runningInstance?.activate(options: [])
    }

    private static func terminateLegacyInstances() {
        let currentProcessIdentifier = ProcessInfo.processInfo.processIdentifier
        for application in NSWorkspace.shared.runningApplications where
            application.processIdentifier != currentProcessIdentifier
            && (application.bundleIdentifier == bundleIdentifier || application.localizedName == "ShelfDrop") {
            application.terminate()
        }
    }

    func applicationDidFinishLaunching(_ notification: Notification) {
        store.discardStaleManagedFiles()

        configureStatusItem()
        toggleShelfHotKey = GlobalHotKey(shortcut: .toggleShelf) { [weak self] in
            self?.shelfWindowController.toggleShelf()
        }
        NSWorkspace.shared.notificationCenter.addObserver(
            self,
            selector: #selector(frontmostApplicationDidChange),
            name: NSWorkspace.didActivateApplicationNotification,
            object: nil
        )
        updateFinderSelectionHotKey(
            frontmostBundleIdentifier: NSWorkspace.shared.frontmostApplication?.bundleIdentifier
        )
    }

    func applicationWillTerminate(_ notification: Notification) {
        NSWorkspace.shared.notificationCenter.removeObserver(self)
        addFinderSelectionHotKey = nil
        toggleShelfHotKey = nil
        store.clear()
    }

    func menuWillOpen(_ menu: NSMenu) {
        let hasItems = !store.items.isEmpty
        let canManageItems = hasItems && !store.isExporting
        copyMenuItem?.isEnabled = canManageItems
        moveMenuItem?.isEnabled = canManageItems
        zipMenuItem?.isEnabled = canManageItems
        clearMenuItem?.isEnabled = canManageItems
    }

    private func configureStatusItem() {
        let item = NSStatusBar.system.statusItem(withLength: NSStatusItem.squareLength)
        item.button?.image = ShelfIcon.templateImage()
        item.button?.imagePosition = .imageOnly

        let menu = NSMenu()
        menu.delegate = self

        let addSelectionItem = NSMenuItem(
            title: "Add Finder Selection",
            action: #selector(addFinderSelection),
            keyEquivalent: "\t"
        )
        addSelectionItem.keyEquivalentModifierMask = [.option]
        menu.addItem(addSelectionItem)
        let toggleShelfItem = NSMenuItem(
            title: "Toggle Shelf",
            action: #selector(toggleShelf),
            keyEquivalent: "\t"
        )
        toggleShelfItem.keyEquivalentModifierMask = [.option, .shift]
        menu.addItem(toggleShelfItem)
        menu.addItem(
            NSMenuItem(
                title: "Add Clipboard Text",
                action: #selector(addClipboardText),
                keyEquivalent: ""
            )
        )
        menu.addItem(.separator())

        let copyItem = NSMenuItem(title: "Copy Items To...", action: #selector(copyItems), keyEquivalent: "")
        let moveItem = NSMenuItem(title: "Move Items To...", action: #selector(moveItems), keyEquivalent: "")
        let zipItem = NSMenuItem(title: "Create ZIP...", action: #selector(createZip), keyEquivalent: "")
        copyMenuItem = copyItem
        moveMenuItem = moveItem
        zipMenuItem = zipItem
        menu.addItem(copyItem)
        menu.addItem(moveItem)
        menu.addItem(zipItem)

        menu.addItem(.separator())

        let clearItem = NSMenuItem(title: "Clear Shelf", action: #selector(clearShelf), keyEquivalent: "")
        clearMenuItem = clearItem
        menu.addItem(clearItem)

        menu.addItem(.separator())
        menu.addItem(NSMenuItem(title: "Download Latest Version...", action: #selector(downloadLatestVersion), keyEquivalent: ""))
        menu.addItem(NSMenuItem(title: "Open Release Page", action: #selector(openReleasePage), keyEquivalent: ""))

        menu.addItem(.separator())
        menu.addItem(NSMenuItem(title: "Quit temoto", action: #selector(quit), keyEquivalent: "q"))

        for item in menu.items where item.action != nil {
            item.target = self
        }

        item.menu = menu
        statusItem = item
    }

    @objc private func toggleShelf() {
        shelfWindowController.toggleShelf()
    }

    @objc private func addClipboardText() {
        guard store.addClipboardText(NSPasteboard.general.string(forType: .string)) else { return }
        shelfWindowController.showShelf()
    }

    @objc private func frontmostApplicationDidChange(_ notification: Notification) {
        let application = notification.userInfo?[NSWorkspace.applicationUserInfoKey]
            as? NSRunningApplication
        updateFinderSelectionHotKey(frontmostBundleIdentifier: application?.bundleIdentifier)
    }

    private func updateFinderSelectionHotKey(frontmostBundleIdentifier: String?) {
        let shouldEnable = FinderShortcutAvailability.isEnabled(
            frontmostBundleIdentifier: frontmostBundleIdentifier
        )

        if shouldEnable, addFinderSelectionHotKey == nil {
            addFinderSelectionHotKey = GlobalHotKey(shortcut: .addFinderSelection) { [weak self] in
                self?.addFinderSelection()
            }
            if addFinderSelectionHotKey == nil {
                finderImportLogger.error("Could not register the Option-Tab shortcut")
            } else {
                finderImportLogger.info("Option-Tab enabled for Finder")
            }
        } else if !shouldEnable, addFinderSelectionHotKey != nil {
            addFinderSelectionHotKey = nil
            finderImportLogger.info("Option-Tab disabled outside Finder")
        }
    }

    @objc private func addFinderSelection() {
        let frontmostBundleIdentifier = NSWorkspace.shared.frontmostApplication?.bundleIdentifier
        guard frontmostBundleIdentifier == FinderSelectionReader.finderBundleIdentifier else {
            finderImportLogger.info(
                "Ignored shortcut for frontmost app: \(frontmostBundleIdentifier ?? "unknown", privacy: .public)"
            )
            return
        }

        do {
            let urls = try finderSelectionReader.selectedFileURLs()
            guard !urls.isEmpty else {
                finderImportLogger.info("Finder selection was empty")
                return
            }
            store.addFileURLs(urls)
            finderImportLogger.info("Added \(urls.count) Finder selection item(s)")
            shelfWindowController.showShelf()
        } catch {
            finderImportLogger.error("Finder selection failed: \(error.localizedDescription, privacy: .public)")
            let alert = NSAlert(error: error)
            alert.messageText = "Could Not Read Finder Selection"
            alert.runModal()
        }
    }

    @objc private func copyItems() {
        store.copyItemsToChosenFolder()
    }

    @objc private func moveItems() {
        store.moveItemsToChosenFolder()
    }

    @objc private func createZip() {
        store.createZipArchive()
    }

    @objc private func clearShelf() {
        store.clear()
    }

    @objc private func downloadLatestVersion() {
        NSWorkspace.shared.open(Self.latestDownloadURL)
    }

    @objc private func openReleasePage() {
        NSWorkspace.shared.open(Self.releasesURL)
    }

    @objc private func quit() {
        NSApp.terminate(nil)
    }
}
