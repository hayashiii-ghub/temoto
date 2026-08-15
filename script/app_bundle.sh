#!/usr/bin/env bash

SHELFDROP_APP_NAME="temoto"
SHELFDROP_BUNDLE_ID="work.hayashigoto.ShelfDrop"
SHELFDROP_MIN_SYSTEM_VERSION="26.0"

shelfdrop_copy_bundle_resources() {
  local root_dir="$1"
  local resources_dir="$2"

  cp "$root_dir/Assets/ShelfDrop.icns" "$resources_dir/temoto.icns"
  cp "$root_dir/Assets/MenuBarTemplate.svg" "$resources_dir/MenuBarTemplate.svg"
}

shelfdrop_write_info_plist() {
  local info_plist="$1"
  local app_version="$2"

  cat >"$info_plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleExecutable</key>
  <string>$SHELFDROP_APP_NAME</string>
  <key>CFBundleIdentifier</key>
  <string>$SHELFDROP_BUNDLE_ID</string>
  <key>CFBundleName</key>
  <string>$SHELFDROP_APP_NAME</string>
  <key>CFBundleDisplayName</key>
  <string>$SHELFDROP_APP_NAME</string>
  <key>CFBundleIconFile</key>
  <string>temoto.icns</string>
  <key>CFBundleShortVersionString</key>
  <string>$app_version</string>
  <key>CFBundleVersion</key>
  <string>$app_version</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>LSMinimumSystemVersion</key>
  <string>$SHELFDROP_MIN_SYSTEM_VERSION</string>
  <key>NSHighResolutionCapable</key>
  <true/>
  <key>NSAppleEventsUsageDescription</key>
  <string>temoto uses Finder access to add your selected files to the shelf.</string>
  <key>LSUIElement</key>
  <true/>
  <key>NSPrincipalClass</key>
  <string>NSApplication</string>
</dict>
</plist>
PLIST
}
