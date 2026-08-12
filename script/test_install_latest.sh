#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/temoto-install-test.XXXXXX")"
trap 'rm -rf "$TEST_ROOT"' EXIT

INSTALL_DIR="$TEST_ROOT/Applications"
EXISTING_APP="$INSTALL_DIR/ShelfDrop.app"
mkdir -p "$EXISTING_APP/Contents"
printf 'keep-existing\n' >"$EXISTING_APP/Contents/existing-marker"

INVALID_ROOT="$TEST_ROOT/invalid"
mkdir -p "$INVALID_ROOT/temoto.app/Contents"
printf 'invalid\n' >"$INVALID_ROOT/temoto.app/Contents/payload"
ditto -c -k --keepParent "$INVALID_ROOT/temoto.app" "$TEST_ROOT/invalid.zip"

if SHELFDROP_INSTALL_DIR="$INSTALL_DIR" \
    SHELFDROP_ZIP_PATH="$TEST_ROOT/invalid.zip" \
    SHELFDROP_SKIP_STOP=1 \
    SHELFDROP_SKIP_OPEN=1 \
    "$ROOT_DIR/script/install_latest.sh"; then
  echo "invalid app archive was accepted" >&2
  exit 1
fi

test -f "$EXISTING_APP/Contents/existing-marker"

VALID_ROOT="$TEST_ROOT/valid"
VALID_APP="$VALID_ROOT/temoto.app"
mkdir -p "$VALID_APP/Contents/MacOS"
cat >"$VALID_APP/Contents/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "https://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleExecutable</key><string>temoto</string>
  <key>CFBundleIdentifier</key><string>work.hayashigoto.ShelfDrop</string>
  <key>CFBundleShortVersionString</key><string>9.9.9</string>
  <key>CFBundleVersion</key><string>9.9.9</string>
  <key>CFBundlePackageType</key><string>APPL</string>
</dict></plist>
PLIST
cat >"$VALID_APP/Contents/MacOS/temoto" <<'EXECUTABLE'
#!/usr/bin/env bash
exit 0
EXECUTABLE
chmod +x "$VALID_APP/Contents/MacOS/temoto"
codesign --force --sign - "$VALID_APP"
ditto -c -k --keepParent "$VALID_APP" "$TEST_ROOT/valid.zip"

SHELFDROP_INSTALL_DIR="$INSTALL_DIR" \
  SHELFDROP_ZIP_PATH="$TEST_ROOT/valid.zip" \
  SHELFDROP_SKIP_STOP=1 \
  SHELFDROP_SKIP_OPEN=1 \
  "$ROOT_DIR/script/install_latest.sh"

INSTALLED_APP="$INSTALL_DIR/temoto.app"
test "$(plutil -extract CFBundleShortVersionString raw "$INSTALLED_APP/Contents/Info.plist")" = "9.9.9"
test ! -e "$EXISTING_APP"
codesign --verify --deep --strict "$INSTALLED_APP"

PIPED_INSTALL_DIR="$TEST_ROOT/PipedApplications"
mkdir -p "$PIPED_INSTALL_DIR"
SHELFDROP_INSTALL_DIR="$PIPED_INSTALL_DIR" \
  SHELFDROP_ZIP_PATH="$TEST_ROOT/valid.zip" \
  SHELFDROP_SKIP_STOP=1 \
  SHELFDROP_SKIP_OPEN=1 \
  bash < "$ROOT_DIR/script/install_latest.sh"

test -x "$PIPED_INSTALL_DIR/temoto.app/Contents/MacOS/temoto"
codesign --verify --deep --strict "$PIPED_INSTALL_DIR/temoto.app"
