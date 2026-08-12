import Combine
import Foundation

enum ShelfPresentationMode: String {
    case floating
    case menuBar
}

final class ShelfPresentationPreference {
    private static let defaultsKey = "shelfPresentationMode"

    private let defaults: UserDefaults

    var mode: ShelfPresentationMode {
        didSet {
            defaults.set(mode.rawValue, forKey: Self.defaultsKey)
        }
    }

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        mode = defaults.string(forKey: Self.defaultsKey)
            .flatMap(ShelfPresentationMode.init(rawValue:)) ?? .floating
    }
}

final class ShelfPresentationState: ObservableObject {
    @Published var isCollapsed = false
}
