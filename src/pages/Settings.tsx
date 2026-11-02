import { useEffect } from "react";
import { useSettings, applyAppearance, resolveTheme } from "../stores/settings";
import { Slider } from "../components/Slider";
import { IconMoon, IconSun, IconMonitor, IconCheck } from "../components/Icons";
import type { AccentName, ThemeMode } from "../types";

const THEMES: Array<{ id: ThemeMode; label: string; icon: typeof IconMoon }> = [
  { id: "dark", label: "Тёмная", icon: IconMoon },
  { id: "light", label: "Светлая", icon: IconSun },
  { id: "system", label: "Системная", icon: IconMonitor },
];

const ACCENTS: Array<{ id: AccentName; label: string; hex: string }> = [
  { id: "emerald", label: "Изумруд", hex: "#10b981" },
  { id: "violet", label: "Фиолет", hex: "#8b5cf6" },
  { id: "rose", label: "Роза", hex: "#f43f5e" },
  { id: "amber", label: "Янтарь", hex: "#f59e0b" },
  { id: "sky", label: "Небо", hex: "#0ea5e9" },
];

export function SettingsPage() {
  const theme = useSettings((s) => s.theme);
  const accent = useSettings((s) => s.accent);
  const volume = useSettings((s) => s.volume);
  const setTheme = useSettings((s) => s.setTheme);
  const setAccent = useSettings((s) => s.setAccent);
  const setVolume = useSettings((s) => s.setVolume);

  // Follow OS theme when mode = system
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => applyAppearance("system", accent);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme, accent]);

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="section-title text-2xl">Настройки и персонализация</h1>

      {/* Theme */}
      <section className="card p-5">
        <h2 className="mb-1 text-sm font-bold">Оформление</h2>
        <p className="mb-4 text-xs text-muted">Сейчас активна: {resolveTheme(theme) === "dark" ? "тёмная" : "светлая"} тема</p>
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTheme(id)}
              className={`flex flex-col items-center gap-2 rounded-card border px-3 py-4 text-sm font-medium transition ${
                theme === id
                  ? "border-accent bg-accent/10 text-fg"
                  : "border-line bg-elevated/40 text-muted hover:text-fg"
              }`}
              aria-pressed={theme === id}
            >
              <Icon size={20} className={theme === id ? "text-accent" : ""} />
              {label}
              {theme === id && <IconCheck size={14} className="text-accent" />}
            </button>
          ))}
        </div>
      </section>

      {/* Accent */}
      <section className="card p-5">
        <h2 className="mb-1 text-sm font-bold">Акцентный цвет</h2>
        <p className="mb-4 text-xs text-muted">Определяет кнопки, подсветку текущего трека и ссылки.</p>
        <div className="flex flex-wrap gap-3">
          {ACCENTS.map((a) => (
            <button
              key={a.id}
              onClick={() => setAccent(a.id)}
              className={`flex items-center gap-2 rounded-pill border px-3.5 py-2 text-sm transition ${
                accent === a.id ? "border-accent bg-accent/10 font-semibold" : "border-line text-muted hover:text-fg"
              }`}
              aria-pressed={accent === a.id}
            >
              <span className="h-4 w-4 rounded-pill" style={{ background: a.hex }} />
              {a.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-faint">
          Готовые темы оформления можно приобрести в Маркетплейсе за DELTA Coins.
        </p>
      </section>

      {/* Playback */}
      <section className="card p-5">
        <h2 className="mb-4 text-sm font-bold">Воспроизведение</h2>
        <label className="flex items-center justify-between gap-4 text-sm">
          <span>Громкость по умолчанию</span>
          <span className="flex items-center gap-3">
            <Slider
              value={Math.round(volume * 100)}
              max={100}
              onChange={(v) => setVolume(v / 100)}
              ariaLabel="Громкость"
              className="w-40"
            />
            <b className="w-10 text-right tabular-nums">{Math.round(volume * 100)}%</b>
          </span>
        </label>
      </section>

      {/* Status of future settings */}
      <section className="card p-5 text-sm text-muted">
        <h2 className="mb-2 text-sm font-bold text-fg">Персонализация и данные</h2>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>AI-рекомендации — появятся после подключения серверного API.</li>
          <li>Синхронизация настроек между устройствами — требует аккаунтов и бэкенда.</li>
          <li>Настройки кэша и офлайн-режима — планируются с мобильными клиентами.</li>
        </ul>
        <p className="mt-3 text-xs text-faint">
          Ваши текущие настройки, библиотека и баланс хранятся локально в этом браузере
          (localStorage) и не покидают устройство.
        </p>
      </section>
    </div>
  );
}
