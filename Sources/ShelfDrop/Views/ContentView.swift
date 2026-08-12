import SwiftUI

struct ContentView: View {
    @ObservedObject var store: ShelfStore
    @ObservedObject var presentation: ShelfPresentationState
    let mode: ShelfPresentationMode
    let onCollapseChange: (Bool) -> Void
    let onDismiss: () -> Void
    let onPresentationModeChange: () -> Void
    let onShowMenu: () -> Void
    @State private var isDropTargeted = false

    private var panelShape: RoundedRectangle {
        RoundedRectangle(
            cornerRadius: mode == .floating ? 32 : 20,
            style: .continuous
        )
    }

    var body: some View {
        VStack(spacing: 0) {
            ShelfHeader(
                count: store.items.count,
                isCollapsed: presentation.isCollapsed,
                mode: mode,
                onToggleCollapsed: toggleCollapsed,
                onDismiss: onDismiss,
                onPresentationModeChange: onPresentationModeChange,
                onShowMenu: onShowMenu
            )

            if !presentation.isCollapsed {
                ZStack {
                    if store.items.isEmpty {
                        EmptyShelfView()
                    } else {
                        itemList
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(isDropTargeted ? Color.accentColor.opacity(0.1) : Color.clear)

                ActionBar(store: store)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .glassEffect(.regular.tint(Color.black.opacity(0.18)), in: panelShape)
        .overlay {
            panelShape
                .strokeBorder(
                    isDropTargeted ? Color.accentColor : Color.clear,
                    lineWidth: 1.5
                )
        }
        .compositingGroup()
        .clipShape(panelShape)
        .onDrop(of: ShelfStore.acceptedTypeIdentifiers, isTargeted: $isDropTargeted) { providers in
            guard !presentation.isCollapsed else { return false }
            return store.handleDrop(providers: providers)
        }
    }

    private var itemList: some View {
        ScrollView {
            LazyVStack(spacing: 8) {
                ForEach(store.items) { item in
                    ShelfItemRow(
                        item: item,
                        onOpen: { store.open(item) },
                        onReveal: { store.reveal(item) },
                        onCopy: { store.copyToPasteboard(item) },
                        onRemove: { store.remove(item) }
                    )
                    .onDrag {
                        return item.dragProvider()
                    }
                }
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
        }
    }

    private func toggleCollapsed() {
        presentation.isCollapsed.toggle()
        if presentation.isCollapsed {
            isDropTargeted = false
        }
        onCollapseChange(presentation.isCollapsed)
    }
}

private struct ShelfHeader: View {
    let count: Int
    let isCollapsed: Bool
    let mode: ShelfPresentationMode
    let onToggleCollapsed: () -> Void
    let onDismiss: () -> Void
    let onPresentationModeChange: () -> Void
    let onShowMenu: () -> Void

    var body: some View {
        HStack(spacing: 8) {
            if mode == .floating {
                ZStack(alignment: .leading) {
                    countLabel
                    WindowDragHandle()
                }
                .frame(maxWidth: .infinity, minHeight: 27, maxHeight: 27, alignment: .leading)
                .help("Drag to move")
            } else {
                countLabel
                    .frame(maxWidth: .infinity, minHeight: 27, maxHeight: 27, alignment: .leading)
            }

            Button(action: onPresentationModeChange) {
                Image(systemName: mode == .floating ? "pin.slash" : "pin")
                    .font(.system(size: 11, weight: .regular))
                    .frame(width: 24, height: 24)
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .focusEffectDisabled()
            .help(mode == .floating ? "Return Shelf to Menu Bar" : "Keep Shelf on Screen")

            Button(action: onDismiss) {
                Image(systemName: "xmark")
                    .font(.system(size: 11, weight: .regular))
                    .frame(width: 24, height: 24)
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .focusEffectDisabled()
            .help("Hide Shelf")

            if mode == .floating {
                Button(action: onToggleCollapsed) {
                    Image(systemName: isCollapsed ? "chevron.down" : "chevron.up")
                        .font(.system(size: 11, weight: .regular))
                        .frame(width: 24, height: 24)
                        .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .focusEffectDisabled()
                .help(isCollapsed ? "Expand Shelf" : "Collapse Shelf")
            }

            Button(action: onShowMenu) {
                Image(systemName: "ellipsis")
                    .font(.system(size: 11, weight: .regular))
                    .frame(width: 24, height: 24)
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .focusEffectDisabled()
            .help("temoto Menu")
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 9)
    }

    @ViewBuilder
    private var countLabel: some View {
        Group {
            if count == 0 {
                Image(nsImage: ShelfIcon.vectorTemplateImage())
                    .resizable()
                    .scaledToFit()
                    .frame(width: 16, height: 16)
                    .foregroundStyle(.primary)
            } else {
                Text("\(count)")
                    .font(.system(size: 13, weight: .regular, design: .monospaced))
                    .foregroundStyle(.primary)
            }
        }
        .padding(.leading, 3)
        .allowsHitTesting(false)
    }
}

private struct EmptyShelfView: View {
    var body: some View {
        Text("Drop here.")
            .font(.system(size: 12, weight: .regular, design: .default))
            .tracking(0.05)
            .foregroundStyle(.secondary)
            .multilineTextAlignment(.center)
            .padding(.horizontal, 22)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}
