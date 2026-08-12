import Foundation
import Testing
@testable import Temoto

struct SingleInstanceGuardTests {
    @Test func onlyOneGuardCanOwnAnApplicationIdentifier() {
        let identifier = "ShelfDropTests.\(UUID().uuidString)"
        let first = SingleInstanceGuard(identifier: identifier)
        let second = SingleInstanceGuard(identifier: identifier)

        #expect(first != nil)
        #expect(second == nil)
    }
}
