// swift-tools-version: 5.9

import PackageDescription

let package = Package(
    name: "temoto",
    platforms: [
        .macOS("26.0")
    ],
    products: [
        .executable(name: "temoto", targets: ["Temoto"])
    ],
    targets: [
        .executableTarget(
            name: "Temoto",
            path: "Sources/ShelfDrop"
        ),
        .testTarget(
            name: "TemotoTests",
            dependencies: ["Temoto"],
            path: "Tests/ShelfDropTests"
        )
    ]
)
