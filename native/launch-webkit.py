#!/usr/bin/env python3
"""
================================================================================
Native WebKitGTK Window Launcher for Goals & Habits (Arch Linux + Wayland)
Uses native WebKitGTK (the GNOME/Wayland native engine, NOT Chromium).
Runs 100% offline. Never uses Chromium or Chrome.
================================================================================
"""

import os
import sys
import socket
import threading
import http.server
import socketserver
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT_DIR = SCRIPT_DIR.parent
DIST_DIR = ROOT_DIR / "dist"

def ensure_build():
    if not (DIST_DIR / "index.html").exists():
        print("[WebKitGTK] Building offline assets (npm run build)...")
        os.system(f"cd '{ROOT_DIR}' && npm run build")
    if not (DIST_DIR / "index.html").exists():
        print(f"[Error] Could not find {DIST_DIR / 'index.html'}. Run 'npm run build' first.", file=sys.stderr)
        sys.exit(1)

def start_local_server(directory):
    # Find a free local port
    sock = socket.socket()
    sock.bind(("127.0.0.1", 0))
    port = sock.getsockname()[1]
    sock.close()

    class QuietHandler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(directory), **kwargs)
        def log_message(self, format, *args):
            pass  # Silent

    server = socketserver.TCPServer(("127.0.0.1", port), QuietHandler)
    t = threading.Thread(target=server.serve_forever, daemon=True)
    t.start()
    return server, port

def launch_with_pywebview(url):
    import webview
    window = webview.create_window(
        "Goals & Habits",
        url,
        width=1100,
        height=820,
        background_color="#000000",
        frameless=False,
        easy_drag=True,
    )
    # Use native GTK engine (WebKit2GTK)
    webview.start(gui="gtk")

def launch_with_pygobject(url):
    import gi
    gi.require_version("Gtk", "3.0")
    try:
        gi.require_version("WebKit2", "4.1")
    except ValueError:
        gi.require_version("WebKit2", "4.0")
    from gi.repository import Gtk, WebKit2, Gdk

    win = Gtk.Window(title="Goals & Habits")
    win.set_default_size(1100, 820)
    win.set_position(Gtk.WindowPosition.CENTER)
    win.connect("destroy", Gtk.main_quit)

    # Set black background
    css_provider = Gtk.CssProvider()
    css_provider.load_from_data(b"window { background-color: #000000; }")
    Gtk.StyleContext.add_provider_for_screen(
        Gdk.Screen.get_default(),
        css_provider,
        Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION,
    )

    webview = WebKit2.WebView()
    settings = webview.get_settings()
    settings.set_enable_developer_extras(False)
    settings.set_enable_javascript(True)

    webview.load_uri(url)
    win.add(webview)
    win.show_all()
    Gtk.main()

def main():
    ensure_build()
    server, port = start_local_server(DIST_DIR)
    url = f"http://127.0.0.1:{port}"
    print(f"[WebKitGTK] Native server running at {url}")

    # Try PyGObject first, then pywebview
    launched = False
    try:
        print("[WebKitGTK] Launching via PyGObject + WebKit2GTK...")
        launch_with_pygobject(url)
        launched = True
    except Exception as e:
        print(f"[WebKitGTK] PyGObject not available ({e}), trying pywebview...", file=sys.stderr)
        try:
            launch_with_pywebview(url)
            launched = True
        except Exception as e2:
            print(f"[WebKitGTK] pywebview not available ({e2})", file=sys.stderr)

    if not launched:
        print("\n" + "=" * 65)
        print("To run the native WebKitGTK window on Arch Linux, install:")
        print("  sudo pacman -S webkit2gtk-4.1 python-gobject")
        print("  # or: sudo pacman -S webkit2gtk-4.1 python-pywebview")
        print("=" * 65 + "\n")
        sys.exit(1)

    server.shutdown()

if __name__ == "__main__":
    main()
