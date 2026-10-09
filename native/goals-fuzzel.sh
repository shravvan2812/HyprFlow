#!/usr/bin/env bash
# ==============================================================================
# Fuzzel Overlay Launcher for Goals & Daily Habits (Arch Linux + Hyprland)
# Super-lightweight Wayland launcher. Zero taskbar footprint.
# Supports toggling habits, adding goals/habits/tasks, and REMOVING habits & goals!
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GOALS_BIN="${SCRIPT_DIR}/goals.py"

TODAY_ITEMS=$("${GOALS_BIN}" today | grep -E "^\s+[0-9]+\.\s+\[" | sed 's/^[ \t]*//')
OPTIONS="${TODAY_ITEMS}\n---\n+ [n] Define New Goal\n+ [h] Add Daily Habit\n+ [s] Add Sub-Goal / Task\n- [r] Remove a Habit\n- [d] Delete a Goal\n+ [t] Open Terminal TUI"

SELECTED=$(echo -e "${OPTIONS}" | fuzzel --dmenu --prompt "Goals: " --lines 10 --width 45)

if [[ -z "$SELECTED" ]]; then
    exit 0
fi

if [[ "$SELECTED" == "- [r] Remove a Habit" ]]; then
    HABIT_LIST=$("${GOALS_BIN}" list-habits-raw)
    if [[ -z "$HABIT_LIST" ]]; then
        notify-send -a "Goals" "No Habits Found" "There are no habits to remove."
        exit 0
    fi
    HABIT_TO_REMOVE=$(echo -e "${HABIT_LIST}" | fuzzel --dmenu --prompt "Remove Habit: " --lines 8 --width 45)
    if [[ -n "$HABIT_TO_REMOVE" ]]; then
        H_NUM=$(echo "$HABIT_TO_REMOVE" | awk '{print $1}' | tr -d '.')
        "${GOALS_BIN}" remove-habit "$H_NUM"
    fi

elif [[ "$SELECTED" == "- [d] Delete a Goal" ]]; then
    GOAL_LIST=$("${GOALS_BIN}" list-goals-raw)
    if [[ -z "$GOAL_LIST" ]]; then
        notify-send -a "Goals" "No Goals Found" "There are no goals to delete."
        exit 0
    fi
    GOAL_TO_DELETE=$(echo -e "${GOAL_LIST}" | fuzzel --dmenu --prompt "Delete Goal: " --lines 8 --width 45)
    if [[ -n "$GOAL_TO_DELETE" ]]; then
        CONFIRM=$(echo -e "Yes, permanently delete this goal\nNo, cancel" | fuzzel --dmenu --prompt "Confirm? " --lines 2 --width 35)
        if [[ "$CONFIRM" =~ ^Yes ]]; then
            G_NUM=$(echo "$GOAL_TO_DELETE" | awk '{print $1}' | tr -d '.')
            "${GOALS_BIN}" remove-goal "$G_NUM"
        fi
    fi

elif [[ "$SELECTED" == "+ [n] Define New Goal" ]]; then
    alacritty --class goal-manager -e "${GOALS_BIN}" add-goal 2>/dev/null || \
    kitty --class goal-manager "${GOALS_BIN}" add-goal 2>/dev/null || \
    foot -a goal-manager "${GOALS_BIN}" add-goal 2>/dev/null || \
    xterm -e "${GOALS_BIN}" add-goal

elif [[ "$SELECTED" == "+ [h] Add Daily Habit" ]]; then
    alacritty --class goal-manager -e "${GOALS_BIN}" add-habit 2>/dev/null || \
    kitty --class goal-manager "${GOALS_BIN}" add-habit 2>/dev/null || \
    foot -a goal-manager "${GOALS_BIN}" add-habit 2>/dev/null || \
    xterm -e "${GOALS_BIN}" add-habit

elif [[ "$SELECTED" == "+ [s] Add Sub-Goal / Task" ]]; then
    alacritty --class goal-manager -e "${GOALS_BIN}" add-task 2>/dev/null || \
    kitty --class goal-manager "${GOALS_BIN}" add-task 2>/dev/null || \
    foot -a goal-manager "${GOALS_BIN}" add-task 2>/dev/null || \
    xterm -e "${GOALS_BIN}" add-task

elif [[ "$SELECTED" == "+ [t] Open Terminal TUI" ]]; then
    alacritty --class goal-manager -e "${GOALS_BIN}" tui 2>/dev/null || \
    kitty --class goal-manager "${GOALS_BIN}" tui 2>/dev/null || \
    foot -a goal-manager "${GOALS_BIN}" tui 2>/dev/null || \
    xterm -e "${GOALS_BIN}" tui

elif [[ "$SELECTED" != "---" ]]; then
    HABIT_NUM=$(echo "$SELECTED" | awk '{print $1}' | tr -d '.')
    if [[ -n "$HABIT_NUM" && "$HABIT_NUM" =~ ^[0-9]+$ ]]; then
        "${GOALS_BIN}" check "$HABIT_NUM"
    fi
fi
