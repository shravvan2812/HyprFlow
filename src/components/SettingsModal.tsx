import React, { useRef, useState } from 'react';
import {
  X,
  Bell,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Download,
  Upload,
  HardDrive,
  Check,
  Terminal,
  Copy,
  Clock,
  EyeOff,
  Cpu,
} from 'lucide-react';
import { AppSettings, PersonalGoal, Task } from '../types';
import { storage } from '../utils/storage';
import {
  generateMakoConfig,
  generateMakoDaemonScript,
  generateSystemdService,
  generateSystemdTimer,
  generateHyprlandSkipTaskbarRules,
} from '../utils/mako';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (updater: (prev: AppSettings) => AppSettings) => void;
  goals: PersonalGoal[];
  tasks: Task[];
  onRestoreData: (goals: PersonalGoal[], tasks: Task[]) => void;
  onTestReminder: () => void;
  notificationPermission: NotificationPermission;
  onRequestPermission: () => Promise<NotificationPermission>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  goals,
  tasks,
  onRestoreData,
  onTestReminder,
  notificationPermission,
  onRequestPermission,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleExport = () => {
    storage.exportBackupFile(goals, tasks, settings);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed.goals && Array.isArray(parsed.goals)) {
          onRestoreData(parsed.goals, parsed.tasks || []);
          storage.saveGoals(parsed.goals);
          if (parsed.tasks) storage.saveTasks(parsed.tasks);
          setImportStatus('Backup restored successfully.');
          setTimeout(() => setImportStatus(null), 3000);
        } else {
          setImportStatus('Invalid backup file format.');
        }
      } catch (err) {
        setImportStatus('Failed to parse backup JSON.');
      }
    };
    reader.readAsText(file);
  };

  // Extract all scheduled reminders across goals, habits, and sub-goals
  const allScheduledReminders: { label: string; time: string; type: 'Goal' | 'Habit' | 'Sub-Goal' }[] = [];
  goals.filter((g) => g.status === 'active').forEach((g) => {
    if (g.dailyReminderEnabled !== false && g.dailyReminderTime) {
      allScheduledReminders.push({ label: g.title, time: g.dailyReminderTime, type: 'Goal' });
    }
    g.habits.forEach((h) => {
      const time = h.reminderTime || h.targetTime;
      if (time) allScheduledReminders.push({ label: h.title, time, type: 'Habit' });
    });
    g.subGoals.forEach((sg) => {
      if (!sg.completed && sg.reminderTime) {
        allScheduledReminders.push({ label: sg.title, time: sg.reminderTime, type: 'Sub-Goal' });
      }
    });
  });

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto font-sans text-white"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl rounded-2xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Settings & Offline Arch Suite
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              100% Offline, Zero Browser / Zero Chromium, Mako Reminders
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 100% Offline Arch Native Suite (No Browser / No Chromium) */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-zinc-200 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-white" />
              <span>Native Arch Linux Suite (No Browser)</span>
            </span>
            <span className="text-[10px] font-mono text-zinc-400">100% Offline</span>
          </div>

          <p className="text-xs text-zinc-400 font-mono leading-relaxed">
            Run entirely through native Linux tools without Chromium, Chrome, or any web browser:
          </p>

          <div className="space-y-2 font-mono text-xs">
            <div className="p-2.5 rounded-lg bg-black border border-zinc-850 space-y-1">
              <div className="flex items-center justify-between text-zinc-300">
                <span>1. Interactive Terminal TUI:</span>
                <button
                  onClick={() => copyToClipboard('python3 native/goals.py', 'cmd_tui')}
                  className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1"
                >
                  {copiedKey === 'cmd_tui' ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'cmd_tui' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <code className="text-[11px] text-zinc-400 block">$ python3 native/goals.py</code>
            </div>

            <div className="p-2.5 rounded-lg bg-black border border-zinc-850 space-y-1">
              <div className="flex items-center justify-between text-zinc-300">
                <span>2. Rofi / Fuzzel Instant Overlay (No Taskbar):</span>
                <button
                  onClick={() => copyToClipboard('~/.local/bin/goals-rofi.sh', 'cmd_rofi')}
                  className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1"
                >
                  {copiedKey === 'cmd_rofi' ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'cmd_rofi' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <code className="text-[11px] text-zinc-400 block">$ ./native/goals-rofi.sh  # Bind to Super+G</code>
            </div>

            <div className="p-2.5 rounded-lg bg-black border border-zinc-850 space-y-1">
              <div className="flex items-center justify-between text-zinc-300">
                <span>3. Native WebKitGTK Window (Pure GTK, Not Chromium):</span>
                <button
                  onClick={() => copyToClipboard('./native/launch-webkit.sh', 'cmd_webkit')}
                  className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1"
                >
                  {copiedKey === 'cmd_webkit' ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'cmd_webkit' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <code className="text-[11px] text-zinc-400 block">$ ./native/launch-webkit.sh</code>
            </div>
          </div>
        </div>

        {/* Arch Linux: Hide from Quickshell / Taskbar */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-zinc-200 flex items-center gap-1.5">
              <EyeOff className="w-4 h-4 text-zinc-300" />
              <span>Hide from Quickshell / Taskbar</span>
            </span>
            <span className="text-[10px] font-mono text-zinc-400">Hyprland rule</span>
          </div>

          <p className="text-xs text-zinc-400 font-mono leading-relaxed">
            Ensure windows never show on Quickshell by adding this rule to <code className="text-zinc-200 bg-black px-1 py-0.5 rounded">~/.config/hypr/hyprland.conf</code>:
          </p>

          <div className="relative p-2.5 rounded-lg bg-black border border-zinc-800 font-mono text-[11px] text-zinc-300">
            <pre className="overflow-x-auto whitespace-pre">{generateHyprlandSkipTaskbarRules()}</pre>
            <button
              onClick={() => copyToClipboard(generateHyprlandSkipTaskbarRules(), 'hypr')}
              className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] text-white transition cursor-pointer"
            >
              {copiedKey === 'hypr' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copiedKey === 'hypr' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Daily Mako Reminders Daemon & Config */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-zinc-200 flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-white" />
              <span>Daily Reminders through Mako</span>
            </span>
            <span className="text-[10px] font-mono text-zinc-400">
              {allScheduledReminders.length} scheduled
            </span>
          </div>

          {/* Active scheduled reminder list */}
          {allScheduledReminders.length > 0 ? (
            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {allScheduledReminders.map((rem, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-black border border-zinc-850 text-xs font-mono"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-[10px] text-zinc-500 uppercase">[{rem.type}]</span>
                    <span className="text-zinc-200 truncate">{rem.label}</span>
                  </div>
                  <span className="text-white font-semibold tabular-nums shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-zinc-400" />
                    <span>{rem.time}</span>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-zinc-500 font-mono">
              No daily reminders configured yet. Add them when defining goals, habits, or sub-goals.
            </div>
          )}

          {/* Test Reminder and Web Notification Permission */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-xs">
            <button
              type="button"
              onClick={onTestReminder}
              className="py-2 px-3 rounded-lg bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition cursor-pointer shadow-xs text-center"
            >
              Test Mako Notification Now
            </button>

            {notificationPermission !== 'granted' ? (
              <button
                type="button"
                onClick={onRequestPermission}
                className="py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs transition cursor-pointer text-center"
              >
                Grant Desktop Notification Permission
              </button>
            ) : (
              <div className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-black border border-zinc-800 text-zinc-300">
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Web Notifications Active</span>
              </div>
            )}
          </div>

          {/* Export Background Daemon Script */}
          <div className="space-y-2 pt-2 border-t border-zinc-850 font-mono text-xs">
            <span className="text-zinc-400 block">
              Headless Background Reminder Daemon (Run with NO window open):
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() =>
                  copyToClipboard(generateMakoDaemonScript(goals), 'daemon')
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition cursor-pointer"
              >
                {copiedKey === 'daemon' ? <Check className="w-3 h-3" /> : <Terminal className="w-3 h-3" />}
                <span>{copiedKey === 'daemon' ? 'Daemon Copied!' : 'Copy goal-mako-reminder.sh'}</span>
              </button>

              <button
                onClick={() =>
                  copyToClipboard(
                    `${generateSystemdService()}\n\n# Timer:\n${generateSystemdTimer()}`,
                    'systemd'
                  )
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition cursor-pointer"
              >
                {copiedKey === 'systemd' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === 'systemd' ? 'Service Copied!' : 'Copy Systemd Timer'}</span>
              </button>

              <button
                onClick={() => copyToClipboard(generateMakoConfig(settings.themePreset), 'mako_cfg')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition cursor-pointer"
              >
                {copiedKey === 'mako_cfg' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === 'mako_cfg' ? 'Config Copied!' : 'Copy ~/.config/mako/config'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Theme & Audio Preferences */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
          <div className="text-xs font-mono font-semibold text-zinc-200">
            Appearance & Audio
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <button
              onClick={() =>
                onUpdateSettings((prev) => ({
                  ...prev,
                  themeMode: prev.themeMode === 'dark' ? 'light' : 'dark',
                }))
              }
              className="flex items-center justify-center gap-2 p-2 rounded-lg bg-black border border-zinc-800 text-zinc-200 hover:bg-zinc-900 transition cursor-pointer"
            >
              {settings.themeMode === 'dark' ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Dark Mode</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Light Mode</span>
                </>
              )}
            </button>

            <button
              onClick={() =>
                onUpdateSettings((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))
              }
              className="flex items-center justify-center gap-2 p-2 rounded-lg bg-black border border-zinc-800 text-zinc-200 hover:bg-zinc-900 transition cursor-pointer"
            >
              {settings.soundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-white" />
                  <span>Sound On</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Muted</span>
                </>
              )}
            </button>
          </div>

          {/* Monochrome Theme Presets */}
          <div className="flex items-center gap-1.5 pt-1">
            {([
              { id: 'monochrome_dark', label: 'Dark Zinc' },
              { id: 'monochrome_pitch_black', label: 'Pitch Black' },
              { id: 'monochrome_light', label: 'Minimal Light' },
            ] as const).map(({ id, label }) => (
              <button
                key={id}
                onClick={() => onUpdateSettings((prev) => ({ ...prev, themePreset: id }))}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-mono transition cursor-pointer ${
                  settings.themePreset === id
                    ? 'bg-white text-black font-semibold'
                    : 'text-zinc-400 hover:text-white bg-black border border-zinc-850'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Local Storage Privacy & Backup */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-zinc-200 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-zinc-400" />
              <span>Local Storage Vault</span>
            </span>
            <span className="text-xs font-mono text-zinc-500">100% Private</span>
          </div>

          <p className="text-xs text-zinc-400 font-mono leading-relaxed">
            All your goals, sub-goals, and habits live in your local storage. Export a JSON file to keep offline backups or use with the native Python tools.
          </p>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleExport}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white text-black font-semibold text-xs font-mono transition hover:bg-zinc-200 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-mono transition cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-zinc-400" />
              <span>Restore JSON</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {importStatus && (
            <div className="text-xs font-mono text-white text-center font-semibold pt-1">
              {importStatus}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
