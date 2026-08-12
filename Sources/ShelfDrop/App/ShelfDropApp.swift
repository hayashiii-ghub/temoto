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
    private let presentationPreference = ShelfPresentationPreference()
    private lazy var shelfWindowController = ShelfWindowController(
        store: store,
        onReturnToMenuBar: { [weak self] in
            self?.selectPresentationMode(.menuBar)
        },
        onShowMenu: { [weak self] in
            self?.showStatusMenu()
        }
    )
    private lazy var menuBarShelfController = MenuBarShelfController(
        store: store,
        onKeepOnScreen: { [weak self] in
            self?.selectPresentationMode(.floating)
        },
        onShowMenu: { [weak self] in
            self?.showStatusMenu()
        }
    )
    private var addFinderSelectionHotKey: GlobalHotKey?
    private var toggleShelfHotKey: GlobalHotKey?
    private var statusItem: NSStatusItem?
    private var statusMenu: NSMenu?
    private var copyMenuItem: NSMenuItem?
    private var moveMenuItem: NSMenuItem?
    private var zipMenuItem: NSMenuItem?
    private var clearMenuItem: NSMenuItem?
    private var floatingShelfMenuItem: NSMenuItem?
    private var menuBarShelfMenuItem: NSMenuItem?

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
            self?.togglePreferredShelf()
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
        floatingShelfMenuItem?.state = presentationPreference.mode == .floating ? .on : .off
        menuBarShelfMenuItem?.state = presentationPreference.mode == .menuBar ? .on : .off
    }

    private func configureStatusItem() {
        let item = NSStatusBar.system.statusItem(withLength: NSStatusItem.squareLength)
        if let button = item.button {
            button.image = ShelfIcon.templateImage()
            button.imagePosition = .imageOnly
            button.target = self
            button.action = #selector(statusItemButtonPressed(_:))
            button.sendAction(on: [.leftMouseUp, .rightMouseUp])
        }

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

        let shelfLocationItem = NSMenuItem(title: "Shelf Location", action: nil, keyEquivalent: "")
        let shelfLocationMenu = NSMenu()
        let floatingItem = NSMenuItem(
            title: "On Screen",
            action: #selector(useFloatingShelf),
            keyEquivalent: ""
        )
        let menuBarItem = NSMenuItem(
            title: "Menu Bar",
            action: #selector(useMenuBarShelf),
            keyEquivalent: ""
        )
        floatingItem.target = self
        menuBarItem.target = self
        shelfLocationMenu.addItem(floatingItem)
        shelfLocationMenu.addItem(menuBarItem)
        shelfLocationItem.submenu = shelfLocationMenu
        floatingShelfMenuItem = floatingItem
        menuBarShelfMenuItem = menuBarItem
        menu.addItem(shelfLocationItem)

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

        statusMenu = menu
        statusItem = item
    }

    @objc private func statusItemButtonPressed(_ sender: NSStatusBarButton) {
        if NSApp.currentEvent?.type == .rightMouseUp {
            showStatusMenu()
        } else {
            let event = NSApp.currentEvent
            let eventWindow = event?.window
            let eventLocation = event.flatMap { event in
                eventWindow?.convertPoint(toScreen: event.locationInWindow)
            }
            togglePreferredShelf(
                relativeTo: sender,
                clickLocation: eventLocation ?? NSEvent.mouseLocation,
                clickScreen: eventWindow?.screen
            )
        }
    }

    @objc private func toggleShelf() {
        DispatchQueue.main.async { [weak self] in
            self?.togglePreferredShelf()
        }
    }

    @objc private func addClipboardText() {
        guard store.addClipboardText(NSPasteboard.general.string(forType: .string)) else { return }
        DispatchQueue.main.async { [weak self] in
            self?.showPreferredShelf()
        }
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
            showPreferredShelf()
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

    @objc private func useFloatingShelf() {
        selectPresentationMode(.floating)
    }

    @objc private func useMenuBarShelf() {
        selectPresentationMode(.menuBar)
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

    private func showPreferredShelf() {
        switch presentationPreference.mode {
        case .floating:
            menuBarShelfController.hideShelf()
            shelfWindowController.showShelf()
        case .menuBar:
            shelfWindowController.hideShelf()
            guard let button = statusItem?.button else { return }
            menuBarShelfController.showShelf(relativeTo: button)
        }
    }

    private func togglePreferredShelf(
        relativeTo clickedButton: NSStatusBarButton? = nil,
        clickLocation: NSPoint? = nil,
        clickScreen: NSScreen? = nil
    ) {
        switch presentationPreference.mode {
        case .floating:
            menuBarShelfController.hideShelf()
            shelfWindowController.toggleShelf()
        case .menuBar:
            shelfWindowController.hideShelf()
            guard let button = clickedButton ?? statusItem?.button else { return }
            menuBarShelfController.toggleShelf(
                relativeTo: button,
                clickLocation: clickLocation,
                clickScreen: clickScreen
            )
        }
    }

    private func selectPresentationMode(_ mode: ShelfPresentationMode) {
        presentationPreference.mode = mode
        shelfWindowController.hideShelf()
        menuBarShelfController.hideShelf()

        DispatchQueue.main.async { [weak self] in
            self?.showPreferredShelf()
        }
    }

    private func showStatusMenu() {
        guard let statusItem, let statusMenu else { return }

        menuBarShelfController.hideShelf()
        statusItem.menu = statusMenu
        statusItem.button?.performClick(nil)
        statusItem.menu = nil
    }
}
