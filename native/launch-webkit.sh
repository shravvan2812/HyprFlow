#!/usr/bin/env bash
# ==============================================================================
# Native WebKitGTK Desktop Window Runner (Arch Linux + Wayland)
# Uses native WebKit2GTK (the GNOME/Wayland native engine, NOT Chromium).
# 100% offline. Never uses Chromium or Chrome.
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec python3 "${SCRIPT_DIR}/launch-webkit.py" "$@"
