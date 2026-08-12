#!/usr/bin/env bash
set -euo pipefail

APP_NAME="temoto"
LEGACY_APP_NAME="ShelfDrop"
BUNDLE_ID="work.hayashigoto.ShelfDrop"
ZIP_URL="https://github.com/hayashiii-ghub/temoto/releases/latest/download/temoto-macos.zip"
TMP_DIR="$(mktemp -d)"
ZIP_PATH="$TMP_DIR/$APP_NAME-macos.zip"
EXTRACT_DIR="$TMP_DIR/extract"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

validate_app() {
  local app="$1"
  local info_plist="$app/Contents/Info.plist"
  local executable_name
  local version

  [[ -d "$app" && -f "$info_plist" ]] || return 1
  [[ "$(plutil -extract CFBundleIdentifier raw "$info_plist" 2>/dev/null)" == "$BUNDLE_ID" ]] || return 1

  executable_name="$(plutil -extract CFBundleExecutable raw "$info_plist" 2>/dev/null)"
  [[ -n "$executable_name" && -x "$app/Contents/MacOS/$executable_name" ]] || return 1

  version="$(plutil -extract CFBundleShortVersionString raw "$info_plist" 2>/dev/null)"
  [[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || return 1
  codesign --verify --deep --strict "$app"
}

choose_install_dir() {
  if [[ -n "${SHELFDROP_INSTALL_DIR:-}" ]]; then
    printf '%s\n' "$SHELFDROP_INSTALL_DIR"
    return
  fi

  if [[ -d "/Applications/$APP_NAME.app" ]]; then
    printf '%s\n' "/Applications"
    return
  fi

  if [[ -d "$HOME/Applications/$APP_NAME.app" ]]; then
    printf '%s\n' "$HOME/Applications"
    return
  fi

  if [[ -d "/Applications/$LEGACY_APP_NAME.app" ]]; then
    printf '%s\n' "/Applications"
    return
  fi

  if [[ -d "$HOME/Applications/$LEGACY_APP_NAME.app" ]]; then
    printf '%s\n' "$HOME/Applications"
    return
  fi

  if [[ -w "/Applications" ]]; then
    printf '%s\n' "/Applications"
    return
  fi

  printf '%s\n' "$HOME/Applications"
}

install_app() {
  local source_app="$1"
  local destination_app="$2"
  local legacy_app="$3"
  local install_dir
  local staged_app
  local backup_app
  local use_sudo=0
  install_dir="$(dirname "$destination_app")"
  staged_app="$install_dir/.$APP_NAME.app.new.$$"
  backup_app="$install_dir/.$APP_NAME.app.backup.$$"

  if [[ ! -w "$install_dir" ]]; then
    use_sudo=1
    echo "Installing to $install_dir requires administrator permission."
  fi

  run_install() {
    if (( use_sudo )); then
      sudo "$@"
    else
      "$@"
    fi
  }

  rollback_install() {
    if [[ -e "$backup_app" ]]; then
      if [[ -e "$destination_app" ]]; then
        run_install rm -rf "$backup_app"
      else
        run_install mv "$backup_app" "$destination_app"
      fi
    fi
    run_install rm -rf "$staged_app"
  }

  trap 'rollback_install; exit 130' HUP INT TERM

  run_install rm -rf "$staged_app" "$backup_app"
  run_install ditto "$source_app" "$staged_app"
  if ! validate_app "$staged_app"; then
    run_install rm -rf "$staged_app"
    echo "Staged $APP_NAME.app failed validation" >&2
    return 1
  fi

  if [[ -e "$destination_app" ]]; then
    run_install mv "$destination_app" "$backup_app"
  fi

  if ! run_install mv "$staged_app" "$destination_app"; then
    if [[ -e "$backup_app" ]]; then
      run_install mv "$backup_app" "$destination_app"
    fi
    return 1
  fi

  run_install rm -rf "$backup_app"
  if [[ "$legacy_app" != "$destination_app" && -e "$legacy_app" ]]; then
    run_install rm -rf "$legacy_app"
  fi
  run_install xattr -dr com.apple.quarantine "$destination_app" 2>/dev/null || true
  trap - HUP INT TERM
}

INSTALL_DIR="$(choose_install_dir)"
DESTINATION_APP="$INSTALL_DIR/$APP_NAME.app"
LEGACY_APP="$INSTALL_DIR/$LEGACY_APP_NAME.app"

if [[ -n "${SHELFDROP_ZIP_PATH:-}" ]]; then
  echo "Using local $APP_NAME archive..."
  cp "$SHELFDROP_ZIP_PATH" "$ZIP_PATH"
else
  echo "Downloading latest $APP_NAME..."
  curl -L --fail -A "Mozilla/5.0" -o "$ZIP_PATH" "$ZIP_URL"
fi

mkdir -p "$EXTRACT_DIR"
ditto -x -k "$ZIP_PATH" "$EXTRACT_DIR"

SOURCE_APP="$EXTRACT_DIR/$APP_NAME.app"
if ! validate_app "$SOURCE_APP"; then
  echo "Downloaded archive did not contain a valid $APP_NAME.app" >&2
  exit 1
fi

if [[ "${SHELFDROP_SKIP_STOP:-0}" != "1" ]]; then
  echo "Stopping running $APP_NAME..."
  pkill -x "$APP_NAME" >/dev/null 2>&1 || true
  pkill -x "$LEGACY_APP_NAME" >/dev/null 2>&1 || true
fi

mkdir -p "$INSTALL_DIR"
echo "Installing to $DESTINATION_APP..."
install_app "$SOURCE_APP" "$DESTINATION_APP" "$LEGACY_APP"

if [[ "${SHELFDROP_SKIP_OPEN:-0}" != "1" ]]; then
  open "$DESTINATION_APP"
fi

echo "Updated $APP_NAME at $DESTINATION_APP"
