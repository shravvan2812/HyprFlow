import { useState, useEffect, useCallback } from 'react';
import { PersonalGoal, AppSettings } from '../types';
import { audioSynth } from '../utils/audio';

export interface DailyReminderAlert {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  pendingHabitsCount: number;
  totalHabitsCount: number;
  activeGoalsCount: number;
  goalId?: string;
  habitId?: string;
}

const STORAGE_KEY_REMINDED = 'goal_reminded_items_v2';

export function useDailyReminder(
  goals: PersonalGoal[],
  settings: AppSettings,
  onUpdateSettings: (updater: (prev: AppSettings) => AppSettings) => void
) {
  const [activeAlert, setActiveAlert] = useState<DailyReminderAlert | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotificationPermission(perm);
        return perm;
      } catch (e) {
        console.error('Error requesting notification permission:', e);
      }
    }
    return 'denied' as NotificationPermission;
  }, []);

  // Helper to get reminded items for today
  const getRemindedKeysForToday = useCallback((): Set<string> => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const data = localStorage.getItem(STORAGE_KEY_REMINDED);
      if (!data) return new Set();
      const parsed = JSON.parse(data);
      if (parsed.date !== todayStr) {
        // Reset for new day
        localStorage.setItem(STORAGE_KEY_REMINDED, JSON.stringify({ date: todayStr, keys: [] }));
        return new Set();
      }
      return new Set(parsed.keys || []);
    } catch {
      return new Set();
    }
  }, []);

  const markKeyRemindedToday = useCallback((key: string) => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const reminded = getRemindedKeysForToday();
      reminded.add(key);
      localStorage.setItem(
        STORAGE_KEY_REMINDED,
        JSON.stringify({ date: todayStr, keys: Array.from(reminded) })
      );
    } catch (e) {
      console.error('Error marking reminder:', e);
    }
  }, [getRemindedKeysForToday]);

  // Dispatch Mako native desktop notification via Web Notification API
  const dispatchMakoNotification = useCallback(
    (title: string, bodyText: string, tag: string) => {
      audioSynth.playReminderChime(settings.soundEnabled);

      if (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        try {
          new Notification(title, {
            body: bodyText,
            icon: '/icon.svg',
            tag,
          });
        } catch (e) {
          console.warn('Native Mako desktop notification failed:', e);
        }
      }
    },
    [settings.soundEnabled]
  );

  const triggerDailyReminder = useCallback(
    (forced = false) => {
      const todayStr = new Date().toISOString().split('T')[0];
      const activeGoals = goals.filter((g) => g.status === 'active');
      const allHabits = activeGoals.flatMap((g) => g.habits);
      const pendingHabits = allHabits.filter((h) => h.lastCompletedDate !== todayStr);

      const alert: DailyReminderAlert = {
        id: 'daily-' + Date.now(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        title: 'Daily Goal Check-In',
        message:
          pendingHabits.length > 0
            ? `${pendingHabits.length} pending habits across ${activeGoals.length} goals today.`
            : 'All daily habits completed today.',
        pendingHabitsCount: pendingHabits.length,
        totalHabitsCount: allHabits.length,
        activeGoalsCount: activeGoals.length,
      };

      setActiveAlert(alert);
      dispatchMakoNotification(
        'Daily Habit & Goal Check-In',
        alert.message,
        'daily-general-checkin'
      );

      onUpdateSettings((prev) => ({
        ...prev,
        lastDailyReminderDate: todayStr,
      }));
    },
    [goals, dispatchMakoNotification, onUpdateSettings]
  );

  // Periodic checker: runs every 25 seconds for each individual goal, habit, and sub-goal
  useEffect(() => {
    const checkSpecificReminders = () => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;

      const remindedKeys = getRemindedKeysForToday();
      const activeGoals = goals.filter((g) => g.status === 'active');

      activeGoals.forEach((goal) => {
        // 1. Check specific Goal daily reminder
        const goalReminderTime = goal.dailyReminderTime;
        const isGoalReminderEnabled = goal.dailyReminderEnabled !== false;
        const goalKey = `goal_${goal.id}`;

        if (
          isGoalReminderEnabled &&
          goalReminderTime &&
          currentTimeStr >= goalReminderTime &&
          !remindedKeys.has(goalKey)
        ) {
          markKeyRemindedToday(goalKey);
          const pendingCount = goal.habits.filter((h) => h.lastCompletedDate !== todayStr).length;
          const bodyText =
            pendingCount > 0
              ? `You have ${pendingCount} habits due today for ${goal.title}.`
              : `Review your sub-goals and milestones for ${goal.title}.`;

          setActiveAlert({
            id: 'goal-rem-' + Date.now(),
            timestamp: currentTimeStr,
            title: `Goal: ${goal.title}`,
            message: bodyText,
            pendingHabitsCount: pendingCount,
            totalHabitsCount: goal.habits.length,
            activeGoalsCount: 1,
            goalId: goal.id,
          });

          dispatchMakoNotification(
            `Goal: ${goal.title}`,
            bodyText,
            `mako-goal-${goal.id}`
          );
        }

        // 2. Check each specific Habit reminder
        goal.habits.forEach((habit) => {
          const habitReminderTime = habit.reminderTime || habit.targetTime;
          const habitKey = `habit_${habit.id}`;
          const isDoneToday = habit.lastCompletedDate === todayStr;

          if (
            habitReminderTime &&
            currentTimeStr >= habitReminderTime &&
            !isDoneToday &&
            !remindedKeys.has(habitKey)
          ) {
            markKeyRemindedToday(habitKey);
            const streakText = habit.streak > 0 ? `Current streak: ${habit.streak}d` : 'Daily practice';
            const bodyText = `${goal.title} · ${streakText}`;

            setActiveAlert({
              id: 'habit-rem-' + Date.now(),
              timestamp: currentTimeStr,
              title: `Habit: ${habit.title}`,
              message: bodyText,
              pendingHabitsCount: 1,
              totalHabitsCount: 1,
              activeGoalsCount: 1,
              goalId: goal.id,
              habitId: habit.id,
            });

            dispatchMakoNotification(
              `Habit: ${habit.title}`,
              bodyText,
              `mako-habit-${habit.id}`
            );
          }
        });

        // 3. Check each specific Sub-Goal reminder
        goal.subGoals.forEach((sg) => {
          const sgReminderTime = sg.reminderTime;
          const sgKey = `subgoal_${sg.id}`;

          if (
            !sg.completed &&
            sgReminderTime &&
            currentTimeStr >= sgReminderTime &&
            !remindedKeys.has(sgKey)
          ) {
            markKeyRemindedToday(sgKey);
            const bodyText = `Milestone for ${goal.title}${sg.targetDate ? ` (Due ${sg.targetDate})` : ''}`;

            setActiveAlert({
              id: 'subgoal-rem-' + Date.now(),
              timestamp: currentTimeStr,
              title: `Sub-Goal: ${sg.title}`,
              message: bodyText,
              pendingHabitsCount: 0,
              totalHabitsCount: 1,
              activeGoalsCount: 1,
              goalId: goal.id,
            });

            dispatchMakoNotification(
              `Sub-Goal: ${sg.title}`,
              bodyText,
              `mako-subgoal-${sg.id}`
            );
          }
        });
      });

      // 4. Fallback General daily reminder if configured in settings
      if (settings.dailyReminderEnabled && settings.lastDailyReminderDate !== todayStr) {
        const targetTime = settings.dailyReminderTime || '09:00';
        if (currentTimeStr >= targetTime) {
          triggerDailyReminder();
        }
      }
    };

    checkSpecificReminders();
    const interval = setInterval(checkSpecificReminders, 25000);
    return () => clearInterval(interval);
  }, [
    goals,
    settings.dailyReminderEnabled,
    settings.dailyReminderTime,
    settings.lastDailyReminderDate,
    getRemindedKeysForToday,
    markKeyRemindedToday,
    dispatchMakoNotification,
    triggerDailyReminder,
  ]);

  const dismissAlert = () => setActiveAlert(null);

  const snoozeAlert = (minutes = 15) => {
    setActiveAlert(null);
    setTimeout(() => {
      triggerDailyReminder(true);
    }, minutes * 60 * 1000);
  };

  return {
    activeAlert,
    dismissAlert,
    snoozeAlert,
    triggerDailyReminder,
    notificationPermission,
    requestPermission,
  };
}
