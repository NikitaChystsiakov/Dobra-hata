"use client";

import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

function subscribe(cb: () => void) {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", cb);
  return () => {
    mo.disconnect();
    mq.removeEventListener("change", cb);
  };
}

function getTheme(): Theme {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "dark" || attr === "light") return attr;
  return "dark"; // без выбора — тёмная
}

export default function ThemeToggle() {
  // На сервере тема неизвестна — обе кнопки не нажаты до гидрации
  const theme = useSyncExternalStore(subscribe, getTheme, () => "dark" as Theme);

  const apply = (t: Theme) => {
    document.documentElement.setAttribute("data-theme", t);
    try {
      localStorage.setItem("theme", t);
    } catch {}
  };

  return (
    <div className="theme" role="group" aria-label="Тема">
      <button type="button" className="theme__opt" aria-pressed={theme === "dark"} onClick={() => apply("dark")} aria-label="Тёмная тема">
        Тёмная
      </button>
      <button type="button" className="theme__opt" aria-pressed={theme === "light"} onClick={() => apply("light")} aria-label="Светлая тема">
        Светлая
      </button>
    </div>
  );
}
