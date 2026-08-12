#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$ROOT_DIR/script/app_bundle.sh"
source "$ROOT_DIR/script/version.sh"

APP_NAME="$SHELFDROP_APP_NAME"
APP_VERSION="$(resolve_shelfdrop_version "$ROOT_DIR")"
DIST_DIR="$ROOT_DIR/dist"
DIST_PACKAGE_DIR="$DIST_DIR/package"
STAGING_DIR="$(mktemp -d "${TMPDIR:-/tmp}/temoto-package.XXXXXX")"
PACKAGE_DIR="$STAGING_DIR/package"
DMG_STAGING_DIR="$STAGING_DIR/dmg"
DMG_MOUNT_DIR="$STAGING_DIR/dmg-mount"
DMG_RW_PATH="$STAGING_DIR/$APP_NAME-rw.dmg"
DMG_BACKGROUND_DIR="$DMG_STAGING_DIR/.background"
DMG_BACKGROUND_PATH="$DMG_BACKGROUND_DIR/background.png"
APP_BUNDLE="$PACKAGE_DIR/$APP_NAME.app"
APP_CONTENTS="$APP_BUNDLE/Contents"
APP_MACOS="$APP_CONTENTS/MacOS"
APP_RESOURCES="$APP_CONTENTS/Resources"
APP_BINARY="$APP_MACOS/$APP_NAME"
INFO_PLIST="$APP_CONTENTS/Info.plist"
ZIP_PATH="$DIST_DIR/$APP_NAME-macos.zip"
DMG_PATH="$DIST_DIR/$APP_NAME-macos.dmg"
SWIFTPM_CACHE_DIR="$ROOT_DIR/.build/cache"
VALIDATION_DIR="$STAGING_DIR/validation"
NOTARY_APP_ZIP_PATH="$STAGING_DIR/$APP_NAME-notary.zip"
SHELFDROP_CODESIGN_IDENTITY="${SHELFDROP_CODESIGN_IDENTITY:--}"
SHELFDROP_NOTARIZE="${SHELFDROP_NOTARIZE:-0}"
SHELFDROP_NOTARY_KEYCHAIN_PROFILE="${SHELFDROP_NOTARY_KEYCHAIN_PROFILE:-}"
SHELFDROP_NOTARY_KEY_PATH="${SHELFDROP_NOTARY_KEY_PATH:-}"
SHELFDROP_NOTARY_KEY_ID="${SHELFDROP_NOTARY_KEY_ID:-}"
SHELFDROP_NOTARY_ISSUER_ID="${SHELFDROP_NOTARY_ISSUER_ID:-}"

cleanup() {
  hdiutil detach "$DMG_MOUNT_DIR" >/dev/null 2>&1 || true
  rm -rf "$STAGING_DIR"
}
trap cleanup EXIT

export CLANG_MODULE_CACHE_PATH="${CLANG_MODULE_CACHE_PATH:-$ROOT_DIR/.build/module-cache}"

cd "$ROOT_DIR"

sign_app() {
  local app="$1"
  xattr -cr "$app" 2>/dev/null || true

  if [[ "$SHELFDROP_CODESIGN_IDENTITY" == "-" ]]; then
    codesign --force --sign - "$app"
  else
    codesign --force \
      --sign "$SHELFDROP_CODESIGN_IDENTITY" \
      --options runtime \
      --timestamp \
      "$app"
  fi

  codesign --verify --deep --strict "$app"
}

sign_disk_image() {
  local dmg="$1"

  if [[ "$SHELFDROP_CODESIGN_IDENTITY" == "-" ]]; then
    return
  fi

  codesign --force --sign "$SHELFDROP_CODESIGN_IDENTITY" --timestamp "$dmg"
  codesign --verify --verbose "$dmg"
}

notary_submit() {
  local artifact="$1"
  local -a args=()

  if [[ -n "$SHELFDROP_NOTARY_KEYCHAIN_PROFILE" ]]; then
    args=(--keychain-profile "$SHELFDROP_NOTARY_KEYCHAIN_PROFILE")
  elif [[ -n "$SHELFDROP_NOTARY_KEY_PATH" \
      && -n "$SHELFDROP_NOTARY_KEY_ID" \
      && -n "$SHELFDROP_NOTARY_ISSUER_ID" ]]; then
    args=(
      --key "$SHELFDROP_NOTARY_KEY_PATH"
      --key-id "$SHELFDROP_NOTARY_KEY_ID"
      --issuer "$SHELFDROP_NOTARY_ISSUER_ID"
    )
  else
    echo "Missing notarization credentials" >&2
    echo "Set SHELFDROP_NOTARY_KEY_PATH, SHELFDROP_NOTARY_KEY_ID, and SHELFDROP_NOTARY_ISSUER_ID." >&2
    return 2
  fi

  xcrun notarytool submit "$artifact" "${args[@]}" --wait --timeout 30m
}

notarize_app_bundle() {
  local app="$1"

  if [[ "$SHELFDROP_CODESIGN_IDENTITY" == "-" ]]; then
    echo "SHELFDROP_NOTARIZE=1 requires a Developer ID signing identity." >&2
    return 2
  fi

  ditto -c -k --keepParent "$app" "$NOTARY_APP_ZIP_PATH"
  notary_submit "$NOTARY_APP_ZIP_PATH"
  xcrun stapler staple "$app"
  xcrun stapler validate "$app"
}

notarize_disk_image() {
  local dmg="$1"

  notary_submit "$dmg"
  xcrun stapler staple "$dmg"
  xcrun stapler validate "$dmg"
}

DEVELOPER_DIR_PATH="$(xcode-select -p 2>/dev/null || true)"
XCBUILD_PATH="$(dirname "$DEVELOPER_DIR_PATH")/SharedFrameworks/XCBuild.framework/Versions/A/Support/xcbuild"
UNIVERSAL_MODE="${SHELFDROP_UNIVERSAL:-auto}"

if [[ "$UNIVERSAL_MODE" == "1" || "$UNIVERSAL_MODE" == "true" ]]; then
  SWIFT_BUILD_FLAGS=(-c release --arch arm64 --arch x86_64 --cache-path "$SWIFTPM_CACHE_DIR")
  BUILD_KIND="universal"
elif [[ -x "$XCBUILD_PATH" ]]; then
  SWIFT_BUILD_FLAGS=(-c release --arch arm64 --arch x86_64 --cache-path "$SWIFTPM_CACHE_DIR")
  BUILD_KIND="universal"
else
  SWIFT_BUILD_FLAGS=(-c release --cache-path "$SWIFTPM_CACHE_DIR")
  BUILD_KIND="host-architecture"
fi

echo "Building $BUILD_KIND release..."
swift build "${SWIFT_BUILD_FLAGS[@]}"
BUILD_BINARY="$(swift build "${SWIFT_BUILD_FLAGS[@]}" --show-bin-path)/$APP_NAME"

rm -rf "$DIST_PACKAGE_DIR" "$ZIP_PATH" "$DMG_PATH"
mkdir -p "$APP_MACOS" "$APP_RESOURCES"
cp "$BUILD_BINARY" "$APP_BINARY"
shelfdrop_copy_bundle_resources "$ROOT_DIR" "$APP_RESOURCES"
chmod +x "$APP_BINARY"

shelfdrop_write_info_plist "$INFO_PLIST" "$APP_VERSION"

# Strip Finder/resource metadata before signing so strict validation and
# distribution zips do not contain AppleDouble files or disallowed xattrs.
sign_app "$APP_BUNDLE"

mkdir -p "$DIST_PACKAGE_DIR"
COPYFILE_DISABLE=1 ditto --norsrc --noextattr --noqtn --noacl \
  "$APP_BUNDLE" "$DIST_PACKAGE_DIR/$APP_NAME.app"
sign_app "$DIST_PACKAGE_DIR/$APP_NAME.app"

if [[ "$SHELFDROP_NOTARIZE" == "1" || "$SHELFDROP_NOTARIZE" == "true" ]]; then
  notarize_app_bundle "$DIST_PACKAGE_DIR/$APP_NAME.app"
fi

mkdir -p "$DIST_DIR"
COPYFILE_DISABLE=1 ditto -c -k --keepParent --norsrc --noextattr --noqtn --noacl \
  "$DIST_PACKAGE_DIR/$APP_NAME.app" "$ZIP_PATH"
mkdir -p "$VALIDATION_DIR"
ditto -x -k "$ZIP_PATH" "$VALIDATION_DIR"
codesign --verify --deep --strict "$VALIDATION_DIR/$APP_NAME.app"

mkdir -p "$DMG_STAGING_DIR"
COPYFILE_DISABLE=1 ditto --norsrc --noextattr --noqtn --noacl \
  "$DIST_PACKAGE_DIR/$APP_NAME.app" "$DMG_STAGING_DIR/$APP_NAME.app"
codesign --verify --deep --strict "$DMG_STAGING_DIR/$APP_NAME.app"
ln -s /Applications "$DMG_STAGING_DIR/Applications"
mkdir -p "$DMG_BACKGROUND_DIR"
swift - "$DMG_BACKGROUND_PATH" <<'SWIFT'
import AppKit

let outputURL = URL(fileURLWithPath: CommandLine.arguments[1])
let canvasSize = NSSize(width: 580, height: 320)
let image = NSImage(size: canvasSize)

image.lockFocus()
NSColor.clear.setFill()
NSRect(origin: .zero, size: canvasSize).fill()

let paragraph = NSMutableParagraphStyle()
paragraph.alignment = .center

let attributes: [NSAttributedString.Key: Any] = [
    .font: NSFont.systemFont(ofSize: 54, weight: .semibold),
    .foregroundColor: NSColor.tertiaryLabelColor,
    .paragraphStyle: paragraph
]

NSAttributedString(string: ">", attributes: attributes)
    .draw(in: NSRect(x: 0, y: 126, width: canvasSize.width, height: 72))

image.unlockFocus()

guard
    let tiffData = image.tiffRepresentation,
    let bitmap = NSBitmapImageRep(data: tiffData),
    let pngData = bitmap.representation(using: .png, properties: [:])
else {
    exit(1)
}

try pngData.write(to: outputURL)
SWIFT

hdiutil create \
  -volname "$APP_NAME" \
  -srcfolder "$DMG_STAGING_DIR" \
  -fs HFS+ \
  -format UDRW \
  -ov \
  "$DMG_RW_PATH"

mkdir -p "$DMG_MOUNT_DIR"
hdiutil attach -readwrite -noverify -noautoopen -mountpoint "$DMG_MOUNT_DIR" "$DMG_RW_PATH" >/dev/null

osascript <<APPLESCRIPT
tell application "Finder"
  set dmgFolderAlias to POSIX file "$DMG_MOUNT_DIR" as alias
  set backgroundImageAlias to POSIX file "$DMG_MOUNT_DIR/.background/background.png" as alias
  tell folder dmgFolderAlias
    open
    set current view of container window to icon view
    set toolbar visible of container window to false
    set statusbar visible of container window to false
    set bounds of container window to {120, 120, 700, 440}
    set icon size of icon view options of container window to 96
    set text size of icon view options of container window to 16
    set background picture of icon view options of container window to backgroundImageAlias
    set position of item "$APP_NAME.app" to {180, 150}
    set position of item "Applications" to {420, 150}
    update without registering applications
    close container window
  end tell
end tell
APPLESCRIPT

sync
hdiutil detach "$DMG_MOUNT_DIR" >/dev/null

hdiutil convert "$DMG_RW_PATH" \
  -format UDZO \
  -imagekey zlib-level=9 \
  -o "$DMG_PATH"
sign_disk_image "$DMG_PATH"
if [[ "$SHELFDROP_NOTARIZE" == "1" || "$SHELFDROP_NOTARIZE" == "true" ]]; then
  notarize_disk_image "$DMG_PATH"
fi
hdiutil verify "$DMG_PATH"

hdiutil attach -nobrowse -readonly -mountpoint "$DMG_MOUNT_DIR" "$DMG_PATH" >/dev/null
test -d "$DMG_MOUNT_DIR/$APP_NAME.app"
test -L "$DMG_MOUNT_DIR/Applications"
codesign --verify --deep --strict "$DMG_MOUNT_DIR/$APP_NAME.app"
if [[ "$SHELFDROP_NOTARIZE" == "1" || "$SHELFDROP_NOTARIZE" == "true" ]]; then
  xcrun stapler validate "$DMG_MOUNT_DIR/$APP_NAME.app"
fi
hdiutil detach "$DMG_MOUNT_DIR" >/dev/null

echo "$ZIP_PATH"
echo "$DMG_PATH"
