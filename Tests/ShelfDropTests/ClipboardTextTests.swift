import Testing
@testable import Temoto

@MainActor
struct ClipboardTextTests {
    @Test func addsNonemptyClipboardTextOnce() {
        let store = ShelfStore(errorPresenter: { _ in })

        #expect(store.addClipboardText("  draft note\n") == true)
        #expect(store.addClipboardText("  draft note\n") == false)
        #expect(store.items.count == 1)
        #expect(store.items.first?.kind == .text)
        #expect(store.items.first?.text == "  draft note\n")
    }

    @Test func ignoresMissingOrWhitespaceOnlyClipboardText() {
        let store = ShelfStore(errorPresenter: { _ in })

        #expect(store.addClipboardText(nil) == false)
        #expect(store.addClipboardText(" \n\t") == false)
        #expect(store.items.isEmpty)
    }
}
