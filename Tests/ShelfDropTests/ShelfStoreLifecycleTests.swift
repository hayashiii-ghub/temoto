import AppKit
import Testing
import UniformTypeIdentifiers
@testable import Temoto

@MainActor
struct ShelfStoreLifecycleTests {
    @Test func removingAnImportedFileDeletesItsManagedCopy() async throws {
        let fixture = try Fixture()
        defer { fixture.cleanup() }
        let store = ShelfStore(inbox: ShelfInbox(directoryURL: fixture.inboxURL))

        store.importItems(from: [provider(name: "notes.txt", contents: "notes")])
        let item = try await waitForImportedItem(in: store)
        let managedURL = try #require(item.url)

        #expect(item.isManagedFile)
        #expect(FileManager.default.fileExists(atPath: managedURL.path))

        store.remove(item)

        #expect(store.items.isEmpty)
        #expect(!FileManager.default.fileExists(atPath: managedURL.path))
    }

    @Test func removingAnExternalFileNeverDeletesTheSource() throws {
        let fixture = try Fixture()
        defer { fixture.cleanup() }
        let sourceURL = fixture.rootURL.appendingPathComponent("source.txt")
        try Data("source".utf8).write(to: sourceURL)
        let store = ShelfStore(inbox: ShelfInbox(directoryURL: fixture.inboxURL))

        store.addFileURLs([sourceURL])
        let item = try #require(store.items.first)
        #expect(!item.isManagedFile)

        store.remove(item)

        #expect(FileManager.default.fileExists(atPath: sourceURL.path))
    }

    @Test func clearDeletesManagedCopiesAndPreservesExternalSources() async throws {
        let fixture = try Fixture()
        defer { fixture.cleanup() }
        let sourceURL = fixture.rootURL.appendingPathComponent("source.txt")
        try Data("source".utf8).write(to: sourceURL)
        let store = ShelfStore(inbox: ShelfInbox(directoryURL: fixture.inboxURL))

        store.addFileURLs([sourceURL])
        store.importItems(from: [provider(name: "managed.txt", contents: "managed")])
        let managedItem = try await waitForItem(named: "managed.txt", in: store)
        let managedURL = try #require(managedItem.url)

        store.clear()

        #expect(store.items.isEmpty)
        #expect(FileManager.default.fileExists(atPath: sourceURL.path))
        #expect(!FileManager.default.fileExists(atPath: managedURL.path))
    }

    @Test func addingTheOriginalFileReplacesAnEquivalentManagedCopy() async throws {
        let fixture = try Fixture()
        defer { fixture.cleanup() }
        let sourceURL = fixture.rootURL.appendingPathComponent("table.csv")
        try Data("name,value\nA,1".utf8).write(to: sourceURL)
        let store = ShelfStore(inbox: ShelfInbox(directoryURL: fixture.inboxURL))

        store.importItems(from: [
            provider(
                name: "table.csv",
                contents: "name,value\nA,1",
                typeIdentifier: "public.comma-separated-values-text"
            )
        ])
        let managedItem = try await waitForImportedItem(in: store)
        let managedURL = try #require(managedItem.url)

        store.addFileURLs([sourceURL])

        #expect(store.items.count == 1)
        #expect(store.items.first?.url == sourceURL)
        #expect(store.items.first?.isManagedFile == false)
        #expect(!FileManager.default.fileExists(atPath: managedURL.path))
    }

    @Test func launchCleanupRemovesOrphanedManagedFiles() throws {
        let fixture = try Fixture()
        defer { fixture.cleanup() }
        let orphanURL = fixture.inboxURL.appendingPathComponent("orphan.txt")
        try Data("orphan".utf8).write(to: orphanURL)
        let store = ShelfStore(inbox: ShelfInbox(directoryURL: fixture.inboxURL))

        store.discardStaleManagedFiles()

        #expect(!FileManager.default.fileExists(atPath: orphanURL.path))
    }

    private func provider(
        name: String,
        contents: String,
        typeIdentifier: String = UTType.utf8PlainText.identifier
    ) -> NSItemProvider {
        let provider = NSItemProvider()
        provider.suggestedName = name
        provider.registerDataRepresentation(
            forTypeIdentifier: typeIdentifier,
            visibility: .all
        ) { completion in
            completion(Data(contents.utf8), nil)
            return nil
        }
        return provider
    }

    private func waitForImportedItem(in store: ShelfStore) async throws -> ShelfItem {
        for _ in 0..<100 {
            if let item = store.items.first(where: \.isManagedFile) {
                return item
            }
            try await Task.sleep(nanoseconds: 20_000_000)
        }
        throw LifecycleTimeout()
    }

    private func waitForItem(named name: String, in store: ShelfStore) async throws -> ShelfItem {
        for _ in 0..<100 {
            if let item = store.items.first(where: { $0.title == name }) {
                return item
            }
            try await Task.sleep(nanoseconds: 20_000_000)
        }
        throw LifecycleTimeout()
    }
}

private struct Fixture {
    let rootURL: URL
    let inboxURL: URL

    init() throws {
        rootURL = FileManager.default.temporaryDirectory
            .appendingPathComponent("ShelfDropTests-\(UUID().uuidString)", isDirectory: true)
        inboxURL = rootURL.appendingPathComponent("Inbox", isDirectory: true)
        try FileManager.default.createDirectory(at: inboxURL, withIntermediateDirectories: true)
    }

    func cleanup() {
        try? FileManager.default.removeItem(at: rootURL)
    }
}

private struct LifecycleTimeout: Error {}
