import AppKit
import Foundation

enum FileActionMode: Sendable {
    case copy
    case move
}

struct FileExportFailure: Sendable {
    let itemTitle: String
    let message: String
}

struct FileExportSuccess: Sendable {
    let itemID: UUID
    let url: URL
}

struct FileExportResult: Sendable {
    let successes: [FileExportSuccess]
    let failures: [FileExportFailure]

    var exportedURLs: [URL] {
        successes.map(\.url)
    }

    var exportedItemIDs: [UUID] {
        successes.map(\.itemID)
    }
}

struct FileActionService {
    func chooseDestinationFolder() -> URL? {
        let panel = NSOpenPanel()
        panel.canChooseFiles = false
        panel.canChooseDirectories = true
        panel.allowsMultipleSelection = false
        panel.prompt = "Choose"
        return panel.runModal() == .OK ? panel.url : nil
    }

    func chooseZipDestination() -> URL? {
        let panel = NSSavePanel()
        panel.allowedContentTypes = [.zip]
        panel.nameFieldStringValue = "temoto-\(Date().compactTimestamp()).zip"
        panel.canCreateDirectories = true
        return panel.runModal() == .OK ? panel.url : nil
    }

    func export(items: [ShelfItem], to destination: URL, mode: FileActionMode) throws {
        for item in items {
            _ = try export(item: item, to: destination, mode: mode)
        }
    }

    func exportAll(items: [ShelfItem], to destination: URL, mode: FileActionMode) -> FileExportResult {
        var successes: [FileExportSuccess] = []
        var failures: [FileExportFailure] = []

        for item in items {
            do {
                let url = try export(item: item, to: destination, mode: mode)
                successes.append(FileExportSuccess(itemID: item.id, url: url))
            } catch {
                failures.append(
                    FileExportFailure(
                        itemTitle: item.displayTitle,
                        message: error.localizedDescription
                    )
                )
            }
        }

        return FileExportResult(
            successes: successes,
            failures: failures
        )
    }

    func createZip(from items: [ShelfItem], destination: URL) throws {
        let stagingRoot = FileManager.default.temporaryDirectory
            .appendingPathComponent("temoto-\(UUID().uuidString)", isDirectory: true)
        let stagingItems = stagingRoot.appendingPathComponent("temoto Items", isDirectory: true)
        try FileManager.default.createDirectory(at: stagingItems, withIntermediateDirectories: true)
        defer {
            try? FileManager.default.removeItem(at: stagingRoot)
        }

        try export(items: items, to: stagingItems, mode: .copy)

        let temporaryDestination = destination.deletingLastPathComponent()
            .appendingPathComponent(".temoto-\(UUID().uuidString).zip")
        defer {
            try? FileManager.default.removeItem(at: temporaryDestination)
        }

        let process = Process()
        process.executableURL = URL(fileURLWithPath: "/usr/bin/ditto")
        process.arguments = [
            "-c",
            "-k",
            "--sequesterRsrc",
            "--keepParent",
            stagingItems.path,
            temporaryDestination.path
        ]

        try process.run()
        process.waitUntilExit()

        guard process.terminationStatus == 0 else {
            throw CocoaError(.fileWriteUnknown)
        }

        if FileManager.default.fileExists(atPath: destination.path) {
            _ = try FileManager.default.replaceItemAt(
                destination,
                withItemAt: temporaryDestination
            )
        } else {
            try FileManager.default.moveItem(at: temporaryDestination, to: destination)
        }
    }

    private func export(item: ShelfItem, to destination: URL, mode: FileActionMode) throws -> URL {
        switch item.kind {
        case .file, .folder, .image:
            guard let source = item.url else {
                throw CocoaError(.fileNoSuchFile)
            }
            let target = destination.availableChildURL(named: item.preferredFileName(fallback: source.lastPathComponent))
            switch mode {
            case .copy:
                try FileManager.default.copyItem(at: source, to: target)
            case .move:
                try FileManager.default.moveItem(at: source, to: target)
            }
            return target
        case .link:
            let name = item.title.sanitizedFileName(defaultName: "Link") + ".url.txt"
            let target = destination.availableChildURL(named: name)
            try (item.url?.absoluteString ?? item.text ?? "").write(to: target, atomically: true, encoding: .utf8)
            return target
        case .text:
            let name = item.title.sanitizedFileName(defaultName: "Text") + ".txt"
            let target = destination.availableChildURL(named: name)
            try (item.text ?? "").write(to: target, atomically: true, encoding: .utf8)
            return target
        }
    }
}
