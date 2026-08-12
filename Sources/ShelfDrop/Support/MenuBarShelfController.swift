import AppKit
import SwiftUI

@MainActor
final class MenuBarShelfController: NSObject, NSWindowDelegate {
    private static let shelfSize = NSSize(width: 230, height: 230)
    private static let menuBarGap: CGFloat = 4
    private static let screenEdgeInset: CGFloat = 8

    private let store: ShelfStore
    private let onKeepOnScreen: () -> Void
    private let onShowMenu: () -> Void
    private let presentation = ShelfPresentationState()
    private var panel: NSPanel?
    private var anchorFrame = NSRect.zero
    private var localEventMonitor: Any?
    private var globalEventMonitor: Any?

    init(
        store: ShelfStore,
        onKeepOnScreen: @escaping () -> Void,
        onShowMenu: @escaping () -> Void
    ) {
        self.store = store
        self.onKeepOnScreen = onKeepOnScreen
        self.onShowMenu = onShowMenu
        super.init()
    }

    var isShelfVisible: Bool {
        panel?.isVisible == true
    }

    func showShelf(
        relativeTo button: NSStatusBarButton,
        clickLocation: NSPoint? = nil,
        clickScreen: NSScreen? = nil
    ) {
        let panel = shelfPanel()

        if presentation.isCollapsed {
            presentation.isCollapsed = false
        }

        positionPanel(
            panel,
            relativeTo: button,
            clickLocation: clickLocation,
            clickScreen: clickScreen
        )
        startEventMonitors()
        panel.orderFrontRegardless()
        panel.makeKey()
    }

    func toggleShelf(
        relativeTo button: NSStatusBarButton,
        clickLocation: NSPoint? = nil,
        clickScreen: NSScreen? = nil
    ) {
        if isShelfVisible {
            hideShelf()
        } else {
            showShelf(
                relativeTo: button,
                clickLocation: clickLocation,
                clickScreen: clickScreen
            )
        }
    }

    func hideShelf() {
        panel?.orderOut(nil)
        stopEventMonitors()
    }

    private func shelfPanel() -> NSPanel {
        if let panel {
            return panel
        }

        let size = Self.shelfSize
        let panel = MenuBarShelfPanel(
            contentRect: NSRect(origin: .zero, size: size),
            styleMask: [.borderless, .nonactivatingPanel],
            backing: .buffered,
            defer: false
        )

        panel.identifier = NSUserInterfaceItemIdentifier("TemotoMenuBarShelfPanel")
        panel.contentViewController = NSHostingController(
            rootView: ContentView(
                store: store,
                presentation: presentation,
                mode: .menuBar,
                onCollapseChange: { _ in },
                onDismiss: { [weak self] in
                    self?.hideShelf()
                },
                onPresentationModeChange: onKeepOnScreen,
                onShowMenu: onShowMenu
            )
            .frame(width: size.width, height: size.height)
        )
        panel.backgroundColor = .clear
        panel.isOpaque = false
        panel.hasShadow = false
        panel.hidesOnDeactivate = false
        panel.isMovableByWindowBackground = false
        panel.isReleasedWhenClosed = false
        panel.level = .popUpMenu
        panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary, .stationary]
        panel.delegate = self

        self.panel = panel
        return panel
    }

    private func positionPanel(
        _ panel: NSPanel,
        relativeTo button: NSStatusBarButton,
        clickLocation: NSPoint?,
        clickScreen: NSScreen?
    ) {
        guard let anchorWindow = button.window else { return }

        // A click provides a screen-space position. When the shelf is sent
        // back from its floating panel there is no status-item click, so use
        // the status item's screen-positioned host window instead of the
        // button's local 0...width coordinate space.
        let anchorCenterX = clickLocation?.x ?? anchorWindow.frame.midX
        let screen = clickScreen ?? clickLocation.flatMap { location in
            NSScreen.screens.first { $0.frame.contains(location) }
        } ?? anchorWindow.screen
        guard let screen else { return }

        let availableFrame = screen.frame
        let size = Self.shelfSize

        var origin = NSPoint(
            x: anchorCenterX - size.width / 2,
            y: screen.visibleFrame.maxY - size.height - Self.menuBarGap
        )
        origin.x = min(
            max(origin.x, availableFrame.minX + Self.screenEdgeInset),
            availableFrame.maxX - size.width - Self.screenEdgeInset
        )

        anchorFrame = NSRect(
            x: anchorCenterX - button.bounds.width / 2,
            y: screen.visibleFrame.maxY,
            width: button.bounds.width,
            height: max(screen.frame.maxY - screen.visibleFrame.maxY, button.bounds.height)
        )
        panel.setFrame(NSRect(origin: origin, size: size), display: true)
    }

    private func startEventMonitors() {
        stopEventMonitors()

        localEventMonitor = NSEvent.addLocalMonitorForEvents(
            matching: [.leftMouseDown, .rightMouseDown, .keyDown]
        ) { [weak self] event in
            guard let self else { return event }

            if event.type == .keyDown, event.keyCode == 53 {
                self.hideShelf()
                return nil
            }

            if event.type == .leftMouseDown || event.type == .rightMouseDown {
                self.hideShelfIfClickedOutside(at: NSEvent.mouseLocation)
            }
            return event
        }

        globalEventMonitor = NSEvent.addGlobalMonitorForEvents(
            matching: [.leftMouseDown, .rightMouseDown]
        ) { [weak self] _ in
            DispatchQueue.main.async {
                self?.hideShelfIfClickedOutside(at: NSEvent.mouseLocation)
            }
        }
    }

    private func stopEventMonitors() {
        if let localEventMonitor {
            NSEvent.removeMonitor(localEventMonitor)
            self.localEventMonitor = nil
        }
        if let globalEventMonitor {
            NSEvent.removeMonitor(globalEventMonitor)
            self.globalEventMonitor = nil
        }
    }

    private func hideShelfIfClickedOutside(at location: NSPoint) {
        guard let panel, panel.isVisible else { return }
        guard !panel.frame.contains(location), !anchorFrame.contains(location) else { return }
        hideShelf()
    }

    func windowShouldClose(_ sender: NSWindow) -> Bool {
        hideShelf()
        return false
    }
}

private final class MenuBarShelfPanel: NSPanel {
    override var canBecomeKey: Bool {
        true
    }

    override var canBecomeMain: Bool {
        false
    }
}
