================================================================================
MINIMALIST PERSONAL GOAL & HABIT MANAGER (100% OFFLINE ARCH LINUX NATIVE)
No Chromium, No Web Browser, Pure Offline Local Storage with Mako Notifications
================================================================================

This system runs 100% offline and natively on your Arch Linux computer.
Zero external browsers (no Chromium, no Brave, no Chrome, no Electron).
Zero telemetry, zero cloud sync, and zero internet connection required.

Key Architecture:
- 100% Native Python engine using standard libraries (zero pip installs required).
- Pure local JSON storage in ~/.local/share/goals/data.json.
- Native Wayland desktop notifications delivered through Mako via notify-send.
- NEVER shows in Quickshell or any taskbar (runs as overlay, TUI, or headless daemon).
- Super+G Rofi / Fuzzel overlay: toggle habits, define goals, or remove habits & goals!
- Prompts for daily reminder times whenever creating Goals, Tasks, or Habits.

--------------------------------------------------------------------------------
TABLE OF CONTENTS
--------------------------------------------------------------------------------
1. Prerequisites on Arch Linux
2. Project Structure
3. Interactive Terminal TUI (Kitty, Alacritty, Foot)
4. Fast Command-Line Interface (CLI)
5. Super+G Rofi / Fuzzel Overlay (Toggle, Add & Remove Items)
6. Headless Mako Background Daemon (Systemd Timer)
7. Native WebKitGTK Window (Pure GTK, Not Chromium)
8. Hyprland Keybindings Setup
9. Mako Configuration (~/.config/mako/config)
10. Data Storage & Portability

================================================================================
1. PREREQUISITES ON ARCH LINUX
================================================================================

Everything runs on standard Arch Linux system packages. No Chromium needed:

  sudo pacman -S python mako libnotify

Optional (depending on your launcher preference):
  sudo pacman -S rofi-wayland   # or fuzzel
  sudo pacman -S alacritty      # or kitty, foot, ghostty

For the native WebKitGTK window (GTK Wayland, NOT Chromium):
  sudo pacman -S webkit2gtk-4.1 python-gobject
  # or: sudo pacman -S webkit2gtk-4.1 python-pywebview

================================================================================
2. PROJECT STRUCTURE
================================================================================

  ~/Projects/goal-manager/
  ├── native/
  │   ├── goals.py               # Standalone 100% offline CLI, TUI & Daemon
  │   ├── goals-rofi.sh          # Super+G Rofi Wayland overlay menu (Add/Toggle/Remove)
  │   ├── goals-fuzzel.sh        # Super+G Fuzzel Wayland overlay menu (Add/Toggle/Remove)
  │   ├── goal-reminders.service # Systemd background service unit
  │   ├── goal-reminders.timer   # Systemd 1-minute reminder check timer
  │   ├── launch-webkit.py       # Native WebKitGTK runner with local embedded server
  │   └── launch-webkit.sh       # Executable wrapper for WebKitGTK
  └── README.txt

Make all scripts executable:
  chmod +x ~/Projects/goal-manager/native/*.sh ~/Projects/goal-manager/native/*.py

================================================================================
3. INTERACTIVE TERMINAL TUI (RUNS IN ANY TERMINAL)
================================================================================

Launch the full monochrome interactive interface inside your terminal:

  python3 ~/Projects/goal-manager/native/goals.py

Keyboard Controls:
  [1-9]       Check off or toggle a habit for today (updates streak & notifies)
  [n]         Define a New Goal (prompts for title, deadline & Mako reminder time)
  [h]         Add a Daily Habit (prompts for title & Mako reminder time)
  [s]         Add a Sub-Goal / Task (prompts for title & Mako reminder time)
  [r]         Remove a Daily Habit
  [d]         Delete a Goal and its attached tasks
  [m]         Send a test notification to Mako
  [q] / Esc   Quit

Launch directly in a floating terminal window with no taskbar presence:
  alacritty --class goal-manager -e python3 ~/Projects/goal-manager/native/goals.py

================================================================================
4. FAST COMMAND-LINE INTERFACE (CLI)
================================================================================

You can interact with your goals and habits directly from your shell:

1. View Today's Habits:
   python3 native/goals.py today

2. Check off a habit for today:
   python3 native/goals.py check 1
   # Or by keyword:
   python3 native/goals.py check "systems coding"

3. Define a new goal with Mako daily reminder:
   python3 native/goals.py add-goal

4. Add a sub-goal / milestone task with reminder time:
   python3 native/goals.py add-task

5. Add a daily habit with reminder time:
   python3 native/goals.py add-habit

6. Remove a habit:
   python3 native/goals.py remove-habit 1
   # Or: python3 native/goals.py remove-habit "coding"

7. Delete a goal:
   python3 native/goals.py remove-goal 1
   # Or: python3 native/goals.py remove-goal "rust"

8. List all goals and milestone progress:
   python3 native/goals.py list

================================================================================
5. SUPER+G ROFI / FUZZEL OVERLAY (NEVER SHOWS ON TASKBAR)
================================================================================

Because you use Quickshell for your taskbar, you do NOT want a persistent
window sitting on your bar. 

The Rofi and Fuzzel overlays provide an instant popup menu that disappears
the moment you make a selection:

1. Rofi Wayland:
   ~/Projects/goal-manager/native/goals-rofi.sh

2. Fuzzel:
   ~/Projects/goal-manager/native/goals-fuzzel.sh

Features in the Super+G Menu:
- Toggle Today's Habits: Selecting any habit checks it off instantly and triggers Mako.
- '+ [n] Define New Goal': Asks for title, category, and daily Mako reminder.
- '+ [h] Add Daily Habit': Asks for habit title and daily reminder time.
- '+ [s] Add Sub-Goal / Task': Adds a milestone to any active goal.
- '- [r] Remove a Habit': Opens a list of all your habits and removes the chosen one.
- '- [d] Delete a Goal': Opens a list of all goals and prompts to delete.
- '+ [t] Open Terminal TUI': Launches the interactive terminal view.
- Zero taskbar footprint on Quickshell!

================================================================================
6. HEADLESS MAKO BACKGROUND DAEMON (SYSTEMD TIMER)
================================================================================

To ensure Mako notifies you at the exact daily reminder times you configured,
without having ANY window or browser running:

Step 1: Copy systemd user service & timer
-----------------------------------------
  mkdir -p ~/.config/systemd/user
  cp ~/Projects/goal-manager/native/goal-reminders.service ~/.config/systemd/user/
  cp ~/Projects/goal-manager/native/goal-reminders.timer ~/.config/systemd/user/

Step 2: Enable and start the timer
----------------------------------
  systemctl --user daemon-reload
  systemctl --user enable --now goal-reminders.timer

Verify it is active:
  systemctl --user list-timers --all | grep goal-reminders

How it functions:
Every minute, systemd runs `python3 native/goals.py notify`. It inspects
~/.local/share/goals/data.json. When the clock matches or passes a reminder time
for any active goal, habit, or uncompleted sub-goal, it fires `notify-send`
straight to Mako! It remembers what was sent so it only alerts once per day.

================================================================================
7. NATIVE WEBKITGTK WINDOW (PURE GTK, NOT CHROMIUM)
================================================================================

If you want a graphical desktop window rather than the terminal TUI, you can
run the native WebKitGTK wrapper. WebKit2GTK is the native C/GTK engine used by
GNOME and Epiphany (completely separate from Chromium / Google Chrome):

  sudo pacman -S webkit2gtk-4.1 python-gobject
  # or: sudo pacman -S webkit2gtk-4.1 python-pywebview

Launch:
  ~/Projects/goal-manager/native/launch-webkit.sh

Why the "Cannot find file" error was fixed:
Previous versions attempted to load ES modules directly via file://, which modern
WebKitGTK blocks due to origin security policies. The updated launcher starts a
silent, ephemeral localhost server in Python (http://127.0.0.1:<random_port>) and
serves the pre-built relative assets with zero CORS or path errors.

To ensure the window never shows in Quickshell, add this Hyprland rule:
  windowrulev2 = skip_taskbar, class:^(goal-manager)$

================================================================================
8. HYPRLAND KEYBINDINGS SETUP
================================================================================

Add the following to ~/.config/hypr/hyprland.conf:

  # ----------------------------------------------------------------------
  # Goals & Habits - 100% Offline Keybindings
  # ----------------------------------------------------------------------
  
  # Super + G: Instant Rofi overlay (never shows in Quickshell taskbar)
  bind = SUPER, G, exec, ~/Projects/goal-manager/native/goals-rofi.sh
  
  # Super + Shift + G: Open full TUI in a floating terminal window
  bind = SUPER SHIFT, G, exec, alacritty --class goal-manager -e python3 ~/Projects/goal-manager/native/goals.py
  
  # Window rules: prevent any goal window from appearing in taskbar
  windowrulev2 = skip_taskbar, class:^(goal-manager)$
  windowrulev2 = float, class:^(goal-manager)$
  windowrulev2 = size 1000 750, class:^(goal-manager)$
  windowrulev2 = center, class:^(goal-manager)$

================================================================================
9. MAKO NOTIFICATION CONFIGURATION (~/.config/mako/config)
================================================================================

Add this monochrome filter to ~/.config/mako/config:

  # Goals & Habits Mako Filter
  [app-name="Goals"]
  background-color=#09090bee
  text-color=#fafafa
  border-color=#3f3f46
  border-size=1
  border-radius=12
  font=JetBrains Mono 10
  default-timeout=8000
  on-button-left=invoke-default-action
  on-button-right=dismiss

Reload Mako:
  makoctl reload

Test your notification:
  notify-send -a "Goals" "Daily Habit Reminder" "45m Deep Systems Coding · 6d streak"

================================================================================
10. DATA STORAGE & PORTABILITY
================================================================================

All goals, sub-goals, habits, completion dates, and streaks are stored in:
  ~/.local/share/goals/data.json

It is a clean, human-readable JSON file. You can back it up, edit it with any
editor (nvim / micro / helix), or copy it between Arch systems anytime.

No internet. No accounts. No browsers. 100% private and native to your machine.
================================================================================
