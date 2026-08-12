import AppKit
import OSLog
import QuartzCore
import SwiftUI

private let windowLogger = Logger(
    subsystem: "work.hayashigoto.ShelfDrop",
    category: "Windowing"
)

final class ShelfWindowController: NSObject, NSWindowDelegate {
    private static let shelfLength: CGFloat = 230
    private static let shelfSize = NSSize(width: shelfLength, height: shelfLength)
    private static let collapsedShelfSize = NSSize(width: shelfLength, height: 45)

    private let store: ShelfStore
    private let onReturnToMenuBar: () -> Void
    private let onShowMenu: () -> Void
    private let presentation = ShelfPresentationState()
    private var panel: NSPanel?
    private var localKeyDownMonitor: Any?

    init(
        store: ShelfStore,
        onReturnToMenuBar: @escaping () -> Void,
        onShowMenu: @escaping () -> Void
    ) {
        self.store = store
        self.onReturnToMenuBar = onReturnToMenuBar
        self.onShowMenu = onShowMenu
    }

    func showShelf() {
        let panel = shelfPanel()

        if presentation.isCollapsed {
            presentation.isCollapsed = false
        }
        // NSHostingController can replace the panel's initial height with its
        // compact fitting size when the content view is first installed.
        // Reassert the expanded frame before every presentation so a fresh or
        // updated app never opens as a short, partially laid-out shelf.
        setShelfCollapsed(false, animate: false)

        if !panel.isVisible {
            positionNearPointer(panel)
            startEscapeKeyMonitor()
        }

        panel.orderFrontRegardless()
        windowLogger.info("Shelf shown")
    }

    func toggleShelf() {
        if panel?.isVisible == true {
            hideShelf()
        } else {
            showShelf()
        }
    }

    func hideShelf() {
        panel?.orderOut(nil)
        stopEscapeKeyMonitor()
        windowLogger.info("Shelf hidden")
    }

    private func shelfPanel() -> NSPanel {
        if let panel {
            return panel
        }

        let size = Self.shelfSize
        let panel = ShelfPanel(
            contentRect: NSRect(origin: .zero, size: size),
            styleMask: [.borderless, .nonactivatingPanel],
            backing: .buffered,
            defer: false
        )

        panel.identifier = NSUserInterfaceItemIdentifier("ShelfDropShelfPanel")
        panel.contentViewController = NSHostingController(
            rootView: ContentView(
                store: store,
                presentation: presentation,
                mode: .floating,
                onCollapseChange: { [weak self] isCollapsed in
                    self?.setShelfCollapsed(isCollapsed)
                },
                onDismiss: { [weak self] in
                    self?.hideShelf()
                },
                onPresentationModeChange: onReturnToMenuBar,
                onShowMenu: onShowMenu
            )
                .frame(width: size.width)
        )
        panel.backgroundColor = .clear
        panel.alphaValue = 1
        panel.isOpaque = false
        // NSPanel shadows follow the rectangular window bounds and leave square
        // corner artifacts around the rounded Liquid Glass surface.
        panel.hasShadow = false
        panel.hidesOnDeactivate = false
        panel.isMovableByWindowBackground = false
        panel.isReleasedWhenClosed = false
        panel.level = .floating
        panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary, .stationary]
        panel.delegate = self

        self.panel = panel
        return panel
    }

    private func setShelfCollapsed(_ isCollapsed: Bool, animate: Bool = true) {
        guard let panel else { return }

        let targetSize = isCollapsed ? Self.collapsedShelfSize : Self.shelfSize
        var frame = panel.frame
        let topEdge = frame.maxY
        frame.size = targetSize
        frame.origin.y = topEdge - targetSize.height

        guard animate else {
            panel.setFrame(frame, display: true)
            return
        }

        NSAnimationContext.runAnimationGroup { context in
            context.duration = 0.18
            context.timingFunction = CAMediaTimingFunction(name: .easeInEaseOut)
            panel.animator().setFrame(frame, display: true)
        }
    }

    private func positionNearPointer(_ panel: NSPanel) {
        let mouseLocation = NSEvent.mouseLocation
        let screen = NSScreen.screens.first { screen in
            NSMouseInRect(mouseLocation, screen.frame, false)
        } ?? NSScreen.main

        guard let visibleFrame = screen?.visibleFrame else {
            panel.center()
            return
        }

        let size = panel.frame.size
        var origin = NSPoint(
            x: mouseLocation.x - size.width / 2,
            y: mouseLocation.y - size.height - 24
        )

        if origin.y < visibleFrame.minY {
            origin.y = mouseLocation.y + 24
        }

        origin.x = min(max(origin.x, visibleFrame.minX + 8), visibleFrame.maxX - size.width - 8)
        origin.y = min(max(origin.y, visibleFrame.minY + 8), visibleFrame.maxY - size.height - 8)

        panel.setFrameOrigin(origin)
    }

    private func startEscapeKeyMonitor() {
        stopEscapeKeyMonitor()
        localKeyDownMonitor = NSEvent.addLocalMonitorForEvents(matching: .keyDown) { [weak self] event in
            if event.keyCode == 53 {
                self?.hideShelf()
                return nil
            }
            return event
        }
    }

    private func stopEscapeKeyMonitor() {
        if let localKeyDownMonitor {
            NSEvent.removeMonitor(localKeyDownMonitor)
            self.localKeyDownMonitor = nil
        }
    }

    func windowShouldClose(_ sender: NSWindow) -> Bool {
        hideShelf()
        return false
    }
}

private final class ShelfPanel: NSPanel {
    override var canBecomeKey: Bool {
        true
    }

    override var canBecomeMain: Bool {
        false
    }
}
