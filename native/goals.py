#!/usr/bin/env python3
"""
================================================================================
Minimalist Personal Goal & Daily Habit Manager (100% Offline Arch Linux Native)
Zero browser, zero Chromium, pure local JSON storage with Mako notifications.
================================================================================
"""

import os
import sys
import json
import time
import subprocess
import argparse
from datetime import datetime, date, timedelta
from pathlib import Path

# Data storage paths (XDG compliant)
DATA_DIR = Path(os.environ.get("XDG_DATA_HOME", Path.home() / ".local" / "share")) / "goals"
DATA_FILE = DATA_DIR / "data.json"
CACHE_DIR = Path(os.environ.get("XDG_CACHE_HOME", Path.home() / ".cache")) / "goals"
STATE_FILE = CACHE_DIR / "reminded_state.json"

DEFAULT_GOALS = [
    {
        "id": "goal-rust-arch",
        "title": "Build High-Performance Systems & Linux Tools",
        "description": "Master systems programming, async architectures, and native Linux utilities.",
        "category": "skills",
        "status": "active",
        "targetDate": (date.today() + timedelta(days=90)).isoformat(),
        "dailyReminderEnabled": True,
        "dailyReminderTime": "09:00",
        "color": "#ffffff",
        "icon": "🎯",
        "progress": 33,
        "createdAt": datetime.now().isoformat(),
        "subGoals": [
            {
                "id": "sg-1",
                "title": "Complete Async I/O Core Implementation",
                "completed": True,
                "targetDate": (date.today() + timedelta(days=7)).isoformat(),
                "reminderTime": "10:00",
            },
            {
                "id": "sg-2",
                "title": "Profile memory and zero-copy buffers",
                "completed": False,
                "targetDate": (date.today() + timedelta(days=21)).isoformat(),
                "reminderTime": "14:00",
            },
        ],
        "habits": [
            {
                "id": "hb-1",
                "goalId": "goal-rust-arch",
                "title": "45m Deep Systems Coding",
                "frequency": "daily",
                "streak": 5,
                "bestStreak": 14,
                "lastCompletedDate": "",
                "history": [],
                "targetTime": "08:30",
                "reminderTime": "08:30",
            },
            {
                "id": "hb-2",
                "goalId": "goal-rust-arch",
                "title": "Review RFCs or kernel documentation",
                "frequency": "daily",
                "streak": 3,
                "bestStreak": 7,
                "lastCompletedDate": "",
                "history": [],
                "targetTime": "20:00",
                "reminderTime": "20:00",
            },
        ],
    }
]

def ensure_data_file():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    if not DATA_FILE.exists():
        initial = {
            "goals": DEFAULT_GOALS,
            "settings": {
                "themeMode": "dark",
                "dailyReminderEnabled": True,
                "dailyReminderTime": "09:00",
                "makoNotificationsEnabled": True,
            },
            "stats": {
                "currentStreak": 5,
                "longestStreak": 14,
                "lastActiveDate": date.today().isoformat(),
            },
        }
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(initial, f, indent=2)

def load_data():
    ensure_data_file()
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading data from {DATA_FILE}: {e}", file=sys.stderr)
        return {"goals": [], "settings": {}, "stats": {}}

def save_data(data):
    ensure_data_file()
    temp_file = DATA_FILE.with_suffix(".tmp")
    with open(temp_file, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    os.replace(temp_file, DATA_FILE)

def calculate_goal_progress(goal):
    sub_goals = goal.get("subGoals", [])
    habits = goal.get("habits", [])
    if not sub_goals and not habits:
        return 0
    total_items = len(sub_goals) + len(habits)
    completed_sub = sum(1 for sg in sub_goals if sg.get("completed", False))
    today_str = date.today().isoformat()
    completed_habits = sum(1 for h in habits if h.get("lastCompletedDate") == today_str)
    return int(((completed_sub + completed_habits) / total_items) * 100)

def send_mako_notification(title, message, urgency="normal"):
    """Dispatches native desktop notification to Mako via notify-send"""
    try:
        subprocess.run(
            [
                "notify-send",
                "-a", "Goals",
                "-u", urgency,
                "-t", "8000",
                title,
                message,
            ],
            check=False,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    except FileNotFoundError:
        print(f"[MAKO NOTIFY FALLBACK] {title} -- {message}")

def check_and_send_due_reminders():
    """Checks goals, sub-goals, and habits against current time and fires Mako alerts"""
    data = load_data()
    now = datetime.now()
    today_str = date.today().isoformat()
    current_time_str = now.strftime("%H:%M")

    # Load reminded state for today
    reminded_state = {}
    if STATE_FILE.exists():
        try:
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                saved = json.load(f)
                if saved.get("date") == today_str:
                    reminded_state = saved.get("keys", {})
        except Exception:
            reminded_state = {}

    notifications_fired = 0

    for goal in data.get("goals", []):
        if goal.get("status") != "active":
            continue

        goal_id = goal.get("id")
        goal_title = goal.get("title")

        # 1. Goal daily reminder
        if goal.get("dailyReminderEnabled", True):
            rem_time = goal.get("dailyReminderTime")
            key = f"goal_{goal_id}"
            if rem_time and current_time_str >= rem_time and key not in reminded_state:
                pending_habits = sum(
                    1 for h in goal.get("habits", []) if h.get("lastCompletedDate") != today_str
                )
                msg = (
                    f"{pending_habits} habits due today for {goal_title}"
                    if pending_habits > 0
                    else f"Review active milestones for {goal_title}"
                )
                send_mako_notification(f"Goal: {goal_title}", msg)
                reminded_state[key] = current_time_str
                notifications_fired += 1

        # 2. Habit reminders
        for habit in goal.get("habits", []):
            h_id = habit.get("id")
            h_title = habit.get("title")
            h_time = habit.get("reminderTime") or habit.get("targetTime")
            h_done = habit.get("lastCompletedDate") == today_str
            key = f"habit_{h_id}"

            if h_time and current_time_str >= h_time and not h_done and key not in reminded_state:
                streak = habit.get("streak", 0)
                streak_msg = f"Current streak: {streak}d" if streak > 0 else "Daily practice"
                send_mako_notification(f"Habit: {h_title}", f"{goal_title} · {streak_msg}")
                reminded_state[key] = current_time_str
                notifications_fired += 1

        # 3. Sub-Goal / Task reminders
        for sg in goal.get("subGoals", []):
            sg_id = sg.get("id")
            sg_title = sg.get("title")
            sg_time = sg.get("reminderTime")
            sg_done = sg.get("completed", False)
            key = f"subgoal_{sg_id}"

            if sg_time and current_time_str >= sg_time and not sg_done and key not in reminded_state:
                due = f" (Due {sg.get('targetDate')})" if sg.get("targetDate") else ""
                send_mako_notification(f"Sub-Goal: {sg_title}", f"Milestone for {goal_title}{due}")
                reminded_state[key] = current_time_str
                notifications_fired += 1

    # Save state
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump({"date": today_str, "keys": reminded_state}, f)

    return notifications_fired

# ==============================================================================
# CLI COMMANDS
# ==============================================================================

def cmd_today():
    data = load_data()
    today_str = date.today().isoformat()
    now_formatted = date.today().strftime("%A, %b %d, %Y")

    print("\n" + "=" * 60)
    print(f" TODAY'S HABITS RITUAL ({now_formatted})")
    print("=" * 60)

    habits_list = []
    for goal in data.get("goals", []):
        if goal.get("status") != "active":
            continue
        for h in goal.get("habits", []):
            habits_list.append((goal, h))

    if not habits_list:
        print("  No habits scheduled. Add habits using: ./goals.py add-habit")
        print("=" * 60 + "\n")
        return

    completed_count = 0
    for idx, (goal, habit) in enumerate(habits_list, 1):
        is_done = habit.get("lastCompletedDate") == today_str
        if is_done:
            completed_count += 1
        box = "[✓]" if is_done else "[ ]"
        streak = habit.get("streak", 0)
        time_rem = habit.get("reminderTime") or habit.get("targetTime") or "--:--"
        status_txt = "DONE" if is_done else f"Mako {time_rem}"

        print(f" {idx:2d}. {box} {habit.get('title'):<30}  | {goal.get('title'):<20} | {streak:2d}d streak | {status_txt}")

    pct = int((completed_count / len(habits_list)) * 100) if habits_list else 0
    print("-" * 60)
    print(f"  Completion: {completed_count}/{len(habits_list)} ({pct}%)")
    print("=" * 60)
    print("  To mark a habit as done:  ./goals.py check <number_or_name>\n")

def cmd_check(query):
    data = load_data()
    today_str = date.today().isoformat()

    habits_list = []
    for goal in data.get("goals", []):
        if goal.get("status") != "active":
            continue
        for h in goal.get("habits", []):
            habits_list.append((goal, h))

    target_habit = None
    target_goal = None

    if query.isdigit():
        idx = int(query) - 1
        if 0 <= idx < len(habits_list):
            target_goal, target_habit = habits_list[idx]
    else:
        for g, h in habits_list:
            if query.lower() in h.get("title", "").lower() or query.lower() in h.get("id", "").lower():
                target_goal, target_habit = g, h
                break

    if not target_habit:
        print(f"Could not find habit matching '{query}'. Run './goals.py today' to view items.")
        return

    is_currently_done = target_habit.get("lastCompletedDate") == today_str
    if is_currently_done:
        target_habit["lastCompletedDate"] = ""
        target_habit["streak"] = max(0, target_habit.get("streak", 1) - 1)
        print(f"[-] Marked incomplete: '{target_habit['title']}' (streak: {target_habit['streak']}d)")
    else:
        target_habit["lastCompletedDate"] = today_str
        target_habit["streak"] = target_habit.get("streak", 0) + 1
        if target_habit["streak"] > target_habit.get("bestStreak", 0):
            target_habit["bestStreak"] = target_habit["streak"]
        history = target_habit.get("history", [])
        if today_str not in history:
            history.append(today_str)
            target_habit["history"] = history
        print(f"[✓] Conquered today: '{target_habit['title']}'! Streak: {target_habit['streak']} days!")
        send_mako_notification(
            f"Habit Conquered: {target_habit['title']}",
            f"{target_goal['title']} · Streak: {target_habit['streak']} days!",
        )

    target_goal["progress"] = calculate_goal_progress(target_goal)
    save_data(data)

def cmd_list_goals():
    data = load_data()
    print("\n" + "=" * 70)
    print(" PERSONAL GOALS ROADMAP (100% Offline)")
    print("=" * 70)

    goals = data.get("goals", [])
    if not goals:
        print("  No goals configured yet. Add one with: ./goals.py add-goal")
        print("=" * 70 + "\n")
        return

    for idx, goal in enumerate(goals, 1):
        rem = f"Mako {goal.get('dailyReminderTime')}" if goal.get("dailyReminderEnabled", True) else "No reminder"
        target = f"Due {goal.get('targetDate')}" if goal.get("targetDate") else "Ongoing"
        progress = goal.get("progress", 0)

        print(f"\n[{idx}] {goal.get('title')} ({goal.get('category').upper()})")
        print(f"    Progress: [{('=' * (progress // 5)):<20}] {progress}% | {target} | {rem}")
        if goal.get("description"):
            print(f"    Vision:   {goal.get('description')}")

        sub_goals = goal.get("subGoals", [])
        if sub_goals:
            print("    Sub-Goals / Tasks:")
            for sg in sub_goals:
                chk = "[✓]" if sg.get("completed") else "[ ]"
                sg_rem = f" (Mako {sg.get('reminderTime')})" if sg.get("reminderTime") else ""
                print(f"      {chk} {sg.get('title')}{sg_rem}")

        habits = goal.get("habits", [])
        if habits:
            print("    Daily Habits:")
            for h in habits:
                h_rem = f" (Mako {h.get('reminderTime') or h.get('targetTime')})" if (h.get('reminderTime') or h.get('targetTime')) else ""
                print(f"      * {h.get('title')} [{h.get('streak')}d streak]{h_rem}")

    print("\n" + "=" * 70 + "\n")

def cmd_list_goals_raw():
    """Outputs a clean enumerated list of all goals for Rofi / Fuzzel menus"""
    data = load_data()
    goals = data.get("goals", [])
    for idx, g in enumerate(goals, 1):
        cat = g.get("category", "skills").upper()
        print(f"{idx}. {g.get('title')} [{cat}]")

def cmd_list_habits_raw():
    """Outputs a clean enumerated list of all habits with their goal name for Rofi / Fuzzel menus"""
    data = load_data()
    idx = 1
    for g in data.get("goals", []):
        for h in g.get("habits", []):
            print(f"{idx}. {h.get('title')} (Goal: {g.get('title')})")
            idx += 1

def cmd_remove_goal(query=None):
    data = load_data()
    goals = data.get("goals", [])
    if not goals:
        print("No goals exist to remove.")
        return

    target_idx = None

    if query is None or not query.strip():
        print("\n=== Remove a Goal ===")
        for idx, g in enumerate(goals, 1):
            print(f"  [{idx}] {g.get('title')} ({g.get('category')})")
        ans = input(f"Select goal to remove (1-{len(goals)}): ").strip()
        if not ans.isdigit() or not (1 <= int(ans) <= len(goals)):
            print("Cancelled.")
            return
        target_idx = int(ans) - 1
    elif query.isdigit():
        val = int(query) - 1
        if 0 <= val < len(goals):
            target_idx = val
    else:
        for idx, g in enumerate(goals):
            if query.lower() in g.get("title", "").lower() or query.lower() in g.get("id", "").lower():
                target_idx = idx
                break

    if target_idx is None or not (0 <= target_idx < len(goals)):
        print(f"Could not find goal matching '{query}'.")
        return

    removed = goals.pop(target_idx)
    save_data(data)
    print(f"\n[✓] Removed goal: '{removed.get('title')}'.\n")
    send_mako_notification("Goal Removed", f"Successfully deleted goal: {removed.get('title')}")

def cmd_remove_habit(query=None):
    data = load_data()
    habits_flat = []
    for g in data.get("goals", []):
        for h in g.get("habits", []):
            habits_flat.append((g, h))

    if not habits_flat:
        print("No habits exist to remove.")
        return

    target_tuple = None

    if query is None or not query.strip():
        print("\n=== Remove a Daily Habit ===")
        for idx, (g, h) in enumerate(habits_flat, 1):
            print(f"  [{idx}] {h.get('title')} (Goal: {g.get('title')})")
        ans = input(f"Select habit to remove (1-{len(habits_flat)}): ").strip()
        if not ans.isdigit() or not (1 <= int(ans) <= len(habits_flat)):
            print("Cancelled.")
            return
        target_tuple = habits_flat[int(ans) - 1]
    elif query.isdigit():
        val = int(query) - 1
        if 0 <= val < len(habits_flat):
            target_tuple = habits_flat[val]
    else:
        for g, h in habits_flat:
            if query.lower() in h.get("title", "").lower() or query.lower() in h.get("id", "").lower():
                target_tuple = (g, h)
                break

    if not target_tuple:
        print(f"Could not find habit matching '{query}'.")
        return

    parent_goal, target_habit = target_tuple
    parent_goal["habits"] = [h for h in parent_goal.get("habits", []) if h.get("id") != target_habit.get("id")]
    parent_goal["progress"] = calculate_goal_progress(parent_goal)
    save_data(data)
    print(f"\n[✓] Removed habit: '{target_habit.get('title')}' from goal '{parent_goal.get('title')}'.\n")
    send_mako_notification("Habit Removed", f"Successfully deleted habit: {target_habit.get('title')}")

def cmd_add_goal():
    print("\n=== Define New Personal Goal ===")
    title = input("Goal Objective (e.g. Master Rust, Run 10km): ").strip()
    if not title:
        print("Cancelled: Goal title cannot be empty.")
        return

    desc = input("Motivation & Vision: ").strip()
    print("Categories: [1] skills  [2] health  [3] career  [4] mind  [5] freedom")
    cat_choice = input("Select category (1-5, default 1): ").strip()
    categories = {"1": "skills", "2": "health", "3": "career", "4": "mind", "5": "freedom"}
    cat = categories.get(cat_choice, "skills")

    deadline = input("Target deadline (YYYY-MM-DD, optional): ").strip()

    # Daily Mako reminder prompt
    rem_prompt = input("Enable daily Mako reminder? (Y/n, default Y): ").strip().lower()
    rem_enabled = rem_prompt != "n"
    rem_time = "09:00"
    if rem_enabled:
        time_input = input("Mako Daily Reminder Time (HH:MM, default 09:00): ").strip()
        if time_input:
            rem_time = time_input

    data = load_data()
    new_goal = {
        "id": f"goal-{int(time.time())}",
        "title": title,
        "description": desc,
        "category": cat,
        "status": "active",
        "targetDate": deadline or (date.today() + timedelta(days=60)).isoformat(),
        "dailyReminderEnabled": rem_enabled,
        "dailyReminderTime": rem_time,
        "color": "#ffffff",
        "icon": "🎯",
        "progress": 0,
        "createdAt": datetime.now().isoformat(),
        "subGoals": [],
        "habits": [],
    }

    data.setdefault("goals", []).append(new_goal)
    save_data(data)
    print(f"\n[✓] Goal '{title}' created successfully! Daily Mako reminder set for {rem_time}.\n")
    send_mako_notification("New Goal Created", f"{title} (Reminder at {rem_time})")

def cmd_add_task():
    data = load_data()
    goals = [g for g in data.get("goals", []) if g.get("status") == "active"]
    if not goals:
        print("No active goals found. Create a goal first: ./goals.py add-goal")
        return

    print("\n=== Add Sub-Goal / Task ===")
    print("Assign to which goal?")
    for idx, g in enumerate(goals, 1):
        print(f"  [{idx}] {g.get('title')}")

    choice = input(f"Choose goal (1-{len(goals)}): ").strip()
    if not choice.isdigit() or not (1 <= int(choice) <= len(goals)):
        print("Invalid selection.")
        return

    selected_goal = goals[int(choice) - 1]
    title = input("Sub-Goal Title (e.g. Read Chapter 1, Build Parser): ").strip()
    if not title:
        print("Cancelled.")
        return

    due = input("Target date (YYYY-MM-DD, optional): ").strip()
    reminder = input("Mako Reminder Time (HH:MM, default 10:00): ").strip() or "10:00"

    new_sg = {
        "id": f"sg-{int(time.time())}",
        "title": title,
        "completed": False,
        "targetDate": due or (date.today() + timedelta(days=14)).isoformat(),
        "reminderTime": reminder,
    }

    selected_goal.setdefault("subGoals", []).append(new_sg)
    selected_goal["progress"] = calculate_goal_progress(selected_goal)
    save_data(data)
    print(f"\n[✓] Sub-Goal '{title}' added to '{selected_goal['title']}' with Mako reminder at {reminder}.\n")

def cmd_add_habit():
    data = load_data()
    goals = [g for g in data.get("goals", []) if g.get("status") == "active"]
    if not goals:
        print("No active goals found. Create a goal first: ./goals.py add-goal")
        return

    print("\n=== Add Daily Habit ===")
    print("Attach habit to which goal?")
    for idx, g in enumerate(goals, 1):
        print(f"  [{idx}] {g.get('title')}")

    choice = input(f"Choose goal (1-{len(goals)}): ").strip()
    if not choice.isdigit() or not (1 <= int(choice) <= len(goals)):
        print("Invalid selection.")
        return

    selected_goal = goals[int(choice) - 1]
    title = input("Daily Habit Title (e.g. 45m Coding, Morning Run): ").strip()
    if not title:
        print("Cancelled.")
        return

    reminder = input("Daily Mako Reminder Time (HH:MM, default 08:30): ").strip() or "08:30"

    new_habit = {
        "id": f"hb-{int(time.time())}",
        "goalId": selected_goal["id"],
        "title": title,
        "frequency": "daily",
        "streak": 0,
        "bestStreak": 0,
        "lastCompletedDate": "",
        "history": [],
        "targetTime": reminder,
        "reminderTime": reminder,
    }

    selected_goal.setdefault("habits", []).append(new_habit)
    selected_goal["progress"] = calculate_goal_progress(selected_goal)
    save_data(data)
    print(f"\n[✓] Daily Habit '{title}' added with daily Mako reminder at {reminder}.\n")
    send_mako_notification("New Habit Added", f"{title} (Reminder at {reminder})")

def cmd_daemon():
    print("=" * 60)
    print(" GOAL MANAGER BACKGROUND REMINDER DAEMON")
    print(" Running headlessly. Zero windows, zero taskbar presence.")
    print(" Reminders dispatched via Mako notify-send.")
    print(" Press Ctrl+C to stop.")
    print("=" * 60)
    send_mako_notification("Goal Daemon Started", "Daily reminders active via Mako.")

    try:
        while True:
            fired = check_and_send_due_reminders()
            if fired > 0:
                print(f"[{datetime.now().strftime('%H:%M:%S')}] Dispatched {fired} reminder(s) to Mako.")
            time.sleep(30)
    except KeyboardInterrupt:
        print("\nDaemon stopped.")

# ==============================================================================
# INTERACTIVE CURSES TUI (Runs in any terminal: kitty, alacritty, foot, etc.)
# ==============================================================================

def run_curses_tui(stdscr):
    import curses

    curses.curs_set(0)
    curses.use_default_colors()

    while True:
        stdscr.clear()
        h, w = stdscr.getmaxyx()
        data = load_data()
        today_str = date.today().isoformat()
        now_str = datetime.now().strftime("%A, %b %d %Y · %H:%M")

        # Header
        title_bar = f" GOALS & HABITS (100% Offline Arch Native) | {now_str} "
        stdscr.addstr(0, 0, title_bar[:w-1], curses.A_REVERSE)

        # Content
        row = 2
        stdscr.addstr(row, 2, "[TODAY'S HABITS]", curses.A_BOLD)
        row += 1

        all_habits = []
        for g in data.get("goals", []):
            if g.get("status") == "active":
                for hb in g.get("habits", []):
                    all_habits.append((g, hb))

        if not all_habits:
            stdscr.addstr(row, 4, "No habits scheduled. Press [h] to add a habit.", curses.A_DIM)
            row += 2
        else:
            for idx, (g, hb) in enumerate(all_habits, 1):
                if row >= h - 8:
                    break
                is_done = hb.get("lastCompletedDate") == today_str
                box = "[X]" if is_done else "[ ]"
                rem = hb.get("reminderTime") or hb.get("targetTime") or ""
                rem_str = f"| Mako {rem}" if rem else ""
                line = f" ({idx}) {box} {hb.get('title'):<26} {rem_str:<12} | {hb.get('streak')}d streak"
                stdscr.addstr(row, 2, line[:w-4])
                row += 1
            row += 1

        stdscr.addstr(row, 2, "[ACTIVE GOALS ROADMAP]", curses.A_BOLD)
        row += 1

        for g in data.get("goals", []):
            if row >= h - 6:
                break
            prog = g.get("progress", 0)
            rem = f"Mako {g.get('dailyReminderTime')}" if g.get("dailyReminderEnabled", True) else "No rem"
            line = f" * {g.get('title'):<30} [{prog:3d}%] | {rem}"
            stdscr.addstr(row, 2, line[:w-4])
            row += 1

        # Keybindings footer
        footer = " [1-9] Toggle | [n] Add Goal | [h] Add Habit | [s] Sub-Goal | [r] Remove Habit | [d] Remove Goal | [q] Quit "
        stdscr.addstr(h - 2, 0, footer[:w-1], curses.A_REVERSE)
        stdscr.refresh()

        key = stdscr.getch()
        if key in (ord('q'), ord('Q'), 27):
            break
        elif ord('1') <= key <= ord('9'):
            target_idx = key - ord('1')
            if target_idx < len(all_habits):
                tg_goal, tg_hb = all_habits[target_idx]
                is_done = tg_hb.get("lastCompletedDate") == today_str
                if is_done:
                    tg_hb["lastCompletedDate"] = ""
                    tg_hb["streak"] = max(0, tg_hb.get("streak", 1) - 1)
                else:
                    tg_hb["lastCompletedDate"] = today_str
                    tg_hb["streak"] = tg_hb.get("streak", 0) + 1
                    send_mako_notification(
                        f"Habit Conquered: {tg_hb['title']}",
                        f"{tg_goal['title']} · Streak: {tg_hb['streak']} days!",
                    )
                tg_goal["progress"] = calculate_goal_progress(tg_goal)
                save_data(data)
        elif key in (ord('m'), ord('M')):
            send_mako_notification("Mako Test Alert", "Daily reminder engine working natively on Arch Linux!")
        elif key in (ord('n'), ord('N')):
            curses.endwin()
            cmd_add_goal()
            input("Press Enter to return to TUI...")
            curses.doupdate()
        elif key in (ord('h'), ord('H')):
            curses.endwin()
            cmd_add_habit()
            input("Press Enter to return to TUI...")
            curses.doupdate()
        elif key in (ord('s'), ord('S')):
            curses.endwin()
            cmd_add_task()
            input("Press Enter to return to TUI...")
            curses.doupdate()
        elif key in (ord('r'), ord('R')):
            curses.endwin()
            cmd_remove_habit()
            input("Press Enter to return to TUI...")
            curses.doupdate()
        elif key in (ord('d'), ord('D')):
            curses.endwin()
            cmd_remove_goal()
            input("Press Enter to return to TUI...")
            curses.doupdate()

def main():
    parser = argparse.ArgumentParser(
        description="Minimalist Personal Goal & Habit Manager (100% Offline Arch Linux Native)"
    )
    subparsers = parser.add_subparsers(dest="command")

    subparsers.add_parser("today", help="Show today's habits ritual")
    check_p = subparsers.add_parser("check", help="Toggle habit completion for today")
    check_p.add_argument("query", help="Habit index number or search keyword")

    subparsers.add_parser("list", help="List all goals, milestones, and habits")
    subparsers.add_parser("list-goals-raw", help="List goals in simple format for Rofi / Fuzzel")
    subparsers.add_parser("list-habits-raw", help="List habits in simple format for Rofi / Fuzzel")

    subparsers.add_parser("add-goal", help="Define a new goal with Mako reminder time")
    subparsers.add_parser("add-task", help="Add a sub-goal / task to an existing goal")
    subparsers.add_parser("add-habit", help="Add a daily habit with Mako reminder time")

    rm_goal_p = subparsers.add_parser("remove-goal", help="Remove an existing goal")
    rm_goal_p.add_argument("query", nargs="?", default=None, help="Goal index number or title substring")

    rm_habit_p = subparsers.add_parser("remove-habit", help="Remove an existing daily habit")
    rm_habit_p.add_argument("query", nargs="?", default=None, help="Habit index number or title substring")

    subparsers.add_parser("notify", help="Check and dispatch any due Mako notifications")
    subparsers.add_parser("daemon", help="Run background reminder daemon (silent, zero taskbar)")
    subparsers.add_parser("tui", help="Launch interactive monochrome terminal UI")

    args = parser.parse_args()

    if not args.command:
        if sys.stdin.isatty():
            import curses
            curses.wrapper(run_curses_tui)
        else:
            cmd_today()
        return

    if args.command == "today":
        cmd_today()
    elif args.command == "check":
        cmd_check(args.query)
    elif args.command == "list":
        cmd_list_goals()
    elif args.command == "list-goals-raw":
        cmd_list_goals_raw()
    elif args.command == "list-habits-raw":
        cmd_list_habits_raw()
    elif args.command == "add-goal":
        cmd_add_goal()
    elif args.command == "add-task":
        cmd_add_task()
    elif args.command == "add-habit":
        cmd_add_habit()
    elif args.command == "remove-goal":
        cmd_remove_goal(args.query)
    elif args.command == "remove-habit":
        cmd_remove_habit(args.query)
    elif args.command == "notify":
        fired = check_and_send_due_reminders()
        print(f"Dispatched {fired} reminder notification(s) to Mako.")
    elif args.command == "daemon":
        cmd_daemon()
    elif args.command == "tui":
        import curses
        curses.wrapper(run_curses_tui)

if __name__ == "__main__":
    main()
