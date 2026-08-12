import Foundation
import Testing
@testable import Temoto

struct ShelfPresentationPreferenceTests {
    @Test func defaultsToFloatingShelf() {
        let (defaults, suiteName) = isolatedDefaults()
        defer { defaults.removePersistentDomain(forName: suiteName) }

        let preference = ShelfPresentationPreference(defaults: defaults)

        #expect(preference.mode == .floating)
    }

    @Test func persistsTheSelectedShelfPresentation() {
        let (defaults, suiteName) = isolatedDefaults()
        defer { defaults.removePersistentDomain(forName: suiteName) }

        let preference = ShelfPresentationPreference(defaults: defaults)
        preference.mode = .menuBar

        let restoredPreference = ShelfPresentationPreference(defaults: defaults)
        #expect(restoredPreference.mode == .menuBar)
    }

    private func isolatedDefaults() -> (UserDefaults, String) {
        let suiteName = "ShelfPresentationPreferenceTests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defaults.removePersistentDomain(forName: suiteName)
        return (defaults, suiteName)
    }
}
