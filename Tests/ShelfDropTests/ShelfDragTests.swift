import AppKit
import Foundation
import Testing
import UniformTypeIdentifiers
@testable import Temoto

@MainActor
struct ShelfDragTests {
    @Test func droppingShelfItemBackOntoShelfIsRejectedWithoutChangingItems() {
        let first = ShelfItem(kind: .file, title: "first.txt", detail: "")
        let second = ShelfItem(kind: .file, title: "second.txt", detail: "")
        let third = ShelfItem(kind: .file, title: "third.txt", detail: "")
        let store = ShelfStore()
        store.items = [first, second, third]

        let accepted = store.handleDrop(providers: [first.dragProvider()])

        #expect(!accepted)
        #expect(store.items.map(\.id) == [first.id, second.id, third.id])
        #expect(store.items.count == 3)
    }

    @Test func rowDragProviderIdentifiesAnInternalShelfDrag() {
        let fileURL = URL(fileURLWithPath: "/tmp/notes.md")
        let item = ShelfItem(kind: .file, title: "notes.md", detail: "/tmp", url: fileURL)

        let provider = item.dragProvider()

        #expect(provider.hasItemConformingToTypeIdentifier(ShelfDragPayload.typeIdentifier))
        #expect(provider.hasItemConformingToTypeIdentifier(UTType.fileURL.identifier))
    }

    @MainActor
    @Test func importingAnInternalRowDragDoesNotDuplicateTheShelfItem() async throws {
        let root = FileManager.default.temporaryDirectory
            .appendingPathComponent("ShelfDropTests-\(UUID().uuidString)", isDirectory: true)
        let fileURL = root.appendingPathComponent("notes.md")
        defer { try? FileManager.default.removeItem(at: root) }
        try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        try Data("# Notes".utf8).write(to: fileURL)

        let item = ShelfItem(kind: .file, title: "notes.md", detail: root.path, url: fileURL)
        let store = ShelfStore()
        store.items = [item]

        store.importItems(from: [item.dragProvider()])
        try await Task.sleep(nanoseconds: 200_000_000)

        #expect(store.items.map(\.id) == [item.id])
    }

    @MainActor
    @Test func droppingSameFileURLWithoutInternalMarkerDoesNotDuplicate() async throws {
        let root = FileManager.default.temporaryDirectory
            .appendingPathComponent("ShelfDropTests-\(UUID().uuidString)", isDirectory: true)
        let fileURL = root.appendingPathComponent("notes.md")
        defer { try? FileManager.default.removeItem(at: root) }
        try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        try Data("# Notes".utf8).write(to: fileURL)

        let store = ShelfStore()
        store.addFileURLs([fileURL])
        let providerWithoutMarker = NSItemProvider(object: fileURL as NSURL)

        store.handleDrop(providers: [providerWithoutMarker])
        try await Task.sleep(nanoseconds: 200_000_000)

        #expect(store.items.count == 1)
        #expect(store.items.first?.url == fileURL)
    }

    @MainActor
    @Test func optionTabAndImageDataDropCreateOneConsistentImageItem() async throws {
        let root = FileManager.default.temporaryDirectory
            .appendingPathComponent("ShelfDropTests-\(UUID().uuidString)", isDirectory: true)
        let fileURL = root.appendingPathComponent("logo.png")
        let imageData = Data([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
        let store = ShelfStore()
        defer {
            for item in store.items where item.url != fileURL {
                if let url = item.url { try? FileManager.default.removeItem(at: url) }
            }
            try? FileManager.default.removeItem(at: root)
        }
        try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        try imageData.write(to: fileURL)

        store.addFileURLs([fileURL])

        let imageProvider = NSItemProvider()
        imageProvider.suggestedName = fileURL.lastPathComponent
        imageProvider.registerDataRepresentation(
            forTypeIdentifier: UTType.png.identifier,
            visibility: .all
        ) { completion in
            completion(imageData, nil)
            return nil
        }

        store.handleDrop(providers: [imageProvider])
        try await Task.sleep(nanoseconds: 200_000_000)

        #expect(store.items.count == 1)
        #expect(store.items.first?.kind == .image)
        #expect(store.items.first?.title == fileURL.lastPathComponent)
        #expect(store.items.first?.url == fileURL)
    }

    @MainActor
    @Test func imageDataDropThenOptionTabUsesOriginalFileWithoutDuplicating() async throws {
        let root = FileManager.default.temporaryDirectory
            .appendingPathComponent("ShelfDropTests-\(UUID().uuidString)", isDirectory: true)
        let fileURL = root.appendingPathComponent("logo.png")
        let imageData = Data([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
        let store = ShelfStore()
        defer {
            for item in store.items where item.url != fileURL {
                if let url = item.url { try? FileManager.default.removeItem(at: url) }
            }
            try? FileManager.default.removeItem(at: root)
        }
        try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        try imageData.write(to: fileURL)

        let imageProvider = NSItemProvider()
        imageProvider.suggestedName = fileURL.lastPathComponent
        imageProvider.registerDataRepresentation(
            forTypeIdentifier: UTType.png.identifier,
            visibility: .all
        ) { completion in
            completion(imageData, nil)
            return nil
        }

        store.handleDrop(providers: [imageProvider])
        try await Task.sleep(nanoseconds: 200_000_000)
        store.addFileURLs([fileURL])

        #expect(store.items.count == 1)
        #expect(store.items.first?.kind == .image)
        #expect(store.items.first?.title == fileURL.lastPathComponent)
        #expect(store.items.first?.url == fileURL)
    }

    @Test func batchDragUsesOnlyFileBackedItemsInShelfOrder() {
        let fileURL = URL(fileURLWithPath: "/tmp/notes.md")
        let folderURL = URL(fileURLWithPath: "/tmp/Archive", isDirectory: true)
        let imageURL = URL(fileURLWithPath: "/tmp/image.png")
        let items = [
            ShelfItem(kind: .file, title: "notes.md", detail: "", url: fileURL),
            ShelfItem(kind: .link, title: "Example", detail: "", url: URL(string: "https://example.com")),
            ShelfItem(kind: .folder, title: "Archive", detail: "", url: folderURL),
            ShelfItem(kind: .text, title: "Text", detail: "", text: "Text"),
            ShelfItem(kind: .image, title: "image.png", detail: "", url: imageURL)
        ]

        #expect(items.batchDragFileURLs == [fileURL, folderURL, imageURL])
    }

    @Test func batchFileWriterProvidesAFileURLAndInternalShelfMarker() {
        let fileURL = URL(fileURLWithPath: "/tmp/notes.md")
        let pasteboard = NSPasteboard(name: .drag)
        let writer = ShelfFileDragWriter(fileURL: fileURL)

        let types = writer.writableTypes(for: pasteboard)

        #expect(types.contains(.fileURL))
        #expect(types.contains(ShelfDragPayload.pasteboardType))
        #expect(writer.pasteboardPropertyList(forType: .fileURL) as? String == fileURL.absoluteString)
    }
}
